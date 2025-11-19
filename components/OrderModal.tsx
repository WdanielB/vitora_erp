
import React, { useState, useMemo, useEffect } from 'react';
import type { Order, Item, Client, User, OrderItem, OrderStatus, ProductItem } from '../types.ts';
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
    const [deliveryDate, setDeliveryDate] = useState(new Date().toISOString().substring(0, 16)); // YYYY-MM-DDTHH:mm
    const [status, setStatus] = useState<OrderStatus>('pendiente');
    const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
    
    const [isClientModalOpen, setIsClientModalOpen] = useState(false);
    const [dedication, setDedication] = useState('');

    // Custom Item State
    const [customItemName, setCustomItemName] = useState('');
    const [customItemPrice, setCustomItemPrice] = useState('');

    // Product Selection States
    const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('Todos');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCatalogItem, setSelectedCatalogItem] = useState('');

    useEffect(() => {
        if(isOpen) {
            if (existingOrder) {
                setSelectedClientId(existingOrder.clientId);
                setAddress(existingOrder.address);
                const d = new Date(existingOrder.deliveryDate);
                const formattedDate = new Date(d.getTime() - (d.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);
                setDeliveryDate(formattedDate);
                
                setStatus(existingOrder.status);
                setOrderItems(existingOrder.items);
                setDedication(existingOrder.dedication || '');
            } else {
                setOrderItems(prefillItems || []);
                if(clients.length > 0) {
                    const defaultClient = clients[0];
                    setSelectedClientId(defaultClient._id!);
                    setAddress(defaultClient.address || '');
                }
                const now = new Date();
                const formattedDate = new Date(now.getTime() - (now.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);
                setDeliveryDate(formattedDate);
                setStatus('pendiente');
                setDedication('');
            }
            setCustomItemName('');
            setCustomItemPrice('');
            setSelectedCatalogItem('');
            setSelectedCategoryFilter('Todos');
            setSearchTerm('');
        }
    }, [isOpen, existingOrder, clients, prefillItems]);

    useEffect(() => {
        if (!existingOrder) {
            const client = clients.find(c => c._id === selectedClientId);
            if (client) setAddress(client.address || '');
        }
    }, [selectedClientId, clients, existingOrder]);

    const total = useMemo(() => orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0), [orderItems]);

    // Filter items for dropdown
    const filteredCatalogItems = useMemo(() => {
        return allItems.filter(item => {
            const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
            const itemCategory = (item as ProductItem).category || 'Adicionales';
            // If item is a flower (usually has no category property in Item interface unless cast), treat as 'Flores' or 'Adicionales'
            // Assuming allItems mix Flowers and Products.
            // Logic: If it's a product, check category. If it's a flower, maybe show in 'Flores' or 'Todos'.
            
            // Quick fix: Check if it has 'costoPaquete' -> It's a flower.
            const isFlower = 'costoPaquete' in item;
            const category = isFlower ? 'Flores' : (itemCategory);

            const matchesCategory = selectedCategoryFilter === 'Todos' || category === selectedCategoryFilter;
            
            return matchesSearch && matchesCategory;
        });
    }, [allItems, searchTerm, selectedCategoryFilter]);

    const handleAddCatalogItem = () => {
        const item = allItems.find(i => i.id === selectedCatalogItem);
        if (item) {
            setOrderItems(prev => [...prev, { itemId: item.id, name: item.name, quantity: 1, price: item.price, unitCost: 0 }]); 
        }
        setSelectedCatalogItem('');
    };

    const handleAddCustomItem = () => {
        if (customItemName && customItemPrice) {
            const price = parseFloat(customItemPrice);
            if (!isNaN(price)) {
                setOrderItems(prev => [...prev, { name: customItemName, quantity: 1, price: price, unitCost: 0 }]);
                setCustomItemName('');
                setCustomItemPrice('');
            }
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const selectedClient = clients.find(c => c._id === selectedClientId);
        if (!selectedClient || orderItems.length === 0) { alert("Datos incompletos."); return; }
        
        const payload = { 
            clientId: selectedClient._id!, 
            clientName: selectedClient.name, 
            address, 
            deliveryDate: new Date(deliveryDate).toISOString(), 
            status, 
            total, 
            items: orderItems, 
            userId: user._id,
            dedication
        };
        
        if (existingOrder) onSave({ ...existingOrder, ...payload }); else onSave(payload);
    };

    if (!isOpen) return null;

    return (
        <>
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4" onClick={onClose}>
            <div className="bg-gray-800 border border-gray-700 rounded-2xl w-full max-w-4xl p-6 flex flex-col max-h-[95vh]" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-purple-300">{existingOrder ? 'Editar Pedido' : 'Nuevo Pedido'}</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white"><TrashIcon className="w-5 h-5"/></button>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-hidden">
                    {/* Left Column: Details */}
                    <div className="lg:col-span-1 space-y-4 overflow-y-auto max-h-[60vh]">
                         <div>
                             <label className="text-xs text-gray-400 uppercase font-bold">Cliente</label>
                             <div className="flex gap-2 mt-1">
                                 <select value={selectedClientId} onChange={e => setSelectedClientId(e.target.value)} className="bg-gray-700 text-white rounded w-full p-2 text-sm">
                                     {clients.map(c=><option key={c._id} value={c._id}>{c.name}</option>)}
                                 </select>
                                 <button onClick={()=>setIsClientModalOpen(true)} className="bg-green-600 p-2 rounded text-white"><PlusIcon className="w-4 h-4"/></button>
                             </div>
                         </div>
                         <div>
                             <label className="text-xs text-gray-400 uppercase font-bold">Dirección</label>
                             <input type="text" value={address} onChange={e=>setAddress(e.target.value)} className="bg-gray-700 text-white rounded w-full p-2 mt-1 text-sm" placeholder="Dirección de entrega"/>
                         </div>
                         <div>
                             <label className="text-xs text-gray-400 uppercase font-bold">Fecha y Hora Entrega</label>
                             <input type="datetime-local" value={deliveryDate} onChange={e=>setDeliveryDate(e.target.value)} className="bg-gray-700 text-white rounded w-full p-2 mt-1 text-sm"/>
                         </div>
                         <div>
                             <label className="text-xs text-gray-400 uppercase font-bold">Dedicatoria (Tarjeta)</label>
                             <textarea value={dedication} onChange={e=>setDedication(e.target.value)} className="bg-gray-700 text-white rounded w-full p-2 mt-1 text-sm h-20 resize-none" placeholder="Mensaje para la tarjeta..."></textarea>
                         </div>
                    </div>

                    {/* Right Column: Items */}
                    <div className="lg:col-span-2 flex flex-col h-full border-l border-gray-700 pl-6">
                         {/* Add Items Section */}
                         <div className="mb-4 space-y-3">
                             {/* Search & Filter */}
                             <div className="flex gap-2">
                                 <select value={selectedCategoryFilter} onChange={e=>setSelectedCategoryFilter(e.target.value)} className="bg-gray-700 text-white text-sm rounded p-2 w-1/3">
                                     <option value="Todos">Todos</option>
                                     <option value="Flores">Flores</option>
                                     <option value="Ramo">Ramo</option>
                                     <option value="Box">Box</option>
                                     <option value="Peluche">Peluche</option>
                                     <option value="Chocolate">Chocolate</option>
                                     <option value="Bebida">Bebida</option>
                                     <option value="Adicionales">Adicionales</option>
                                 </select>
                                 <input type="text" placeholder="Buscar producto..." value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} className="bg-gray-700 text-white text-sm rounded p-2 flex-grow" />
                             </div>

                             {/* Product Select */}
                             <div className="flex gap-2">
                                 <select value={selectedCatalogItem} onChange={e=>setSelectedCatalogItem(e.target.value)} className="bg-gray-700 text-white flex-grow rounded p-2 text-sm">
                                     <option value="">-- Seleccionar del Catálogo --</option>
                                     {filteredCatalogItems.map(i=><option key={i.id} value={i.id}>{i.name} - S/ {i.price}</option>)}
                                 </select>
                                 <button onClick={handleAddCatalogItem} disabled={!selectedCatalogItem} className="bg-purple-600 disabled:opacity-50 text-white px-3 rounded text-sm font-bold">Añadir</button>
                             </div>
                             
                             {/* Custom Add */}
                             <div className="flex gap-2 items-center bg-gray-900/30 p-2 rounded border border-gray-700/50">
                                 <input type="text" value={customItemName} onChange={e=>setCustomItemName(e.target.value)} placeholder="Ítem Personalizado..." className="bg-transparent border-b border-gray-600 text-white text-sm w-full focus:outline-none focus:border-purple-500"/>
                                 <input type="number" value={customItemPrice} onChange={e=>setCustomItemPrice(e.target.value)} placeholder="S/" className="bg-transparent border-b border-gray-600 text-white text-sm w-20 text-center focus:outline-none focus:border-purple-500"/>
                                 <button onClick={handleAddCustomItem} className="text-green-500 hover:text-green-400"><PlusIcon className="w-5 h-5"/></button>
                             </div>
                         </div>

                         {/* Items List */}
                         <div className="flex-grow overflow-y-auto bg-gray-900/50 rounded-lg border border-gray-700 mb-4">
                             <table className="w-full text-left text-sm">
                                 <thead className="bg-gray-800 text-gray-400 text-xs uppercase sticky top-0">
                                     <tr><th className="p-2">Item</th><th className="p-2 text-center">Cant</th><th className="p-2 text-right">Precio</th><th className="p-2"></th></tr>
                                 </thead>
                                 <tbody className="divide-y divide-gray-700">
                                     {orderItems.map((item, i)=>(
                                         <tr key={i}>
                                             <td className="p-2">{item.name}</td>
                                             <td className="p-2 text-center">{item.quantity}</td>
                                             <td className="p-2 text-right">S/ {(item.price * item.quantity).toFixed(2)}</td>
                                             <td className="p-2 text-center"><button onClick={()=>setOrderItems(prev=>prev.filter((_, idx)=>idx!==i))} className="text-red-500 hover:text-red-400"><TrashIcon className="w-4 h-4"/></button></td>
                                         </tr>
                                     ))}
                                 </tbody>
                             </table>
                             {orderItems.length === 0 && <div className="text-center p-4 text-gray-500 text-sm">Sin items agregados.</div>}
                         </div>

                         {/* Total & Actions */}
                         <div className="flex justify-between items-center pt-2 border-t border-gray-700 mt-auto">
                            <span className="text-2xl font-bold text-white">Total: <span className="text-green-400">S/ {total.toFixed(2)}</span></span>
                            <div className="flex gap-3">
                                <button onClick={onClose} className="px-4 py-2 text-gray-400 hover:text-white font-medium">Cancelar</button>
                                <button onClick={handleSubmit} className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-2 rounded-lg font-bold shadow-lg shadow-purple-500/20 hover:scale-105 transition-transform">Guardar Pedido</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <ClientModal isOpen={isClientModalOpen} onClose={()=>setIsClientModalOpen(false)} onClientCreated={onClientCreated} userId={user._id}/>
        </>
    );
};
export default OrderModal;