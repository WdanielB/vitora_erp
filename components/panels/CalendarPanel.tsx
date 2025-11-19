
import React, { useState, useMemo } from 'react';
import type { Event, Order, User } from '../../types.ts';
import * as api from '../../services/api.ts';
import EventModal from '../EventModal.tsx';
import { ArrowLeftIcon } from '../icons/ArrowLeftIcon.tsx';
import { ArrowRightIcon } from '../icons/ArrowRightIcon.tsx';
import { PlusIcon } from '../icons/PlusIcon.tsx';

interface CalendarPanelProps {
    events: Event[];
    orders: Order[];
    user: User;
    onDataNeedsRefresh: () => void;
}

type CalendarView = 'month' | 'year' | 'list';

const CalendarPanel: React.FC<CalendarPanelProps> = ({ events, orders, user, onDataNeedsRefresh }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [viewMode, setViewMode] = useState<CalendarView>('month');
    const [isEventModalOpen, setIsEventModalOpen] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);

    // --- HOOKS MOVED TO TOP LEVEL (Fixes React Error #310/White Screen) ---
    
    // 1. Data for Month View
    const calendarDays = useMemo(() => {
        const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const days = [];
        const startDate = new Date(firstDayOfMonth);
        startDate.setDate(startDate.getDate() - startDate.getDay());
        for (let i = 0; i < 42; i++) {
            days.push(new Date(startDate));
            startDate.setDate(startDate.getDate() + 1);
        }
        return days;
    }, [currentDate]);

    // 2. Data for Year View
    const yearViewData = useMemo(() => {
        return {
            eventDates: events.map(e => new Date(e.date).toDateString()),
            orderDates: orders.map(o => new Date(o.deliveryDate).toDateString())
        };
    }, [events, orders]);

    // 3. Data for List View
    const combinedList = useMemo(() => {
        const eventItems = events.map(e => ({ ...e, type: 'event' as const, date: new Date(e.date) }));
        const orderItems = orders.map(o => ({ ...o, type: 'order' as const, date: new Date(o.deliveryDate) }));
        return [...eventItems, ...orderItems].sort((a, b) => a.date.getTime() - b.date.getTime());
    }, [events, orders]);


    const handleEventSave = async (eventData: Omit<Event, '_id'> | Event) => {
        try {
            if ('_id' in eventData) await api.updateEvent(eventData, user._id);
            else await api.createEvent(eventData, user._id);
            onDataNeedsRefresh();
        } catch(error) { console.error("Failed to save event", error); }
        setIsEventModalOpen(false);
    };

    const handleEventDelete = async (eventId: string) => {
        try {
            await api.deleteEvent(eventId, user._id);
            onDataNeedsRefresh();
        } catch(error) { console.error("Failed to delete event", error); }
        setIsEventModalOpen(false);
    };

    const openEventModalForNew = (date: Date) => { setSelectedDate(date); setSelectedEvent(null); setIsEventModalOpen(true); };
    const openEventModalForEdit = (event: Event) => { setSelectedDate(null); setSelectedEvent(event); setIsEventModalOpen(true); };
    
    const ViewSwitcher = () => (
        <div className="flex bg-gray-700/50 rounded-lg p-1">
            {(['month', 'year', 'list'] as CalendarView[]).map(v => (
                <button key={v} onClick={() => setViewMode(v)} className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors capitalize ${viewMode === v ? 'bg-purple-600 text-white' : 'text-gray-300 hover:bg-gray-600'}`}>
                    {v === 'month' ? 'Mes' : v === 'year' ? 'Año' : 'Lista'}
                </button>
            ))}
        </div>
    );

    const renderMonthView = () => {
        return (
            <>
                <div className="grid grid-cols-7 text-center font-bold text-gray-400 text-xs uppercase pb-2 border-b border-gray-700 flex-shrink-0">
                    {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(day => <div key={day}>{day}</div>)}
                </div>
                <div className="grid grid-cols-7 flex-grow overflow-hidden">
                    {calendarDays.map((day, index) => {
                        const isCurrentMonth = day.getMonth() === currentDate.getMonth();
                        const isToday = day.toDateString() === new Date().toDateString();
                        const dayEvents = events.filter(e => new Date(e.date).toDateString() === day.toDateString());
                        const dayOrders = orders.filter(o => new Date(o.deliveryDate).toDateString() === day.toDateString() && o.status !== 'cancelado');
                        return (
                            <div key={index} className={`relative border-r border-b border-gray-700 p-2 flex flex-col group ${isCurrentMonth ? '' : 'bg-gray-800/40 text-gray-600'}`}>
                                <time dateTime={day.toISOString()} className={`text-sm font-semibold ${isToday ? 'bg-purple-600 text-white rounded-full w-6 h-6 flex items-center justify-center' : ''}`}>{day.getDate()}</time>
                                <div className="mt-1 flex-grow overflow-y-auto text-left text-xs space-y-1">{dayOrders.map(order => (<div key={order._id} className="bg-blue-900/70 p-1 rounded text-white truncate" title={`${order.clientName} - ${order.address}`}>🚚 {order.clientName}</div>))}{dayEvents.map(event => (<div key={event._id} onClick={() => openEventModalForEdit(event)} className="bg-amber-800/70 p-1 rounded text-white truncate cursor-pointer" title={event.name}>🎉 {event.name}</div>))}</div>
                                <button onClick={() => openEventModalForNew(day)} className="absolute bottom-1 right-1 w-6 h-6 bg-gray-600 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-purple-600"><PlusIcon className="w-4 h-4" /></button>
                            </div>
                        );
                    })}
                </div>
            </>
        );
    };

    const renderYearView = () => {
        const year = currentDate.getFullYear();
        const months = Array.from({ length: 12 }, (_, i) => new Date(year, i, 1));

        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 flex-grow overflow-y-auto pr-2 mt-4">
                {months.map(month => {
                    const monthDays = Array.from({ length: new Date(year, month.getMonth() + 1, 0).getDate() }, (_, i) => i + 1);
                    const firstDay = month.getDay();
                    return (
                        <div key={month.getMonth()} className="bg-gray-800/50 p-2 rounded-lg">
                            <h3 className="font-bold text-center text-purple-300 text-sm mb-2">{month.toLocaleString('es-ES', { month: 'long' })}</h3>
                            <div className="grid grid-cols-7 text-center text-xs text-gray-500">
                                {['D', 'L', 'M', 'M', 'J', 'V', 'S'].map(d => <span key={d}>{d}</span>)}
                            </div>
                            <div className="grid grid-cols-7 text-center text-xs">
                                {Array.from({ length: firstDay }).map((_, i) => <div key={`empty-${i}`}></div>)}
                                {monthDays.map(day => {
                                    const dayDate = new Date(year, month.getMonth(), day).toDateString();
                                    const hasEvent = yearViewData.eventDates.includes(dayDate);
                                    const hasOrder = yearViewData.orderDates.includes(dayDate);
                                    let dotClass = '';
                                    if (hasOrder) dotClass = 'bg-blue-500';
                                    else if (hasEvent) dotClass = 'bg-amber-500';
                                    return (
                                        <div key={day} className="relative py-1">{day}{dotClass && <div className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full ${dotClass}`}></div>}</div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    const renderListView = () => {
        return (
            <div className="flex-grow overflow-y-auto mt-4 pr-2">
                <ul className="space-y-3">
                    {combinedList.map((item, index) => (
                        <li key={`${item.type}-${item._id}-${index}`} className="flex items-center gap-4 p-2 bg-gray-800/50 rounded-lg">
                            <div className="text-center w-16 flex-shrink-0">
                                <p className="font-bold text-purple-300 text-lg">{item.date.getDate()}</p>
                                <p className="text-xs text-gray-400 uppercase">{item.date.toLocaleString('es-ES', { month: 'short' })}</p>
                            </div>
                            <div className="border-l border-gray-600 pl-4">
                                <p className="font-semibold text-white">{item.type === 'event' ? `🎉 ${item.name}` : `🚚 Pedido: ${item.clientName}`}</p>
                                <p className="text-xs text-gray-400">{item.type === 'order' ? item.address : item.date.toLocaleDateString('es-ES', { weekday: 'long' })}</p>
                            </div>
                        </li>
                    ))}
                    {combinedList.length === 0 && <p className="text-center text-gray-500 pt-8">No hay próximos eventos o pedidos.</p>}
                </ul>
            </div>
        );
    };

    return (
        <div className="flex flex-col h-full">
            <div className="flex justify-between items-center mb-6 flex-shrink-0">
                <h1 className="text-3xl font-bold text-gray-300 tracking-wider">Agenda y Calendario</h1>
                <div className="flex items-center gap-4">
                    <button onClick={() => setCurrentDate(prev => new Date(viewMode === 'year' ? prev.setFullYear(prev.getFullYear() - 1) : prev.setMonth(prev.getMonth() - 1)))} className="p-2 rounded-full hover:bg-gray-700"><ArrowLeftIcon className="w-5 h-5"/></button>
                    <h2 className="text-xl font-semibold text-white w-48 text-center capitalize">
                        {currentDate.toLocaleString('es-ES', { month: viewMode !== 'year' ? 'long' : undefined, year: 'numeric' })}
                    </h2>
                    <button onClick={() => setCurrentDate(prev => new Date(viewMode === 'year' ? prev.setFullYear(prev.getFullYear() + 1) : prev.setMonth(prev.getMonth() + 1)))} className="p-2 rounded-full hover:bg-gray-700"><ArrowRightIcon className="w-5 h-5"/></button>
                </div>
                <ViewSwitcher />
            </div>

            {viewMode === 'month' && renderMonthView()}
            {viewMode === 'year' && renderYearView()}
            {viewMode === 'list' && renderListView()}
            
             <EventModal isOpen={isEventModalOpen} onClose={() => setIsEventModalOpen(false)} onSave={handleEventSave} onDelete={handleEventDelete} event={selectedEvent} selectedDate={selectedDate} user={user} />
        </div>
    );
};

export default CalendarPanel;
