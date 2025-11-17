
import React, { useState, useMemo } from 'react';
import type { StockItem } from '../../types';
import { PlusIcon } from '../icons/PlusIcon';
import StockModal from '../StockModal';
import * as api from '../../services/api';

interface StockPanelProps {
    stockItems: StockItem[];
    onStockUpdate: () => void;
    userId: string;
}

const StockPanel: React.FC<StockPanelProps> = ({ stockItems, onStockUpdate, userId }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'add' | 'remove'>('add');

    const filteredItems = useMemo(() => stockItems.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
    ), [stockItems, searchTerm]);

    const handleOpenModal = (mode: 'add' | 'remove') => {
        setModalMode(mode);
        setIsModalOpen(true);
    };

    const handleSaveChanges = async (updates: { itemId: string, change: number, type: 'flower' | 'fixed' }[]) => {
        try {
            await Promise.all(updates.map(update => api.updateStock({ ...update, userId })));
            onStockUpdate(); // Recargar todos los datos
        } catch (error) {
            console.error("Failed to update stock:", error);
            // Consider adding user feedback here
        }
        setIsModalOpen(false);
    };

    const getStatus = (item: StockItem) => {
        if (item.quantity <= 0) {
            return <span className="px-2 py-1 text-xs font-semibold text-white bg-red-800 rounded-full">Agotado</span>;
        }
        if (item.quantity <= item.criticalStock) {
            return <span className="px-2 py-1 text-xs font-semibold text-black bg-yellow-400 rounded-full">Stock Crítico</span>;
        }
        return <span className="px-2 py-1 text-xs font-semibold text-white bg-green-700 rounded-full">En Stock</span>;
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-300 tracking-wider">Control de Stock</h1>
                <div className="flex gap-2">
                    <button onClick={() => handleOpenModal('add')} className="flex items-center gap-2 text-sm font-semibold py-2 px-4 rounded-lg transition-colors bg-blue-600 hover:bg-blue-500 text-white">
                        <PlusIcon className="w-4 h-4" /> Ingresar Mercadería
                    </button>
                    <button onClick={() => handleOpenModal('remove')} className="flex items-center gap-2 text-sm font-semibold py-2 px-4 rounded-lg transition-colors bg-orange-600 hover:bg-orange-500 text-white">
                        <PlusIcon className="w-4 h-4" /> Registrar Salida/Pérdida
                    </button>
                </div>
            </div>

            <div className="mb-4">
                <input
                    type="text"
                    placeholder="Buscar producto..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full md:w-1/3 bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-purple-500 focus:border-purple-500 block p-2.5"
                />
            </div>

            <div className="bg-gray-800/50 rounded-lg overflow-hidden border border-gray-700">
                <table className="w-full text-left">
                    <thead className="bg-gray-700/50 text-xs text-gray-300 uppercase">
                        <tr>
                            <th scope="col" className="px-4 py-3">Producto</th>
                            <th scope="col" className="px-4 py-3 text-center">Cantidad Actual</th>
                            <th scope="col" className="px-4 py-3 text-center">Stock Crítico</th>
                            <th scope="col" className="px-4 py-3 text-center">Estado</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredItems.map(item => (
                            <tr key={item.itemId} className="border-b border-gray-700 hover:bg-gray-700/40">
                                <td className="px-4 py-3 font-medium text-white">{item.name}</td>
                                <td className="px-4 py-3 text-center text-white font-bold">{item.quantity} {item.type === 'flower' ? 'tallos' : 'uds.'}</td>
                                <td className="px-4 py-3 text-center text-gray-300">{item.criticalStock}</td>
                                <td className="px-4 py-3 text-center">{getStatus(item)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            
            <StockModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSaveChanges}
                stockItems={stockItems}
                mode={modalMode}
            />
        </div>
    );
};

export default StockPanel;
