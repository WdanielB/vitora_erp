
import React, { useState, useMemo, useRef } from 'react';
import type { FlowerItem, VariationGift, OrderItem } from '../types.ts';
import { EyeIcon } from './icons/EyeIcon.tsx';
import { EyeSlashIcon } from './icons/EyeSlashIcon.tsx';
import { PlusIcon } from './icons/PlusIcon.tsx';

interface MainPanelProps {
  flowerItems: FlowerItem[];
  variationGifts: VariationGift[]; // Changed from fixedItems
  onConvertOrder: (items: OrderItem[]) => void;
}

const MainPanel: React.FC<MainPanelProps> = ({ flowerItems, variationGifts, onConvertOrder }) => {
  const [selectedGift, setSelectedGift] = useState<VariationGift | null>(null);
  const [addedFlowers, setAddedFlowers] = useState<Record<string, { item: FlowerItem; count: number }>>({});
  const [showProfitDetails, setShowProfitDetails] = useState(true);

  const draggedItem = useRef<FlowerItem | null>(null);
  const dragOverItem = useRef<FlowerItem | null>(null);

  const { totalPrice, totalCost, profit, profitMargin } = useMemo(() => {
    const giftPrice = selectedGift?.price ?? 0;
    const flowersPrice = Object.values(addedFlowers).reduce(
      (sum: number, { item, count }) => sum + (item.price * count),
      0
    );
    const calculatedTotalPrice = giftPrice + flowersPrice;

    const giftCost = selectedGift?.costo ?? 0;
    const flowersCost = Object.values(addedFlowers).reduce((sum: number, { item, count }) => {
        const { costoPaquete = 0, cantidadPorPaquete = 1, merma = 0 } = item;
        const effectiveQuantity = cantidadPorPaquete - merma;
        if (effectiveQuantity <= 0) return sum; 
        const unitCost = costoPaquete / effectiveQuantity;
        return sum + (unitCost * count);
    }, 0);

    const calculatedTotalCost = giftCost + flowersCost;
    const calculatedProfit = calculatedTotalPrice - calculatedTotalCost;
    const calculatedMargin = calculatedTotalPrice > 0 ? (calculatedProfit / calculatedTotalPrice) * 100 : 0;

    return { totalPrice: calculatedTotalPrice, totalCost: calculatedTotalCost, profit: calculatedProfit, profitMargin: calculatedMargin };
  }, [selectedGift, addedFlowers]);

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
        return { ...prev, [flowerId]: { ...prev[flowerId], count: newCount }};
    });
  };

  const resetCalculation = () => {
    setSelectedGift(null);
    setAddedFlowers({});
  };
  
  const handleWhatsAppShare = () => {
      const itemsList = Object.values(addedFlowers).map((f: { item: FlowerItem; count: number }) => `- ${f.count}x ${f.item.name}`).join('%0A');
      const base = selectedGift ? `- Base: ${selectedGift.name}%0A` : '';
      const text = `Hola! Aquí está el detalle de la cotización:%0A%0A${base}${itemsList}%0A%0A*Total: S/ ${totalPrice.toFixed(2)}*`;
      window.open(`https://wa.me/?text=${text}`, '_blank');
  };
  
  const handleConvertToOrder = () => {
      const items: OrderItem[] = [];
      if (selectedGift) {
          items.push({ itemId: selectedGift.id, name: selectedGift.name, quantity: 1, price: selectedGift.price, unitCost: selectedGift.costo || 0 });
      }
      Object.values(addedFlowers).forEach(({ item, count }) => {
          const unitCost = (item.costoPaquete || 0) / ((item.cantidadPorPaquete || 1) - (item.merma || 0));
          items.push({ itemId: item.id, name: item.name, quantity: count, price: item.price, unitCost });
      });
      onConvertOrder(items);
  };
  
  const addedItemsList = Object.values(addedFlowers);

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center mb-4 flex-shrink-0">
        <h1 className="text-3xl font-bold text-gray-300 tracking-wider">Generador de Cotizaciones</h1>
        <div className="flex gap-3">
            <button onClick={handleWhatsAppShare} className="flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg font-semibold transition-colors">
                WhatsApp
            </button>
            <button onClick={handleConvertToOrder} className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg font-semibold transition-colors">
                <PlusIcon className="w-5 h-5" /> Crear Pedido
            </button>
        </div>
      </div>
      
      <div className="flex flex-grow gap-6 overflow-hidden">
        {/* Left Side - Product Selection */}
        <div className="w-2/3 flex flex-col gap-4 overflow-hidden">
          <div className="flex-shrink-0">
            <h2 className="text-xl font-bold mb-3 text-purple-300">TIPO DE ARREGLO</h2>
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {variationGifts.filter(item => item.visible).map(item => (
                <button
                  key={item.id}
                  onClick={() => setSelectedGift(item)}
                  style={{ backgroundImage: `url(${item.imageUrl})` }}
                  className={`relative aspect-[4/3] bg-cover bg-center rounded-lg overflow-hidden group transition-all duration-200 active:scale-95 focus:outline-none ring-2 
                    ${selectedGift?.id === item.id ? 'ring-purple-500 shadow-lg shadow-purple-500/30' : 'ring-transparent hover:ring-purple-500/50'}`}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-2">
                    <span className="text-white font-bold text-xs sm:text-sm uppercase tracking-wide group-hover:text-amber-300 transition-colors">{item.name}</span>
                  </div>
                  {selectedGift?.id === item.id && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center backdrop-blur-sm">
                        <svg className="w-8 h-8 text-purple-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
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
                    onClick={() => handleAddFlower(item)}
                    style={{ backgroundImage: `url(${item.imageUrl})` }}
                    className="relative aspect-square bg-cover bg-center rounded-lg overflow-hidden group transition-transform duration-150 active:scale-95 focus:outline-none focus:ring-2 focus:ring-transparent hover:ring-purple-500/50 cursor-grab active:cursor-grabbing"
                  >
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-2">
                      <span className="text-white font-bold text-xs uppercase tracking-wide group-hover:text-amber-300 transition-colors">{item.name}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Summary */}
        <div className="w-1/3 flex flex-col">
          <div className="bg-gray-800/50 rounded-2xl p-4 border border-gray-700 flex flex-col h-full">
            <h2 className="text-xl font-bold text-purple-300 flex-shrink-0">RESUMEN</h2>
            <div className="flex-grow mt-3 space-y-2 pr-2 -mr-2 overflow-y-auto">
              {selectedGift && (
                <div className="flex justify-between items-center text-sm font-semibold">
                  <span>{selectedGift.name}</span>
                  <span className="text-gray-300">S/ {selectedGift.price.toFixed(2)}</span>
                </div>
              )}
              {addedItemsList.length > 0 && selectedGift && <hr className="border-gray-600 my-1"/>}

              {addedItemsList.map(({ item, count }) => (
                <div key={item.id} className="flex justify-between items-center text-sm group">
                  <span className="font-semibold">{item.name}</span>
                  <div className="flex items-center gap-2">
                     <button onClick={() => handleUpdateQuantity(item.id, count - 1)} className="font-bold text-base w-5 h-5 rounded bg-gray-700 hover:bg-gray-600">-</button>
                     <input type="number" value={count} onChange={(e) => handleUpdateQuantity(item.id, parseInt(e.target.value, 10))} className="w-8 text-center bg-gray-900/50 rounded p-0.5 text-sm"/>
                     <button onClick={() => handleAddFlower(item)} className="font-bold text-base w-5 h-5 rounded bg-gray-700 hover:bg-gray-600">+</button>
                    <span className="text-gray-300 w-14 text-right">S/ {(item.price * count).toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-auto pt-3 flex-shrink-0">
               {(selectedGift || addedItemsList.length > 0) && (
                  <button onClick={resetCalculation} className="w-full text-center text-red-400 hover:text-red-300 text-xs font-semibold mb-2">Limpiar Cálculo</button>
               )}
              <div className="border-2 border-gray-600 rounded-lg p-3">
                <div className="flex justify-end items-center mb-1 -mt-1 -mr-1">
                  <button onClick={() => setShowProfitDetails(!showProfitDetails)} className="p-1">{showProfitDetails ? <EyeSlashIcon className="w-4 h-4 text-gray-400" /> : <EyeIcon className="w-4 h-4 text-gray-400" />}</button>
                </div>
                {showProfitDetails && (
                  <>
                    <div className="grid grid-cols-3 gap-2 text-center mb-2">
                      <div><p className="text-gray-400 font-semibold mb-1 text-xs">COSTO</p><span className="text-base font-bold text-orange-400">S/ {totalCost.toFixed(2)}</span></div>
                      <div><p className="text-gray-400 font-semibold mb-1 text-xs">GANANCIA</p><span className="text-base font-bold text-cyan-400">S/ {profit.toFixed(2)}</span></div>
                      <div><p className="text-gray-400 font-semibold mb-1 text-xs">MARGEN</p><span className="text-base font-bold text-teal-400">{profitMargin.toFixed(1)}%</span></div>
                    </div>
                    <hr className="border-gray-600 my-2" />
                  </>
                )}
                <div className="text-center"><p className="text-gray-400 font-semibold mb-1 text-base">PRECIO TOTAL</p><span className="text-3xl font-bold text-green-400">S/ {totalPrice.toFixed(2)}</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainPanel;
