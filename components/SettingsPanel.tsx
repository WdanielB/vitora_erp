
import React, { useState, useEffect, useRef } from 'react';
import type { FlowerItem, ProductItem, User, View, UserRole } from '../types.ts';
import * as api from '../services/api.ts';
import { CloudArrowUpIcon } from './icons/CloudArrowUpIcon.tsx';
import { ArrowDownTrayIcon } from './icons/ArrowDownTrayIcon.tsx';
import { PencilIcon } from './icons/PencilIcon.tsx';
import { TrashIcon } from './icons/TrashIcon.tsx';
import { PlusIcon } from './icons/PlusIcon.tsx';
import { moduleNames } from '../constants.ts';
import UserModal from './UserModal.tsx';

interface SettingsPanelProps {
  flowerItems: FlowerItem[];
  productItems: ProductItem[];
  user: User;
  onUserPinsUpdate: (user: User) => void;
  allUsers: User[];
  onUsersRefresh?: () => void;
}

type SettingsViewTab = 'general' | 'users';

const SettingsPanel: React.FC<SettingsPanelProps> = ({ flowerItems, productItems, user, onUserPinsUpdate, allUsers, onUsersRefresh }) => {
  const [settingsView, setSettingsView] = useState<SettingsViewTab>('general');
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // --- User Management States ---
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [selectedUserForPins, setSelectedUserForPins] = useState<string | null>(null);
  const [pins, setPins] = useState<{ [key in View]?: string }>({});
  const [pinSaveStatus, setPinSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');

  useEffect(() => {
    if (selectedUserForPins) {
        const targetUser = allUsers.find(u => u._id === selectedUserForPins);
        setPins(targetUser?.modulePins || {});
    }
  }, [selectedUserForPins, allUsers]);

  const handleDownloadBackup = async () => {
      try {
          setSyncStatus('syncing');
          const data = await api.fetchFullBackup(user._id);
          const dataStr = JSON.stringify(data, null, 2);
          const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
          const linkElement = document.createElement('a');
          linkElement.setAttribute('href', dataUri);
          linkElement.setAttribute('download', `backup_${user.username}_${new Date().toISOString().slice(0,10)}.json`);
          linkElement.click();
          setSyncStatus('success');
      } catch (e) {
          console.error(e);
          setSyncStatus('error');
      } finally { setTimeout(() => setSyncStatus('idle'), 3000); }
  };

  const handleUploadBackup = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      if (!window.confirm("¡ADVERTENCIA! Esto SOBREESCRIBIRÁ todos los datos actuales con el contenido del archivo. ¿Estás seguro?")) {
          if (fileInputRef.current) fileInputRef.current.value = '';
          return;
      }

      const reader = new FileReader();
      reader.onload = async (e) => {
          try {
              setSyncStatus('syncing');
              const json = JSON.parse(e.target?.result as string);
              await api.restoreBackup(json, user._id);
              setSyncStatus('success');
              alert("Restauración completada. La página se recargará.");
              window.location.reload();
          } catch (error) {
              console.error(error);
              setSyncStatus('error');
              alert("Error al restaurar el archivo. Asegúrate de que sea un backup válido.");
          } finally {
               if (fileInputRef.current) fileInputRef.current.value = '';
               setTimeout(() => setSyncStatus('idle'), 3000);
          }
      };
      reader.readAsText(file);
  };
  
  const handleResetAccount = async () => {
      if (window.confirm("PELIGRO: ¿Estás seguro de que quieres ELIMINAR TODOS LOS DATOS de esta cuenta? Esto borrará inventario, pedidos, clientes, todo. No se puede deshacer.")) {
           try {
              setSyncStatus('syncing');
              await api.resetAccount(user._id);
              alert("Cuenta reseteada correctamente. La página se recargará.");
              window.location.reload();
           } catch(e) {
               alert("Error al resetear cuenta.");
               setSyncStatus('error');
           }
      }
  };

  // --- User CRUD Logic ---
  const handleOpenUserModalNew = () => { setEditingUser(null); setIsUserModalOpen(true); };
  const handleOpenUserModalEdit = (u: User) => { setEditingUser(u); setIsUserModalOpen(true); };
  const handleSaveUser = async (userData: any) => { try { if (editingUser) await api.updateUser(editingUser._id, userData, user._id); else await api.createUser(userData, user._id); if (onUsersRefresh) onUsersRefresh(); setIsUserModalOpen(false); } catch (error: any) { alert(error.message); } };
  const handleDeleteUser = async (id: string) => { if (window.confirm("Eliminar usuario?")) { try { await api.deleteUser(id, user._id); if (onUsersRefresh) onUsersRefresh(); } catch (e: any) { alert(e.message); } } };

  // --- PIN Management ---
  const handleSavePins = async () => { if (!selectedUserForPins) return; setPinSaveStatus('saving'); try { await api.updateUserPins(selectedUserForPins, pins, user._id); if (onUsersRefresh) onUsersRefresh(); setPinSaveStatus('success'); } catch(err) { setPinSaveStatus('error'); } finally { setTimeout(() => setPinSaveStatus('idle'), 3000); } };

  const renderGeneralContent = () => (
     <div className="space-y-8">
        <div>
            <h3 className="text-lg font-bold mb-3 text-cyan-300">Copia de Seguridad (Exportar)</h3>
            <p className="text-sm text-gray-500 mb-4">Descarga un archivo con toda tu información (Inventario, Pedidos, Finanzas).</p>
            <button onClick={handleDownloadBackup} className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded-lg">
                <ArrowDownTrayIcon className="w-5 h-5"/> {syncStatus === 'syncing' ? 'Generando...' : 'Descargar Backup Completo'}
            </button>
        </div>

        <div className="pt-6 border-t border-gray-700">
             <h3 className="text-lg font-bold mb-3 text-orange-400">Restaurar Datos (Importar)</h3>
             <p className="text-sm text-gray-500 mb-4">Carga un archivo de backup para restaurar tu sistema. ⚠️ Esto borrará los datos actuales.</p>
             <div className="flex items-center gap-4">
                 <input 
                    type="file" 
                    ref={fileInputRef}
                    accept=".json"
                    onChange={handleUploadBackup}
                    className="hidden"
                 />
                 <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg border border-gray-600">
                    <CloudArrowUpIcon className="w-5 h-5"/> Cargar Archivo de Respaldo
                 </button>
                 {syncStatus === 'syncing' && <span className="text-yellow-500 text-sm">Restaurando...</span>}
                 {syncStatus === 'success' && <span className="text-green-500 text-sm">¡Éxito!</span>}
                 {syncStatus === 'error' && <span className="text-red-500 text-sm">Error</span>}
             </div>
        </div>
        
        <div className="pt-6 border-t border-gray-700">
             <h3 className="text-lg font-bold mb-3 text-red-500">Zona de Peligro</h3>
             <p className="text-sm text-gray-500 mb-4">Acciones destructivas para la cuenta actual.</p>
             <button onClick={handleResetAccount} className="flex items-center gap-2 bg-red-900/50 hover:bg-red-800 text-red-200 px-4 py-2 rounded-lg border border-red-800">
                <TrashIcon className="w-5 h-5"/> Eliminar Todos los Datos (Resetear Cuenta)
             </button>
        </div>
     </div>
  );

  const renderUsersContent = () => (
     <div className="flex flex-col lg:flex-row gap-6 h-full">
        <div className="lg:w-1/2 bg-gray-800/50 rounded-lg border border-gray-700 p-4 flex flex-col">
            <div className="flex justify-between mb-3"><h3 className="font-bold text-cyan-300">Usuarios</h3><button onClick={handleOpenUserModalNew} className="bg-green-600 px-2 py-1 rounded text-xs text-white">Nuevo</button></div>
            <div className="flex-grow overflow-y-auto"><table className="w-full text-sm text-left text-gray-300"><thead><tr><th>User</th><th>Rol</th><th>Acción</th></tr></thead><tbody>{allUsers.map(u => (<tr key={u._id} onClick={() => setSelectedUserForPins(u._id)} className={`cursor-pointer hover:bg-gray-700 ${selectedUserForPins===u._id?'bg-purple-900/30':''}`}><td>{u.username}</td><td>{u.role}</td><td><button onClick={(e)=>{e.stopPropagation();handleOpenUserModalEdit(u)}}><PencilIcon className="w-4 h-4"/></button> <button onClick={(e)=>{e.stopPropagation();handleDeleteUser(u._id)}}><TrashIcon className="w-4 h-4 text-red-500"/></button></td></tr>))}</tbody></table></div>
        </div>
        <div className="lg:w-1/2 bg-gray-800/30 rounded-lg border border-gray-700 p-4">
            <h3 className="font-bold text-purple-300 mb-4">Seguridad (PINs)</h3>
            {selectedUserForPins ? (
                <div className="space-y-2">
                    {Object.keys(moduleNames).filter(k=>k!=='settings').map(k => (
                        <div key={k} className="flex justify-between items-center bg-gray-900/50 p-2 rounded"><span className="text-sm text-gray-400">{moduleNames[k as View]}</span><input type="password" maxLength={4} value={pins[k as View]||''} onChange={e=>setPins(p=>({...p, [k]:e.target.value}))} className="w-16 bg-gray-700 text-center rounded text-white"/></div>
                    ))}
                    <button onClick={handleSavePins} className="w-full mt-4 bg-purple-600 text-white py-2 rounded hover:bg-purple-500">{pinSaveStatus==='saving'?'Guardando...':'Guardar PINs'}</button>
                </div>
            ) : <div className="text-gray-500 text-center mt-10">Selecciona un usuario.</div>}
        </div>
        <UserModal isOpen={isUserModalOpen} onClose={() => setIsUserModalOpen(false)} onSave={handleSaveUser} userToEdit={editingUser} />
     </div>
  );

  return (
    <div className="bg-black/20 backdrop-blur-xl border border-gray-700/50 rounded-3xl shadow-2xl p-6 h-full flex flex-col">
      <h1 className="text-3xl font-bold text-gray-300 mb-4">Ajustes</h1>
      <div className="flex gap-4 border-b border-gray-700 mb-4"><button onClick={()=>setSettingsView('general')} className={`pb-2 ${settingsView==='general'?'text-purple-400 border-b-2 border-purple-400':'text-gray-400'}`}>General</button>{user.role==='admin' && <button onClick={()=>setSettingsView('users')} className={`pb-2 ${settingsView==='users'?'text-purple-400 border-b-2 border-purple-400':'text-gray-400'}`}>Usuarios</button>}</div>
      <div className="flex-grow overflow-y-auto">{settingsView === 'general' ? renderGeneralContent() : renderUsersContent()}</div>
    </div>
  );
};
export default SettingsPanel;
