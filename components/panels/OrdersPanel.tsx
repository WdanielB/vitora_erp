
import React, { useState, useEffect } from 'react';
import type { Order, Item, Client, User, OrderItem } from '../../types.ts';
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
    prefillItems?: OrderItem[];
    onOrderCreated?: () => void;
}

const OrdersPanel: React.FC<OrdersPanelProps> = ({ orders, allItems, clients, onDataNeedsRefresh, user, prefillItems, onOrderCreated }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingOrder, setEditingOrder] = useState<Order | null>(null);

    useEffect(() => {
        if (prefillItems && prefillItems.length > 0) {
            setEditingOrder(null);
            setIsModalOpen(true);
        }
    }, [prefillItems]);
    
    const handleOpenModalForNew = () => { setEditingOrder(null); setIsModalOpen(true); };
    const handleOpenModalForEdit = (order: Order) => { setEditingOrder(order); setIsModalOpen(true); };
    const handleSaveOrder = async (orderData: any) => {
        try {
            if ('_id' in orderData) await api.updateOrder(orderData, user._id);
            else { await api.createOrder(orderData, user._id); if(onOrderCreated) onOrderCreated(); }
            onDataNeedsRefresh();
        } catch(error) { console.error(error); }
        setIsModalOpen(false); setEditingOrder(null);
    };
    const handleDeleteOrder = async (id: string) => { if(window.confirm("Confirmar eliminación?")) { await api.deleteOrder(id, user._id); onDataNeedsRefresh(); } };

    return (
        <div>
            <div className="flex justify-between items-center mb-6"><h1 className="text-3xl font-bold text-gray-300">Pedidos</h1><button onClick={handleOpenModalForNew} className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg flex items-center gap-2"><PlusIcon className="w-4 h-4"/> Nuevo Pedido</button></div>
            <div className="bg-gray-800/50 rounded-lg overflow-x-auto border border-gray-700">
                <table className="w-full text-left text-sm"><thead className="bg-gray-700/50 uppercase text-gray-300"><tr><th className="px-4 py-3">Cliente</th><th className="px-4 py-3">Entrega</th><th className="px-4 py-3">Estado</th><th className="px-4 py-3 text-right">Total</th><th className="px-4 py-3 text-center">Acción</th></tr></thead><tbody>{orders.map(o => (<tr key={o._id} className="border-b border-gray-700 hover:bg-gray-700/30"><td className="px-4 py-3">{o.clientName}</td><td className="px-4 py-3">{new Date(o.deliveryDate).toLocaleDateString()}</td><td className="px-4 py-3"><span className={`px-2 py-1 rounded text-xs font-bold ${o.status==='pendiente'?'bg-yellow-500/20 text-yellow-500':'bg-green-500/20 text-green-500'}`}>{o.status}</span></td><td className="px-4 py-3 text-right font-bold">S/ {o.total.toFixed(2)}</td><td className="px-4 py-3 text-center flex justify-center gap-2"><button onClick={()=>handleOpenModalForEdit(o)}><PencilIcon className="w-4 h-4 text-purple-400"/></button><button onClick={()=>handleDeleteOrder(o._id!)}><TrashIcon className="w-4 h-4 text-red-400"/></button></td></tr>))}</tbody></table>
            </div>
            <OrderModal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); if(onOrderCreated) onOrderCreated(); }} onSave={handleSaveOrder} allItems={allItems} clients={clients} user={user} onClientCreated={onDataNeedsRefresh} existingOrder={editingOrder} prefillItems={!editingOrder ? prefillItems : undefined} />
        </div>
    );
};
export default OrdersPanel;
