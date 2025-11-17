import React, { useState, useMemo } from 'react';
import type { Order, Item, FlowerItem, FixedItem } from '../types';
import { PlusIcon } from './icons/PlusIcon';
import { TrashIcon } from './icons/TrashIcon';

interface OrderModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (order: Omit<Order, 'createdAt'>) => void;
    allItems: Item[];
    userId: string;
}

const OrderModal: React.FC<OrderModalProps> = ({ isOpen, onClose, onSave, allItems, userId }) => {
    const [customerName, setCustomerName] = useState('');
    const [address, setAddress] = useState('');
    const [deliveryDate, setDeliveryDate] = useState(new Date().toISOString().substring(0, 16));
    const [status, setStatus] = useState<Order['status']>('pendiente');
    const [orderItems, setOrderItems] = useState<Record<string, { item: Item, quantity: number }>>({});
    const [selectedItem, setSelectedItem] = useState('');

    const calculateUnitCost = (item: Item): number => {
        if (item.id.startsWith('f')) { // FlowerItem
            const flower = item as FlowerItem;
            const { costoPaquete = 0, cantidadPorPaquete = 1, merma = 0 } = flower;
            const effectiveQuantity = cantidadPorPaquete - merma;
            if (effectiveQuantity <= 0) return 0;
            return costoPaquete / effectiveQuantity;
        }
        // FixedItem
        return (item as FixedItem).costo || 0;
    };

    const total = useMemo(() => {
        return Object.values(orderItems).reduce((sum, { item, quantity }) => sum + item.price * quantity, 0);
    }, [orderItems]);

    const handleAddItem = () => {
        if (!selectedItem) return;
        const item = allItems.find(i => i.id === selectedItem);
        if (item) {
            setOrderItems(prev => ({
                ...prev,
                // FIX: Operator '+' cannot be applied to types 'unknown' and 'number'.
                // Cast the quantity to a number before performing addition to resolve the type error.
                [item.id]: { item, quantity: Number(prev[item.id]?.quantity || 0) + 1 }
            }));
        }
        setSelectedItem('');
    };
    
    const handleUpdateQuantity = (itemId: string, newQuantity: number) => {
        if (isNaN(newQuantity)) return;
        setOrderItems(prev => {
            if (newQuantity <= 0) {
                const { [itemId]: _, ...rest } = prev;
                return rest;
            }
            return { ...prev, [itemId]: { ...prev[itemId], quantity: newQuantity } };
        });
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!customerName || Object.keys(orderItems).length === 0) {
            // Add better validation feedback
            alert("Por favor, complete el nombre del cliente y añada al menos un producto.");
            return;
        }

        const newOrder: Omit<Order, 'createdAt' | '_id'> = {
            userId,
            customerName,
            address,
            deliveryDate: new Date(deliveryDate).toISOString(),
            status,
            total,
            items: Object.values(orderItems).map(({ item, quantity }) => ({
                itemId: item.id,
                name: item.name,
                quantity,
                price: item.price,
                unitCost: calculateUnitCost(item)
            })),
        };
        onSave(newOrder);
        // Reset state for next time
        setCustomerName('');
        setAddress('');
        setDeliveryDate(new Date().toISOString().substring(0, 16));
        setStatus('pendiente');
        setOrderItems({});
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4" onClick={onClose}>
            <form onSubmit={handleSubmit} className="bg-gray-800 border border-gray-700 rounded-2xl p-6 w-full max-w-2xl shadow-2xl shadow-purple-500/20 flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
                <h2 className="text-xl font-bold mb-4 text-purple-300">Nuevo Pedido</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                     <input type="text" placeholder="Nombre del Cliente" value={customerName} onChange={e => setCustomerName(e.target.value)} required className="input-style"/>
                     <input type="text" placeholder="Dirección de Entrega" value={address} onChange={e => setAddress(e.target.value)} className="input-style"/>
                     <input type="datetime-local" value={deliveryDate} onChange={e => setDeliveryDate(e.target.value)} required className="input-style"/>
                     <select value={status} onChange={e => setStatus(e.target.value as Order['status'])} className="input-style">
                        <option value="pendiente">Pendiente</option>
                        <option value="en armado">En Armado</option>
                        <option value="entregado">Entregado</option>
                        <option value="cancelado">Cancelado</option>
                     </select>
                </div>

                <div className="flex gap-2 mb-3">
                    <select value={selectedItem} onChange={e => setSelectedItem(e.target.value)} className="input-style flex-grow">
                        <option value="">-- Seleccionar producto --</option>
                        {allItems.filter(i => i.visible).map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
                    </select>
                    <button type="button" onClick={handleAddItem} className="p-2 bg-purple-600 hover:bg-purple-500 rounded-lg text-white"><PlusIcon className="w-5 h-5"/></button>
                </div>
                
                <div className="flex-grow overflow-y-auto border-y border-gray-700 py-2 space-y-2">
                    {Object.values(orderItems).map(({item, quantity}) => (
                        <div key={item.id} className="flex justify-between items-center text-sm">
                            <span className="font-semibold">{item.name}</span>
                            <div className="flex items-center gap-2">
                                <input type="number" value={quantity} onChange={e => handleUpdateQuantity(item.id, parseInt(e.target.value))} className="w-14 text-center bg-gray-900/50 rounded p-0.5 text-sm"/>
                                <span>x S/ {item.price.toFixed(2)}</span>
                                <span className="text-gray-300 w-20 text-right font-bold">S/ {(item.price * quantity).toFixed(2)}</span>
                                <button type="button" onClick={() => handleUpdateQuantity(item.id, 0)} className="p-1 text-red-500 hover:text-red-400"><TrashIcon className="w-4 h-4"/></button>
                            </div>
                        </div>
                    ))}
                     {Object.keys(orderItems).length === 0 && (
                        <p className="text-center text-gray-500 p-4">Añada productos al pedido.</p>
                    )}
                </div>
                
                <div className="flex justify-between items-center mt-4">
                    <span className="text-xl font-bold text-gray-300">Total:</span>
                    <span className="text-2xl font-bold text-green-400">S/ {total.toFixed(2)}</span>
                </div>

                 <div className="flex justify-end gap-3 pt-4 mt-auto">
                    <button type="button" onClick={onClose} className="py-2 px-4 text-sm font-medium text-gray-300 bg-gray-600 rounded-lg hover:bg-gray-500 transition-colors">Cancelar</button>
                    <button type="submit" className="py-2 px-4 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 focus:ring-4 focus:outline-none focus:ring-purple-800 transition-colors">Guardar Pedido</button>
                </div>
                <style jsx>{`
                    .input-style {
                        background-color: #374151; /* bg-gray-700 */
                        border: 1px solid #4B5563; /* border-gray-600 */
                        color: white;
                        font-size: 0.875rem; /* text-sm */
                        border-radius: 0.5rem; /* rounded-lg */
                        padding: 0.625rem; /* p-2.5 */
                        width: 100%;
                    }
                    .input-style:focus {
                        --tw-ring-color: #A855F7; /* ring-purple-500 */
                        border-color: #A855F7; /* border-purple-500 */
                    }
                `}</style>
            </form>
        </div>
    );
};

export default OrderModal;