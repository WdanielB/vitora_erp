
import React, { useState, useMemo } from 'react';
import type { FinancialSummary, FixedExpense, Order, Item, User, FlowerItem, FixedItem } from '../../types.ts';
import * as api from '../../services/api.ts';
import FixedExpenseModal from '../FixedExpenseModal.tsx';
import CostModal from '../CostModal.tsx';
import CostChart from '../CostChart.tsx';
import { PlusIcon } from '../icons/PlusIcon.tsx';
import { PencilIcon } from '../icons/PencilIcon.tsx';
import { TrashIcon } from '../icons/TrashIcon.tsx';
import { ChartLineIcon } from '../icons/ChartLineIcon.tsx';

interface FinancePanelProps {
    summary: FinancialSummary | null;
    fixedExpenses: FixedExpense[];
    orders: Order[];
    user: User;
    onDataNeedsRefresh: () => void;
    flowerItems: FlowerItem[];
    setFlowerItems: (updater: FlowerItem[] | ((prev: FlowerItem[]) => FlowerItem[])) => Promise<void>;
    fixedItems: FixedItem[];
    setFixedItems: (updater: FixedItem[] | ((prev: FixedItem[]) => FixedItem[])) => Promise<void>;
}

type FinancePanelTab = 'summary' | 'costs' | 'history';

const FinancePanel: React.FC<FinancePanelProps> = ({ summary, fixedExpenses, orders, user, onDataNeedsRefresh, flowerItems, setFlowerItems, fixedItems, setFixedItems }) => {
    const [activeTab, setActiveTab] = useState<FinancePanelTab>('summary');

    // State for Fixed Expenses
    const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
    const [editingExpense, setEditingExpense] = useState<FixedExpense | null>(null);

    // State for Costs
    const [isCostModalOpen, setIsCostModalOpen] = useState(false);
    const [editingCostItem, setEditingCostItem] = useState<Item | FlowerItem | null>(null);
    const [costItemType, setCostItemType] = useState<'flower' | 'fixed' | null>(null);

    // State for History
    const allItemsForHistory = useMemo(() => [
        ...flowerItems.map(item => ({ ...item, type: 'flower' as const })),
        ...fixedItems.map(item => ({ ...item, type: 'fixed' as const }))
    ], [flowerItems, fixedItems]);
    const [selectedHistoryItemId, setSelectedHistoryItemId] = useState<string | null>(allItemsForHistory.length > 0 ? allItemsForHistory[0].id : null);
    const selectedHistoryItem = useMemo(() => {
        if (!selectedHistoryItemId) return null;
        return allItemsForHistory.find(item => item.id === selectedHistoryItemId) || null;
    }, [allItemsForHistory, selectedHistoryItemId]);


    const handleOpenExpenseModalForNew = () => { setEditingExpense(null); setIsExpenseModalOpen(true); };
    const handleOpenExpenseModalForEdit = (expense: FixedExpense) => { setEditingExpense(expense); setIsExpenseModalOpen(true); };
    const handleSaveExpense = async (expenseData: Omit<FixedExpense, '_id'> | FixedExpense) => {
        try {
            if ('_id' in expenseData) await api.updateFixedExpense(expenseData, user._id);
            else await api.createFixedExpense(expenseData, user._id);
            onDataNeedsRefresh();
        } catch (error) { console.error("Failed to save expense:", error); }
        setIsExpenseModalOpen(false);
    };
    const handleDeleteExpense = async (expenseId: string) => {
        if (window.confirm("¿Confirmas la eliminación de este gasto fijo?")) {
            try { await api.deleteFixedExpense(expenseId, user._id); onDataNeedsRefresh(); } 
            catch (error) { console.error("Failed to delete expense:", error); }
        }
    };
    
    // --- Cost Management Logic ---
    const openCostModalForEdit = (item: Item | FlowerItem, type: 'flower' | 'fixed') => {
        setCostItemType(type);
        setEditingCostItem(item);
        setIsCostModalOpen(true);
    };
    const handleCostSave = async (itemData: Partial<FlowerItem & FixedItem>) => {
        const newItemData = { ...itemData, costHistory: [...(editingCostItem?.costHistory || [])] };
        const date = new Date().toISOString();
        if (costItemType === 'flower' && editingCostItem) {
            if(itemData.costoPaquete !== (editingCostItem as FlowerItem).costoPaquete) {
                newItemData.costHistory.push({ date, costoPaquete: itemData.costoPaquete });
            }
            await setFlowerItems(prevItems => prevItems.map(i => i.id === editingCostItem.id ? { ...i, ...newItemData } : i));
        } else if (costItemType === 'fixed' && editingCostItem) {
            if(itemData.costo !== editingCostItem.costo) {
                newItemData.costHistory.push({ date, costo: itemData.costo });
            }
            await setFixedItems(prevItems => prevItems.map(i => i.id === editingCostItem.id ? { ...i, ...newItemData } : i));
        }
        setIsCostModalOpen(false);
    };
    const calculateUnitCost = (item: FlowerItem): string => {
        const { costoPaquete = 0, cantidadPorPaquete = 0, merma = 0 } = item;
        if (!costoPaquete || !cantidadPorPaquete) return 'N/A';
        const effectiveQuantity = cantidadPorPaquete - merma;
        if (effectiveQuantity <= 0) return 'Error';
        return (costoPaquete / effectiveQuantity).toFixed(2);
    };

    // --- RENDER FUNCTIONS ---
    const TabButton: React.FC<{tab: FinancePanelTab, label: string}> = ({ tab, label }) => (
        <button onClick={() => setActiveTab(tab)} className={`px-4 py-2 text-sm font-semibold rounded-t-lg border-b-2 transition-colors ${activeTab === tab ? 'text-purple-300 border-purple-400' : 'text-gray-400 border-transparent hover:text-white hover:border-gray-500'}`}>{label}</button>
    );

    const renderSummary = () => {
        const productProfitability = useMemo(() => {
            const productSales: { [key: string]: { totalRevenue: number, totalCost: number } } = {};
            orders.forEach(order => {
                 if (order.status === 'cancelado') return;
                order.items.forEach(item => {
                    if (!productSales[item.name]) productSales[item.name] = { totalRevenue: 0, totalCost: 0 };
                    productSales[item.name].totalRevenue += item.price * item.quantity;
                    productSales[item.name].totalCost += item.unitCost * item.quantity;
                });
            });
            return Object.entries(productSales).map(([name, data]) => ({ name, margin: data.totalRevenue > 0 ? ((data.totalRevenue - data.totalCost) / data.totalRevenue) * 100 : 0, totalRevenue: data.totalRevenue })).sort((a, b) => b.totalRevenue - a.totalRevenue).slice(0, 5);
        }, [orders]);

        if (!summary) return <div className="text-center p-8 text-gray-500">Cargando datos financieros...</div>;
        
        return (
            <div className="mt-4">
                <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700 mb-6">
                    <h3 className="font-bold text-lg text-amber-300 mb-4">Resumen Financiero del Mes</h3>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
                        <div className="p-3 bg-gray-700/50 rounded-lg"><p className="text-sm text-gray-400">Ingresos Totales</p><p className="text-2xl font-bold text-green-400">S/ {summary.totalRevenue.toFixed(2)}</p></div>
                        <div className="p-3 bg-gray-700/50 rounded-lg"><p className="text-sm text-gray-400">Costo de Mercadería</p><p className="text-2xl font-bold text-orange-400">S/ {summary.totalCostOfGoods.toFixed(2)}</p></div>
                        <div className="p-3 bg-gray-700/50 rounded-lg"><p className="text-sm text-gray-400">Pérdida por Merma</p><p className="text-2xl font-bold text-red-400">S/ {summary.wastedGoodsCost.toFixed(2)}</p></div>
                        <div className="p-3 bg-gray-700/50 rounded-lg"><p className="text-sm text-gray-400">Gastos Fijos</p><p className="text-2xl font-bold text-yellow-400">S/ {summary.fixedExpenses.toFixed(2)}</p></div>
                        <div className="p-3 bg-cyan-600/30 rounded-lg border border-cyan-500"><p className="text-sm text-cyan-200">Ganancia Neta</p><p className="text-2xl font-bold text-white">S/ {summary.netProfit.toFixed(2)}</p></div>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700">
                        <h3 className="font-bold text-lg text-amber-300 mb-4">Rentabilidad por Producto (Top 5)</h3>
                        <div className="space-y-2">{productProfitability.map(p => (<div key={p.name} className="flex items-center justify-between"><span className="font-medium text-white">{p.name}</span><div className="flex items-center gap-2"><div className="w-48 bg-gray-700 rounded-full h-2.5"><div className="bg-teal-500 h-2.5 rounded-full" style={{ width: `${Math.max(0, p.margin)}%` }}></div></div><span className={`font-bold ${p.margin >= 0 ? 'text-teal-400' : 'text-red-400'}`}>{p.margin.toFixed(1)}%</span></div></div>))}</div>
                    </div>
                    <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700">
                         <div className="flex justify-between items-center mb-4"><h3 className="font-bold text-lg text-amber-300">Desglose de Gastos Fijos</h3><button onClick={handleOpenExpenseModalForNew} className="flex items-center gap-1 text-sm font-semibold py-1 px-2 rounded-lg transition-colors bg-purple-600 hover:bg-purple-500 text-white"><PlusIcon className="w-4 h-4" /> Añadir</button></div>
                         <ul className="space-y-2">{fixedExpenses.map(e => (<li key={e._id} className="flex justify-between items-center text-sm group hover:bg-gray-700/50 p-1 rounded-md"><div><span className="text-gray-300">{e.name}</span></div><div className="flex items-center gap-3"><span className="font-semibold text-white">S/ {e.amount.toFixed(2)}</span><div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-2"><button onClick={() => handleOpenExpenseModalForEdit(e)}><PencilIcon className="w-4 h-4 text-gray-400 hover:text-white"/></button><button onClick={() => handleDeleteExpense(e._id!)}><TrashIcon className="w-4 h-4 text-gray-400 hover:text-red-500"/></button></div></div></li>))}</ul>
                    </div>
                </div>
            </div>
        );
    };

    const renderCosts = () => (
        <div className="space-y-8 mt-4">
           <div>
               <h3 className="text-lg font-bold mb-3 text-amber-300">Costos de Flores y Follajes</h3>
               <div className="bg-gray-800/50 rounded-lg overflow-hidden border border-gray-700">
               <table className="w-full text-left">
                   <thead className="bg-gray-700/50 text-xs text-gray-300 uppercase"><tr><th scope="col" className="px-4 py-3">Item</th><th scope="col" className="px-4 py-3 text-center">Costo Paquete</th><th scope="col" className="px-4 py-3 text-center">Cant. Paquete</th><th scope="col" className="px-4 py-3 text-center">Merma (uds)</th><th scope="col" className="px-4 py-3 text-center">Costo Unitario</th></tr></thead>
                   <tbody>{flowerItems.map((item) => (<tr key={item.id} onDoubleClick={() => openCostModalForEdit(item, 'flower')} className="border-b border-gray-700 transition-colors cursor-pointer hover:bg-gray-700/40"><td className="px-4 py-3 font-medium text-white">{item.name}</td><td className="px-4 py-3 text-center text-white">S/ {item.costoPaquete || 0}</td><td className="px-4 py-3 text-center text-white">{item.cantidadPorPaquete || 0}</td><td className="px-4 py-3 text-center text-white">{item.merma || 0}</td><td className="px-4 py-3 text-center font-bold text-white">S/ {calculateUnitCost(item)}</td></tr>))}</tbody>
               </table>
               </div>
               <p className="text-xs text-gray-500 mt-2">Haz doble click en una fila para editar sus valores de costo.</p>
           </div>
           <div>
               <h3 className="text-lg font-bold mb-3 text-amber-300">Costos de Artículos Fijos</h3>
               <div className="bg-gray-800/50 rounded-lg overflow-hidden border border-gray-700">
               <table className="w-full text-left">
                   <thead className="bg-gray-700/50 text-xs text-gray-300 uppercase"><tr><th scope="col" className="px-4 py-3">Item</th><th scope="col" className="px-4 py-3 text-center">Costo</th></tr></thead>
                   <tbody>{fixedItems.map((item) => (<tr key={item.id} onDoubleClick={() => openCostModalForEdit(item, 'fixed')} className="border-b border-gray-700 transition-colors cursor-pointer hover:bg-gray-700/40"><td className="px-4 py-3 font-medium text-white">{item.name}</td><td className="px-4 py-3 text-center font-bold text-white">S/ {item.costo || 0}</td></tr>))}</tbody>
               </table>
               </div>
               <p className="text-xs text-gray-500 mt-2">Haz doble click en una fila para editar su costo.</p>
           </div>
       </div>
    );

    const renderHistory = () => (
        <div className="flex flex-col md:flex-row gap-6 mt-4">
           <div className="md:w-1/3"><label htmlFor="item-select" className="block mb-2 text-sm font-medium text-gray-400">Seleccionar Item</label><select id="item-select" value={selectedHistoryItemId || ''} onChange={(e) => setSelectedHistoryItemId(e.target.value)} className="bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-purple-500 focus:border-purple-500 block w-full p-2.5"><option value="" disabled>-- Elige un item --</option>{allItemsForHistory.map(item => (<option key={item.id} value={item.id}>{item.name}</option>))}</select></div>
           <div className="md:w-2/3">
             {selectedHistoryItem ? (
               <div className="flex flex-col gap-6">
                 <div><h3 className="text-lg font-bold mb-3 text-amber-300">Evolución de Costo para: {selectedHistoryItem.name}</h3><CostChart data={selectedHistoryItem.costHistory || []} itemType={selectedHistoryItem.type}/></div>
                 <div><h3 className="text-lg font-bold mb-3 text-amber-300">Registros de Cambios</h3>
                   <div className="bg-gray-800/50 rounded-lg overflow-hidden border border-gray-700 max-h-60 overflow-y-auto"><table className="w-full text-left"><thead className="bg-gray-700/50 text-xs text-gray-300 uppercase sticky top-0"><tr><th scope="col" className="px-4 py-3">Fecha de Registro</th><th scope="col" className="px-4 py-3 text-center">{selectedHistoryItem.type === 'flower' ? 'Costo Paquete' : 'Costo Item'}</th></tr></thead>
                       <tbody>{(!selectedHistoryItem.costHistory || selectedHistoryItem.costHistory.length === 0) ? (<tr><td colSpan={2} className="text-center text-gray-500 p-4">No hay historial de costos.</td></tr>) : ([...(selectedHistoryItem.costHistory || [])].reverse().map((entry, index) => (<tr key={index} className="border-b border-gray-700 last:border-b-0"><td className="px-4 py-3 font-medium text-white">{new Date(entry.date).toLocaleString('es-ES', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</td><td className="px-4 py-3 text-center font-semibold text-white">S/ {(selectedHistoryItem.type === 'flower' ? entry.costoPaquete : entry.costo)?.toFixed(2) || 'N/A'}</td></tr>)))}</tbody>
                   </table></div>
                 </div>
               </div>
             ) : ( <div className="flex flex-col items-center justify-center h-full min-h-[300px] bg-gray-800/50 rounded-lg border border-gray-700 p-8 text-center"><ChartLineIcon className="w-16 h-16 text-gray-600 mb-4"/><h3 className="text-lg font-bold text-gray-400">Selecciona un item</h3><p className="text-sm text-gray-500">Elige un item de la lista para ver su historial.</p></div>)}
           </div>
         </div>
     );

    return (
        <div className="flex flex-col h-full">
            <h1 className="text-3xl font-bold text-gray-300 tracking-wider flex-shrink-0">Finanzas y Rentabilidad</h1>
            <div className="border-b border-gray-700 mt-4">
                <nav className="-mb-px flex gap-4 flex-wrap">
                    <TabButton tab="summary" label="Resumen Financiero" />
                    <TabButton tab="costs" label="Gestionar Costos" />
                    <TabButton tab="history" label="Historial de Costos" />
                </nav>
            </div>
            
            <div className="flex-grow overflow-y-auto pt-4">
              {activeTab === 'summary' && renderSummary()}
              {activeTab === 'costs' && renderCosts()}
              {activeTab === 'history' && renderHistory()}
            </div>

            <FixedExpenseModal isOpen={isExpenseModalOpen} onClose={() => setIsExpenseModalOpen(false)} onSave={handleSaveExpense} expense={editingExpense} userId={user._id}/>
            <CostModal isOpen={isCostModalOpen} onClose={() => setIsCostModalOpen(false)} onSave={handleCostSave} item={editingCostItem} itemType={costItemType} />
        </div>
    );
};

export default FinancePanel;