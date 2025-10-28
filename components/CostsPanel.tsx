
import React, { useState } from 'react';
import type { FlowerItem, FixedItem, Item } from '../types';
import { CogIcon } from './icons/CogIcon';
import { HomeIcon } from './icons/HomeIcon';
import CostModal from './CostModal';

interface CostsPanelProps {
  flowerItems: FlowerItem[];
  setFlowerItems: (updater: FlowerItem[] | ((prev: FlowerItem[]) => FlowerItem[])) => Promise<void>;
  fixedItems: FixedItem[];
  setFixedItems: (updater: FixedItem[] | ((prev: FixedItem[]) => FixedItem[])) => Promise<void>;
  onNavigateToSettings: () => void;
  onNavigateToMain: () => void;
}

const CostsPanel: React.FC<CostsPanelProps> = ({
  flowerItems,
  setFlowerItems,
  fixedItems,
  setFixedItems,
  onNavigateToSettings,
  onNavigateToMain,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | FlowerItem | null>(null);
  const [itemType, setItemType] = useState<'flower' | 'fixed' | null>(null);

  const openModalForEdit = (item: Item | FlowerItem, type: 'flower' | 'fixed') => {
    setItemType(type);
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleSave = async (itemData: Partial<FlowerItem & FixedItem>) => {
    const newItemData = { ...itemData, costHistory: [...(editingItem?.costHistory || [])] };
    const date = new Date().toISOString();

    if (itemType === 'flower' && editingItem) {
        if(itemData.costoPaquete !== (editingItem as FlowerItem).costoPaquete) {
            newItemData.costHistory.push({ date, costoPaquete: itemData.costoPaquete });
        }
        await setFlowerItems(prevItems => 
            prevItems.map(i => i.id === editingItem.id ? { ...i, ...newItemData } : i)
        );
    } else if (itemType === 'fixed' && editingItem) {
        if(itemData.costo !== editingItem.costo) {
            newItemData.costHistory.push({ date, costo: itemData.costo });
        }
        await setFixedItems(prevItems =>
            prevItems.map(i => i.id === editingItem.id ? { ...i, ...newItemData } : i)
        );
    }
    setIsModalOpen(false);
    setEditingItem(null);
    setItemType(null);
  };
  
  const calculateUnitCost = (item: FlowerItem): string => {
    const { costoPaquete = 0, cantidadPorPaquete = 0, merma = 0 } = item;
    if (!costoPaquete || !cantidadPorPaquete) return 'N/A';
    const effectiveQuantity = cantidadPorPaquete - merma;
    if (effectiveQuantity <= 0) return 'Error';
    return (costoPaquete / effectiveQuantity).toFixed(2);
  };

  return (
    <div className="flex flex-col gap-6">
       <div className="flex justify-center gap-4 border-b border-gray-700 pb-4 mb-4">
          <button onClick={onNavigateToMain} className="flex flex-col items-center gap-2 group">
              <span className="p-3 bg-gray-700 rounded-full group-hover:bg-gray-600 transition-colors">
                  <HomeIcon className="w-6 h-6 text-gray-300" />
              </span>
              <span className="text-xs font-semibold text-gray-400">INICIO</span>
          </button>
          <button onClick={onNavigateToSettings} className="flex flex-col items-center gap-2 group">
              <span className="p-3 bg-gray-700 rounded-full group-hover:bg-gray-600 transition-colors">
                  <CogIcon className="w-6 h-6 text-gray-300" />
              </span>
              <span className="text-xs font-semibold text-gray-400">AJUSTES</span>
          </button>
      </div>
      
      {/* Tabla de Costos de Flores */}
      <div>
        <h3 className="text-lg font-bold mb-3 text-amber-300">Costos de Flores y Follajes</h3>
        <div className="bg-gray-800/50 rounded-lg overflow-hidden border border-gray-700">
          <table className="w-full text-left">
            <thead className="bg-gray-700/50 text-xs text-gray-300 uppercase">
              <tr>
                <th scope="col" className="px-4 py-3 text-base">Item</th>
                <th scope="col" className="px-4 py-3 text-center text-base">Costo Paquete</th>
                <th scope="col" className="px-4 py-3 text-center text-base">Cant. Paquete</th>
                <th scope="col" className="px-4 py-3 text-center text-base">Merma (uds)</th>
                <th scope="col" className="px-4 py-3 text-center text-base">Costo Unitario</th>
              </tr>
            </thead>
            <tbody>
              {flowerItems.map((item) => (
                <tr 
                  key={item.id}
                  onDoubleClick={() => openModalForEdit(item, 'flower')}
                  className="border-b border-gray-700 transition-colors cursor-pointer hover:bg-gray-700/40"
                >
                  <td className="px-4 py-3 font-medium text-white text-base">{item.name}</td>
                  <td className="px-4 py-3 text-center text-base text-white">S/ {item.costoPaquete || 0}</td>
                  <td className="px-4 py-3 text-center text-base text-white">{item.cantidadPorPaquete || 0}</td>
                  <td className="px-4 py-3 text-center text-base text-white">{item.merma || 0}</td>
                  <td className="px-4 py-3 text-center font-bold text-white text-base">S/ {calculateUnitCost(item)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
         <p className="text-xs text-gray-500 mt-2">Haz doble click en una fila para editar sus valores de costo.</p>
      </div>
      
      {/* Tabla de Costos Fijos */}
       <div>
        <h3 className="text-lg font-bold mb-3 text-amber-300">Costos Fijos</h3>
        <div className="bg-gray-800/50 rounded-lg overflow-hidden border border-gray-700">
          <table className="w-full text-left">
            <thead className="bg-gray-700/50 text-xs text-gray-300 uppercase">
              <tr>
                <th scope="col" className="px-4 py-3 text-base">Item</th>
                <th scope="col" className="px-4 py-3 text-center text-base">Costo</th>
              </tr>
            </thead>
            <tbody>
              {fixedItems.map((item) => (
                <tr 
                  key={item.id}
                  onDoubleClick={() => openModalForEdit(item, 'fixed')}
                  className="border-b border-gray-700 transition-colors cursor-pointer hover:bg-gray-700/40"
                >
                  <td className="px-4 py-3 font-medium text-white text-base">{item.name}</td>
                  <td className="px-4 py-3 text-center font-bold text-white text-base">S/ {item.costo || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-gray-500 mt-2">Haz doble click en una fila para editar su costo.</p>
      </div>

      <CostModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        item={editingItem}
        itemType={itemType}
      />
    </div>
  );
};

export default CostsPanel;
