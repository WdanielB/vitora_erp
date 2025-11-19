
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
    };

    if (!isOpen) return null;
    
    const title = mode === 'add' ? 'Ingresar Mercadería' : mode === 'remove' ? 'Registrar Salida / Pérdida' : 'Ajuste Manual de Stock';
    const buttonText = mode === 'add' ? 'Registrar Ingreso' : mode === 'remove' ? 'Registrar Salida' : 'Guardar Ajuste';
    const description = mode === 'add' 
        ? 'Ingresa cantidad recibida. Si activas "Paquete", el sistema convertirá a tallos automáticamente y actualizará el <strong>Costo Promedio</strong>.' 
        : mode === 'remove' 
        ? 'Ingresa la cantidad de unidades perdidas (merma).'
        : 'Ingresa la <strong>nueva cantidad total (unidades/tallos)</strong> en stock.';

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4" onClick={onClose}>
            <form onSubmit={handleSubmit} className="bg-gray-800 border border-gray-700 rounded-2xl w-full max-w-3xl shadow-2xl shadow-purple-500/20 flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
                <div className="p-6 flex-shrink-0">
                    <h2 className="text-xl font-bold mb-4 text-purple-300">{title}</h2>
                    <p className="text-sm text-gray-400" dangerouslySetInnerHTML={{ __html: description }}></p>
                </div>

                <div className="flex-grow overflow-y-auto px-6 space-y-3">
                    <div className="grid grid-cols-12 gap-2 text-xs text-gray-400 uppercase font-bold mb-2">
                        <div className="col-span-4">Producto</div>
                        <div className="col-span-2 text-center">{mode === 'ajuste' ? 'Nuevo Stock' : 'Cantidad'}</div>
                        {mode === 'add' && (
                            <>
                                <div className="col-span-2 text-center">Unidad</div>
                                <div className="col-span-4 text-center">Costo (Opcional)</div>
                            </>
                        )}
                    </div>
                    {stockItems.map(item => (
                        <div key={item.itemId} className="grid grid-cols-12 gap-2 items-center border-b border-gray-700 pb-2">
                            <label htmlFor={item.itemId} className="col-span-4 text-sm font-medium text-white truncate" title={item.name}>
                                {item.name} <span className="text-xs text-gray-500">({item.quantity})</span>
                            </label>
                            <div className="col-span-2">
                                <input
                                    type="number"
                                    id={item.itemId}
                                    value={updates[item.itemId] || ''}
                                    onChange={(e) => handleUpdate(item.itemId, e.target.value)}
                                    className="w-full bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-purple-500 focus:border-purple-500 p-2 text-center"
                                    min="0"
                                    step="1"
                                    placeholder="0"
                                />
                            </div>
                            {mode === 'add' && (
                                <>
                                    <div className="col-span-2 flex justify-center">
                                        {item.type === 'flower' ? (
                                            <button
                                                type="button"
                                                onClick={() => togglePackage(item.itemId)}
                                                className={`px-2 py-1 text-xs rounded-md font-bold transition-colors ${isPackageMap[item.itemId] ? 'bg-amber-600 text-white' : 'bg-gray-600 text-gray-300'}`}
                                            >
                                                {isPackageMap[item.itemId] ? 'PAQUETE' : 'UNIDAD'}
                                            </button>
                                        ) : (
                                            <span className="text-xs text-gray-500">Unidad</span>
                                        )}
                                    </div>
                                    <div className="col-span-4">
                                         <input
                                            type="number"
                                            value={costs[item.itemId] || ''}
                                            onChange={(e) => handleCostUpdate(item.itemId, e.target.value)}
                                            className="w-full bg-gray-900 border border-gray-600 text-white text-sm rounded-lg focus:ring-green-500 focus:border-green-500 p-2 text-center"
                                            min="0"
                                            step="0.01"
                                            placeholder={`Costo / ${isPackageMap[item.itemId] ? 'Paq' : 'Uni'}`}
                                        />
                                    </div>
                                </>
                            )}
                        </div>
                    ))}
                </div>
                 <div className="flex justify-end gap-3 p-6 mt-auto flex-shrink-0">
                    <button type="button" onClick={onClose} className="py-2 px-4 text-sm font-medium text-gray-300 bg-gray-600 rounded-lg hover:bg-gray-500 transition-colors">
                        Cancelar
                    </button>
                    <button type="submit" className="py-2 px-4 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 focus:ring-4 focus:outline-none focus:ring-purple-800 transition-colors">
                        {buttonText}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default StockModal;
