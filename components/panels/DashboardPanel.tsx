
import React from 'react';
import { BanknotesIcon } from '../icons/BanknotesIcon';
import { ChartBarIcon } from '../icons/ChartBarIcon';
import { ClipboardListIcon } from '../icons/ClipboardListIcon';
import { TrashIcon } from '../icons/TrashIcon';

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
        <h3 className="font-bold text-lg text-amber-300 mb-4">Ventas vs Costos (Últimos 6 meses)</h3>
        <div className="flex justify-around items-end h-48 space-x-2">
            {/* Mock data for chart */}
            {[ {sales: 60, cost: 30}, {sales: 80, cost: 40}, {sales: 70, cost: 35}, {sales: 90, cost: 50}, {sales: 110, cost: 60}, {sales: 130, cost: 70}].map((month, i) => (
                <div key={i} className="flex-1 flex flex-col justify-end items-center gap-1">
                    <div className="w-full flex justify-center items-end gap-1">
                       <div className="bg-green-500 rounded-t-md w-1/2" style={{ height: `${month.sales}px` }} title={`Ventas: S/ ${month.sales*100}`}></div>
                       <div className="bg-orange-500 rounded-t-md w-1/2" style={{ height: `${month.cost}px` }} title={`Costos: S/ ${month.cost*100}`}></div>
                    </div>
                    <span className="text-xs text-gray-400">Mes {i + 1}</span>
                </div>
            ))}
        </div>
    </div>
);


const DashboardPanel: React.FC = () => {
    // Datos de ejemplo
    const topProducts = [
        { name: 'Rosas', sold: 120 },
        { name: 'Ramo Coreano', sold: 85 },
        { name: 'Girasoles', sold: 70 },
        { name: 'Box', sold: 65 },
        { name: 'Tulipanes', sold: 50 },
    ];
    
    return (
        <div>
            <h1 className="text-3xl font-bold text-gray-300 tracking-wider">Dashboard</h1>
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                <StatCard title="Ventas del Mes" value="S/ 12,500" icon={<BanknotesIcon className="w-6 h-6 text-white"/>} color="bg-green-500/80" />
                <StatCard title="Ganancia Neta" value="S/ 4,800" icon={<ChartBarIcon className="w-6 h-6 text-white"/>} color="bg-cyan-500/80" />
                <StatCard title="Pedidos Nuevos" value="82" icon={<ClipboardListIcon className="w-6 h-6 text-white"/>} color="bg-purple-500/80" />
                <StatCard title="Tasa de Merma" value="8.5%" icon={<TrashIcon className="w-6 h-6 text-white"/>} color="bg-red-500/80" />
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
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default DashboardPanel;
