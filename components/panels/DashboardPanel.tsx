
import React, { useMemo } from 'react';
import type { FinancialSummary, Order, Item } from '../../types';
import { BanknotesIcon } from '../icons/BanknotesIcon';
import { ChartBarIcon } from '../icons/ChartBarIcon';
import { ClipboardListIcon } from '../icons/ClipboardListIcon';
import { TrashIcon } from '../icons/TrashIcon';

interface DashboardPanelProps {
    orders: Order[];
    financialSummary: FinancialSummary | null;
    allItems: Item[];
}

const StatCard: React.FC<{ title: string, value: string, icon: React.ReactNode, color: string }> = ({ title, value, icon, color }) => (
    <div className="bg-gray-800/50 p-4 rounded-xl flex items-center gap-4 border border-gray-700">
        <div className={`p-3 rounded-full ${color}`}>
            {icon}
        </div>
        <div>
            <p className="text-sm text-gray-400 font-medium">{title}</p>
            <p className="text-2xl font-bold text-white">{value}</p>
        </div>
    </div>
);

const SalesChart = () => (
    <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700">
        <h3 className="font-bold text-lg text-amber-300 mb-4">Ventas vs Costos (Próximamente)</h3>
        <div className="flex justify-around items-end h-48 space-x-2">
           <div className="flex w-full h-full items-center justify-center text-gray-500">
                Gráfico en desarrollo
           </div>
        </div>
    </div>
);


const DashboardPanel: React.FC<DashboardPanelProps> = ({ orders, financialSummary, allItems }) => {

    const topProducts = useMemo(() => {
        const productCount: { [key: string]: number } = {};
        orders.forEach(order => {
            order.items.forEach(item => {
                productCount[item.name] = (productCount[item.name] || 0) + item.quantity;
            });
        });

        return Object.entries(productCount)
            .sort(([, countA], [, countB]) => countB - countA)
            .slice(0, 5)
            .map(([name, sold]) => ({ name, sold }));
    }, [orders]);
    
    return (
        <div>
            <h1 className="text-3xl font-bold text-gray-300 tracking-wider">Dashboard</h1>
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                <StatCard title="Ventas del Mes" value={`S/ ${financialSummary?.totalRevenue.toFixed(2) || '0.00'}`} icon={<BanknotesIcon className="w-6 h-6 text-white"/>} color="bg-green-500/80" />
                <StatCard title="Ganancia Neta" value={`S/ ${financialSummary?.netProfit.toFixed(2) || '0.00'}`} icon={<ChartBarIcon className="w-6 h-6 text-white"/>} color="bg-cyan-500/80" />
                <StatCard title="Pedidos del Mes" value={orders.length.toString()} icon={<ClipboardListIcon className="w-6 h-6 text-white"/>} color="bg-purple-500/80" />
                <StatCard title="Costo por Merma" value={`S/ ${financialSummary?.wastedGoodsCost.toFixed(2) || '0.00'}`} icon={<TrashIcon className="w-6 h-6 text-white"/>} color="bg-red-500/80" />
            </div>
            <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <SalesChart />
                </div>
                <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700">
                    <h3 className="font-bold text-lg text-amber-300 mb-4">Productos Más Vendidos</h3>
                    <ul className="space-y-3">
                        {topProducts.map(product => (
                            <li key={product.name} className="flex justify-between items-center text-sm">
                                <span className="font-medium text-white">{product.name}</span>
                                <span className="font-bold text-gray-300 bg-gray-700 px-2 py-0.5 rounded-md">{product.sold} uds</span>
                            </li>
                        ))}
                         {topProducts.length === 0 && (
                            <li className="text-center text-gray-500 pt-8">No hay datos de ventas.</li>
                        )}
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default DashboardPanel;
