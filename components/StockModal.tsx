
import React, { useState } from 'react';
import type { StockItem } from '../types';

interface StockModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (updates: { itemId: string, change: number, type: 'flower' | 'product', newCost?: number, isPackage?: boolean }[]) => void;
    stockItems: StockItem[];
    mode: 'add' | 'remove' | 'ajuste';
}

const StockModal: React.FC<StockModalProps> = ({ isOpen, onClose, onSave, stockItems, mode }) => {
    const [updates, setUpdates] = useState<Record<string, number>>({});
    const [costs, setCosts] = useState<Record<string, number>>({});
    // Only relevant for flowers in 'add' mode
    const [isPackageMap, setIsPackageMap] = useState<Record<string, boolean>>({});

    const handleUpdate = (itemId: string, value: string) => {
        const numberValue = parseInt(value, 10);
        if (!isNaN(numberValue) && numberValue >= 0) {
            setUpdates(prev => ({ ...prev, [itemId]: numberValue }));
        } else if (value === '') {
            setUpdates(prev => {
                const newUpdates = { ...prev };
                delete newUpdates[itemId];
                return newUpdates;
            });
        }
    };

    const handleCostUpdate = (itemId: string, value: string) => {
        const numberValue = parseFloat(value);
        if (!isNaN(numberValue) && numberValue >= 0) {
            setCosts(prev => ({ ...prev, [itemId]: numberValue }));
        }
    };

    const togglePackage = (itemId: string) => {
        setIsPackageMap(prev => ({ ...prev, [itemId]: !prev[itemId] }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        type StockUpdatePayload = { 
            itemId: string; 
            change: number; 
            type: 'flower' | 'product'; 
            newCost?: number; 
            isPackage?: boolean 
        };

        const changes = Object.entries(updates)
            .map(([itemId, value]): StockUpdatePayload | null => {
                const item = stockItems.find(si => si.itemId === itemId);
                if (!item) return null;
                const numericValue = Number(value);

                if (mode === 'ajuste') {
                    return {
                        itemId,
                        change: numericValue - item.quantity,
                        type: item.type,
                    };
                }
                
                return {
                    itemId,
                    change: mode === 'add' ? numericValue : -numericValue,
                    type: item.type,
                    newCost: costs[itemId],
                    isPackage: isPackageMap[itemId]
                };
            })
            .filter((change): change is StockUpdatePayload => 
                change !== null && change.change !== 0
            );
        
        if (changes.length > 0) {
            onSave(changes);
        }
        setUpdates({});
        setCosts({});
        setIsPackageMap({});
    };

    if (!isOpen) return null;
    
    const title = mode === 'add' ? 'Ingresar Mercadería' : mode === 'remove' ? 'Registrar Salida / Pérdida' : 'Ajuste Manual de Stock';
    const buttonText = mode === 'add' ? 'Registrar Ingreso' : mode === 'remove' ? 'Registrar Salida' : 'Guardar Ajuste';

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4" onClick={onClose}>
            <form onSubmit={handleSubmit} className="bg-gray-800 border border-gray-700 rounded-2xl w-full max-w-3xl shadow-2xl shadow-purple-500/20 flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
                <div className="p-6 flex-shrink-0 border-b border-gray-700">
                    <h2 className="text-xl font-bold text-purple-300">{title}</h2>
                    <p className="text-sm text-gray-400 mt-1">
                        {mode === 'add' && "Ingresa la cantidad a comprar. Para Flores, puedes usar 'Paquete' para convertir automáticamente a tallos."}
                        {mode === 'remove' && "Registra mermas o salidas no vendidas."}
                        {mode === 'ajuste' && "Corrige el inventario final real."}
                    </p>
                </div>

                <div className="flex-grow overflow-y-auto px-6 py-4 space-y-4">
                    {stockItems.length === 0 && <div className="text-center text-gray-500">No hay items en esta lista.</div>}
                    
                    {stockItems.map(item => (
                        <div key={item.itemId} className="flex items-center gap-4 border-b border-gray-700 pb-4 last:border-0">
                            <div className="w-1/3">
                                <p className="text-sm font-bold text-white truncate" title={item.name}>{item.name}</p>
                                <p className="text-xs text-gray-500">Stock actual: {item.quantity}</p>
                            </div>
                            
                            <div className="w-1/6">
                                <input
                                    type="number"
                                    value={updates[item.itemId] || ''}
                                    onChange={(e) => handleUpdate(item.itemId, e.target.value)}
                                    className="w-full bg-gray-700 border border-gray-600 text-white text-sm rounded-lg p-2 text-center placeholder-gray-500"
                                    placeholder="Cant."
                                    min="0"
                                />
                            </div>

                            {mode === 'add' && (
                                <>
                                    <div className="w-1/6 flex justify-center">
                                        {item.type === 'flower' ? (
                                            <button
                                                type="button"
                                                onClick={() => togglePackage(item.itemId)}
                                                className={`px-2 py-1 text-[10px] uppercase rounded font-bold transition-colors w-full ${isPackageMap[item.itemId] ? 'bg-amber-600 text-white' : 'bg-gray-600 text-gray-300'}`}
                                            >
                                                {isPackageMap[item.itemId] ? 'Paquetes' : 'Tallos'}
                                            </button>
                                        ) : (
                                            <span className="text-xs text-gray-500 font-medium">Unidades</span>
                                        )}
                                    </div>
                                    <div className="w-1/3">
                                         <input
                                            type="number"
                                            value={costs[item.itemId] || ''}
                                            onChange={(e) => handleCostUpdate(item.itemId, e.target.value)}
                                            className="w-full bg-gray-900 border border-gray-600 text-white text-sm rounded-lg focus:ring-green-500 focus:border-green-500 p-2 text-center"
                                            min="0"
                                            step="0.01"
                                            placeholder={item.type === 'flower' && isPackageMap[item.itemId] ? "Costo Paq." : "Costo Unit."}
                                        />
                                    </div>
                                </>
                            )}
                        </div>
                    ))}
                </div>
                 <div className="flex justify-end gap-3 p-6 mt-auto flex-shrink-0 border-t border-gray-700">
                    <button type="button" onClick={onClose} className="py-2 px-4 text-sm font-medium text-gray-300 bg-gray-600 rounded-lg hover:bg-gray-500 transition-colors">
                        Cancelar
                    </button>
                    <button type="submit" className="py-2 px-4 text-sm font-bold text-white bg-purple-600 rounded-lg hover:bg-purple-700 focus:ring-4 focus:outline-none focus:ring-purple-800 transition-colors shadow-lg shadow-purple-500/30">
                        {buttonText}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default StockModal;
