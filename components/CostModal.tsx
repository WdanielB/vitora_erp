
import React, { useState, useEffect } from 'react';
import type { Item, FlowerItem, ProductItem } from '../types.ts';

interface CostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (itemData: Partial<FlowerItem> | Partial<ProductItem>) => void;
  item: Item | FlowerItem | ProductItem | null;
  itemType: 'flower' | 'fixed' | null;
}

const CostModal: React.FC<CostModalProps> = ({ isOpen, onClose, onSave, item, itemType }) => {
  const [costo, setCosto] = useState('0');
  const [costoPaquete, setCostoPaquete] = useState('0');
  const [cantidadPorPaquete, setCantidadPorPaquete] = useState('0');
  const [merma, setMerma] = useState('0');

  useEffect(() => {
    if (isOpen && item) {
        if (itemType === 'flower') {
            const flowerItem = item as FlowerItem;
            setCostoPaquete(String(flowerItem.costoPaquete || '0'));
            setCantidadPorPaquete(String(flowerItem.cantidadPorPaquete || '0'));
            setMerma(String(flowerItem.merma || '0'));
        } else if (itemType === 'fixed') {
            // Cast to ProductItem (FixedItem) to access 'costo'
            setCosto(String((item as ProductItem).costo || '0'));
        }
    }
  }, [isOpen, item, itemType]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (itemType === 'flower') {
        const updatedFlower: Partial<FlowerItem> = {
            costoPaquete: parseFloat(costoPaquete) || 0,
            cantidadPorPaquete: parseInt(cantidadPorPaquete, 10) || 0,
            merma: parseInt(merma, 10) || 0,
        };
        onSave(updatedFlower);
    } else if (itemType === 'fixed') {
        const updatedFixed: Partial<ProductItem> = {
            costo: parseFloat(costo) || 0
        };
        onSave(updatedFixed);
    }
  };
  
  const renderFlowerFields = () => (
    <>
      <div>
        <label htmlFor="costoPaquete" className="block mb-1 text-sm font-medium text-gray-400">Costo del Paquete (S/)</label>
        <input type="number" id="costoPaquete" value={costoPaquete} onChange={(e) => setCostoPaquete(e.target.value)}
          className="bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-purple-500 focus:border-purple-500 block w-full p-2.5"
          step="0.01" min="0" />
      </div>
      <div>
        <label htmlFor="cantidadPorPaquete" className="block mb-1 text-sm font-medium text-gray-400">Cantidad por Paquete</label>
        <input type="number" id="cantidadPorPaquete" value={cantidadPorPaquete} onChange={(e) => setCantidadPorPaquete(e.target.value)}
          className="bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-purple-500 focus:border-purple-500 block w-full p-2.5"
          step="1" min="0" />
      </div>
      <div>
        <label htmlFor="merma" className="block mb-1 text-sm font-medium text-gray-400">Merma (unidades perdidas)</label>
        <input type="number" id="merma" value={merma} onChange={(e) => setMerma(e.target.value)}
          className="bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-purple-500 focus:border-purple-500 block w-full p-2.5"
          step="1" min="0" />
      </div>
    </>
  );

  const renderFixedFields = () => (
    <div>
        <label htmlFor="costo" className="block mb-1 text-sm font-medium text-gray-400">Costo del Item (S/)</label>
        <input type="number" id="costo" value={costo} onChange={(e) => setCosto(e.target.value)}
          className="bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-purple-500 focus:border-purple-500 block w-full p-2.5"
          step="0.01" min="0" />
    </div>
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4" onClick={onClose}>
      <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6 w-full max-w-sm shadow-2xl shadow-purple-500/20" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-xl font-bold mb-4 text-purple-300">Editar Costos de "{item?.name}"</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {itemType === 'flower' ? renderFlowerFields() : renderFixedFields()}
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="py-2 px-4 text-sm font-medium text-gray-300 bg-gray-600 rounded-lg hover:bg-gray-500 transition-colors">
              Cancelar
            </button>
            <button type="submit" className="py-2 px-4 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 focus:ring-4 focus:outline-none focus:ring-purple-800 transition-colors">
              Guardar Costos
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CostModal;
