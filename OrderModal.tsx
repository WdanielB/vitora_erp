
import React, { useState, useMemo, useEffect } from 'react';
import type { Order, Item, FlowerItem, FixedItem, Client, User, OrderItem } from '../types';
import { PlusIcon } from './icons/PlusIcon';
import { TrashIcon } from './icons/TrashIcon';
import ClientModal from './ClientModal';

interface OrderModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (order: Omit<Order, 'createdAt' | '_id'>) => void;
    allItems: Item[];
    clients: Client[];
    user: User;
    onClientCreated: () => void;
}

const OrderModal: React.FC<OrderModalProps> = ({ isOpen, onClose, onSave, allItems, clients, user, onClientCreated }) => {
    const [selectedClientId, setSelectedClientId] = useState('');
    const [address, setAddress] = useState('');
    const [deliveryDate, setDeliveryDate] = useState(new Date().toISOString().substring(0, 16));
    const [status, setStatus] = useState<Order['status']>('pendiente');
    const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
    
    const [selectedCatalogItem, setSelectedCatalogItem] = useState('');
    const [customItemName, setCustomItemName] = useState('');
    const [customItemPrice, setCustomItemPrice] = useState('');
    
    const [isClientModalOpen, setIsClientModalOpen] = useState(false);
    
    useEffect(() => {
        if(isOpen) {
             // Reset state when modal opens
            if(clients.length > 0) {
                const defaultClient = clients[0];
                setSelectedClientId(defaultClient._id!);
                setAddress(defaultClient.address || '');
            } else {
                 setSelectedClientId('');
                 setAddress('');
            }
            setDeliveryDate(new Date().toISOString().substring(0, 16));
            setStatus('pendiente');
            setOrderItems([]);
        }
    }, [isOpen, clients]);

    useEffect(() => {
        const client = clients.find(c => c._id === selectedClientId);
        if (client) {
            setAddress(client.address || '');
        }
    }, [selectedClientId, clients]);


    const calculateUnitCost = (item: Item): number => {
        if (item.id.startsWith('f')) { // FlowerItem
            const flower = item as FlowerItem;
            const { costoPaquete = 0, cantidadPorPaquete = 1, merma = 0 } = flower;
            const effectiveQuantity = cantidadPorPaquete - merma;
            if (effectiveQuantity <= 0) return 0;
            return costoPaquete / effectiveQuantity;
        }
        return (item as FixedItem).costo || 0;
    };

    const total = useMemo(() => {
        return orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    }, [orderItems]);

    const handleAddCatalogItem = () => {
        if (!selectedCatalogItem) return;
        const item = allItems.find(i => i.id === selectedCatalogItem);
        if (item) {
            setOrderItems(prev => {
                const existing = prev.find(oi => oi.itemId === item.id);
                if(existing) {
                    return prev.map(oi => oi.itemId === item.id ? {...oi, quantity: Number(oi.quantity) + 1} : oi);
                }
                return [...prev, { itemId: item.id, name: item.name, quantity: 1, price: item.price, unitCost: calculateUnitCost(item) }];
            });
        }
        setSelectedCatalogItem('');
    };
    
    const handleAddCustomItem = () => {
        const price = parseFloat(customItemPrice);
        if(!customItemName.trim() || isNaN(price) || price <= 0) return;
        
        setOrderItems(prev => [...prev, {
            name: customItemName.trim(),
            quantity: 1,
            price,
            unitCost: 0 // Custom items have no COGS tracked here
        }]);
        setCustomItemName('');
        setCustomItemPrice('');
    };

    const handleUpdateQuantity = (index: number, newQuantity: number) => {
        if (isNaN(newQuantity)) return;
        setOrderItems(prev => {
            if (newQuantity <= 0) {
                return prev.filter((_, i) => i !== index);
            }
            return prev.map((item, i) => i === index ? { ...item, quantity: newQuantity } : item);
        });
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const selectedClient = clients.find(c => c._id === selectedClientId);
        if (!selectedClient || orderItems.length === 0) {
            alert("Por favor, seleccione un cliente y añada al menos un producto.");
            return;
        }

        const newOrder: Omit<Order, 'createdAt' | '_id'> = {
            userId: user._id,
            clientId: selectedClient._id!,
            clientName: selectedClient.name,
            address,
            deliveryDate: new Date(deliveryDate).toISOString(),
            status,
            total,
            items: orderItems,
        };
        onSave(newOrder);
    };
    
    if (!isOpen) return null;
    const inputStyle = "bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-purple-500 focus:border-purple-500 block w-full p-2.5";

    return (
        <>
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4" onClick={onClose}>
            <form onSubmit={handleSubmit} className="bg-gray-800 border border-gray-700 rounded-2xl w-full max-w-3xl shadow-2xl shadow-purple-500/20 flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
                <div className="p-6 flex-shrink-0">
                    <h2 className="text-xl font-bold mb-4 text-purple-300">Nuevo Pedido</h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div className="flex gap-2">
                            <select value={selectedClientId} onChange={e => setSelectedClientId(e.target.value)} required className={inputStyle}>
                                <option value="" disabled>-- Seleccionar Cliente --</option>
                                {clients.map(c => <option key={c._id} value={c._id!}>{c.name}</option>)}
                            </select>
                            <button type="button" onClick={() => setIsClientModalOpen(true)} className="p-2 bg-green-600 hover:bg-green-500 rounded-lg text-white flex-shrink-0"><PlusIcon className="w-5 h-5"/></button>
                        </div>
                         <input type="text" placeholder="Dirección de Entrega" value={address} onChange={e => setAddress(e.target.value)} className={inputStyle}/>
                         <input type="datetime-local" value={deliveryDate} onChange={e => setDeliveryDate(e.target.value)} required className={inputStyle}/>
                         <select value={status} onChange={e => setStatus(e.target.value as Order['status'])} className={inputStyle}>
                            <option value="pendiente">Pendiente</option>
                            <option value="en armado">En Armado</option>
                            <option value="entregado">Entregado</option>
                            <option value="cancelado">Cancelado</option>
                         </select>
                    </div>

                    <div className="border-t border-gray-700 pt-4 space-y-3">
                        <div>
                            <label className="text-sm font-semibold text-gray-400">Añadir Producto del Catálogo</label>
                             <div className="flex gap-2 mt-1">
                                <select value={selectedCatalogItem} onChange={e => setSelectedCatalogItem(e.target.value)} className={`${inputStyle} flex-grow`}>
                                    <option value="">-- Seleccionar producto --</option>
                                    {allItems.filter(i => i.visible).map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
                                </select>
                                <button type="button" onClick={handleAddCatalogItem} className="p-2 bg-purple-600 hover:bg-purple-500 rounded-lg text-white"><PlusIcon className="w-5 h-5"/></button>
                            </div>
                        </div>
                        <div>
                            <label className="text-sm font-semibold text-gray-400">Añadir Item Personalizado</label>
                            <div className="flex gap-2 mt-1">
                                <input type="text" placeholder="Nombre del Item (ej. Ramo de Flores)" value={customItemName} onChange={e => setCustomItemName(e.target.value)} className={`${inputStyle} flex-grow`}/>
                                <input type="number" placeholder="Precio (S/)" value={customItemPrice} onChange={e => setCustomItemPrice(e.target.value)} className={`${inputStyle} w-28`}/>
                                <button type="button" onClick={handleAddCustomItem} className="p-2 bg-purple-600 hover:bg-purple-500 rounded-lg text-white"><PlusIcon className="w-5 h-5"/></button>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div className="flex-grow overflow-y-auto border-y border-gray-700 my-4 py-2 px-6 space-y-2">
                    {orderItems.map((orderItem, index) => (
                        <div key={index} className="flex justify-between items-center text-sm">
                            <span className="font-semibold">{orderItem.name}</span>
                            <div className="flex items-center gap-2">
                                <input type="number" value={orderItem.quantity} onChange={e => handleUpdateQuantity(index, parseInt(e.target.value))} className="w-14 text-center bg-gray-900/50 rounded p-0.5 text-sm"/>
                                <span>x S/ {orderItem.price.toFixed(2)}</span>
                                <span className="text-gray-300 w-20 text-right font-bold">S/ {(orderItem.price * orderItem.quantity).toFixed(2)}</span>
                                <button type="button" onClick={() => handleUpdateQuantity(index, 0)} className="p-1 text-red-500 hover:text-red-400"><TrashIcon className="w-4 h-4"/></button>
                            </div>
                        </div>
                    ))}
                     {orderItems.length === 0 && (
                        <p className="text-center text-gray-500 p-4">Añada productos al pedido.</p>
                    )}
                </div>
                
                <div className="p-6 pt-0 flex-shrink-0">
                    <div className="flex justify-between items-center mb-4">
                        <span className="text-xl font-bold text-gray-300">Total:</span>
                        <span className="text-2xl font-bold text-green-400">S/ {total.toFixed(2)}</span>
                    </div>

                     <div className="flex justify-end gap-3">
                        <button type="button" onClick={onClose} className="py-2 px-4 text-sm font-medium text-gray-300 bg-gray-600 rounded-lg hover:bg-gray-500 transition-colors">Cancelar</button>
                        <button type="submit" className="py-2 px-4 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 focus:ring-4 focus:outline-none focus:ring-purple-800 transition-colors">Guardar Pedido</button>
                    </div>
                </div>
            </form>
        </div>
        <ClientModal 
            isOpen={isClientModalOpen}
            onClose={() => setIsClientModalOpen(false)}
            onClientCreated={onClientCreated}
            userId={user._id}
        />
        </>
    );
};

export default OrderModal;