
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
}

const OrderModal: React.FC<OrderModalProps> = ({ isOpen, onClose, onSave, allItems, clients, user, onClientCreated, existingOrder }) => {
    const [selectedClientId, setSelectedClientId] = useState('');
    const [address, setAddress] = useState('');
    const [deliveryDate, setDeliveryDate] = useState(new Date().toISOString().substring(0, 16));
    const [status, setStatus] = useState<OrderStatus>('pendiente');
    const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
    
    // States for Custom Bouquet Builder
    const [isCustomBouquetMode, setIsCustomBouquetMode] = useState(false);
    const [bouquetComponents, setBouquetComponents] = useState<OrderItem[]>([]);
    
    const [selectedCatalogItem, setSelectedCatalogItem] = useState('');
    const [customItemName, setCustomItemName] = useState('');
    const [customItemPrice, setCustomItemPrice] = useState('');
    
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
            setIsCustomBouquetMode(false);
            setBouquetComponents([]);
        }
    }, [isOpen, existingOrder, clients]);

    useEffect(() => {
        if (!existingOrder) {
            const client = clients.find(c => c._id === selectedClientId);
            if (client) {
                setAddress(client.address || '');
            }
        }
    }, [selectedClientId, clients, existingOrder]);


    const calculateUnitCost = (item: Item): number => {
        if (item.id.startsWith('f')) {
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
    
    // Custom Bouquet Builder Logic
    const handleAddToBouquet = () => {
        if (!selectedCatalogItem) return;
        const item = allItems.find(i => i.id === selectedCatalogItem);
        if (item) {
            setBouquetComponents(prev => {
                const existing = prev.find(oi => oi.itemId === item.id);
                if(existing) {
                    return prev.map(oi => oi.itemId === item.id ? {...oi, quantity: Number(oi.quantity) + 1} : oi);
                }
                return [...prev, { itemId: item.id, name: item.name, quantity: 1, price: item.price, unitCost: calculateUnitCost(item) }];
            });
        }
        setSelectedCatalogItem('');
    };

    const handleSaveBouquet = () => {
        // Add all components to the main order list
        setOrderItems(prev => [...prev, ...bouquetComponents]);
        setBouquetComponents([]);
        setIsCustomBouquetMode(false);
    };

    
    const handleAddCustomItem = () => {
        const price = parseFloat(customItemPrice);
        if(!customItemName.trim() || isNaN(price) || price <= 0) return;
        
        setOrderItems(prev => [...prev, {
            name: customItemName.trim(),
            quantity: 1,
            price,
            unitCost: 0 
        }]);
        setCustomItemName('');
        setCustomItemPrice('');
    };

    const handleUpdateQuantity = (index: number, newQuantity: number, isBouquet = false) => {
        if (isNaN(newQuantity)) return;
        const setter = isBouquet ? setBouquetComponents : setOrderItems;
        
        setter(prev => {
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
        
        const payload = {
            clientId: selectedClient._id!,
            clientName: selectedClient.name,
            address,
            deliveryDate: new Date(deliveryDate).toISOString(),
            status,
            total,
            items: orderItems,
            userId: user._id // Ensure userId is passed in case of new order
        };

        if (existingOrder) {
            onSave({ ...existingOrder, ...payload });
        } else {
            onSave(payload);
        }
    };
    
    if (!isOpen) return null;
    const inputStyle = "bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-purple-500 focus:border-purple-500 block w-full p-2.5";

    return (
        <>
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4" onClick={onClose}>
            <div className="bg-gray-800 border border-gray-700 rounded-2xl w-full max-w-3xl shadow-2xl shadow-purple-500/20 flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
                
                {/* Header */}
                <div className="p-6 flex-shrink-0 border-b border-gray-700">
                    <h2 className="text-xl font-bold text-purple-300">{existingOrder ? 'Editar Pedido' : 'Nuevo Pedido'}</h2>
                    {!isCustomBouquetMode && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
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
                    )}
                </div>

                {/* Body - Product Selection */}
                {!isCustomBouquetMode ? (
                     <div className="flex-grow overflow-y-auto p-6 space-y-4">
                        <div className="flex gap-2 justify-between">
                            <div className="w-1/2">
                                <label className="text-sm font-semibold text-gray-400 block mb-1">Añadir Producto Individual</label>
                                <div className="flex gap-2">
                                    <select value={selectedCatalogItem} onChange={e => setSelectedCatalogItem(e.target.value)} className={`${inputStyle} flex-grow`}>
                                        <option value="">-- Seleccionar --</option>
                                        {allItems.filter(i => i.visible).map(item => <option key={item.id} value={item.id}>{item.name} - S/ {item.price}</option>)}
                                    </select>
                                    <button type="button" onClick={handleAddCatalogItem} className="p-2 bg-purple-600 hover:bg-purple-500 rounded-lg text-white"><PlusIcon className="w-5 h-5"/></button>
                                </div>
                            </div>
                             <div className="w-1/2">
                                <label className="text-sm font-semibold text-gray-400 block mb-1">Ramo Personalizado (Varios Ítems)</label>
                                <button type="button" onClick={() => setIsCustomBouquetMode(true)} className="w-full p-2.5 bg-pink-700 hover:bg-pink-600 rounded-lg text-white font-semibold text-sm flex justify-center items-center gap-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                                    Armar Ramo
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="text-sm font-semibold text-gray-400 block mb-1">Añadir Item Personalizado (Sin stock)</label>
                            <div className="flex gap-2">
                                <input type="text" placeholder="Nombre (ej. Ramo Especial)" value={customItemName} onChange={e => setCustomItemName(e.target.value)} className={`${inputStyle} flex-grow`}/>
                                <input type="number" placeholder="S/" value={customItemPrice} onChange={e => setCustomItemPrice(e.target.value)} className={`${inputStyle} w-28`}/>
                                <button type="button" onClick={handleAddCustomItem} className="p-2 bg-purple-600 hover:bg-purple-500 rounded-lg text-white"><PlusIcon className="w-5 h-5"/></button>
                            </div>
                        </div>

                        <div className="border-t border-gray-700 pt-2">
                             <h3 className="text-gray-300 font-bold mb-2">Ítems del Pedido</h3>
                             <ul className="space-y-2 bg-gray-900/30 p-2 rounded-lg min-h-[100px]">
                                {orderItems.map((orderItem, index) => (
                                    <li key={index} className="flex justify-between items-center text-sm bg-gray-800 p-2 rounded border border-gray-700">
                                        <span className="font-semibold text-gray-200">{orderItem.name}</span>
                                        <div className="flex items-center gap-2">
                                            <input type="number" value={orderItem.quantity} onChange={e => handleUpdateQuantity(index, parseInt(e.target.value))} className="w-12 text-center bg-gray-700 rounded p-0.5 text-white"/>
                                            <span className="text-gray-400 text-xs">x S/ {orderItem.price.toFixed(2)}</span>
                                            <span className="text-white w-20 text-right font-bold">S/ {(orderItem.price * orderItem.quantity).toFixed(2)}</span>
                                            <button type="button" onClick={() => handleUpdateQuantity(index, 0)} className="text-red-500 hover:text-red-400"><TrashIcon className="w-4 h-4"/></button>
                                        </div>
                                    </li>
                                ))}
                                {orderItems.length === 0 && <p className="text-center text-gray-500 italic">Lista vacía.</p>}
                             </ul>
                        </div>
                     </div>
                ) : (
                    // Custom Bouquet Builder View
                    <div className="flex-grow overflow-y-auto p-6 flex flex-col bg-pink-900/10">
                         <h3 className="text-lg font-bold text-pink-300 mb-2">Constructor de Ramo</h3>
                         <p className="text-sm text-gray-400 mb-4">Selecciona los componentes que forman este ramo. Se descontarán individualmente del stock.</p>
                         
                         <div className="flex gap-2 mb-4">
                             <select value={selectedCatalogItem} onChange={e => setSelectedCatalogItem(e.target.value)} className={`${inputStyle} flex-grow`}>
                                <option value="">-- Añadir Flor/Insumo --</option>
                                {allItems.filter(i => i.visible).map(item => <option key={item.id} value={item.id}>{item.name} - S/ {item.price}</option>)}
                            </select>
                            <button type="button" onClick={handleAddToBouquet} className="p-2 bg-pink-600 hover:bg-pink-500 rounded-lg text-white"><PlusIcon className="w-5 h-5"/></button>
                         </div>
                         
                         <ul className="space-y-2 flex-grow">
                            {bouquetComponents.map((item, index) => (
                                <li key={index} className="flex justify-between items-center text-sm bg-gray-800 p-2 rounded border border-gray-600">
                                    <span>{item.name}</span>
                                    <div className="flex items-center gap-2">
                                        <input type="number" value={item.quantity} onChange={e => handleUpdateQuantity(index, parseInt(e.target.value), true)} className="w-10 text-center bg-gray-700 rounded p-0.5"/>
                                        <span className="w-16 text-right">S/ {(item.price * item.quantity).toFixed(2)}</span>
                                        <button onClick={() => handleUpdateQuantity(index, 0, true)} className="text-red-400"><TrashIcon className="w-4 h-4"/></button>
                                    </div>
                                </li>
                            ))}
                         </ul>
                         
                         <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-gray-700">
                             <span className="self-center font-bold text-pink-200 mr-4">Subtotal Ramo: S/ {bouquetComponents.reduce((s, i) => s + i.price * i.quantity, 0).toFixed(2)}</span>
                             <button type="button" onClick={() => setIsCustomBouquetMode(false)} className="px-4 py-2 text-gray-300 hover:bg-gray-700 rounded-lg">Cancelar</button>
                             <button type="button" onClick={handleSaveBouquet} className="px-4 py-2 bg-pink-600 hover:bg-pink-500 text-white rounded-lg font-bold">Confirmar Ramo</button>
                         </div>
                    </div>
                )}
                
                {/* Footer */}
                {!isCustomBouquetMode && (
                    <div className="p-6 pt-0 flex-shrink-0">
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-xl font-bold text-gray-300">Total:</span>
                            <span className="text-2xl font-bold text-green-400">S/ {total.toFixed(2)}</span>
                        </div>
                         <div className="flex justify-end gap-3">
                            <button type="button" onClick={onClose} className="py-2 px-4 text-sm font-medium text-gray-300 bg-gray-600 rounded-lg hover:bg-gray-500 transition-colors">Cancelar</button>
                            <button type="submit" onClick={handleSubmit} className="py-2 px-4 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors shadow-lg shadow-purple-500/30">{existingOrder ? 'Guardar Cambios' : 'Crear Pedido'}</button>
                        </div>
                    </div>
                )}
            </div>
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
