
import React from 'react';
import type { View } from '../types.ts';
import { DashboardIcon } from './icons/DashboardIcon.tsx';
import { DocumentTextIcon } from './icons/DocumentTextIcon.tsx';
import { BoxIcon } from './icons/BoxIcon.tsx';
import { ClipboardListIcon } from './icons/ClipboardListIcon.tsx';
import { CalendarIcon } from './icons/CalendarIcon.tsx';
import { BanknotesIcon } from './icons/BanknotesIcon.tsx';
import { CogIcon } from './icons/CogIcon.tsx';


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
            className={`relative flex items-center justify-center h-12 w-12 rounded-xl transition-all duration-300 focus:outline-none group
                ${isActive 
                    ? 'bg-gradient-to-br from-purple-600 to-purple-800 text-white shadow-lg shadow-purple-500/40 translate-x-1' 
                    : 'text-gray-500 hover:bg-gray-800 hover:text-gray-200'}`}
        >
            {children}
            {/* Tooltip */}
            <span className="absolute left-full ml-4 px-3 py-1.5 bg-gray-800 border border-gray-700 text-white text-xs font-medium rounded-lg invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-all whitespace-nowrap z-50 shadow-xl translate-x-[-10px] group-hover:translate-x-0">
                {label}
                <div className="absolute left-0 top-1/2 -translate-x-1 -translate-y-1/2 w-2 h-2 bg-gray-800 border-l border-b border-gray-700 transform rotate-45"></div>
            </span>
        </button>
    );
};

const Sidebar: React.FC<SidebarProps> = ({ currentView, setView }) => {
    return (
        <aside className="w-20 bg-gray-900 border-r border-gray-800 flex flex-col items-center py-6 flex-shrink-0 z-30">
            {/* Logo Area */}
            <div className="mb-8 flex items-center justify-center w-full">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
                    <span className="font-black text-white text-lg tracking-tighter">AD</span>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex flex-col items-center space-y-4 w-full">
                <NavItem viewName="dashboard" label="Dashboard" currentView={currentView} setView={setView}>
                    <DashboardIcon className="w-6 h-6" />
                </NavItem>
                <NavItem viewName="quotation" label="Cotización" currentView={currentView} setView={setView}>
                    <DocumentTextIcon className="w-6 h-6" />
                </NavItem>
                <NavItem viewName="stock" label="Inventario" currentView={currentView} setView={setView}>
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
            </nav>

            {/* Bottom Actions */}
            <div className="mt-auto pt-4 border-t border-gray-800 w-full flex justify-center">
                <NavItem viewName="settings" label="Ajustes" currentView={currentView} setView={setView}>
                    <CogIcon className="w-6 h-6" />
                </NavItem>
            </div>
        </aside>
    );
};

export default Sidebar;
