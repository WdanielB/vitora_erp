
import React from 'react';

const CalendarPanel: React.FC = () => {
    return (
        <div>
            <h1 className="text-3xl font-bold text-gray-300 tracking-wider">Agenda y Calendario</h1>
            <div className="mt-6 p-10 bg-black/20 border border-gray-700/50 rounded-2xl text-center min-h-[calc(100vh-12rem)] flex flex-col justify-center">
                <p className="text-lg text-gray-400">Módulo en construcción.</p>
                <p className="text-sm text-gray-500">Aquí se visualizarán las entregas, fechas importantes y campañas.</p>
            </div>
        </div>
    );
};

export default CalendarPanel;
