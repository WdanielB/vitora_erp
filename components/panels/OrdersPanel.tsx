
import React, { useState } from 'react';
import type { Order, OrderStatus, Item, Client, User } from '../../types.ts';
import { PlusIcon } from '../icons/PlusIcon.tsx';
import { PencilIcon } from '../icons/PencilIcon.tsx';
import { TrashIcon } from '../icons/TrashIcon.tsx';
import OrderModal from '../OrderModal.tsx';
import * as api from '../../services/api.ts';

interface OrdersPanelProps {
    orders: Order[];
    allItems: Item[];
    clients: Client[];
    onDataNeedsRefresh: () => void;
    user: User;
}

const OrdersPanel: React.FC<OrdersPanelProps> = ({ orders, allItems, clients, onDataNeedsRefresh, user }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingOrder, setEditingOrder] = useState<Order | null>(null);
    
    const handleOpenModalForNew = () => {
        setEditingOrder(null);
        setIsModalOpen(true);
    };

    const handleOpenModalForEdit = (order: Order) => {
        setEditingOrder(order);
        setIsModalOpen(true);
    };

    const handleSaveOrder = async (orderData: Omit<Order, 'createdAt' | '_id'> | Order) => {
        try {
            if ('_id' in orderData) {
                // Update
                await api.updateOrder(orderData, user._id);
            } else {
                // Create
                await api.createOrder(orderData, user._id);
            }
            onDataNeedsRefresh();
        } catch(error) {
            console.error("Failed to save order:", error);
        }
        setIsModalOpen(false);
        setEditingOrder(null);
    };

    const handleDeleteOrder = async (orderId: string) => {
        if (window.confirm("¿Estás seguro de que quieres eliminar este pedido? Esta acción no se puede deshacer y el stock de los productos será devuelto.")) {
            try {
                await api.deleteOrder(orderId, user._id);
                onDataNeedsRefresh();
            } catch (error) {
                console.error("Failed to delete order:", error);
            }
        }
    };
    
    const getStatusChip = (status: OrderStatus) => {
        const styles: Record<OrderStatus, string> = {
            pendiente: 'bg-yellow-400/80 text-yellow-900',
            'en armado': 'bg-blue-400/80 text-blue-900',
            entregado: 'bg-green-500/80 text-green-900',
            cancelado: 'bg-red-500/80 text-red-900',
        };
        return <span className={`px-2 py-1 text-xs font-bold rounded-full ${styles[status]}`}>{status.toUpperCase()}</span>;
    };
    
    const sortedOrders = [...orders].sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-300 tracking-wider">Gestión de Pedidos</h1>
                <button onClick={handleOpenModalForNew} className="flex items-center gap-2 text-sm font-semibold py-2 px-4 rounded-lg transition-colors bg-purple-600 hover:bg-purple-500 text-white">
                    <PlusIcon className="w-4 h-4" /> Nuevo Pedido
                </button>
            </div>

            <div className="bg-gray-800/50 rounded-lg overflow-x-auto border border-gray-700">
                <table className="w-full text-left">
                    <thead className="bg-gray-700/50 text-xs text-gray-300 uppercase">
                        <tr>
                            <th scope="col" className="px-4 py-3">Cliente</th>
                            <th scope="col" className="px-4 py-3">Fecha de Entrega</th>
                            <th scope="col" className="px-4 py-3 text-center">Estado</th>
                            <th scope="col" className="px-4 py-3 text-right">Total</th>
                            <th scope="col" className="px-4 py-3 text-center">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedOrders.map(order => (
                            <tr key={order._id} className="border-b border-gray-700 hover:bg-gray-700/40">
                                <td className="px-4 py-3 font-medium text-white">{order.clientName}</td>
                                <td className="px-4 py-3 text-gray-300">
                                    {new Date(order.deliveryDate).toLocaleString('es-ES', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                </td>
                                <td className="px-4 py-3 text-center">{getStatusChip(order.status)}</td>
                                <td className="px-4 py-3 text-right font-bold text-white">S/ {order.total.toFixed(2)}</td>
                                <td className="px-4 py-3 text-center">
                                   <div className="flex justify-center gap-2">
                                        <button onClick={() => handleOpenModalForEdit(order)} className="flex items-center gap-1 text-purple-400 hover:text-purple-300 font-semibold text-sm">
                                            <PencilIcon className="w-4 h-4"/> Ver/Editar
                                        </button>
                                         <button onClick={() => handleDeleteOrder(order._id!)} className="flex items-center gap-1 text-red-500 hover:text-red-400 font-semibold text-sm">
                                            <TrashIcon className="w-4 h-4"/> Eliminar
                                        </button>
                                   </div>
                                </td>
                            </tr>
                        ))}
                         {sortedOrders.length === 0 && (
                            <tr>
                                <td colSpan={5} className="text-center p-6 text-gray-500">No hay pedidos registrados.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            
            <OrderModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSaveOrder}
                allItems={allItems}
                clients={clients}
                user={user}
                onClientCreated={onDataNeedsRefresh}
                existingOrder={editingOrder}
            />
        </div>
    );
};

export default OrdersPanel;