import React, { useState, useMemo } from 'react';
import type { FlowerItem, FixedItem } from '../types';
import CostChart from './CostChart';
import { ChartLineIcon } from './icons/ChartLineIcon';
import { ArrowLeftIcon } from './icons/ArrowLeftIcon';

interface HistoryPanelProps {
  flowerItems: FlowerItem[];
  fixedItems: FixedItem[];
  onNavigateToSettings: () => void;
}

const HistoryPanel: React.FC<HistoryPanelProps> = ({ flowerItems, fixedItems, onNavigateToSettings }) => {
  const allItems = useMemo(() => [
    ...flowerItems.map(item => ({ ...item, type: 'flower' as const })),
    ...fixedItems.map(item => ({ ...item, type: 'fixed' as const }))
  ], [flowerItems, fixedItems]);

  const [selectedItemId, setSelectedItemId] = useState<string | null>(allItems.length > 0 ? allItems[0].id : null);

  const selectedItem = useMemo(() => {
    if (!selectedItemId) return null;
    return allItems.find(item => item.id === selectedItemId) || null;
  }, [allItems, selectedItemId]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-start items-center gap-4">
        <button onClick={onNavigateToSettings} className="p-2 bg-gray-700 rounded-full hover:bg-gray-600 transition-colors" title="Volver a Ajustes">
            <ArrowLeftIcon className="w-6 h-6 text-gray-300" />
        </button>
        <h2 className="text-xl font-bold text-purple-300">HISTORIAL DE COSTOS</h2>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        <div className="md:w-1/3">
          <label htmlFor="item-select" className="block mb-2 text-sm font-medium text-gray-400">Seleccionar Item</label>
          <select 
            id="item-select"
            value={selectedItemId || ''}
            onChange={(e) => setSelectedItemId(e.target.value)}
            className="bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-purple-500 focus:border-purple-500 block w-full p-2.5"
          >
            <option value="" disabled>-- Elige un item --</option>
            {allItems.map(item => (
              <option key={item.id} value={item.id}>{item.name}</option>
            ))}
          </select>
        </div>
        <div className="md:w-2/3">
          {selectedItem ? (
            <div className="flex flex-col gap-6">
              <div>
                <h3 className="text-lg font-bold mb-3 text-amber-300">Evolución de Costo para: {selectedItem.name}</h3>
                <CostChart 
                  data={selectedItem.costHistory || []}
                  itemType={selectedItem.type}
                />
              </div>
              <div>
                <h3 className="text-lg font-bold mb-3 text-amber-300">Registros de Cambios</h3>
                <div className="bg-gray-800/50 rounded-lg overflow-hidden border border-gray-700 max-h-60 overflow-y-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-700/50 text-xs text-gray-300 uppercase sticky top-0">
                            <tr>
                                <th scope="col" className="px-4 py-3 text-base">Fecha de Registro</th>
                                <th scope="col" className="px-4 py-3 text-center text-base">
                                    {selectedItem.type === 'flower' ? 'Costo Paquete' : 'Costo Item'}
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {(!selectedItem.costHistory || selectedItem.costHistory.length === 0) ? (
                                <tr>
                                    <td colSpan={2} className="text-center text-gray-500 p-4">No hay historial de costos para este item.</td>
                                </tr>
                            ) : (
                                [...(selectedItem.costHistory || [])].reverse().map((entry, index) => (
                                <tr key={index} className="border-b border-gray-700 last:border-b-0">
                                    <td className="px-4 py-3 font-medium text-white text-base">
                                        {new Date(entry.date).toLocaleString('es-ES', { 
                                            year: 'numeric', month: 'long', day: 'numeric', 
                                            hour: '2-digit', minute: '2-digit' 
                                        })}
                                    </td>
                                    <td className="px-4 py-3 text-center text-base font-semibold text-white">
                                        S/ {(selectedItem.type === 'flower' ? entry.costoPaquete : entry.costo)?.toFixed(2) || 'N/A'}
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
    </div>
  );
};

export default HistoryPanel;
