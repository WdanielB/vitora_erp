
import React from 'react';

const CalendarPanel: React.FC = () => {
    // Datos de ejemplo
    const importantDates = [
        { name: "Día de San Valentín", date: "2025-02-14" },
        { name: "Día de la Madre", date: "2025-05-11" },
        { name: "Campaña Navideña", date: "2024-12-01" },
    ];
    
    const todayDeliveries = [
        { time: '10:00 AM', address: 'Calle Falsa 123, Cayma', status: 'en ruta', driver: 'Juan Pérez' },
        { time: '11:30 AM', address: 'Av. Ejército 789, Yanahuara', status: 'pendiente', driver: 'Asignar' },
        { time: '02:00 PM', address: 'Plaza de Paucarpata', status: 'pendiente', driver: 'Asignar' },
        { time: '04:00 PM', address: 'Urb. La Florida C-5, Cerro Colorado', status: 'entregado', driver: 'Maria Quispe' },
    ];

    const Countdown: React.FC<{ date: string }> = ({ date }) => {
        const calculateDaysLeft = () => {
            const today = new Date();
            const eventDate = new Date(date);
            today.setHours(0, 0, 0, 0);
            eventDate.setHours(0, 0, 0, 0);
            const diffTime = eventDate.getTime() - today.getTime();
            return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        };
        const daysLeft = calculateDaysLeft();

        if (daysLeft < 0) return <span className="text-sm text-gray-500">Finalizado</span>;
        if (daysLeft === 0) return <span className="text-sm font-bold text-red-400">¡ES HOY!</span>;
        return <span className="text-sm font-semibold text-cyan-400">Faltan {daysLeft} días</span>;
    };
    
    const getStatusChip = (status: string) => {
        const styles = {
            pendiente: 'bg-yellow-400/80 text-yellow-900',
            'en ruta': 'bg-blue-400/80 text-blue-900',
            entregado: 'bg-green-500/80 text-green-900'
        };
        // @ts-ignore
        return <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${styles[status]}`}>{status.toUpperCase()}</span>;
    };

    return (
        <div>
            <h1 className="text-3xl font-bold text-gray-300 tracking-wider mb-6">Agenda y Calendario</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-1 bg-gray-800/50 p-4 rounded-xl border border-gray-700">
                     <h3 className="font-bold text-lg text-amber-300 mb-4">Fechas Importantes / Campañas</h3>
                     <ul className="space-y-3">
                         {importantDates.map(d => (
                             <li key={d.name} className="flex justify-between items-center p-3 bg-gray-700/50 rounded-lg">
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
                        {todayDeliveries.map((delivery, i) => (
                            <div key={i} className="grid grid-cols-12 gap-4 items-center p-3 bg-gray-700/50 rounded-lg">
                                <div className="col-span-2 font-bold text-white text-center">{delivery.time}</div>
                                <div className="col-span-5 text-gray-300">{delivery.address}</div>
                                <div className="col-span-2 text-gray-400 text-sm text-center">{delivery.driver}</div>
                                <div className="col-span-3 text-center">{getStatusChip(delivery.status)}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CalendarPanel;
