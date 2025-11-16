
import React, { useState, useMemo } from 'react';
import type { FlowerItem, FixedItem, Item } from '../types';
import * as api from '../services/api';
import { CheckIcon } from './icons/CheckIcon';
import { XIcon } from './icons/XIcon';
import { PlusIcon } from './icons/PlusIcon';
import { TrashIcon } from './icons/TrashIcon';
import { CloudArrowUpIcon } from './icons/CloudArrowUpIcon';
import { ArrowDownTrayIcon } from './icons/ArrowDownTrayIcon';
import { ChartLineIcon } from './icons/ChartLineIcon';
import Modal from './Modal';
import CostModal from './CostModal';
import CostChart from './CostChart';

interface SettingsPanelProps {
  flowerItems: FlowerItem[];
  setFlowerItems: (updater: FlowerItem[] | ((prev: FlowerItem[]) => FlowerItem[])) => Promise<void>;
  fixedItems: FixedItem[];
  setFixedItems: (updater: FixedItem[] | ((prev: FixedItem[]) => FixedItem[])) => Promise<void>;
}

type SettingsView = 'products' | 'costs' | 'history' | 'general';

const SettingsPanel: React.FC<SettingsPanelProps> = ({
  flowerItems,
  setFlowerItems,
  fixedItems,
  setFixedItems,
}) => {
  const [settingsView, setSettingsView] = useState<SettingsView>('products');
  
  // State for Product Management
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Item | FlowerItem | null>(null);
  const [productType, setProductType] = useState<'flower' | 'fixed' | null>(null);
  const [selectedFlowerId, setSelectedFlowerId] = useState<string | null>(null);
  const [selectedFixedId, setSelectedFixedId] = useState<string | null>(null);
  
  // State for Cost Management
  const [isCostModalOpen, setIsCostModalOpen] = useState(false);
  const [editingCostItem, setEditingCostItem] = useState<Item | FlowerItem | null>(null);
  const [costItemType, setCostItemType] = useState<'flower' | 'fixed' | null>(null);
  
  // State for History
  const allItemsForHistory = useMemo(() => [
    ...flowerItems.map(item => ({ ...item, type: 'flower' as const })),
    ...fixedItems.map(item => ({ ...item, type: 'fixed' as const }))
  ], [flowerItems, fixedItems]);
  const [selectedHistoryItemId, setSelectedHistoryItemId] = useState<string | null>(allItemsForHistory.length > 0 ? allItemsForHistory[0].id : null);
   const selectedHistoryItem = useMemo(() => {
    if (!selectedHistoryItemId) return null;
    return allItemsForHistory.find(item => item.id === selectedHistoryItemId) || null;
  }, [allItemsForHistory, selectedHistoryItemId]);


  // State for Sync
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [syncMessage, setSyncMessage] = useState('');

  // --- Product Management Logic ---
  const openProductModalForNew = (type: 'flower' | 'fixed') => {
    setProductType(type);
    setEditingProduct(null);
    setIsProductModalOpen(true);
  };
  
  const openProductModalForEdit = (item: Item | FlowerItem, type: 'flower' | 'fixed') => {
    setProductType(type);
    setEditingProduct(item);
    setIsProductModalOpen(true);
  };

  const handleProductSave = async (itemData: Omit<Item, 'id' | 'costo' | 'costHistory'> & { imageUrl?: string }) => {
    if (productType === 'flower') {
        await setFlowerItems(prevItems => {
             const baseItem = editingProduct ? prevItems.find(i => i.id === editingProduct.id) : { costHistory: [] };
             const newItem: FlowerItem = { 
                ...(baseItem as FlowerItem),
                ...itemData, 
                id: editingProduct?.id || `id_${Date.now()}`,
                imageUrl: itemData.imageUrl || ''
            };
            if (editingProduct) {
                return prevItems.map(i => i.id === editingProduct.id ? newItem : i);
            }
            return [...prevItems, newItem];
        });
    } else {
        await setFixedItems(prevItems => {
            const baseItem = editingProduct ? prevItems.find(i => i.id === editingProduct.id) : { costHistory: [] };
            const newItem: FixedItem = { 
              ...(baseItem as FixedItem),
              ...itemData, 
              id: editingProduct?.id || `id_${Date.now()}`
            };
            if (editingProduct) {
                return prevItems.map(i => i.id === editingProduct.id ? newItem : i);
            }
            return [...prevItems, newItem];
        });
    }

    setIsProductModalOpen(false);
    setEditingProduct(null);
    setProductType(null);
  };

  const handleProductDelete = async (type: 'flower' | 'fixed') => {
    if (type === 'flower' && selectedFlowerId) {
      await setFlowerItems(prev => prev.filter(item => item.id !== selectedFlowerId));
      setSelectedFlowerId(null);
    } else if (type === 'fixed' && selectedFixedId) {
      await setFixedItems(prev => prev.filter(item => item.id !== selectedFixedId));
      setSelectedFixedId(null);
    }
  };
  
  const toggleProductVisibility = async (id: string, type: 'flower' | 'fixed') => {
    const itemsSetter = type === 'flower' ? setFlowerItems : setFixedItems;
    await itemsSetter(prevItems => 
      prevItems.map(item => 
        item.id === id ? { ...item, visible: !item.visible } : item
      )
    );
  };
  
  // --- Cost Management Logic ---
  const openCostModalForEdit = (item: Item | FlowerItem, type: 'flower' | 'fixed') => {
    setCostItemType(type);
    setEditingCostItem(item);
    setIsCostModalOpen(true);
  };

  const handleCostSave = async (itemData: Partial<FlowerItem & FixedItem>) => {
    const newItemData = { ...itemData, costHistory: [...(editingCostItem?.costHistory || [])] };
    const date = new Date().toISOString();

    if (costItemType === 'flower' && editingCostItem) {
        if(itemData.costoPaquete !== (editingCostItem as FlowerItem).costoPaquete) {
            newItemData.costHistory.push({ date, costoPaquete: itemData.costoPaquete });
        }
        await setFlowerItems(prevItems => 
            prevItems.map(i => i.id === editingCostItem.id ? { ...i, ...newItemData } : i)
        );
    } else if (costItemType === 'fixed' && editingCostItem) {
        if(itemData.costo !== editingCostItem.costo) {
            newItemData.costHistory.push({ date, costo: itemData.costo });
        }
        await setFixedItems(prevItems =>
            prevItems.map(i => i.id === editingCostItem.id ? { ...i, ...newItemData } : i)
        );
    }
    setIsCostModalOpen(false);
    setEditingCostItem(null);
    setCostItemType(null);
  };
  
  const calculateUnitCost = (item: FlowerItem): string => {
    const { costoPaquete = 0, cantidadPorPaquete = 0, merma = 0 } = item;
    if (!costoPaquete || !cantidadPorPaquete) return 'N/A';
    const effectiveQuantity = cantidadPorPaquete - merma;
    if (effectiveQuantity <= 0) return 'Error';
    return (costoPaquete / effectiveQuantity).toFixed(2);
  };

  // --- Sync Logic ---
   const handleForceSync = async () => {
    setSyncStatus('syncing');
    setSyncMessage('Sincronizando datos locales con la nube...');
    try {
      const localFlowers = api.getItemsFromStorageOnly<FlowerItem[]>('flowerItems');
      const localFixed = api.getItemsFromStorageOnly<FixedItem[]>('fixedItems');
      
      if (!localFlowers && !localFixed) {
        throw new Error("No se encontraron datos locales para sincronizar.");
      }

      await Promise.all([
        localFlowers ? api.updateFlowerItems(localFlowers) : Promise.resolve(),
        localFixed ? api.updateFixedItems(localFixed) : Promise.resolve(),
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
      const localFlowers = api.getItemsFromStorageOnly<FlowerItem[]>('flowerItems');
      const localFixed = api.getItemsFromStorageOnly<FixedItem[]>('fixedItems');
      const backupData = {
        flowerItems: localFlowers || [],
        fixedItems: localFixed || [],
        backupDate: new Date().toISOString(),
      };
      const dataStr = JSON.stringify(backupData, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', 'vitora-erp-backup.json');
      linkElement.click();
      linkElement.remove();
    } catch (error) {
      console.error("Error al descargar los datos:", error);
      alert("No se pudo generar la copia de seguridad.");
    }
  };

  // --- RENDER FUNCTIONS FOR TABS ---

  const renderProductsContent = () => (
    <div className="space-y-8">
      {renderTableProducts('Precios de Flores', flowerItems, selectedFlowerId, setSelectedFlowerId, 'flower')}
      {renderTableProducts('Precios Fijos', fixedItems, selectedFixedId, setSelectedFixedId, 'fixed')}
    </div>
  );

  const renderTableProducts = (
    title: string,
    items: (Item | FlowerItem)[],
    selectedId: string | null,
    setSelectedId: (id: string | null) => void,
    type: 'flower' | 'fixed'
  ) => (
    <div>
      <h3 className="text-lg font-bold mb-3 text-amber-300">{title}</h3>
      <div className="bg-gray-800/50 rounded-lg overflow-hidden border border-gray-700">
        <table className="w-full text-left">
          <thead className="bg-gray-700/50 text-xs text-gray-300 uppercase">
            <tr>
              <th scope="col" className="px-4 py-3">Item</th>
              <th scope="col" className="px-4 py-3 text-center">Precio Venta</th>
              <th scope="col" className="px-4 py-3 text-center">Visible</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr 
                key={item.id}
                onClick={() => setSelectedId(item.id === selectedId ? null : item.id)}
                onDoubleClick={() => openProductModalForEdit(item, type)}
                className={`border-b border-gray-700 transition-colors cursor-pointer ${selectedId === item.id ? 'bg-purple-600/30' : 'hover:bg-gray-700/40'}`}
              >
                <td className="px-4 py-3 font-medium text-white">{item.name}</td>
                <td className="px-4 py-3 text-center text-white">S/ {item.price}</td>
                <td className="px-4 py-3 text-center">
                  <button onClick={(e) => { e.stopPropagation(); toggleProductVisibility(item.id, type); }} className="p-1 rounded-full">
                    {item.visible ? <CheckIcon className="w-5 h-5 text-green-400"/> : <XIcon className="w-5 h-5 text-red-400"/>}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex gap-2 mt-3">
        <button onClick={() => openProductModalForNew(type)} className={`flex items-center gap-2 text-sm font-semibold py-2 px-4 rounded-lg transition-colors ${type === 'flower' ? 'bg-amber-600 hover:bg-amber-500' : 'bg-blue-600 hover:bg-blue-500'} text-white`}>
          <PlusIcon className="w-4 h-4" /> Añadir
        </button>
        <button 
          onClick={() => handleProductDelete(type)}
          disabled={!selectedId}
          className={`flex items-center gap-2 text-sm font-semibold py-2 px-4 rounded-lg transition-colors ${type === 'flower' ? 'bg-red-700 hover:bg-red-600' : 'bg-red-700 hover:bg-red-600'} text-white disabled:bg-gray-600 disabled:cursor-not-allowed`}
        >
          <TrashIcon className="w-4 h-4" /> Eliminar
        </button>
      </div>
    </div>
  );

  const renderCostsContent = () => (
     <div className="space-y-8">
        <div>
            <h3 className="text-lg font-bold mb-3 text-amber-300">Costos de Flores y Follajes</h3>
            <div className="bg-gray-800/50 rounded-lg overflow-hidden border border-gray-700">
            <table className="w-full text-left">
                <thead className="bg-gray-700/50 text-xs text-gray-300 uppercase">
                <tr>
                    <th scope="col" className="px-4 py-3">Item</th>
                    <th scope="col" className="px-4 py-3 text-center">Costo Paquete</th>
                    <th scope="col" className="px-4 py-3 text-center">Cant. Paquete</th>
                    <th scope="col" className="px-4 py-3 text-center">Merma (uds)</th>
                    <th scope="col" className="px-4 py-3 text-center">Costo Unitario</th>
                </tr>
                </thead>
                <tbody>
                {flowerItems.map((item) => (
                    <tr 
                    key={item.id}
                    onDoubleClick={() => openCostModalForEdit(item, 'flower')}
                    className="border-b border-gray-700 transition-colors cursor-pointer hover:bg-gray-700/40"
                    >
                    <td className="px-4 py-3 font-medium text-white">{item.name}</td>
                    <td className="px-4 py-3 text-center text-white">S/ {item.costoPaquete || 0}</td>
                    <td className="px-4 py-3 text-center text-white">{item.cantidadPorPaquete || 0}</td>
                    <td className="px-4 py-3 text-center text-white">{item.merma || 0}</td>
                    <td className="px-4 py-3 text-center font-bold text-white">S/ {calculateUnitCost(item)}</td>
                    </tr>
                ))}
                </tbody>
            </table>
            </div>
            <p className="text-xs text-gray-500 mt-2">Haz doble click en una fila para editar sus valores de costo.</p>
        </div>
        
        <div>
            <h3 className="text-lg font-bold mb-3 text-amber-300">Costos Fijos</h3>
            <div className="bg-gray-800/50 rounded-lg overflow-hidden border border-gray-700">
            <table className="w-full text-left">
                <thead className="bg-gray-700/50 text-xs text-gray-300 uppercase">
                <tr>
                    <th scope="col" className="px-4 py-3">Item</th>
                    <th scope="col" className="px-4 py-3 text-center">Costo</th>
                </tr>
                </thead>
                <tbody>
                {fixedItems.map((item) => (
                    <tr 
                    key={item.id}
                    onDoubleClick={() => openCostModalForEdit(item, 'fixed')}
                    className="border-b border-gray-700 transition-colors cursor-pointer hover:bg-gray-700/40"
                    >
                    <td className="px-4 py-3 font-medium text-white">{item.name}</td>
                    <td className="px-4 py-3 text-center font-bold text-white">S/ {item.costo || 0}</td>
                    </tr>
                ))}
                </tbody>
            </table>
            </div>
            <p className="text-xs text-gray-500 mt-2">Haz doble click en una fila para editar su costo.</p>
        </div>
    </div>
  );
  
  const renderHistoryContent = () => (
     <div className="flex flex-col md:flex-row gap-6">
        <div className="md:w-1/3">
          <label htmlFor="item-select" className="block mb-2 text-sm font-medium text-gray-400">Seleccionar Item</label>
          <select 
            id="item-select"
            value={selectedHistoryItemId || ''}
            onChange={(e) => setSelectedHistoryItemId(e.target.value)}
            className="bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-purple-500 focus:border-purple-500 block w-full p-2.5"
          >
            <option value="" disabled>-- Elige un item --</option>
            {allItemsForHistory.map(item => (
              <option key={item.id} value={item.id}>{item.name}</option>
            ))}
          </select>
        </div>
        <div className="md:w-2/3">
          {selectedHistoryItem ? (
            <div className="flex flex-col gap-6">
              <div>
                <h3 className="text-lg font-bold mb-3 text-amber-300">Evolución de Costo para: {selectedHistoryItem.name}</h3>
                <CostChart 
                  data={selectedHistoryItem.costHistory || []}
                  itemType={selectedHistoryItem.type}
                />
              </div>
              <div>
                <h3 className="text-lg font-bold mb-3 text-amber-300">Registros de Cambios</h3>
                <div className="bg-gray-800/50 rounded-lg overflow-hidden border border-gray-700 max-h-60 overflow-y-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-700/50 text-xs text-gray-300 uppercase sticky top-0">
                            <tr>
                                <th scope="col" className="px-4 py-3">Fecha de Registro</th>
                                <th scope="col" className="px-4 py-3 text-center">
                                    {selectedHistoryItem.type === 'flower' ? 'Costo Paquete' : 'Costo Item'}
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {(!selectedHistoryItem.costHistory || selectedHistoryItem.costHistory.length === 0) ? (
                                <tr>
                                    <td colSpan={2} className="text-center text-gray-500 p-4">No hay historial de costos para este item.</td>
                                </tr>
                            ) : (
                                [...(selectedHistoryItem.costHistory || [])].reverse().map((entry, index) => (
                                <tr key={index} className="border-b border-gray-700 last:border-b-0">
                                    <td className="px-4 py-3 font-medium text-white">
                                        {new Date(entry.date).toLocaleString('es-ES', { 
                                            year: 'numeric', month: 'long', day: 'numeric', 
                                            hour: '2-digit', minute: '2-digit' 
                                        })}
                                    </td>
                                    <td className="px-4 py-3 text-center font-semibold text-white">
                                        S/ {(selectedHistoryItem.type === 'flower' ? entry.costoPaquete : entry.costo)?.toFixed(2) || 'N/A'}
                                    </td>
                                </tr>
                            )))}
                        </tbody>
                    </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full min-h-[300px] bg-gray-800/50 rounded-lg border border-gray-700 p-8 text-center">
                <ChartLineIcon className="w-16 h-16 text-gray-600 mb-4"/>
                <h3 className="text-lg font-bold text-gray-400">Selecciona un item</h3>
                <p className="text-sm text-gray-500">Elige un item de la lista para ver su historial de costos.</p>
            </div>
          )}
        </div>
      </div>
  );

  const renderGeneralContent = () => (
     <div className="space-y-8">
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
         <div>
            <h3 className="text-lg font-bold mb-3 text-cyan-300">Branding</h3>
             <p className="text-sm text-gray-500 mb-4">Configura el logo que aparecerá en el sistema y en los documentos.</p>
             <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                <label htmlFor="logoUrl" className="block mb-1 text-sm font-medium text-gray-400">URL del Logo</label>
                <input
                    type="text"
                    id="logoUrl"
                    placeholder="https://example.com/logo.png"
                    className="bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-purple-500 focus:border-purple-500 block w-full p-2.5"
                />
                <p className="text-xs text-gray-500 mt-2">Esta función se implementará próximamente.</p>
             </div>
        </div>
     </div>
  );

  const TabButton: React.FC<{view: SettingsView, label: string}> = ({ view, label }) => (
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
    <div className="bg-black/20 backdrop-blur-xl border border-gray-700/50 rounded-3xl shadow-2xl shadow-purple-500/10 transition-all duration-500 min-h-[60vh]">
      <div className="px-6 md:px-8 pt-6">
        <h1 className="text-3xl font-bold text-gray-300 tracking-wider">Ajustes del Sistema</h1>
        <div className="border-b border-gray-700 mt-4">
            <nav className="-mb-px flex gap-4">
                <TabButton view="products" label="Productos y Precios" />
                <TabButton view="costs" label="Costos" />
                <TabButton view="history" label="Historial de Costos" />
                <TabButton view="general" label="Configuración General" />
            </nav>
        </div>
      </div>

      <div className="p-6 md:p-8">
        {settingsView === 'products' && renderProductsContent()}
        {settingsView === 'costs' && renderCostsContent()}
        {settingsView === 'history' && renderHistoryContent()}
        {settingsView === 'general' && renderGeneralContent()}
      </div>

      <Modal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        onSave={handleProductSave}
        item={editingProduct}
        itemType={productType}
      />
      <CostModal
        isOpen={isCostModalOpen}
        onClose={() => setIsCostModalOpen(false)}
        onSave={handleCostSave}
        item={editingCostItem}
        itemType={costItemType}
      />
    </div>
  );
};

export default SettingsPanel;
