
import React, { useMemo } from 'react';
import type { FinancialSummary, FixedExpense, Order, Item } from '../../types';

interface FinancePanelProps {
    summary: FinancialSummary | null;
    fixedExpenses: FixedExpense[];
    orders: Order[];
    allItems: Item[];
}

const FinancePanel: React.FC<FinancePanelProps> = ({ summary, fixedExpenses, orders, allItems }) => {
    
    const productProfitability = useMemo(() => {
        const productSales: { [key: string]: { totalRevenue: number, totalCost: number } } = {};
        
        orders.forEach(order => {
            order.items.forEach(item => {
                if (!productSales[item.name]) {
                    productSales[item.name] = { totalRevenue: 0, totalCost: 0 };
                }
                productSales[item.name].totalRevenue += item.price * item.quantity;
                productSales[item.name].totalCost += item.unitCost * item.quantity;
            });
        });

        return Object.entries(productSales)
            .map(([name, data]) => {
                const profit = data.totalRevenue - data.totalCost;
                const margin = data.totalRevenue > 0 ? (profit / data.totalRevenue) * 100 : 0;
                return { name, margin, totalRevenue: data.totalRevenue };
            })
            .sort((a, b) => b.totalRevenue - a.totalRevenue) // Sort by most sold
            .slice(0, 5); // Take top 5

    }, [orders, allItems]);


    if (!summary) {
        return <div className="text-center p-8 text-gray-500">Cargando datos financieros...</div>;
    }
    
    return (
        <div>
            <h1 className="text-3xl font-bold text-gray-300 tracking-wider mb-6">Finanzas y Rentabilidad</h1>

            <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700 mb-6">
                <h3 className="font-bold text-lg text-amber-300 mb-4">Resumen Financiero del Mes</h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
                    <div className="p-3 bg-gray-700/50 rounded-lg">
                        <p className="text-sm text-gray-400">Ingresos Totales</p>
                        <p className="text-2xl font-bold text-green-400">S/ {summary.totalRevenue.toFixed(2)}</p>
                    </div>
                    <div className="p-3 bg-gray-700/50 rounded-lg">
                        <p className="text-sm text-gray-400">Costo de Mercadería</p>
                        <p className="text-2xl font-bold text-orange-400">S/ {summary.totalCostOfGoods.toFixed(2)}</p>
                    </div>
                     <div className="p-3 bg-gray-700/50 rounded-lg">
                        <p className="text-sm text-gray-400">Pérdida por Merma</p>
                        <p className="text-2xl font-bold text-red-400">S/ {summary.wastedGoodsCost.toFixed(2)}</p>
                    </div>
                    <div className="p-3 bg-gray-700/50 rounded-lg">
                        <p className="text-sm text-gray-400">Gastos Fijos</p>
                        <p className="text-2xl font-bold text-yellow-400">S/ {summary.fixedExpenses.toFixed(2)}</p>
                    </div>
                    <div className="p-3 bg-cyan-600/30 rounded-lg border border-cyan-500">
                        <p className="text-sm text-cyan-200">Ganancia Neta</p>
                        <p className="text-2xl font-bold text-white">S/ {summary.netProfit.toFixed(2)}</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700">
                    <h3 className="font-bold text-lg text-amber-300 mb-4">Rentabilidad por Producto (Top 5)</h3>
                    <div className="space-y-2">
                        {productProfitability.map(p => (
                            <div key={p.name} className="flex items-center justify-between">
                                <span className="font-medium text-white">{p.name}</span>
                                <div className="flex items-center gap-2">
                                    <div className="w-48 bg-gray-700 rounded-full h-2.5">
                                        <div className="bg-teal-500 h-2.5 rounded-full" style={{ width: `${Math.max(0, p.margin)}%` }}></div>
                                    </div>
                                    <span className={`font-bold ${p.margin >= 0 ? 'text-teal-400' : 'text-red-400'}`}>{p.margin.toFixed(1)}%</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700">
                     <h3 className="font-bold text-lg text-amber-300 mb-4">Desglose de Gastos Fijos</h3>
                     <ul className="space-y-2">
                        {fixedExpenses.map(e => (
                             <li key={e._id} className="flex justify-between items-center text-sm">
                                <span className="text-gray-300">{e.name}</span>
                                <span className="font-semibold text-white">S/ {e.amount.toFixed(2)}</span>
                            </li>
                        ))}
                     </ul>
                </div>
            </div>
        </div>
    );
};

export default FinancePanel;
