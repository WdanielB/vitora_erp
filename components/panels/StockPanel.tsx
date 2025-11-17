
import React, { useState, useMemo } from 'react';
import type { FlowerItem, FixedItem, StockItem } from '../../types';
import { PlusIcon } from '../icons/PlusIcon';

interface StockPanelProps {
    flowerItems: FlowerItem[];
    fixedItems: FixedItem[];
}

const StockPanel: React.FC<StockPanelProps> = ({ flowerItems, fixedItems }) => {
    // En una aplicación real, los datos de stock vendrían de la API.
    // Aquí los simulamos basados en los items existentes.
    const stockItems: StockItem[] = useMemo(() => {
        const flowersAsStock: StockItem[] = flowerItems.map(f => ({
            id: f.id,
            name: f.name,
            type: 'flower',
            quantity: Math.floor(Math.random() * 200), // Cantidad aleatoria de ejemplo
            criticalStock: (f.cantidadPorPaquete || 10) * 2, // Stock crítico de ejemplo para 2 paquetes
            lastUpdated: new Date().toISOString(),
        }));
        const fixedAsStock: StockItem[] = fixedItems.map(f => ({
            id: f.id,
            name: f.name,
            type: 'fixed',
            quantity: Math.floor(Math.random() * 50),
            criticalStock: 10,
            lastUpdated: new Date().toISOString(),
        }));
        return [...flowersAsStock, ...fixedAsStock];
    }, [flowerItems, fixedItems]);

    const [searchTerm, setSearchTerm] = useState('');
    
    const filteredItems = stockItems.filter(item => 
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getStatus = (item: StockItem) => {
        if (item.quantity === 0) {
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
                     <button className="flex items-center gap-2 text-sm font-semibold py-2 px-4 rounded-lg transition-colors bg-blue-600 hover:bg-blue-500 text-white">
                        <PlusIcon className="w-4 h-4" /> Ingresar Mercadería
                    </button>
                    <button className="flex items-center gap-2 text-sm font-semibold py-2 px-4 rounded-lg transition-colors bg-orange-600 hover:bg-orange-500 text-white">
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
                            <th scope="col" className="px-4 py-3 text-center">Última Actualización</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredItems.map(item => (
                            <tr key={item.id} className="border-b border-gray-700 hover:bg-gray-700/40">
                                <td className="px-4 py-3 font-medium text-white">{item.name}</td>
                                <td className="px-4 py-3 text-center text-white font-bold">{item.quantity} {item.type === 'flower' ? 'tallos' : 'uds.'}</td>
                                <td className="px-4 py-3 text-center text-gray-300">{item.criticalStock}</td>
                                <td className="px-4 py-3 text-center">{getStatus(item)}</td>
                                <td className="px-4 py-3 text-center text-gray-400 text-sm">
                                    {new Date(item.lastUpdated).toLocaleDateString('es-ES')}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default StockPanel;
