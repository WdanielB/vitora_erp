
import React, { useState } from 'react';
import type { StockItem } from '../types';

interface StockModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (updates: { itemId: string, change: number, type: 'flower' | 'fixed' }[]) => void;
    stockItems: StockItem[];
    mode: 'add' | 'remove';
}

const StockModal: React.FC<StockModalProps> = ({ isOpen, onClose, onSave, stockItems, mode }) => {
    const [updates, setUpdates] = useState<Record<string, number>>({});

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

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const changes = Object.entries(updates)
            .filter(([, change]) => Number(change) > 0)
            .map(([itemId, change]) => {
                const item = stockItems.find(si => si.itemId === itemId);
                const numericChange = Number(change);
                return {
                    itemId,
                    change: mode === 'add' ? numericChange : -numericChange,
                    type: item!.type,
                };
            });
        
        if (changes.length > 0) {
            onSave(changes);
        }
        setUpdates({});
    };

    if (!isOpen) return null;
    
    const title = mode === 'add' ? 'Ingresar Mercadería' : 'Registrar Salida / Pérdida';
    const buttonText = mode === 'add' ? 'Registrar Ingreso' : 'Registrar Salida';

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4" onClick={onClose}>
            <form onSubmit={handleSubmit} className="bg-gray-800 border border-gray-700 rounded-2xl w-full max-w-lg shadow-2xl shadow-purple-500/20 flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
                <div className="p-6 flex-shrink-0">
                    <h2 className="text-xl font-bold mb-4 text-purple-300">{title}</h2>
                    <p className="text-sm text-gray-400">
                        {mode === 'add' 
                            ? 'Ingresa la cantidad de unidades que han llegado para cada producto.' 
                            : 'Ingresa la cantidad de unidades utilizadas o perdidas (merma).'}
                    </p>
                </div>

                <div className="flex-grow overflow-y-auto px-6 space-y-3">
                    {stockItems.map(item => (
                        <div key={item.itemId} className="flex items-center justify-between gap-4">
                            <label htmlFor={item.itemId} className="flex-1 text-sm font-medium text-white">{item.name}</label>
                            <input
                                type="number"
                                id={item.itemId}
                                value={updates[item.itemId] || ''}
                                onChange={(e) => handleUpdate(item.itemId, e.target.value)}
                                className="bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-purple-500 focus:border-purple-500 block w-24 p-2 text-center"
                                min="0"
                                step="1"
                                placeholder="0"
                            />
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
