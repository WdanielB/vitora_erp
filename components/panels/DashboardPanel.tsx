
import React, { useMemo } from 'react';
import type { FinancialSummary, Order, StockItem, User } from '../../types.ts';
import { BanknotesIcon } from '../icons/BanknotesIcon.tsx';
import { ChartBarIcon } from '../icons/ChartBarIcon.tsx';
import { ClipboardListIcon } from '../icons/ClipboardListIcon.tsx';
import { BellAlertIcon } from '../icons/BellAlertIcon.tsx';
import { TruckIcon } from '../icons/TruckIcon.tsx';
import { UserCircleIcon } from '../icons/UserCircleIcon.tsx';
import { EyeIcon } from '../icons/EyeIcon.tsx';


interface DashboardPanelProps {
    orders: Order[];
    financialSummary: FinancialSummary | null;
    stockItems: StockItem[];
    user?: User;
    allUsers?: User[];
    onSelectUser?: (id: string) => void;
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

const DashboardPanel: React.FC<DashboardPanelProps> = ({ orders, financialSummary, stockItems, user, allUsers, onSelectUser }) => {

    const topProducts = useMemo(() => {
        const productCount: { [key: string]: { quantity: number; revenue: number } } = {};
        orders.forEach(order => {
             if (order.status === 'cancelado') return;
            order.items.forEach(item => {
                if (!productCount[item.name]) {
                    productCount[item.name] = { quantity: 0, revenue: 0 };
                }
                productCount[item.name].quantity += item.quantity;
                productCount[item.name].revenue += item.quantity * item.price;
            });
        });

        return Object.entries(productCount)
            .sort(([, a], [, b]) => b.revenue - a.revenue)
            .slice(0, 5)
            .map(([name, data]) => ({ name, sold: data.quantity }));
    }, [orders]);
    
     const criticalStockItems = useMemo(() => {
        return stockItems
            .filter(item => item.quantity <= item.criticalStock && item.quantity > 0)
            .sort((a, b) => a.quantity - b.quantity);
    }, [stockItems]);

    const upcomingDeliveries = useMemo(() => {
        const now = new Date();
        const next7Days = new Date();
        next7Days.setDate(now.getDate() + 7);

        return orders
            .filter(order => {
                const deliveryDate = new Date(order.deliveryDate);
                return deliveryDate >= now && deliveryDate <= next7Days && order.status !== 'entregado' && order.status !== 'cancelado';
            })
            .sort((a, b) => new Date(a.deliveryDate).getTime() - new Date(b.deliveryDate).getTime());
    }, [orders]);
    
    const isAdmin = user?.role === 'admin';

    // Client Summary for Admin Table
    const clientsSummary = useMemo(() => {
        if (!isAdmin || !allUsers) return [];
        
        return allUsers
            .filter(u => u.role === 'user')
            .map(client => {
                // Calculate metrics for this specific client based on global orders (assuming global orders are loaded for admin)
                const clientOrders = orders.filter(o => o.userId === client._id && o.status !== 'cancelado');
                const totalSales = clientOrders.reduce((acc, o) => acc + o.total, 0);
                const ordersCount = clientOrders.length;
                
                return {
                    ...client,
                    totalSales,
                    ordersCount
                };
            });
    }, [isAdmin, allUsers, orders]);

    return (
        <div>
            <h1 className="text-3xl font-bold text-gray-300 tracking-wider">
                {isAdmin ? 'Dashboard Administrativo' : 'Panel Operativo'}
            </h1>
            
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                {/* VISTA ADMIN: Enfasis Financiero Global */}
                {isAdmin && (
                    <>
                        <StatCard title="Ingresos Globales" value={`S/ ${financialSummary?.totalRevenue.toFixed(2) || '0.00'}`} icon={<BanknotesIcon className="w-6 h-6 text-white"/>} color="bg-green-600/80" />
                        <StatCard title="Ganancia Neta Global" value={`S/ ${financialSummary?.netProfit.toFixed(2) || '0.00'}`} icon={<ChartBarIcon className="w-6 h-6 text-white"/>} color="bg-cyan-600/80" />
                        <StatCard title="Clientes Activos" value={clientsSummary.length.toString()} icon={<UserCircleIcon className="w-6 h-6 text-white"/>} color="bg-indigo-600/80" />
                    </>
                )}
                
                {/* VISTA USUARIO/COMUN: Enfasis Operativo */}
                {!isAdmin && (
                     <>
                        <StatCard title="Pedidos Activos" value={orders.filter(o => o.status === 'pendiente' || o.status === 'en armado').length.toString()} icon={<ClipboardListIcon className="w-6 h-6 text-white"/>} color="bg-blue-500/80" />
                        <StatCard title="Entregas Hoy" value={upcomingDeliveries.filter(o => new Date(o.deliveryDate).toDateString() === new Date().toDateString()).length.toString()} icon={<TruckIcon className="w-6 h-6 text-white"/>} color="bg-purple-500/80" />
                     </>
                )}

                {/* COMUN */}
                <StatCard title="Stock Crítico" value={criticalStockItems.length.toString()} icon={<BellAlertIcon className="w-6 h-6 text-white"/>} color="bg-yellow-500/80" />
                {!isAdmin && <StatCard title="Ventas Mes" value={`S/ ${financialSummary?.totalRevenue.toFixed(2) || '0.00'}`} icon={<BanknotesIcon className="w-6 h-6 text-white"/>} color="bg-green-500/80" />}
            </div>

            {isAdmin ? (
                <div className="mt-8 bg-gray-800/50 p-6 rounded-xl border border-gray-700">
                    <h3 className="font-bold text-xl text-purple-300 mb-4 flex items-center gap-2">
                        <UserCircleIcon className="w-6 h-6"/> Gestión de Clientes (Florerías)
                    </h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-gray-300">
                            <thead className="bg-gray-700/50 text-xs uppercase text-gray-400">
                                <tr>
                                    <th className="px-4 py-3 rounded-tl-lg">Florería / Usuario</th>
                                    <th className="px-4 py-3">Fecha Registro</th>
                                    <th className="px-4 py-3 text-center">Pedidos Totales</th>
                                    <th className="px-4 py-3 text-right">Ventas Totales</th>
                                    <th className="px-4 py-3 text-center rounded-tr-lg">Acción</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-700">
                                {clientsSummary.map((client) => (
                                    <tr key={client._id} className="hover:bg-gray-700/30 transition-colors">
                                        <td className="px-4 py-3 font-medium text-white flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-xs font-bold">
                                                {client.username.substring(0, 2).toUpperCase()}
                                            </div>
                                            {client.username}
                                        </td>
                                        <td className="px-4 py-3">
                                            {client.createdAt ? new Date(client.createdAt).toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A'}
                                        </td>
                                        <td className="px-4 py-3 text-center font-semibold">{client.ordersCount}</td>
                                        <td className="px-4 py-3 text-right text-green-400 font-bold">S/ {client.totalSales.toFixed(2)}</td>
                                        <td className="px-4 py-3 text-center">
                                            <button 
                                                onClick={() => onSelectUser && onSelectUser(client._id)}
                                                className="inline-flex items-center gap-1 bg-gray-700 hover:bg-purple-600 text-white px-3 py-1.5 rounded-md transition-all text-xs font-medium"
                                            >
                                                <EyeIcon className="w-3 h-3"/> Inspeccionar
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {clientsSummary.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="text-center py-8 text-gray-500">
                                            No hay clientes registrados aún.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700">
                            <h3 className="font-bold text-lg text-amber-300 mb-4 flex items-center gap-2"><TruckIcon className="w-5 h-5"/> Próximas Entregas (7 días)</h3>
                            <ul className="space-y-2 max-h-48 overflow-y-auto">
                                {upcomingDeliveries.map(order => (
                                    <li key={order._id} className="flex justify-between items-center text-sm p-2 bg-gray-700/50 rounded-md">
                                        <div>
                                            <p className="font-medium text-white">{order.clientName}</p>
                                            <p className="text-xs text-gray-400">{order.address}</p>
                                        </div>
                                        <span className="font-bold text-gray-300 text-xs">
                                            {new Date(order.deliveryDate).toLocaleDateString('es-ES', { weekday: 'short', day: '2-digit', month: 'short' })}
                                        </span>
                                    </li>
                                ))}
                                {upcomingDeliveries.length === 0 && (
                                    <li className="text-center text-gray-500 pt-8">No hay entregas programadas.</li>
                                )}
                            </ul>
                        </div>
                        <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700">
                            <h3 className="font-bold text-lg text-amber-300 mb-4 flex items-center gap-2"><BellAlertIcon className="w-5 h-5"/> Alerta de Stock</h3>
                            <ul className="space-y-2 max-h-48 overflow-y-auto">
                                {criticalStockItems.map(item => (
                                    <li key={item.itemId} className="flex justify-between items-center text-sm p-2 bg-gray-700/50 rounded-md">
                                        <span className="font-medium text-white">{item.name}</span>
                                        <span className="font-bold text-yellow-400">{item.quantity} uds</span>
                                    </li>
                                ))}
                                {criticalStockItems.length === 0 && (
                                    <li className="text-center text-gray-500 pt-8">Todo el stock está en niveles óptimos.</li>
                                )}
                            </ul>
                        </div>
                    </div>
                    <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700">
                        <h3 className="font-bold text-lg text-amber-300 mb-4">Productos Top</h3>
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
            )}
        </div>
    );
};

export default DashboardPanel;
