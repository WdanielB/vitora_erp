
import React, { useState, useEffect } from 'react';
import type { FlowerItem, FixedItem, User, View, UserRole } from '../types.ts';
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
  fixedItems: FixedItem[];
  user: User;
  onUserPinsUpdate: (user: User) => void;
  allUsers: User[];
  onUsersRefresh?: () => void;
}

type SettingsViewTab = 'general' | 'users';

const SettingsPanel: React.FC<SettingsPanelProps> = ({
  flowerItems, fixedItems, user, onUserPinsUpdate, allUsers, onUsersRefresh
}) => {
  const [settingsView, setSettingsView] = useState<SettingsViewTab>('general');
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [syncMessage, setSyncMessage] = useState('');
  
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

  // --- Sync Logic ---
  const handleForceSync = async () => {
    setSyncStatus('syncing');
    setSyncMessage('Sincronizando datos locales con la nube...');
    try {
      await Promise.all([
         api.updateFlowerItems(flowerItems, user._id),
         api.updateFixedItems(fixedItems, user._id)
      ]);
      setSyncStatus('success');
      setSyncMessage('¡Sincronización completada con éxito!');
    } catch (error) {
      console.error("Error en la sincronización forzada:", error);
      setSyncStatus('error');
      setSyncMessage('Error al sincronizar. Revisa tu conexión a internet.');
    } finally {
        setTimeout(() => setSyncStatus('idle'), 5000);
    }
  };
  
  const handleDownloadData = () => {
    try {
      const backupData = {
        flowerItems,
        fixedItems,
        backupDate: new Date().toISOString(),
      };
      const dataStr = JSON.stringify(backupData, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', `vitora-erp-backup-${user.username}.json`);
      linkElement.click();
      linkElement.remove();
    } catch (error) {
      console.error("Error al descargar los datos:", error);
      alert("No se pudo generar la copia de seguridad.");
    }
  };
  
  // --- User CRUD Logic ---
  const handleOpenUserModalNew = () => { setEditingUser(null); setIsUserModalOpen(true); };
  const handleOpenUserModalEdit = (u: User) => { setEditingUser(u); setIsUserModalOpen(true); };
  
  const handleSaveUser = async (userData: { username: string; password?: string; role: UserRole }) => {
    try {
        if (editingUser) {
            await api.updateUser(editingUser._id, userData, user._id);
        } else {
            if (!userData.password) return; // Should be caught by modal
            await api.createUser({ ...userData, password: userData.password }, user._id);
        }
        if (onUsersRefresh) onUsersRefresh();
        setIsUserModalOpen(false);
    } catch (error: any) {
        alert(error.message || "Error al guardar usuario.");
    }
  };

  const handleDeleteUser = async (userIdToDelete: string) => {
      if (window.confirm("¿Estás seguro de eliminar este usuario? Esta acción no se puede deshacer.")) {
          try {
              await api.deleteUser(userIdToDelete, user._id);
              if (onUsersRefresh) onUsersRefresh();
              if (selectedUserForPins === userIdToDelete) setSelectedUserForPins(null);
          } catch (error: any) {
              alert(error.message || "Error al eliminar el usuario.");
          }
      }
  };

  // --- PIN Management Logic ---
  const handlePinChange = (module: View, value: string) => {
    if (/^\d{0,4}$/.test(value)) {
        setPins(prev => ({...prev, [module]: value }));
    }
  };

  const handleSavePins = async () => {
    if (!selectedUserForPins) return;
    setPinSaveStatus('saving');
    try {
        await api.updateUserPins(selectedUserForPins, pins, user._id);
        if (user._id === selectedUserForPins) {
            onUserPinsUpdate({...user, modulePins: pins });
        }
        if (onUsersRefresh) onUsersRefresh();
        setPinSaveStatus('success');
    } catch(err) {
        setPinSaveStatus('error');
    } finally {
        setTimeout(() => setPinSaveStatus('idle'), 3000);
    }
  };

  const renderGeneralContent = () => (
     <div>
        <h3 className="text-lg font-bold mb-3 text-cyan-300">Sincronización y Respaldo</h3>
         <p className="text-sm text-gray-500 mb-4">Usa estas herramientas para guardar datos ingresados sin conexión o para crear una copia de seguridad.</p>
        <div className="flex items-start gap-4 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
            <div className='flex-grow'>
                <div className="flex gap-4">
                    <button onClick={handleForceSync} disabled={syncStatus === 'syncing'} className="flex items-center gap-2 text-sm font-semibold py-2 px-4 rounded-lg transition-colors bg-cyan-600 hover:bg-cyan-500 text-white disabled:bg-gray-600">
                        <CloudArrowUpIcon className="w-5 h-5" /> Forzar Sincronización
                    </button>
                    <button onClick={handleDownloadData} className="flex items-center gap-2 text-sm font-semibold py-2 px-4 rounded-lg transition-colors bg-gray-600 hover:bg-gray-500 text-white">
                        <ArrowDownTrayIcon className="w-5 h-5" /> Descargar Copia
                    </button>
                </div>
                {syncStatus !== 'idle' && (
                <p className={`text-sm mt-3 font-semibold ${
                    syncStatus === 'success' ? 'text-green-400' :
                    syncStatus === 'error' ? 'text-red-400' :
                    'text-cyan-300'
                }`}>{syncMessage}</p>
                )}
            </div>
        </div>
     </div>
  );

  const renderUsersContent = () => (
     <div className="flex flex-col lg:flex-row gap-6 h-full overflow-hidden">
        {/* User List */}
        <div className="lg:w-1/2 flex flex-col h-full">
            <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-bold text-cyan-300">Usuarios del Sistema</h3>
                <button onClick={handleOpenUserModalNew} className="flex items-center gap-1 text-xs font-bold py-1.5 px-3 rounded-lg bg-green-600 hover:bg-green-500 text-white">
                    <PlusIcon className="w-4 h-4"/> Nuevo
                </button>
            </div>
            <div className="bg-gray-800/50 rounded-lg border border-gray-700 overflow-y-auto flex-grow">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-700/50 text-xs text-gray-400 uppercase sticky top-0">
                        <tr>
                            <th className="px-4 py-3">Usuario</th>
                            <th className="px-4 py-3">Rol</th>
                            <th className="px-4 py-3 text-center">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                        {allUsers.map(u => (
                            <tr key={u._id} 
                                onClick={() => setSelectedUserForPins(u._id)}
                                className={`cursor-pointer transition-colors ${selectedUserForPins === u._id ? 'bg-purple-900/30' : 'hover:bg-gray-700/30'}`}
                            >
                                <td className="px-4 py-3 font-medium text-white">{u.username}</td>
                                <td className="px-4 py-3 text-gray-400 capitalize">{u.role}</td>
                                <td className="px-4 py-3 text-center flex justify-center gap-2">
                                    <button onClick={(e) => { e.stopPropagation(); handleOpenUserModalEdit(u); }} className="text-blue-400 hover:text-blue-300 p-1"><PencilIcon className="w-4 h-4"/></button>
                                    {u._id !== user._id && (
                                        <button onClick={(e) => { e.stopPropagation(); handleDeleteUser(u._id); }} className="text-red-500 hover:text-red-400 p-1"><TrashIcon className="w-4 h-4"/></button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>

        {/* PIN Management (Right Side) */}
        <div className="lg:w-1/2 flex flex-col bg-gray-800/30 rounded-lg border border-gray-700 p-4">
            <h3 className="text-lg font-bold mb-2 text-purple-300">Gestión de Seguridad</h3>
            {selectedUserForPins ? (
                <>
                    <p className="text-sm text-gray-400 mb-4">
                        Configurando PINs para: <span className="font-bold text-white">{allUsers.find(u => u._id === selectedUserForPins)?.username}</span>
                    </p>
                    <div className="space-y-3 flex-grow overflow-y-auto pr-2">
                        {Object.keys(moduleNames).map(key => {
                            const module = key as View;
                            if (module === 'settings') return null;
                            return (
                                <div key={module} className="flex items-center justify-between bg-gray-900/40 p-2 rounded border border-gray-700">
                                    <label htmlFor={`pin-${module}`} className="font-medium text-white text-sm">{moduleNames[module]}</label>
                                    <input
                                        type="password"
                                        id={`pin-${module}`}
                                        value={pins[module] || ''}
                                        onChange={(e) => handlePinChange(module, e.target.value)}
                                        maxLength={4}
                                        className="bg-gray-700 border border-gray-600 text-white text-sm rounded focus:ring-purple-500 focus:border-purple-500 block w-20 p-1.5 text-center tracking-[.3em]"
                                        placeholder="----"
                                    />
                                </div>
                            );
                        })}
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                        <span className={`text-sm ${pinSaveStatus === 'success' ? 'text-green-400' : pinSaveStatus === 'error' ? 'text-red-400' : 'text-transparent'}`}>
                            {pinSaveStatus === 'success' ? '¡Guardado!' : 'Error al guardar'}
                        </span>
                        <button onClick={handleSavePins} disabled={pinSaveStatus === 'saving'} className="py-2 px-6 text-sm font-bold text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors disabled:bg-gray-600">
                            {pinSaveStatus === 'saving' ? '...' : 'Guardar PINs'}
                        </button>
                    </div>
                </>
            ) : (
                <div className="flex items-center justify-center h-full text-gray-500 text-sm italic">
                    Selecciona un usuario de la lista para gestionar sus permisos.
                </div>
            )}
        </div>

        <UserModal 
            isOpen={isUserModalOpen} 
            onClose={() => setIsUserModalOpen(false)} 
            onSave={handleSaveUser} 
            userToEdit={editingUser} 
        />
     </div>
  );
  
  const TabButton: React.FC<{view: SettingsViewTab, label: string}> = ({ view, label }) => (
      <button 
        onClick={() => setSettingsView(view)}
        className={`px-4 py-2 text-sm font-semibold rounded-t-lg border-b-2 transition-colors
            ${settingsView === view 
                ? 'text-purple-300 border-purple-400' 
                : 'text-gray-400 border-transparent hover:text-white hover:border-gray-500'}`}
      >
          {label}
      </button>
  );

  return (
    <div className="bg-black/20 backdrop-blur-xl border border-gray-700/50 rounded-3xl shadow-2xl shadow-purple-500/10 transition-all duration-500 min-h-[calc(100vh-10rem)] flex flex-col">
      <div className="px-6 md:px-8 pt-6 flex-shrink-0">
        <h1 className="text-3xl font-bold text-gray-300 tracking-wider">Ajustes del Sistema</h1>
        <div className="border-b border-gray-700 mt-4">
            <nav className="-mb-px flex gap-4 flex-wrap">
                <TabButton view="general" label="General" />
                 {user.role === 'admin' && <TabButton view="users" label="Gestión de Usuarios" />}
            </nav>
        </div>
      </div>

      <div className="p-6 md:p-8 flex-grow overflow-y-auto">
        {settingsView === 'general' && renderGeneralContent()}
        {settingsView === 'users' && user.role === 'admin' && renderUsersContent()}
      </div>
    </div>
  );
};

export default SettingsPanel;
