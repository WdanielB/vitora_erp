
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

type StockPanelTab = 'kardex' | 'products';

const StockPanel: React.FC<StockPanelProps> = ({ stockItems, onStockUpdate, user, selectedUserId, flowerItems, setFlowerItems, productItems, setProductItems }) => {
    const [activeTab, setActiveTab] = useState<StockPanelTab>('kardex');
    const [searchTerm, setSearchTerm] = useState('');
    const [isStockModalOpen, setIsStockModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'add' | 'remove' | 'ajuste'>('add');
    const [selectedItem, setSelectedItem] = useState<StockItem | null>(null);
    const [history, setHistory] = useState<StockMovement[]>([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);
    const [isProductModalOpen, setIsProductModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Item | FlowerItem | null>(null);
    const [productType, setProductType] = useState<'flower' | 'product' | null>(null);
    const [selectedFlowerId, setSelectedFlowerId] = useState<string | null>(null);
    const [selectedProductId, setSelectedProductId] = useState<string | null>(null);

    useEffect(() => {
        if (activeTab === 'kardex' && !selectedItem && stockItems && stockItems.length > 0) setSelectedItem(stockItems[0]);
    }, [stockItems, selectedItem, activeTab]);

    useEffect(() => {
        if (activeTab === 'kardex' && selectedItem) {
            const fetchHistory = async () => {
                setIsLoadingHistory(true);
                try {
                    const data = await api.fetchStockHistory(selectedItem.itemId, user, selectedUserId);
                    setHistory(Array.isArray(data) ? data : []);
                } catch (error) { setHistory([]); } finally { setIsLoadingHistory(false); }
            };
            fetchHistory();
        } else { setHistory([]); }
    }, [selectedItem, user, selectedUserId, activeTab]);

    const filteredItems = useMemo(() => (stockItems || []).filter(item => item.name.toLowerCase().includes(searchTerm.toLowerCase())), [stockItems, searchTerm]);

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

    const openProductModalForNew = (type: 'flower' | 'product') => { setProductType(type); setEditingProduct(null); setIsProductModalOpen(true); };
    const openProductModalForEdit = (item: Item, type: 'flower' | 'product') => { setProductType(type); setEditingProduct(item); setIsProductModalOpen(true); };
    
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
    };

    const handleProductDelete = async (type: 'flower' | 'product') => {
        if (type === 'flower' && selectedFlowerId) { await setFlowerItems(prev => prev.filter(i => i.id !== selectedFlowerId)); setSelectedFlowerId(null); }
        else if (type === 'product' && selectedProductId) { await setProductItems(prev => prev.filter(i => i.id !== selectedProductId)); setSelectedProductId(null); }
    };

    const TabButton: React.FC<{tab: StockPanelTab, label: string}> = ({ tab, label }) => (
      <button onClick={() => setActiveTab(tab)} className={`px-4 py-2 text-sm font-semibold rounded-t-lg border-b-2 transition-colors ${activeTab === tab ? 'text-purple-300 border-purple-400' : 'text-gray-400 border-transparent hover:text-white hover:border-gray-500'}`}>{label}</button>
    );

    const renderKardex = () => (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-grow overflow-hidden mt-4">
            <div className="lg:col-span-5 flex flex-col h-full">
                <input type="text" placeholder="Buscar..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full bg-gray-700 border border-gray-600 text-white text-sm rounded-lg p-2.5"/>
                <div className="flex-grow overflow-y-auto mt-4 bg-gray-800/50 rounded-lg border border-gray-700">
                    <table className="w-full text-left">
                        <thead className="bg-gray-700/50 text-xs text-gray-300 uppercase"><tr><th className="px-4 py-3">Item</th><th className="px-4 py-3 text-center">Cant.</th></tr></thead>
                        <tbody>
                            {filteredItems.map(item => (
                                <tr key={item.itemId} onClick={() => setSelectedItem(item)} className={`cursor-pointer ${selectedItem?.itemId === item.itemId ? 'bg-purple-600/30' : 'hover:bg-gray-700/40'}`}>
                                    <td className="px-4 py-3 font-medium text-white">{item.name}</td><td className="px-4 py-3 text-center font-bold">{item.quantity}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            <div className="lg:col-span-7 bg-gray-800/50 rounded-lg border border-gray-700 flex flex-col h-full overflow-hidden">
                 {selectedItem ? (
                    <div className="flex flex-col h-full">
                        <div className="p-4 border-b border-gray-700"><h3 className="text-lg font-bold text-amber-300">Historial: {selectedItem.name}</h3></div>
                        <div className="flex-grow overflow-y-auto">
                            {isLoadingHistory ? <div className="text-center p-8">Cargando...</div> : (
                                <table className="w-full text-left">
                                    <thead className="bg-gray-700/50 text-xs text-gray-300"><tr><th className="px-4 py-3">Fecha</th><th className="px-4 py-3">Tipo</th><th className="px-4 py-3 text-center">Cambio</th></tr></thead>
                                    <tbody>
                                        {history.map(h => (<tr key={h._id} className="border-b border-gray-700"><td className="px-4 py-3 text-gray-300 text-sm">{new Date(h.createdAt).toLocaleDateString()}</td><td className="px-4 py-3 uppercase text-xs font-bold">{h.type}</td><td className={`px-4 py-3 text-center font-bold ${h.quantityChange>0?'text-green-400':'text-red-400'}`}>{h.quantityChange}</td></tr>))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                 ) : <div className="flex items-center justify-center h-full text-gray-500">Selecciona un producto</div>}
            </div>
        </div>
    );

    const renderProducts = () => {
        const renderTable = (title: string, items: any[], selectedId: string | null, setSelected: any, type: 'flower' | 'product') => (
            <div>
                <h3 className="text-lg font-bold mb-3 text-amber-300">{title}</h3>
                <div className="bg-gray-800/50 rounded-lg overflow-hidden border border-gray-700">
                    <table className="w-full text-left">
                        <thead className="bg-gray-700/50 text-xs text-gray-300 uppercase"><tr><th className="px-4 py-3">Item</th><th className="px-4 py-3 text-center">Precio Venta</th></tr></thead>
                        <tbody>
                            {items.map(item => (
                                <tr key={item.id} onClick={() => setSelected(item.id === selectedId ? null : item.id)} onDoubleClick={() => openProductModalForEdit(item, type)} className={`border-b border-gray-700 cursor-pointer ${selectedId === item.id ? 'bg-purple-600/30' : 'hover:bg-gray-700/40'}`}>
                                    <td className="px-4 py-3 text-white">{item.name}</td><td className="px-4 py-3 text-center text-white">S/ {item.price}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="flex gap-2 mt-3">
                    <button onClick={() => openProductModalForNew(type)} className="text-sm bg-blue-600 text-white px-3 py-1.5 rounded">Añadir</button>
                    <button onClick={() => handleProductDelete(type)} disabled={!selectedId} className="text-sm bg-red-700 text-white px-3 py-1.5 rounded disabled:opacity-50">Eliminar</button>
                </div>
            </div>
        );
        return <div className="space-y-8 mt-4">{renderTable('Flores', flowerItems, selectedFlowerId, setSelectedFlowerId, 'flower')}{renderTable('Productos (Chocolates, etc.)', productItems, selectedProductId, setSelectedProductId, 'product')}</div>;
    };

    return (
        <div className="flex flex-col h-full">
            <div className="flex justify-between items-center mb-2">
                <h1 className="text-3xl font-bold text-gray-300">Inventario y Catálogo</h1>
                {activeTab === 'kardex' && <div className="flex gap-2"><button onClick={() => handleOpenStockModal('add')} className="bg-blue-600 text-white px-3 py-1.5 rounded text-sm font-bold">Compra</button><button onClick={() => handleOpenStockModal('remove')} className="bg-orange-600 text-white px-3 py-1.5 rounded text-sm font-bold">Merma</button></div>}
            </div>
            <div className="border-b border-gray-700"><nav className="-mb-px flex gap-4"><TabButton tab="kardex" label="Kardex" /><TabButton tab="products" label="Productos" /></nav></div>
            {activeTab === 'kardex' ? renderKardex() : renderProducts()}
            <StockModal isOpen={isStockModalOpen} onClose={() => setIsStockModalOpen(false)} onSave={handleSaveChanges} stockItems={stockItems} mode={modalMode}/>
            <Modal isOpen={isProductModalOpen} onClose={() => setIsProductModalOpen(false)} onSave={handleProductSave} item={editingProduct} itemType={productType as any}/>
        </div>
    );
};
export default StockPanel;
