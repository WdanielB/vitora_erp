
import React, { useState, useMemo, useEffect } from 'react';
import type { StockItem, User, StockMovement, StockMovementType, FlowerItem, ProductItem, Item } from '../../types.ts';
import { PlusIcon } from '../icons/PlusIcon.tsx';
import StockModal from '../StockModal.tsx';
import Modal from '../Modal.tsx';
import * as api from '../../services/api.ts';
import { ChartLineIcon } from '../icons/ChartLineIcon.tsx';
import { CheckIcon } from '../icons/CheckIcon.tsx';
import { XIcon } from '../icons/XIcon.tsx';
import { TrashIcon } from '../icons/TrashIcon.tsx';

interface StockPanelProps {
    stockItems: StockItem[];
    onStockUpdate: () => void;
    user: User;
    selectedUserId: string | null;
    flowerItems: FlowerItem[];
    setFlowerItems: (updater: FlowerItem[] | ((prev: FlowerItem[]) => FlowerItem[])) => Promise<void>;
    productItems: ProductItem[];
    setProductItems: (updater: ProductItem[] | ((prev: ProductItem[]) => ProductItem[])) => Promise<void>;
}

// New Tab Structure: 'flowers' | 'products'
// Within each, we show list + optional Kardex details
type InventoryTab = 'flowers' | 'products';

const StockPanel: React.FC<StockPanelProps> = ({ stockItems, onStockUpdate, user, selectedUserId, flowerItems, setFlowerItems, productItems, setProductItems }) => {
    const [activeTab, setActiveTab] = useState<InventoryTab>('flowers');
    const [searchTerm, setSearchTerm] = useState('');
    
    // Stock Operations (Buy/Waste/Adjust)
    const [isStockModalOpen, setIsStockModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'add' | 'remove' | 'ajuste'>('add');
    
    // Selection for Kardex
    const [selectedItem, setSelectedItem] = useState<StockItem | null>(null);
    const [history, setHistory] = useState<StockMovement[]>([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);
    
    // Product Management
    const [isProductModalOpen, setIsProductModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Item | FlowerItem | null>(null);
    const [productType, setProductType] = useState<'flower' | 'product' | null>(null);

    // Filter items based on tab and search
    const displayedStockItems = useMemo(() => {
        const type = activeTab === 'flowers' ? 'flower' : 'product';
        return stockItems
            .filter(item => item.type === type)
            .filter(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [stockItems, activeTab, searchTerm]);

    // Auto-select first item for Kardex if none selected
    useEffect(() => {
        if (!selectedItem && displayedStockItems.length > 0) {
            setSelectedItem(displayedStockItems[0]);
        } else if (selectedItem && !displayedStockItems.find(i => i.itemId === selectedItem.itemId)) {
             if (displayedStockItems.length > 0) setSelectedItem(displayedStockItems[0]);
             else setSelectedItem(null);
        }
    }, [displayedStockItems, selectedItem]);

    // Fetch History
    useEffect(() => {
        if (selectedItem) {
            const fetchHistory = async () => {
                setIsLoadingHistory(true);
                try {
                    const data = await api.fetchStockHistory(selectedItem.itemId, user, selectedUserId);
                    setHistory(Array.isArray(data) ? data : []);
                } catch (error) { setHistory([]); } finally { setIsLoadingHistory(false); }
            };
            fetchHistory();
        } else { setHistory([]); }
    }, [selectedItem, user, selectedUserId]);

    const handleOpenStockModal = (mode: 'add' | 'remove' | 'ajuste') => { setModalMode(mode); setIsStockModalOpen(true); };
    const handleSaveChanges = async (updates: any[]) => {
        try {
            const movementType = modalMode === 'add' ? 'compra' : modalMode === 'remove' ? 'merma' : 'ajuste';
            const batchUpdates = updates.map(u => ({...u, userId: user._id, movementType }));
            await api.updateStockBatch(batchUpdates, user._id);
            onStockUpdate();
        } catch (error) { console.error(error); }
        setIsStockModalOpen(false);
    };

    // Catalog Management (Edit/Add/Delete)
    const openProductModalForNew = () => { 
        setProductType(activeTab === 'flowers' ? 'flower' : 'product'); 
        setEditingProduct(null); 
        setIsProductModalOpen(true); 
    };
    
    const openProductModalForEdit = (stockItem: StockItem) => {
        let catalogItem;
        const type = activeTab === 'flowers' ? 'flower' : 'product';
        if (activeTab === 'flowers') catalogItem = flowerItems.find(i => i.id === stockItem.itemId);
        else catalogItem = productItems.find(i => i.id === stockItem.itemId);
        
        if (catalogItem) {
            setProductType(type);
            setEditingProduct(catalogItem);
            setIsProductModalOpen(true);
        }
    };

    const handleProductSave = async (itemData: any) => {
        if (productType === 'flower') {
            await setFlowerItems(prev => {
                 const newItem: FlowerItem = { ...(editingProduct as FlowerItem), ...itemData, id: editingProduct?.id || `f_${Date.now()}`, userId: user._id };
                 if (editingProduct) return prev.map(i => i.id === editingProduct.id ? newItem : i);
                 return [...prev, newItem];
            });
        } else {
            await setProductItems(prev => {
                const newItem: ProductItem = { ...(editingProduct as ProductItem), ...itemData, id: editingProduct?.id || `p_${Date.now()}`, userId: user._id };
                if (editingProduct) return prev.map(i => i.id === editingProduct.id ? newItem : i);
                return [...prev, newItem];
            });
        }
        setIsProductModalOpen(false);
        onStockUpdate(); // Refresh stock list because names might have changed or new items added
    };
    
    const handleDeleteCatalogItem = async (itemId: string) => {
        // This is logical delete from frontend state only for now as requested for simplicity, usually would check dependencies
        if (!window.confirm("¿Eliminar producto del catálogo?")) return;
        if (activeTab === 'flowers') await setFlowerItems(prev => prev.filter(i => i.id !== itemId));
        else await setProductItems(prev => prev.filter(i => i.id !== itemId));
        onStockUpdate();
    };

    const getCatalogDetails = (itemId: string) => {
        if (activeTab === 'flowers') return flowerItems.find(f => f.id === itemId);
        return productItems.find(p => p.id === itemId);
    };

    return (
        <div className="flex flex-col h-full">
            {/* Header & Tabs */}
            <div className="flex justify-between items-center mb-2">
                <h1 className="text-3xl font-bold text-gray-300">Control de Inventario</h1>
                <div className="flex gap-2">
                    <button onClick={() => handleOpenStockModal('add')} className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded text-sm font-bold transition-colors">Registrar Compra</button>
                    <button onClick={() => handleOpenStockModal('remove')} className="bg-orange-600 hover:bg-orange-500 text-white px-3 py-1.5 rounded text-sm font-bold transition-colors">Registrar Merma</button>
                    <button onClick={() => handleOpenStockModal('ajuste')} className="bg-gray-600 hover:bg-gray-500 text-white px-3 py-1.5 rounded text-sm font-bold transition-colors">Ajuste</button>
                </div>
            </div>
            
            <div className="border-b border-gray-700 mb-4">
                <nav className="-mb-px flex gap-6">
                    <button onClick={() => setActiveTab('flowers')} className={`pb-2 text-sm font-bold border-b-2 transition-colors ${activeTab === 'flowers' ? 'border-purple-400 text-purple-300' : 'border-transparent text-gray-400 hover:text-white'}`}>Inventario de Flores</button>
                    <button onClick={() => setActiveTab('products')} className={`pb-2 text-sm font-bold border-b-2 transition-colors ${activeTab === 'products' ? 'border-purple-400 text-purple-300' : 'border-transparent text-gray-400 hover:text-white'}`}>Inventario de Productos</button>
                </nav>
            </div>

            {/* Main Content Area */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-grow overflow-hidden">
                
                {/* Left List */}
                <div className="lg:col-span-7 flex flex-col h-full bg-gray-800/30 rounded-lg border border-gray-700">
                    <div className="p-3 border-b border-gray-700 flex gap-2">
                        <input type="text" placeholder="Buscar item..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="flex-grow bg-gray-700 border border-gray-600 text-white text-sm rounded-lg p-2"/>
                        <button onClick={openProductModalForNew} className="bg-green-600 hover:bg-green-500 text-white px-3 rounded-lg flex items-center"><PlusIcon className="w-5 h-5"/></button>
                    </div>
                    <div className="flex-grow overflow-y-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-700/50 text-xs text-gray-300 uppercase sticky top-0">
                                <tr>
                                    <th className="px-4 py-3">Nombre</th>
                                    {activeTab === 'flowers' ? (
                                        <>
                                            <th className="px-4 py-3 text-center">Paquetes (Ref)</th>
                                            <th className="px-4 py-3 text-center">Tallos/Paq</th>
                                            <th className="px-4 py-3 text-center">Stock (Tallos)</th>
                                        </>
                                    ) : (
                                        <>
                                             <th className="px-4 py-3 text-center">Costo Unit.</th>
                                             <th className="px-4 py-3 text-center">Stock (Uds)</th>
                                        </>
                                    )}
                                    <th className="px-4 py-3 text-center">Acción</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-700">
                                {displayedStockItems.map(item => {
                                    const details = getCatalogDetails(item.itemId);
                                    const isFlower = activeTab === 'flowers';
                                    const flowerDetails = details as FlowerItem;
                                    const productDetails = details as ProductItem;

                                    return (
                                        <tr key={item.itemId} onClick={() => setSelectedItem(item)} className={`cursor-pointer transition-colors ${selectedItem?.itemId === item.itemId ? 'bg-purple-600/20' : 'hover:bg-gray-700/40'}`}>
                                            <td className="px-4 py-3 font-medium text-white">{item.name}</td>
                                            {isFlower ? (
                                                <>
                                                    <td className="px-4 py-3 text-center text-gray-400">
                                                        {flowerDetails ? `~${(item.quantity / (flowerDetails.cantidadPorPaquete || 1)).toFixed(1)}` : '-'}
                                                    </td>
                                                    <td className="px-4 py-3 text-center text-gray-400">{flowerDetails?.cantidadPorPaquete || 1}</td>
                                                    <td className={`px-4 py-3 text-center font-bold ${item.quantity <= item.criticalStock ? 'text-red-400' : 'text-green-400'}`}>{item.quantity}</td>
                                                </>
                                            ) : (
                                                <>
                                                    <td className="px-4 py-3 text-center text-gray-300">S/ {productDetails?.costo?.toFixed(2) || '0.00'}</td>
                                                    <td className={`px-4 py-3 text-center font-bold ${item.quantity <= item.criticalStock ? 'text-red-400' : 'text-green-400'}`}>{item.quantity}</td>
                                                </>
                                            )}
                                            <td className="px-4 py-3 text-center">
                                                <div className="flex justify-center gap-2">
                                                    <button onClick={(e) => { e.stopPropagation(); openProductModalForEdit(item); }} className="text-purple-400 hover:text-purple-300"><span className="text-xs underline">Editar</span></button>
                                                    <button onClick={(e) => { e.stopPropagation(); handleDeleteCatalogItem(item.itemId); }} className="text-red-400 hover:text-red-300"><TrashIcon className="w-4 h-4"/></button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Right Kardex */}
                <div className="lg:col-span-5 bg-gray-800/50 rounded-lg border border-gray-700 flex flex-col h-full overflow-hidden">
                     {selectedItem ? (
                        <div className="flex flex-col h-full">
                            <div className="p-4 border-b border-gray-700 bg-gray-800">
                                <h3 className="text-lg font-bold text-amber-300">Kardex: {selectedItem.name}</h3>
                                <p className="text-xs text-gray-400">Historial de movimientos en tiempo real</p>
                            </div>
                            <div className="flex-grow overflow-y-auto">
                                {isLoadingHistory ? <div className="text-center p-8">Cargando...</div> : history.length === 0 ? <div className="text-center p-8 text-gray-500">Sin movimientos registrados.</div> : (
                                    <table className="w-full text-left">
                                        <thead className="bg-gray-700/50 text-xs text-gray-300 sticky top-0"><tr><th className="px-4 py-2">Fecha</th><th className="px-4 py-2">Movimiento</th><th className="px-4 py-2 text-center">Cant.</th><th className="px-4 py-2 text-center">Saldo</th></tr></thead>
                                        <tbody className="divide-y divide-gray-700">
                                            {history.map(h => (
                                                <tr key={h._id} className="hover:bg-gray-700/30">
                                                    <td className="px-4 py-2 text-xs text-gray-400">
                                                        {new Date(h.createdAt).toLocaleDateString()} <span className="text-[10px]">{new Date(h.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                                    </td>
                                                    <td className="px-4 py-2 uppercase text-[10px] font-bold tracking-wide">
                                                        <span className={`px-1.5 py-0.5 rounded ${
                                                            h.type==='compra'?'bg-blue-900 text-blue-300':
                                                            h.type==='venta'?'bg-green-900 text-green-300':
                                                            h.type==='merma'?'bg-orange-900 text-orange-300':
                                                            'bg-gray-700 text-gray-300'
                                                        }`}>{h.type}</span>
                                                    </td>
                                                    <td className={`px-4 py-2 text-center text-xs font-bold ${h.quantityChange>0?'text-green-400':'text-red-400'}`}>{h.quantityChange > 0 ? '+' : ''}{h.quantityChange}</td>
                                                    <td className="px-4 py-2 text-center text-xs text-white font-medium">{h.quantityAfter}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </div>
                     ) : <div className="flex flex-col items-center justify-center h-full text-gray-500 gap-2"><ChartLineIcon className="w-12 h-12 opacity-20"/><p>Selecciona un ítem para ver su Kardex</p></div>}
                </div>
            </div>

            <StockModal isOpen={isStockModalOpen} onClose={() => setIsStockModalOpen(false)} onSave={handleSaveChanges} stockItems={displayedStockItems} mode={modalMode} />
            <Modal isOpen={isProductModalOpen} onClose={() => setIsProductModalOpen(false)} onSave={handleProductSave} item={editingProduct} itemType={productType as any} />
        </div>
    );
};
export default StockPanel;
