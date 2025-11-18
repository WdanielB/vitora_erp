
import React, { useState, useMemo, useEffect } from 'react';
import type { StockItem, User, StockMovement, StockMovementType, FlowerItem, FixedItem, Item } from '../../types.ts';
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
    fixedItems: FixedItem[];
    setFixedItems: (updater: FixedItem[] | ((prev: FixedItem[]) => FixedItem[])) => Promise<void>;
}

type StockPanelTab = 'kardex' | 'products';

const StockPanel: React.FC<StockPanelProps> = ({ stockItems, onStockUpdate, user, selectedUserId, flowerItems, setFlowerItems, fixedItems, setFixedItems }) => {
    const [activeTab, setActiveTab] = useState<StockPanelTab>('kardex');
    
    // Kardex states
    const [searchTerm, setSearchTerm] = useState('');
    const [isStockModalOpen, setIsStockModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'add' | 'remove' | 'ajuste'>('add');
    const [selectedItem, setSelectedItem] = useState<StockItem | null>(null);
    const [history, setHistory] = useState<StockMovement[]>([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);

    // Product management states
    const [isProductModalOpen, setIsProductModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Item | FlowerItem | null>(null);
    const [productType, setProductType] = useState<'flower' | 'fixed' | null>(null);
    const [selectedFlowerId, setSelectedFlowerId] = useState<string | null>(null);
    const [selectedFixedId, setSelectedFixedId] = useState<string | null>(null);

    // --- Kardex Logic ---
    useEffect(() => {
        if (activeTab === 'kardex' && !selectedItem && stockItems.length > 0) {
            setSelectedItem(stockItems[0]);
        }
    }, [stockItems, selectedItem, activeTab]);

    useEffect(() => {
        if (activeTab === 'kardex' && selectedItem) {
            const fetchHistory = async () => {
                setIsLoadingHistory(true);
                try {
                    const data = await api.fetchStockHistory(selectedItem.itemId, user, selectedUserId);
                    setHistory(data);
                } catch (error) {
                    console.error("Failed to fetch stock history:", error);
                    setHistory([]);
                } finally {
                    setIsLoadingHistory(false);
                }
            };
            fetchHistory();
        } else {
            setHistory([]);
        }
    }, [selectedItem, user, selectedUserId, activeTab]);

    const filteredItems = useMemo(() => stockItems.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
    ), [stockItems, searchTerm]);

    const handleOpenStockModal = (mode: 'add' | 'remove' | 'ajuste') => {
        setModalMode(mode);
        setIsStockModalOpen(true);
    };

    const handleSaveChanges = async (updates: { itemId: string, change: number, type: 'flower' | 'fixed' }[]) => {
        try {
            // FIX: Explicitly type `movementType` to ensure it matches the expected union type for the API call.
            const movementType: 'compra' | 'merma' | 'ajuste' = modalMode === 'add' ? 'compra' : modalMode === 'remove' ? 'merma' : 'ajuste';
            const batchUpdates = updates.map(u => ({...u, userId: user._id, movementType }));
            await api.updateStockBatch(batchUpdates, user._id);
            onStockUpdate();
        } catch (error: any) {
            console.error("Failed to update stock:", error.message);
        }
        setIsStockModalOpen(false);
    };

    const getStatus = (item: StockItem) => {
        if (item.quantity <= 0) return <span className="px-2 py-1 text-xs font-semibold text-white bg-red-800 rounded-full">Agotado</span>;
        if (item.quantity <= item.criticalStock) return <span className="px-2 py-1 text-xs font-semibold text-black bg-yellow-400 rounded-full">Crítico</span>;
        return <span className="px-2 py-1 text-xs font-semibold text-white bg-green-700 rounded-full">En Stock</span>;
    };
    
    // --- Product Management Logic ---
    const openProductModalForNew = (type: 'flower' | 'fixed') => {
        setProductType(type);
        setEditingProduct(null);
        setIsProductModalOpen(true);
    };
    const openProductModalForEdit = (item: Item | FlowerItem, type: 'flower' | 'fixed') => {
        setProductType(type);
        setEditingProduct(item);
        setIsProductModalOpen(true);
    };
    const handleProductSave = async (itemData: Omit<Item, 'id' | 'costo' | 'costHistory' | 'userId'> & { imageUrl?: string }) => {
        if (productType === 'flower') {
            await setFlowerItems(prevItems => {
                 const baseItem = editingProduct ? prevItems.find(i => i.id === editingProduct.id) : { costHistory: [], userId: user._id };
                 const newItem: FlowerItem = { 
                    ...(baseItem as FlowerItem), ...itemData, id: editingProduct?.id || `f_${Date.now()}`,
                    userId: user._id, imageUrl: itemData.imageUrl || ''
                };
                if (editingProduct) return prevItems.map(i => i.id === editingProduct.id ? newItem : i);
                return [...prevItems, newItem];
            });
        } else {
            await setFixedItems(prevItems => {
                const baseItem = editingProduct ? prevItems.find(i => i.id === editingProduct.id) : { costHistory: [], userId: user._id };
                const newItem: FixedItem = { 
                  ...(baseItem as FixedItem), ...itemData, id: editingProduct?.id || `t_${Date.now()}`, userId: user._id,
                };
                if (editingProduct) return prevItems.map(i => i.id === editingProduct.id ? newItem : i);
                return [...prevItems, newItem];
            });
        }
        setIsProductModalOpen(false);
    };
    const handleProductDelete = async (type: 'flower' | 'fixed') => {
        if (type === 'flower' && selectedFlowerId) {
            await setFlowerItems(prev => prev.filter(item => item.id !== selectedFlowerId));
            setSelectedFlowerId(null);
        } else if (type === 'fixed' && selectedFixedId) {
            await setFixedItems(prev => prev.filter(item => item.id !== selectedFixedId));
            setSelectedFixedId(null);
        }
    };
    const toggleProductVisibility = async (id: string, type: 'flower' | 'fixed') => {
        const itemsSetter = type === 'flower' ? setFlowerItems : setFixedItems;
        await itemsSetter(prevItems => prevItems.map(item => item.id === id ? { ...item, visible: !item.visible } : item));
    };

    // --- RENDER FUNCTIONS ---
    const TabButton: React.FC<{tab: StockPanelTab, label: string}> = ({ tab, label }) => (
      <button 
        onClick={() => setActiveTab(tab)}
        className={`px-4 py-2 text-sm font-semibold rounded-t-lg border-b-2 transition-colors
            ${activeTab === tab 
                ? 'text-purple-300 border-purple-400' 
                : 'text-gray-400 border-transparent hover:text-white hover:border-gray-500'}`}
      >{label}</button>
    );

    const renderKardex = () => {
        const getTypeChip = (type: StockMovementType) => {
            const styles: Record<StockMovementType, string> = {
                compra: 'bg-blue-600 text-white', venta: 'bg-green-600 text-white', merma: 'bg-orange-600 text-white',
                ajuste: 'bg-gray-500 text-white', cancelacion: 'bg-red-700 text-white'
            };
            return <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${styles[type]}`}>{type.toUpperCase()}</span>;
        };
        return(
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-grow overflow-hidden mt-4">
                <div className="lg:col-span-5 flex flex-col h-full">
                    <input type="text" placeholder="Buscar producto..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-purple-500 focus:border-purple-500 block p-2.5 flex-shrink-0"/>
                    <div className="flex-grow overflow-y-auto mt-4 bg-gray-800/50 rounded-lg border border-gray-700">
                        <table className="w-full text-left">
                           <thead className="bg-gray-700/50 text-xs text-gray-300 uppercase sticky top-0">
                                <tr>
                                    <th scope="col" className="px-4 py-3">Producto</th>
                                    <th scope="col" className="px-4 py-3 text-center">Cant.</th>
                                    <th scope="col" className="px-4 py-3 text-center">Estado</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredItems.map(item => (
                                    <tr key={item.itemId} onClick={() => setSelectedItem(item)} className={`border-b border-gray-700 last:border-b-0 transition-colors cursor-pointer ${selectedItem?.itemId === item.itemId ? 'bg-purple-600/30' : 'hover:bg-gray-700/40'}`}>
                                        <td className="px-4 py-3 font-medium text-white">{item.name}</td>
                                        <td className="px-4 py-3 text-center text-white font-bold">{item.quantity}</td>
                                        <td className="px-4 py-3 text-center">{getStatus(item)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
                <div className="lg:col-span-7 bg-gray-800/50 rounded-lg border border-gray-700 flex flex-col h-full overflow-hidden">
                    {!selectedItem ? (
                        <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
                            <ChartLineIcon className="w-16 h-16 text-gray-600 mb-4"/>
                            <h3 className="text-lg font-bold text-gray-400">Selecciona un producto</h3>
                            <p className="text-sm">Elige un item de la lista para ver su Kardex detallado.</p>
                        </div>
                    ) : (
                        <>
                            <div className="p-4 border-b border-gray-700 flex-shrink-0">
                                <h3 className="text-lg font-bold text-amber-300">Kardex: <span className="text-white">{selectedItem.name}</span></h3>
                            </div>
                            <div className="flex-grow overflow-y-auto">
                                {isLoadingHistory ? <div className="text-center p-8 text-gray-400">Cargando historial...</div>
                                 : history.length === 0 ? <div className="text-center p-8 text-gray-500">No hay movimientos registrados.</div>
                                 : (
                                    <table className="w-full text-left">
                                        <thead className="bg-gray-700/50 text-xs text-gray-300 uppercase sticky top-0">
                                            <tr>
                                                <th scope="col" className="px-4 py-3">Fecha</th>
                                                <th scope="col" className="px-4 py-3">Tipo</th>
                                                <th scope="col" className="px-4 py-3 text-center">Cantidad</th>
                                                <th scope="col" className="px-4 py-3 text-center">Stock Resultante</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {history.map(move => (
                                                <tr key={move._id} className="border-b border-gray-700 last:border-b-0">
                                                    <td className="px-4 py-3 text-sm text-gray-300 whitespace-nowrap">{new Date(move.createdAt).toLocaleString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</td>
                                                    <td className="px-4 py-3">{getTypeChip(move.type)}</td>
                                                    <td className={`px-4 py-3 text-center font-bold ${move.quantityChange > 0 ? 'text-green-400' : 'text-red-400'}`}>{move.quantityChange > 0 ? `+${move.quantityChange}` : move.quantityChange}</td>
                                                    <td className="px-4 py-3 text-center font-semibold text-white">{move.quantityAfter}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>
        );
    };
    
    const renderProducts = () => {
         const renderTable = (title: string, items: (Item | FlowerItem)[], selectedId: string | null, setSelectedId: (id: string | null) => void, type: 'flower' | 'fixed') => (
            <div>
              <h3 className="text-lg font-bold mb-3 text-amber-300">{title}</h3>
              <div className="bg-gray-800/50 rounded-lg overflow-hidden border border-gray-700">
                <table className="w-full text-left">
                  <thead className="bg-gray-700/50 text-xs text-gray-300 uppercase"><tr><th scope="col" className="px-4 py-3">Item</th><th scope="col" className="px-4 py-3 text-center">Precio Venta</th><th scope="col" className="px-4 py-3 text-center">Visible</th></tr></thead>
                  <tbody>
                    {items.map((item) => (
                      <tr key={item.id} onClick={() => setSelectedId(item.id === selectedId ? null : item.id)} onDoubleClick={() => openProductModalForEdit(item, type)} className={`border-b border-gray-700 transition-colors cursor-pointer ${selectedId === item.id ? 'bg-purple-600/30' : 'hover:bg-gray-700/40'}`}>
                        <td className="px-4 py-3 font-medium text-white">{item.name}</td>
                        <td className="px-4 py-3 text-center text-white">S/ {item.price}</td>
                        <td className="px-4 py-3 text-center">
                          <button onClick={(e) => { e.stopPropagation(); toggleProductVisibility(item.id, type); }} className="p-1 rounded-full">{item.visible ? <CheckIcon className="w-5 h-5 text-green-400"/> : <XIcon className="w-5 h-5 text-red-400"/>}</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex gap-2 mt-3">
                <button onClick={() => openProductModalForNew(type)} className={`flex items-center gap-2 text-sm font-semibold py-2 px-4 rounded-lg transition-colors ${type === 'flower' ? 'bg-amber-600 hover:bg-amber-500' : 'bg-blue-600 hover:bg-blue-500'} text-white`}><PlusIcon className="w-4 h-4" /> Añadir</button>
                <button onClick={() => handleProductDelete(type)} disabled={!selectedId} className={`flex items-center gap-2 text-sm font-semibold py-2 px-4 rounded-lg transition-colors bg-red-700 hover:bg-red-600 text-white disabled:bg-gray-600 disabled:cursor-not-allowed`}><TrashIcon className="w-4 h-4" /> Eliminar</button>
              </div>
            </div>
        );
        return (
            <div className="space-y-8 mt-4">
                {renderTable('Flores y Follajes', flowerItems, selectedFlowerId, setSelectedFlowerId, 'flower')}
                {renderTable('Artículos Fijos', fixedItems, selectedFixedId, setSelectedFixedId, 'fixed')}
            </div>
        );
    };

    return (
        <div className="flex flex-col h-full">
            <div className="flex justify-between items-center mb-2 flex-shrink-0">
                <h1 className="text-3xl font-bold text-gray-300 tracking-wider">Stock y Catálogo</h1>
                {activeTab === 'kardex' && user.role === 'user' && (
                    <div className="flex gap-2">
                        <button onClick={() => handleOpenStockModal('add')} className="flex items-center gap-2 text-sm font-semibold py-2 px-4 rounded-lg transition-colors bg-blue-600 hover:bg-blue-500 text-white"><PlusIcon className="w-4 h-4" /> Compra</button>
                        <button onClick={() => handleOpenStockModal('remove')} className="flex items-center gap-2 text-sm font-semibold py-2 px-4 rounded-lg transition-colors bg-orange-600 hover:bg-orange-500 text-white"><PlusIcon className="w-4 h-4" /> Merma</button>
                        <button onClick={() => handleOpenStockModal('ajuste')} className="flex items-center gap-2 text-sm font-semibold py-2 px-4 rounded-lg transition-colors bg-gray-600 hover:bg-gray-500 text-white">Ajuste Manual</button>
                    </div>
                )}
            </div>

            <div className="border-b border-gray-700">
                <nav className="-mb-px flex gap-4 flex-wrap">
                    <TabButton tab="kardex" label="Kardex de Inventario" />
                    <TabButton tab="products" label="Gestionar Productos" />
                </nav>
            </div>
            
            {activeTab === 'kardex' ? renderKardex() : renderProducts()}

            <StockModal isOpen={isStockModalOpen} onClose={() => setIsStockModalOpen(false)} onSave={handleSaveChanges} stockItems={stockItems} mode={modalMode}/>
            <Modal isOpen={isProductModalOpen} onClose={() => setIsProductModalOpen(false)} onSave={handleProductSave} item={editingProduct} itemType={productType}/>
        </div>
    );
};

export default StockPanel;