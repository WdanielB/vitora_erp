
import React, { useState, useMemo, useEffect } from 'react';
import type { FinancialSummary, FixedExpense, Order, User, FlowerItem, ProductItem, PriceRecord } from '../../types.ts';
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
    productItems: ProductItem[];
    setProductItems: (updater: ProductItem[] | ((prev: ProductItem[]) => ProductItem[])) => Promise<void>;
}

type FinancePanelTab = 'summary' | 'costs' | 'history';

const FinancePanel: React.FC<FinancePanelProps> = ({ summary, fixedExpenses, orders, user, onDataNeedsRefresh, flowerItems, setFlowerItems, productItems, setProductItems }) => {
    const [activeTab, setActiveTab] = useState<FinancePanelTab>('summary');
    const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
    const [editingExpense, setEditingExpense] = useState<FixedExpense | null>(null);
    const [isCostModalOpen, setIsCostModalOpen] = useState(false);
    const [editingCostItem, setEditingCostItem] = useState<FlowerItem | ProductItem | null>(null);
    const [costItemType, setCostItemType] = useState<'flower' | 'product' | null>(null);
    
    const [priceRecords, setPriceRecords] = useState<PriceRecord[]>([]);
    const [selectedHistoryItemId, setSelectedHistoryItemId] = useState<string | null>(null);

    useEffect(() => {
        if (activeTab === 'history') {
            api.fetchRecordPrices(user).then(setPriceRecords).catch(console.error);
        }
    }, [activeTab, user]);

    const allItemsForHistory = useMemo(() => [...flowerItems, ...productItems], [flowerItems, productItems]);
    
    const chartData = useMemo(() => {
        if (!selectedHistoryItemId) return [];
        return priceRecords
            .filter(r => r.itemId === selectedHistoryItemId)
            .map(r => ({ date: r.date, costo: r.price, costoPaquete: r.price })) // Adapt generic record to chart format
            .sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }, [priceRecords, selectedHistoryItemId]);

    const productProfitability = useMemo(() => {
        const productSales: { [key: string]: { revenue: number, cost: number } } = {};
        orders.filter(o => o.status !== 'cancelado').forEach(order => {
            order.items.forEach(item => {
                if (!productSales[item.name]) productSales[item.name] = { revenue: 0, cost: 0 };
                productSales[item.name].revenue += item.price * item.quantity;
                productSales[item.name].cost += item.unitCost * item.quantity;
            });
        });
        return Object.entries(productSales).map(([name, data]) => ({
            name, margin: data.revenue > 0 ? ((data.revenue - data.cost) / data.revenue) * 100 : 0
        })).sort((a, b) => b.margin - a.margin).slice(0, 5);
    }, [orders]);

    const handleSaveExpense = async (data: any) => {
        if ('_id' in data) await api.updateFixedExpense(data, user._id); else await api.createFixedExpense(data, user._id);
        onDataNeedsRefresh(); setIsExpenseModalOpen(false);
    };

    const handleCostSave = async (itemData: any) => {
        if (costItemType === 'flower') {
            await setFlowerItems(prev => prev.map(i => i.id === editingCostItem?.id ? { ...i, ...itemData } : i));
        } else {
            await setProductItems(prev => prev.map(i => i.id === editingCostItem?.id ? { ...i, ...itemData } : i));
        }
        setIsCostModalOpen(false);
    };

    const renderHistory = () => (
        <div className="flex flex-col md:flex-row gap-6 mt-4">
             <div className="md:w-1/3">
                <label className="text-sm text-gray-400 block mb-2">Item</label>
                <select className="w-full bg-gray-700 text-white p-2 rounded" onChange={e => setSelectedHistoryItemId(e.target.value)}>
                    <option value="">Seleccionar</option>
                    {allItemsForHistory.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                </select>
             </div>
             <div className="md:w-2/3">
                {selectedHistoryItemId && <CostChart data={chartData} itemType="fixed" />} 
             </div>
        </div>
    );

    const renderCosts = () => (
        <div className="space-y-8 mt-4">
             <div><h3 className="text-lg font-bold text-amber-300 mb-2">Flores (Paquetes)</h3>
                 <div className="bg-gray-800/50 rounded-lg border border-gray-700 overflow-hidden"><table className="w-full text-left text-sm"><thead className="bg-gray-700/50 uppercase text-xs text-gray-300"><tr><th className="px-4 py-3">Nombre</th><th className="px-4 py-3">Costo Paq.</th><th className="px-4 py-3">Cant.</th><th className="px-4 py-3">Merma</th><th className="px-4 py-3">Costo Unit.</th></tr></thead><tbody>{flowerItems.map(i => (<tr key={i.id} onDoubleClick={() => {setCostItemType('flower'); setEditingCostItem(i); setIsCostModalOpen(true);}} className="hover:bg-gray-700/50 cursor-pointer border-b border-gray-700"><td className="px-4 py-2">{i.name}</td><td className="px-4 py-2">S/ {i.costoPaquete}</td><td className="px-4 py-2">{i.cantidadPorPaquete}</td><td className="px-4 py-2">{i.merma}</td><td className="px-4 py-2 font-bold">S/ {((i.costoPaquete||0)/((i.cantidadPorPaquete||1)-(i.merma||0))).toFixed(2)}</td></tr>))}</tbody></table></div>
             </div>
             <div><h3 className="text-lg font-bold text-amber-300 mb-2">Productos (Unidad)</h3>
                 <div className="bg-gray-800/50 rounded-lg border border-gray-700 overflow-hidden"><table className="w-full text-left text-sm"><thead className="bg-gray-700/50 uppercase text-xs text-gray-300"><tr><th className="px-4 py-3">Nombre</th><th className="px-4 py-3">Costo Unitario</th></tr></thead><tbody>{productItems.map(i => (<tr key={i.id} onDoubleClick={() => {setCostItemType('product'); setEditingCostItem(i); setIsCostModalOpen(true);}} className="hover:bg-gray-700/50 cursor-pointer border-b border-gray-700"><td className="px-4 py-2">{i.name}</td><td className="px-4 py-2 font-bold">S/ {i.costo}</td></tr>))}</tbody></table></div>
             </div>
        </div>
    );

    return (
        <div className="flex flex-col h-full">
            <h1 className="text-3xl font-bold text-gray-300">Finanzas</h1>
            <div className="border-b border-gray-700 mt-4"><nav className="-mb-px flex gap-4"><button onClick={() => setActiveTab('summary')} className={`px-4 py-2 text-sm font-bold border-b-2 ${activeTab === 'summary' ? 'border-purple-400 text-purple-300' : 'border-transparent text-gray-400'}`}>Resumen</button><button onClick={() => setActiveTab('costs')} className={`px-4 py-2 text-sm font-bold border-b-2 ${activeTab === 'costs' ? 'border-purple-400 text-purple-300' : 'border-transparent text-gray-400'}`}>Gestionar Costos</button><button onClick={() => setActiveTab('history')} className={`px-4 py-2 text-sm font-bold border-b-2 ${activeTab === 'history' ? 'border-purple-400 text-purple-300' : 'border-transparent text-gray-400'}`}>Historial</button></nav></div>
            <div className="flex-grow overflow-y-auto pt-4">
                {activeTab === 'summary' && summary && (
                    <div className="grid grid-cols-4 gap-4 text-center mb-6">
                        <div className="bg-gray-800 p-4 rounded"><p className="text-gray-400 text-sm">Ingresos</p><p className="text-2xl font-bold text-green-400">S/ {summary.totalRevenue.toFixed(2)}</p></div>
                        <div className="bg-gray-800 p-4 rounded"><p className="text-gray-400 text-sm">Gastos Fijos</p><p className="text-2xl font-bold text-yellow-400">S/ {summary.fixedExpenses.toFixed(2)}</p></div>
                         <div className="bg-gray-800 p-4 rounded"><p className="text-gray-400 text-sm">Costos Prod.</p><p className="text-2xl font-bold text-orange-400">S/ {summary.totalCostOfGoods.toFixed(2)}</p></div>
                        <div className="bg-gray-800 p-4 rounded border border-cyan-600"><p className="text-gray-400 text-sm">Ganancia Neta</p><p className="text-2xl font-bold text-white">S/ {summary.netProfit.toFixed(2)}</p></div>
                    </div>
                )}
                {activeTab === 'costs' && renderCosts()}
                {activeTab === 'history' && renderHistory()}
            </div>
            <CostModal isOpen={isCostModalOpen} onClose={() => setIsCostModalOpen(false)} onSave={handleCostSave} item={editingCostItem} itemType={costItemType === 'flower' ? 'flower' : 'fixed'} />
        </div>
    );
};
export default FinancePanel;
