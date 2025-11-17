
import React from 'react';
import type { Event, Order } from '../../types';

interface CalendarPanelProps {
    events: Event[];
    orders: Order[];
}

const CalendarPanel: React.FC<CalendarPanelProps> = ({ events, orders }) => {
    
    const isSameDay = (d1: Date, d2: Date) => {
        return d1.getFullYear() === d2.getFullYear() &&
               d1.getMonth() === d2.getMonth() &&
               d1.getDate() === d2.getDate();
    };
    
    const todayDeliveries = orders
        .filter(o => isSameDay(new Date(o.deliveryDate), new Date()) && o.status !== 'cancelado')
        .sort((a, b) => new Date(a.deliveryDate).getTime() - new Date(b.deliveryDate).getTime());

    const Countdown: React.FC<{ date: string }> = ({ date }) => {
        const calculateDaysLeft = () => {
            const today = new Date();
            const eventDate = new Date(date);
            today.setHours(0, 0, 0, 0);
            eventDate.setHours(0, 0, 0, 0);
            const diffTime = eventDate.getTime() - today.getTime();
            if (diffTime < 0) return -1;
            return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        };
        const daysLeft = calculateDaysLeft();

        if (daysLeft < 0) return <span className="text-sm text-gray-500">Finalizado</span>;
        if (daysLeft === 0) return <span className="text-sm font-bold text-red-400">¡ES HOY!</span>;
        return <span className="text-sm font-semibold text-cyan-400">Faltan {daysLeft} días</span>;
    };
    
    const getStatusChip = (status: string) => {
        const styles: { [key: string]: string } = {
            pendiente: 'bg-yellow-400/80 text-yellow-900',
            'en armado': 'bg-blue-400/80 text-blue-900',
            entregado: 'bg-green-500/80 text-green-900'
        };
        return <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${styles[status]}`}>{status.toUpperCase()}</span>;
    };

    return (
        <div>
            <h1 className="text-3xl font-bold text-gray-300 tracking-wider mb-6">Agenda y Calendario</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-1 bg-gray-800/50 p-4 rounded-xl border border-gray-700">
                     <h3 className="font-bold text-lg text-amber-300 mb-4">Fechas Importantes / Campañas</h3>
                     <ul className="space-y-3">
                         {events.map(d => (
                             <li key={d._id} className="flex justify-between items-center p-3 bg-gray-700/50 rounded-lg">
                                 <div>
                                     <p className="font-semibold text-white">{d.name}</p>
                                     <p className="text-xs text-gray-400">{new Date(d.date).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                                 </div>
                                 <Countdown date={d.date} />
                             </li>
                         ))}
                     </ul>
                </div>

                <div className="md:col-span-2 bg-gray-800/50 p-4 rounded-xl border border-gray-700">
                    <h3 className="font-bold text-lg text-amber-300 mb-4">Mapa de Entregas del Día</h3>
                    <div className="space-y-2">
                        {todayDeliveries.length > 0 ? todayDeliveries.map((delivery) => (
                            <div key={delivery._id} className="grid grid-cols-12 gap-4 items-center p-3 bg-gray-700/50 rounded-lg">
                                <div className="col-span-3 font-bold text-white text-center">
                                    {new Date(delivery.deliveryDate).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                                </div>
                                <div className="col-span-6 text-gray-300 text-sm">
                                    {/* FIX: Changed customerName to clientName to match the Order type. */}
                                    <p className="font-semibold">{delivery.clientName}</p>
                                    <p className="text-xs text-gray-400">{delivery.address}</p>
                                </div>
                                <div className="col-span-3 text-center">{getStatusChip(delivery.status)}</div>
                            </div>
                        )) : (
                            <div className="text-center p-8 text-gray-500">No hay entregas programadas para hoy.</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CalendarPanel;
