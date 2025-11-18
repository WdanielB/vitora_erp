
import React, { useState, useEffect } from 'react';
import type { FlowerItem, FixedItem, User, View } from '../types.ts';
import * as api from '../services/api.ts';
// Icons
import { CloudArrowUpIcon } from './icons/CloudArrowUpIcon.tsx';
import { ArrowDownTrayIcon } from './icons/ArrowDownTrayIcon.tsx';
import { moduleNames } from '../constants.ts';

interface SettingsPanelProps {
  flowerItems: FlowerItem[];
  fixedItems: FixedItem[];
  user: User;
  onUserPinsUpdate: (user: User) => void;
  allUsers: User[];
}

type SettingsViewTab = 'general' | 'security';

const SettingsPanel: React.FC<SettingsPanelProps> = ({
  flowerItems, fixedItems, user, onUserPinsUpdate, allUsers
}) => {
  const [settingsView, setSettingsView] = useState<SettingsViewTab>('general');
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [syncMessage, setSyncMessage] = useState('');
  
  // --- PIN Management (for Admin) ---
  const [selectedUserForPins, setSelectedUserForPins] = useState<string>(user._id);
  const [pins, setPins] = useState<{ [key in View]?: string }>({});
  const [pinSaveStatus, setPinSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');

  useEffect(() => {
    const targetUser = allUsers.find(u => u._id === selectedUserForPins) || user;
    setPins(targetUser.modulePins || {});
  }, [selectedUserForPins, allUsers, user]);

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
  
  // --- PIN Management ---
  const handlePinChange = (module: View, value: string) => {
    if (/^\d{0,4}$/.test(value)) {
        setPins(prev => ({...prev, [module]: value }));
    }
  };

  const handleSavePins = async () => {
    setPinSaveStatus('saving');
    try {
        await api.updateUserPins(selectedUserForPins, pins, user._id);
        if (user._id === selectedUserForPins) {
            onUserPinsUpdate({...user, modulePins: pins });
        }
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

  const renderSecurityContent = () => (
     <div>
        <h3 className="text-lg font-bold mb-3 text-cyan-300">Gestión de Seguridad (PINs)</h3>
        <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
            <div className="max-w-sm mb-6">
                <label htmlFor="user-pin-selector" className="block mb-2 text-sm font-medium text-gray-400">Seleccionar Usuario</label>
                <select 
                    id="user-pin-selector"
                    value={selectedUserForPins}
                    onChange={(e) => setSelectedUserForPins(e.target.value)}
                    className="bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-purple-500 focus:border-purple-500 block w-full p-2.5"
                >
                    {allUsers.map(u => <option key={u._id} value={u._id}>{u.username} ({u.role})</option>)}
                </select>
            </div>

            <p className="text-sm text-gray-400 mb-4">Establece un PIN de 4 dígitos para restringir el acceso del usuario seleccionado a ciertos módulos. Déjalo en blanco para desactivar el bloqueo.</p>
            <div className="space-y-3 max-w-sm">
                {Object.keys(moduleNames).map(key => {
                    const module = key as View;
                    if (module === 'settings') return null; // Can't lock settings
                    return (
                        <div key={module} className="flex items-center justify-between">
                            <label htmlFor={`pin-${module}`} className="font-medium text-white">{moduleNames[module]}</label>
                            <input
                                type="password"
                                id={`pin-${module}`}
                                value={pins[module] || ''}
                                onChange={(e) => handlePinChange(module, e.target.value)}
                                maxLength={4}
                                className="bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-purple-500 focus:border-purple-500 block w-24 p-2.5 text-center tracking-[.5em]"
                                placeholder="----"
                            />
                        </div>
                    );
                })}
            </div>
            <div className="mt-6">
                <button onClick={handleSavePins} disabled={pinSaveStatus === 'saving'} className="py-2 px-5 text-sm font-semibold text-white bg-cyan-600 rounded-lg hover:bg-cyan-700 transition-colors disabled:bg-cyan-800">
                    {pinSaveStatus === 'saving' ? 'Guardando...' : 'Guardar PINs'}
                </button>
                {pinSaveStatus === 'success' && <p className="text-green-400 text-sm mt-2">¡Configuración guardada!</p>}
                {pinSaveStatus === 'error' && <p className="text-red-400 text-sm mt-2">Error al guardar.</p>}
            </div>
        </div>
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
    <div className="bg-black/20 backdrop-blur-xl border border-gray-700/50 rounded-3xl shadow-2xl shadow-purple-500/10 transition-all duration-500 min-h-[calc(100vh-10rem)]">
      <div className="px-6 md:px-8 pt-6">
        <h1 className="text-3xl font-bold text-gray-300 tracking-wider">Ajustes del Sistema</h1>
        <div className="border-b border-gray-700 mt-4">
            <nav className="-mb-px flex gap-4 flex-wrap">
                <TabButton view="general" label="Configuración General" />
                 {user.role === 'admin' && <TabButton view="security" label="Seguridad" />}
            </nav>
        </div>
      </div>

      <div className="p-6 md:p-8">
        {settingsView === 'general' && renderGeneralContent()}
        {settingsView === 'security' && user.role === 'admin' && renderSecurityContent()}
      </div>
    </div>
  );
};

export default SettingsPanel;