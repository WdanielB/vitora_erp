
import React, { useState, useMemo, useRef } from 'react';
import type { FlowerItem, FixedItem } from '../types';
import { EyeIcon } from './icons/EyeIcon';
import { EyeSlashIcon } from './icons/EyeSlashIcon';


interface MainPanelProps {
  flowerItems: FlowerItem[];
  setFlowerItems: (updater: FlowerItem[] | ((prev: FlowerItem[]) => FlowerItem[])) => Promise<void>;
  fixedItems: FixedItem[];
}

const MainPanel: React.FC<MainPanelProps> = ({ flowerItems, setFlowerItems, fixedItems }) => {
  const [selectedFixedItem, setSelectedFixedItem] = useState<FixedItem | null>(null);
  const [addedFlowers, setAddedFlowers] = useState<Record<string, { item: FlowerItem; count: number }>>({});
  const [showProfitDetails, setShowProfitDetails] = useState(true);

  const draggedItem = useRef<FlowerItem | null>(null);
  const dragOverItem = useRef<FlowerItem | null>(null);

  const { totalPrice, totalCost, profit, profitMargin } = useMemo(() => {
    const fixedPrice = selectedFixedItem?.price ?? 0;
    const flowersPrice = Object.values(addedFlowers).reduce(
      (sum: number, { item, count }) => sum + (item.price * count),
      0
    );
    const calculatedTotalPrice = fixedPrice + flowersPrice;

    const fixedCost = selectedFixedItem?.costo ?? 0;
    const flowersCost = Object.values(addedFlowers).reduce((sum: number, { item, count }) => {
        const { costoPaquete = 0, cantidadPorPaquete = 1, merma = 0 } = item;
        const effectiveQuantity = cantidadPorPaquete - merma;
        if (effectiveQuantity <= 0) return sum; 
        const unitCost = costoPaquete / effectiveQuantity;
        return sum + (unitCost * count);
    }, 0);

    const calculatedTotalCost = fixedCost + flowersCost;
    const calculatedProfit = calculatedTotalPrice - calculatedTotalCost;
    const calculatedMargin = calculatedTotalPrice > 0 ? (calculatedProfit / calculatedTotalPrice) * 100 : 0;

    return { 
      totalPrice: calculatedTotalPrice, 
      totalCost: calculatedTotalCost, 
      profit: calculatedProfit,
      profitMargin: calculatedMargin
    };
  }, [selectedFixedItem, addedFlowers]);


  const handleAddFlower = (flower: FlowerItem) => {
    setAddedFlowers(prev => {
      const existing = prev[flower.id];
      const newCount = existing ? existing.count + 1 : 1;
      return { ...prev, [flower.id]: { item: flower, count: newCount } };
    });
  };

  const handleUpdateQuantity = (flowerId: string, newCount: number) => {
    if (isNaN(newCount) || newCount < 0) return;
    setAddedFlowers(prev => {
        if (newCount === 0) {
            const { [flowerId]: _, ...rest } = prev;
            return rest;
        }
        const existing = prev[flowerId];
        if (!existing) return prev;
        
        return { ...prev, [flowerId]: { ...existing, count: newCount }};
    });
  };

  const resetCalculation = () => {
    setSelectedFixedItem(null);
    setAddedFlowers({});
  };

  const handleDragSort = async () => {
    if (!draggedItem.current || !dragOverItem.current || draggedItem.current.id === dragOverItem.current.id) return;
  
    const items = [...flowerItems];
    const draggedItemIndex = items.findIndex(item => item.id === draggedItem.current!.id);
    const dragOverItemIndex = items.findIndex(item => item.id === dragOverItem.current!.id);

    const [reorderedItem] = items.splice(draggedItemIndex, 1);
    items.splice(dragOverItemIndex, 0, reorderedItem);

    await setFlowerItems(items);

    draggedItem.current = null;
    dragOverItem.current = null;
  };
  
  const addedItemsList = Object.values(addedFlowers);

  return (
    <div className="flex flex-col h-full">
      <h1 className="text-3xl font-bold mb-4 text-gray-300 tracking-wider flex-shrink-0">Generador de Cotizaciones</h1>
      <div className="flex flex-grow gap-6 overflow-hidden">
        {/* Left Side - Product Selection */}
        <div className="w-2/3 flex flex-col gap-4 overflow-hidden">
          <div className="flex-shrink-0">
            <h2 className="text-xl font-bold mb-3 text-purple-300">TIPO DE ARREGLO</h2>
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {fixedItems.filter(item => item.visible).map(item => (
                <button
                  key={item.id}
                  onClick={() => setSelectedFixedItem(item)}
                  style={{ backgroundImage: `url(${item.imageUrl})` }}
                  className={`relative aspect-[4/3] bg-cover bg-center rounded-lg overflow-hidden group transition-all duration-200 active:scale-95 focus:outline-none ring-2 
                    ${selectedFixedItem?.id === item.id 
                      ? 'ring-purple-500 shadow-lg shadow-purple-500/30' 
                      : 'ring-transparent hover:ring-purple-500/50'}`}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-2">
                    <span className="text-white font-bold text-xs sm:text-sm uppercase tracking-wide group-hover:text-amber-300 transition-colors">
                      {item.name}
                    </span>
                  </div>
                  {selectedFixedItem?.id === item.id && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center backdrop-blur-sm">
                        <svg className="w-8 h-8 text-purple-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col flex-grow overflow-hidden">
            <h2 className="text-xl font-bold mb-3 text-purple-300 flex-shrink-0">FLORES Y FOLLAJES</h2>
            <div className="flex-grow overflow-y-auto pr-2">
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
                {flowerItems.filter(item => item.visible).map(item => (
                  <button
                    key={item.id}
                    draggable
                    onDragStart={() => (draggedItem.current = item)}
                    onDragEnter={() => (dragOverItem.current = item)}
                    onDragEnd={handleDragSort}
                    onDragOver={(e) => e.preventDefault()}
                    onClick={() => handleAddFlower(item)}
                    style={{ backgroundImage: `url(${item.imageUrl})` }}
                    className="relative aspect-square bg-cover bg-center rounded-lg overflow-hidden group transition-transform duration-150 active:scale-95 focus:outline-none focus:ring-2 focus:ring-transparent hover:ring-purple-500/50 cursor-grab active:cursor-grabbing"
                  >
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-2">
                      <span className="text-white font-bold text-xs uppercase tracking-wide group-hover:text-amber-300 transition-colors">
                        {item.name}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2 flex-shrink-0">Puedes arrastrar y soltar las flores para reordenarlas.</p>
          </div>
        </div>

        {/* Right Side - Summary */}
        <div className="w-1/3 flex flex-col">
          <div className="bg-gray-800/50 rounded-2xl p-4 border border-gray-700 flex flex-col h-full">
            <h2 className="text-xl font-bold text-purple-300 flex-shrink-0">RESUMEN</h2>
           
            <div className="flex-grow mt-3 space-y-2 pr-2 -mr-2 overflow-y-auto">
              {selectedFixedItem && (
                <div className="flex justify-between items-center text-sm font-semibold">
                  <span>{selectedFixedItem.name}</span>
                  <span className="text-gray-300">S/ {selectedFixedItem.price.toFixed(2)}</span>
                </div>
              )}
              {addedItemsList.length > 0 && selectedFixedItem && <hr className="border-gray-600 my-1"/>}

              {addedItemsList.map(({ item, count }) => (
                <div key={item.id} className="flex justify-between items-center text-sm group">
                  <span className="font-semibold">{item.name}</span>
                  <div className="flex items-center gap-2">
                     <button onClick={() => handleUpdateQuantity(item.id, count - 1)} className="font-bold text-base w-5 h-5 rounded bg-gray-700 hover:bg-gray-600">-</button>
                     <input 
                       type="number" 
                       value={count} 
                       onChange={(e) => handleUpdateQuantity(item.id, parseInt(e.target.value, 10))}
                       className="w-8 text-center bg-gray-900/50 rounded p-0.5 text-sm"
                     />
                     <button onClick={() => handleAddFlower(item)} className="font-bold text-base w-5 h-5 rounded bg-gray-700 hover:bg-gray-600">+</button>
                    <span className="text-gray-300 w-14 text-right">S/ {(item.price * count).toFixed(2)}</span>
                  </div>
                </div>
              ))}
               {addedItemsList.length === 0 && !selectedFixedItem && (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-gray-500 text-center text-sm">Seleccione productos para calcular el precio.</p>
                  </div>
              )}
            </div>
            
            <div className="mt-auto pt-3 flex-shrink-0">
               {(selectedFixedItem || addedItemsList.length > 0) && (
                  <button onClick={resetCalculation} className="w-full text-center text-red-400 hover:text-red-300 text-xs font-semibold mb-2">
                    Limpiar Cálculo
                  </button>
               )}
              <div className="border-2 border-gray-600 rounded-lg p-3">
                <div className="flex justify-end items-center mb-1 -mt-1 -mr-1">
                  <button onClick={() => setShowProfitDetails(!showProfitDetails)} className="p-1" title={showProfitDetails ? "Ocultar costos" : "Mostrar costos"}>
                    {showProfitDetails ? <EyeSlashIcon className="w-4 h-4 text-gray-400 hover:text-white" /> : <EyeIcon className="w-4 h-4 text-gray-400 hover:text-white" />}
                  </button>
                </div>

                {showProfitDetails && (
                  <>
                    <div className="grid grid-cols-3 gap-2 text-center mb-2">
                      <div>
                          <p className="text-gray-400 font-semibold mb-1 text-xs">COSTO</p>
                          <span className="text-base font-bold text-orange-400">S/ {totalCost.toFixed(2)}</span>
                      </div>
                      <div>
                          <p className="text-gray-400 font-semibold mb-1 text-xs">GANANCIA</p>
                          <span className="text-base font-bold text-cyan-400">S/ {profit.toFixed(2)}</span>
                      </div>
                       <div>
                          <p className="text-gray-400 font-semibold mb-1 text-xs">MARGEN</p>
                          <span className="text-base font-bold text-teal-400">{profitMargin.toFixed(1)}%</span>
                      </div>
                    </div>
                    <hr className="border-gray-600 my-2" />
                  </>
                )}

                <div className="text-center">
                  <p className="text-gray-400 font-semibold mb-1 text-base">PRECIO TOTAL</p>
                  <span className="text-3xl font-bold text-green-400">S/ {totalPrice.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainPanel;
