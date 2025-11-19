
import React, { useState, useMemo, useEffect } from 'react';
import type { Order, Item, FlowerItem, FixedItem, Client, User, OrderItem, OrderStatus } from '../types.ts';
import { PlusIcon } from './icons/PlusIcon.tsx';
import { TrashIcon } from './icons/TrashIcon.tsx';
import ClientModal from './ClientModal.tsx';

interface OrderModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (order: Omit<Order, 'createdAt' | '_id'> | Order) => void;
    allItems: Item[];
    clients: Client[];
    user: User;
    onClientCreated: () => void;
    existingOrder?: Order | null;
    prefillItems?: OrderItem[];
}

const OrderModal: React.FC<OrderModalProps> = ({ isOpen, onClose, onSave, allItems, clients, user, onClientCreated, existingOrder, prefillItems }) => {
    const [selectedClientId, setSelectedClientId] = useState('');
    const [address, setAddress] = useState('');
    const [deliveryDate, setDeliveryDate] = useState(new Date().toISOString().substring(0, 16));
    const [status, setStatus] = useState<OrderStatus>('pendiente');
    const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
    const [selectedCatalogItem, setSelectedCatalogItem] = useState('');
    const [isClientModalOpen, setIsClientModalOpen] = useState(false);
    
    useEffect(() => {
        if(isOpen) {
            if (existingOrder) {
                setSelectedClientId(existingOrder.clientId);
                setAddress(existingOrder.address);
                setDeliveryDate(new Date(existingOrder.deliveryDate).toISOString().substring(0, 16));
                setStatus(existingOrder.status);
                setOrderItems(existingOrder.items);
            } else {
                if (prefillItems) {
                    setOrderItems(prefillItems);
                } else {
                    setOrderItems([]);
                }
                if(clients.length > 0) {
                    const defaultClient = clients[0];
                    setSelectedClientId(defaultClient._id!);
                    setAddress(defaultClient.address || '');
                }
                setDeliveryDate(new Date().toISOString().substring(0, 16));
                setStatus('pendiente');
            }
        }
    }, [isOpen, existingOrder, clients, prefillItems]);

    useEffect(() => {
        if (!existingOrder) {
            const client = clients.find(c => c._id === selectedClientId);
            if (client) setAddress(client.address || '');
        }
    }, [selectedClientId, clients, existingOrder]);

    const total = useMemo(() => orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0), [orderItems]);

    const handleAddCatalogItem = () => {
        const item = allItems.find(i => i.id === selectedCatalogItem);
        if (item) {
            setOrderItems(prev => [...prev, { itemId: item.id, name: item.name, quantity: 1, price: item.price, unitCost: 0 }]); // Unit cost simplified
        }
        setSelectedCatalogItem('');
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const selectedClient = clients.find(c => c._id === selectedClientId);
        if (!selectedClient || orderItems.length === 0) { alert("Datos incompletos."); return; }
        const payload = { clientId: selectedClient._id!, clientName: selectedClient.name, address, deliveryDate: new Date(deliveryDate).toISOString(), status, total, items: orderItems, userId: user._id };
        if (existingOrder) onSave({ ...existingOrder, ...payload }); else onSave(payload);
    };

    if (!isOpen) return null;

    return (
        <>
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4" onClick={onClose}>
            <div className="bg-gray-800 border border-gray-700 rounded-2xl w-full max-w-3xl p-6 flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                <h2 className="text-xl font-bold text-purple-300 mb-4">{existingOrder ? 'Editar' : 'Nuevo Pedido'}</h2>
                <div className="grid grid-cols-2 gap-4 mb-4">
                     <div className="flex gap-2"><select value={selectedClientId} onChange={e => setSelectedClientId(e.target.value)} className="bg-gray-700 text-white rounded w-full p-2">{clients.map(c=><option key={c._id} value={c._id}>{c.name}</option>)}</select><button onClick={()=>setIsClientModalOpen(true)} className="bg-green-600 p-2 rounded text-white"><PlusIcon className="w-5 h-5"/></button></div>
                     <input type="text" value={address} onChange={e=>setAddress(e.target.value)} className="bg-gray-700 text-white rounded p-2" placeholder="Dirección"/>
                     <input type="datetime-local" value={deliveryDate} onChange={e=>setDeliveryDate(e.target.value)} className="bg-gray-700 text-white rounded p-2"/>
                </div>
                <div className="flex-grow overflow-y-auto mb-4 border-t border-gray-700 pt-4">
                     <div className="flex gap-2 mb-2"><select value={selectedCatalogItem} onChange={e=>setSelectedCatalogItem(e.target.value)} className="bg-gray-700 text-white flex-grow rounded p-2"><option value="">-- Añadir --</option>{allItems.map(i=><option key={i.id} value={i.id}>{i.name} - S/ {i.price}</option>)}</select><button onClick={handleAddCatalogItem} className="bg-purple-600 text-white p-2 rounded">Añadir</button></div>
                     <ul className="space-y-2">{orderItems.map((item, i)=>(<li key={i} className="flex justify-between bg-gray-900/50 p-2 rounded text-sm text-white"><span>{item.name}</span><span>x{item.quantity}</span><span>S/ {item.price * item.quantity}</span><button onClick={()=>setOrderItems(prev=>prev.filter((_, idx)=>idx!==i))} className="text-red-500"><TrashIcon className="w-4 h-4"/></button></li>))}</ul>
                </div>
                <div className="flex justify-between items-center pt-4 border-t border-gray-700">
                    <span className="text-2xl font-bold text-green-400">Total: S/ {total.toFixed(2)}</span>
                    <div className="flex gap-3"><button onClick={onClose} className="text-gray-300">Cancelar</button><button onClick={handleSubmit} className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-500">Guardar</button></div>
                </div>
            </div>
        </div>
        <ClientModal isOpen={isClientModalOpen} onClose={()=>setIsClientModalOpen(false)} onClientCreated={onClientCreated} userId={user._id}/>
        </>
    );
};
export default OrderModal;
