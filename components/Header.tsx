
import React, { useState, useEffect } from 'react';
import type { User } from '../types.ts';
import { LogoutIcon } from './icons/LogoutIcon.tsx';
import { UserCircleIcon } from './icons/UserCircleIcon.tsx';

interface HeaderProps {
    user: User;
    onLogout: () => void;
    allUsers: User[];
    selectedUserId: string | null;
    setSelectedUserId: (id: string | null) => void;
}

const Header: React.FC<HeaderProps> = ({ user, onLogout, allUsers, selectedUserId, setSelectedUserId }) => {
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('es-ES', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
        });
    };

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    };

    const handleUserSelection = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value;
        setSelectedUserId(value === 'all' ? 'all' : value);
    };

    return (
        <header className="flex-shrink-0 h-20 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-6 md:px-8 z-20 relative shadow-md shadow-black/20">
            {/* Left: User Info */}
            <div className="flex items-center gap-4">
                <div className="relative">
                    <div className="absolute inset-0 bg-purple-500 blur opacity-20 rounded-full"></div>
                    <UserCircleIcon className="w-10 h-10 text-gray-400 relative z-10" />
                </div>
                <div className="hidden sm:block">
                    <p className="font-bold text-white text-sm leading-tight capitalize">{user.username}</p>
                    <p className="text-xs text-purple-400 font-medium tracking-wide uppercase">
                        {user.role === 'admin' ? 'ADMINISTRADOR' : 'USUARIO'}
                    </p>
                </div>
            </div>

            {/* Right: Actions & Time */}
            <div className="flex items-center gap-4 md:gap-6">
                 {/* Admin User Selector Pill - SOLO VISIBLE PARA ADMIN */}
                 {user.role === 'admin' && (
                    <div className="flex items-center bg-gray-800/80 rounded-xl px-3 py-1.5 border border-gray-700 transition-colors hover:border-gray-600 group">
                        <span className="text-[10px] uppercase font-bold text-gray-500 mr-2 tracking-wider group-hover:text-purple-400 transition-colors">
                            Viendo a:
                        </span>
                        <div className="relative">
                            <select
                                id="user-selector"
                                value={selectedUserId || 'all'}
                                onChange={handleUserSelection}
                                className="bg-transparent text-white text-sm font-semibold appearance-none focus:outline-none cursor-pointer pr-6 py-0.5 hover:text-purple-100"
                            >
                                <option value="all" className="bg-gray-800 text-gray-300">Todos</option>
                                {/* Filtramos para mostrar SOLO usuarios con rol 'user' */}
                                {allUsers.filter(u => u.role === 'user').map(u => (
                                    <option key={u._id} value={u._id} className="bg-gray-800 text-gray-300 capitalize">{u.username}</option>
                                ))}
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center text-gray-400">
                                <svg className="h-3 w-3 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"/></svg>
                            </div>
                        </div>
                    </div>
                 )}

                 <div className="h-8 w-px bg-gray-800 hidden sm:block"></div>

                 {/* Time Display */}
                 <div className="text-right hidden md:block">
                    <p className="font-bold text-white text-lg leading-none tracking-tight">{formatTime(currentTime)}</p>
                    <p className="text-[10px] text-gray-500 uppercase tracking-wide font-semibold mt-1">{formatDate(currentTime)}</p>
                </div>

                {/* Logout */}
                <button 
                    onClick={onLogout} 
                    title="Cerrar Sesión" 
                    className="p-2.5 bg-gray-800 rounded-xl hover:bg-red-500/10 hover:text-red-400 text-gray-400 transition-all duration-200 border border-transparent hover:border-red-500/30"
                >
                    <LogoutIcon className="w-5 h-5" />
                </button>
            </div>
        </header>
    );
};

export default Header;
