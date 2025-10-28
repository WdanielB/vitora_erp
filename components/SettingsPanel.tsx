
import React, { useState } from 'react';
import type { FlowerItem, FixedItem, Item } from '../types';
import { HomeIcon } from './icons/HomeIcon';
import { CheckIcon } from './icons/CheckIcon';
import { XIcon } from './icons/XIcon';
import { PlusIcon } from './icons/PlusIcon';
import { TrashIcon } from './icons/TrashIcon';
import { CurrencyDollarIcon } from './icons/CurrencyDollarIcon';
import { ChartBarIcon } from './icons/ChartBarIcon';
import Modal from './Modal';

interface SettingsPanelProps {
  flowerItems: FlowerItem[];
  setFlowerItems: (updater: FlowerItem[] | ((prev: FlowerItem[]) => FlowerItem[])) => Promise<void>;
  fixedItems: FixedItem[];
  setFixedItems: (updater: FixedItem[] | ((prev: FixedItem[]) => FixedItem[])) => Promise<void>;
  onNavigateToMain: () => void;
  onNavigateToCosts: () => void;
  onNavigateToHistory: () => void;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({
  flowerItems,
  setFlowerItems,
  fixedItems,
  setFixedItems,
  onNavigateToMain,
  onNavigateToCosts,
  onNavigateToHistory,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | FlowerItem | null>(null);
  const [itemType, setItemType] = useState<'flower' | 'fixed' | null>(null);
  const [selectedFlowerId, setSelectedFlowerId] = useState<string | null>(null);
  const [selectedFixedId, setSelectedFixedId] = useState<string | null>(null);
  
  const openModalForNew = (type: 'flower' | 'fixed') => {
    setItemType(type);
    setEditingItem(null);
    setIsModalOpen(true);
  };
  
  const openModalForEdit = (item: Item | FlowerItem, type: 'flower' | 'fixed') => {
    setItemType(type);
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleSave = async (itemData: Omit<Item, 'id' | 'costo' | 'costHistory'> & { imageUrl?: string }) => {
    if (itemType === 'flower') {
        await setFlowerItems(prevItems => {
             const baseItem = editingItem ? prevItems.find(i => i.id === editingItem.id) : { costHistory: [] };
             const newItem: FlowerItem = { 
                ...(baseItem as FlowerItem),
                ...itemData, 
                id: editingItem?.id || `id_${Date.now()}`,
                imageUrl: itemData.imageUrl || ''
            };
            if (editingItem) {
                return prevItems.map(i => i.id === editingItem.id ? newItem : i);
            }
            return [...prevItems, newItem];
        });
    } else {
        await setFixedItems(prevItems => {
            const baseItem = editingItem ? prevItems.find(i => i.id === editingItem.id) : { costHistory: [] };
            const newItem: FixedItem = { 
              ...(baseItem as FixedItem),
              ...itemData, 
              id: editingItem?.id || `id_${Date.now()}`
            };
            if (editingItem) {
                return prevItems.map(i => i.id === editingItem.id ? newItem : i);
            }
            return [...prevItems, newItem];
        });
    }

    setIsModalOpen(false);
    setEditingItem(null);
    setItemType(null);
  };


  const handleDelete = async (type: 'flower' | 'fixed') => {
    if (type === 'flower' && selectedFlowerId) {
      await setFlowerItems(prev => prev.filter(item => item.id !== selectedFlowerId));
      setSelectedFlowerId(null);
    } else if (type === 'fixed' && selectedFixedId) {
      await setFixedItems(prev => prev.filter(item => item.id !== selectedFixedId));
      setSelectedFixedId(null);
    }
  };

  const toggleVisibility = async (id: string, type: 'flower' | 'fixed') => {
    const itemsSetter = type === 'flower' ? setFlowerItems : setFixedItems;
    await itemsSetter(prevItems => 
      prevItems.map(item => 
        item.id === id ? { ...item, visible: !item.visible } : item
      )
    );
  };

  const renderTable = (
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
              <th scope="col" className="px-4 py-3 text-base">Item</th>
              <th scope="col" className="px-4 py-3 text-center text-base">Precio Venta</th>
              <th scope="col" className="px-4 py-3 text-center text-base">Visible</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr 
                key={item.id}
                onClick={() => setSelectedId(item.id === selectedId ? null : item.id)}
                onDoubleClick={() => openModalForEdit(item, type)}
                className={`border-b border-gray-700 transition-colors cursor-pointer ${selectedId === item.id ? 'bg-purple-600/30' : 'hover:bg-gray-700/40'}`}
              >
                <td className="px-4 py-3 font-medium text-white text-base">{item.name}</td>
                <td className="px-4 py-3 text-center text-base text-white">S/ {item.price}</td>
                <td className="px-4 py-3 text-center">
                  <button onClick={(e) => { e.stopPropagation(); toggleVisibility(item.id, type); }} className="p-1 rounded-full">
                    {item.visible ? <CheckIcon className="w-5 h-5 text-green-400"/> : <XIcon className="w-5 h-5 text-red-400"/>}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex gap-2 mt-3">
        <button onClick={() => openModalForNew(type)} className={`flex items-center gap-2 text-sm font-semibold py-2 px-4 rounded-lg transition-colors ${type === 'flower' ? 'bg-amber-600 hover:bg-amber-500' : 'bg-blue-600 hover:bg-blue-500'} text-white`}>
          <PlusIcon className="w-4 h-4" /> Añadir
        </button>
        <button 
          onClick={() => handleDelete(type)}
          disabled={!selectedId}
          className={`flex items-center gap-2 text-sm font-semibold py-2 px-4 rounded-lg transition-colors ${type === 'flower' ? 'bg-amber-800' : 'bg-blue-800'} text-white disabled:bg-gray-600 disabled:cursor-not-allowed`}
        >
          <TrashIcon className="w-4 h-4" /> Eliminar
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-6">
       <div className="flex justify-center gap-4 border-b border-gray-700 pb-4 mb-4">
        <button onClick={onNavigateToMain} className="flex flex-col items-center gap-2 group">
            <span className="p-3 bg-gray-700 rounded-full group-hover:bg-gray-600 transition-colors">
                <HomeIcon className="w-6 h-6 text-gray-300" />
            </span>
            <span className="text-xs font-semibold text-gray-400">INICIO</span>
        </button>
         <button onClick={onNavigateToCosts} className="flex flex-col items-center gap-2 group">
            <span className="p-3 bg-gray-700 rounded-full group-hover:bg-gray-600 transition-colors">
                <CurrencyDollarIcon className="w-6 h-6 text-gray-300" />
            </span>
            <span className="text-xs font-semibold text-gray-400">COSTOS</span>
        </button>
         <button onClick={onNavigateToHistory} className="flex flex-col items-center gap-2 group">
            <span className="p-3 bg-gray-700 rounded-full group-hover:bg-gray-600 transition-colors">
                <ChartBarIcon className="w-6 h-6 text-gray-300" />
            </span>
            <span className="text-xs font-semibold text-gray-400">HISTORIAL</span>
        </button>
      </div>

      <h2 className="text-2xl font-bold text-center text-purple-300 -mt-4">PRECIOS DE VENTA</h2>
      
      {renderTable('Precios de Flores', flowerItems, selectedFlowerId, setSelectedFlowerId, 'flower')}
      {renderTable('Precios Fijos', fixedItems, selectedFixedId, setSelectedFixedId, 'fixed')}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        item={editingItem}
        itemType={itemType}
      />
    </div>
  );
};

export default SettingsPanel;
