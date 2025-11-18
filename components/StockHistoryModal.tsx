
import React, { useState, useEffect } from 'react';
import type { StockItem, StockMovement, StockMovementType, User } from '../types.ts';
import * as api from '../services/api.ts';

interface StockHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: StockItem;
  user: User;
  selectedUserId: string | null;
}

const StockHistoryModal: React.FC<StockHistoryModalProps> = ({ isOpen, onClose, item, user, selectedUserId }) => {
    const [history, setHistory] = useState<StockMovement[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (isOpen) {
            const fetchHistory = async () => {
                setIsLoading(true);
                try {
                    const data = await api.fetchStockHistory(item.itemId, user, selectedUserId);
                    setHistory(data);
                } catch (error) {
                    console.error("Failed to fetch stock history:", error);
                } finally {
                    setIsLoading(false);
                }
            };
            fetchHistory();
        }
    }, [isOpen, item, user, selectedUserId]);
    
    if (!isOpen) return null;

    const getTypeChip = (type: StockMovementType) => {
        // FIX: Added 'cancelacion' to the styles object to handle all possible movement types.
        const styles: Record<StockMovementType, string> = {
            compra: 'bg-blue-600 text-white',
            venta: 'bg-green-600 text-white',
            merma: 'bg-orange-600 text-white',
            ajuste: 'bg-gray-500 text-white',
            cancelacion: 'bg-red-700 text-white',
        };
        return <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${styles[type]}`}>{type.toUpperCase()}</span>;
    };
    
    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4" onClick={onClose}>
            <div className="bg-gray-800 border border-gray-700 rounded-2xl w-full max-w-2xl shadow-2xl shadow-purple-500/20 flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
                <div className="p-6 flex-shrink-0">
                    <h2 className="text-xl font-bold text-purple-300">Historial de Movimientos</h2>
                    <p className="text-lg text-white font-semibold">{item.name}</p>
                </div>
                
                <div className="flex-grow overflow-y-auto px-6">
                    {isLoading ? (
                         <div className="text-center p-8 text-gray-400">Cargando historial...</div>
                    ) : history.length === 0 ? (
                         <div className="text-center p-8 text-gray-500">No hay movimientos registrados para este producto.</div>
                    ) : (
                        <table className="w-full text-left">
                            <thead className="bg-gray-700/50 text-xs text-gray-300 uppercase sticky top-0">
                                <tr>
                                    <th scope="col" className="px-4 py-3">Fecha</th>
                                    <th scope="col" className="px-4 py-3">Tipo</th>
                                    <th scope="col" className="px-4 py-3 text-center">Cambio</th>
                                    <th scope="col" className="px-4 py-3 text-center">Stock Resultante</th>
                                </tr>
                            </thead>
                            <tbody>
                                {history.map(move => (
                                    <tr key={move._id} className="border-b border-gray-700">
                                        <td className="px-4 py-3 text-sm text-gray-300">
                                            {new Date(move.createdAt).toLocaleString('es-ES', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                        </td>
                                        <td className="px-4 py-3">{getTypeChip(move.type)}</td>
                                        <td className={`px-4 py-3 text-center font-bold ${move.quantityChange > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                            {move.quantityChange > 0 ? `+${move.quantityChange}` : move.quantityChange}
                                        </td>
                                        <td className="px-4 py-3 text-center font-semibold text-white">{move.quantityAfter}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                <div className="flex justify-end gap-3 p-6 mt-auto flex-shrink-0">
                    <button type="button" onClick={onClose} className="py-2 px-4 text-sm font-medium text-gray-300 bg-gray-600 rounded-lg hover:bg-gray-500 transition-colors">
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default StockHistoryModal;