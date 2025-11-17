import React from 'react';
import type { View } from '../types';
import { DashboardIcon } from './icons/DashboardIcon';
import { DocumentTextIcon } from './icons/DocumentTextIcon';
import { BoxIcon } from './icons/BoxIcon';
import { ClipboardListIcon } from './icons/ClipboardListIcon';
import { CalendarIcon } from './icons/CalendarIcon';
import { BanknotesIcon } from './icons/BanknotesIcon';
import { CogIcon } from './icons/CogIcon';


interface SidebarProps {
    currentView: View;
    setView: (view: View) => void;
}

const NavItem: React.FC<{
    viewName: View;
    label: string;
    currentView: View;
    setView: (view: View) => void;
    children: React.ReactNode;
}> = ({ viewName, label, currentView, setView, children }) => {
    const isActive = currentView === viewName;
    return (
        <button
            onClick={() => setView(viewName)}
            title={label}
            className={`relative flex items-center justify-center h-14 w-14 rounded-xl transition-all duration-200 focus:outline-none group
                ${isActive ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30' : 'text-gray-400 hover:bg-gray-700 hover:text-white'}`}
        >
            {children}
            {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1 bg-purple-400 rounded-r-full"></div>}
            <span className="absolute left-full ml-4 px-2 py-1 bg-gray-800 border border-gray-700 text-white text-xs rounded-md invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                {label}
            </span>
        </button>
    );
};

const Sidebar: React.FC<SidebarProps> = ({ currentView, setView }) => {
    return (
        <aside className="w-20 bg-gray-900 border-r border-gray-800 flex flex-col items-center py-6 space-y-4 flex-shrink-0">
            <div className="text-purple-500 font-bold text-xl">AD</div>
            <nav className="flex flex-col items-center space-y-3 mt-8">
                <NavItem viewName="dashboard" label="Dashboard" currentView={currentView} setView={setView}>
                    <DashboardIcon className="w-6 h-6" />
                </NavItem>
                <NavItem viewName="quotation" label="Cotización" currentView={currentView} setView={setView}>
                    <DocumentTextIcon className="w-6 h-6" />
                </NavItem>
                <NavItem viewName="stock" label="Control de Stock" currentView={currentView} setView={setView}>
                    <BoxIcon className="w-6 h-6" />
                </NavItem>
                <NavItem viewName="orders" label="Pedidos" currentView={currentView} setView={setView}>
                    <ClipboardListIcon className="w-6 h-6" />
                </NavItem>
                <NavItem viewName="calendar" label="Agenda" currentView={currentView} setView={setView}>
                    <CalendarIcon className="w-6 h-6" />
                </NavItem>
                 <NavItem viewName="finance" label="Finanzas" currentView={currentView} setView={setView}>
                    <BanknotesIcon className="w-6 h-6" />
                </NavItem>
                <NavItem viewName="settings" label="Ajustes" currentView={currentView} setView={setView}>
                    <CogIcon className="w-6 h-6" />
                </NavItem>
            </nav>
        </aside>
    );
};

export default Sidebar;