
import React, { useState } from 'react';
import type { Order, OrderStatus } from '../../types';
import { PlusIcon } from '../icons/PlusIcon';

const OrdersPanel: React.FC = () => {
    // Datos de ejemplo para los pedidos
    const [orders, setOrders] = useState<Order[]>([
        { id: 'ORD-001', userId: 'admin', customerName: 'Ana García', address: 'Calle Falsa 123, Cayma', deliveryDate: '2024-08-15T14:00:00Z', status: 'entregado', total: 150.00, items: [] },
        { id: 'ORD-002', userId: 'admin', customerName: 'Luis Torres', address: 'Av. Ejército 789, Yanahuara', deliveryDate: '2024-08-16T10:00:00Z', status: 'en armado', total: 250.50, items: [] },
        { id: 'ORD-003', userId: 'admin', customerName: 'Sofía Mendoza', address: 'Urb. La Florida C-5, Cerro Colorado', deliveryDate: '2024-08-16T18:00:00Z', status: 'pendiente', total: 95.00, items: [] },
        { id: 'ORD-004', userId: 'admin', customerName: 'Carlos Vera', address: 'Plaza de Paucarpata', deliveryDate: '2024-08-14T11:00:00Z', status: 'cancelado', total: 120.00, items: [] },
    ]);

    const getStatusChip = (status: OrderStatus) => {
        const styles = {
            pendiente: 'bg-yellow-400/80 text-yellow-900',
            'en armado': 'bg-blue-400/80 text-blue-900',
            entregado: 'bg-green-500/80 text-green-900',
            cancelado: 'bg-red-500/80 text-red-900',
        };
        return <span className={`px-2 py-1 text-xs font-bold rounded-full ${styles[status]}`}>{status.toUpperCase()}</span>;
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-300 tracking-wider">Gestión de Pedidos</h1>
                <button className="flex items-center gap-2 text-sm font-semibold py-2 px-4 rounded-lg transition-colors bg-purple-600 hover:bg-purple-500 text-white">
                    <PlusIcon className="w-4 h-4" /> Nuevo Pedido
                </button>
            </div>

            <div className="bg-gray-800/50 rounded-lg overflow-x-auto border border-gray-700">
                <table className="w-full text-left">
                    <thead className="bg-gray-700/50 text-xs text-gray-300 uppercase">
                        <tr>
                            <th scope="col" className="px-4 py-3">ID Pedido</th>
                            <th scope="col" className="px-4 py-3">Cliente</th>
                            <th scope="col" className="px-4 py-3">Fecha de Entrega</th>
                            <th scope="col" className="px-4 py-3 text-center">Estado</th>
                            <th scope="col" className="px-4 py-3 text-right">Total</th>
                            <th scope="col" className="px-4 py-3 text-center">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {orders.map(order => (
                            <tr key={order.id} className="border-b border-gray-700 hover:bg-gray-700/40">
                                <td className="px-4 py-3 font-mono text-sm text-gray-400">{order.id}</td>
                                <td className="px-4 py-3 font-medium text-white">{order.customerName}</td>
                                <td className="px-4 py-3 text-gray-300">
                                    {new Date(order.deliveryDate).toLocaleString('es-ES', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                </td>
                                <td className="px-4 py-3 text-center">{getStatusChip(order.status)}</td>
                                <td className="px-4 py-3 text-right font-bold text-white">S/ {order.total.toFixed(2)}</td>
                                <td className="px-4 py-3 text-center">
                                    <button className="text-purple-400 hover:text-purple-300 font-semibold text-sm">Ver Detalles</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default OrdersPanel;
