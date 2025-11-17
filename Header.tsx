
import React, { useState, useEffect } from 'react';
import type { User } from '../types';
import { LogoutIcon } from './icons/LogoutIcon';
import { UserCircleIcon } from './icons/UserCircleIcon';

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
        return date.toLocaleTimeString('es-ES');
    };

    const handleUserSelection = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value;
        setSelectedUserId(value === 'all' ? 'all' : value);
    };

    return (
        <header className="flex-shrink-0 h-20 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-6 md:px-8">
            <div className="flex items-center gap-4">
                <UserCircleIcon className="w-10 h-10 text-gray-500" />
                <div>
                    <p className="font-bold text-white capitalize">{user.username}</p>
                    <p className="text-xs text-gray-400 capitalize">{user.role}</p>
                </div>
            </div>
            <div className="flex items-center gap-6">
                 {user.role === 'admin' && (
                    <div>
                        <label htmlFor="user-selector" className="text-xs text-gray-400 mr-2">Viendo a:</label>
                        <select
                            id="user-selector"
                            value={selectedUserId || 'all'}
                            onChange={handleUserSelection}
                            className="bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-purple-500 focus:border-purple-500 p-1.5"
                        >
                            <option value="all">Todos</option>
                            {allUsers.map(u => (
                                <option key={u._id} value={u._id}>{u.username}</option>
                            ))}
                        </select>
                    </div>
                 )}
                 <div className="text-right hidden sm:block">
                    <p className="font-semibold text-white">{formatTime(currentTime)}</p>
                    <p className="text-xs text-gray-400 capitalize">{formatDate(currentTime)}</p>
                </div>
                <button onClick={onLogout} title="Cerrar Sesión" className="p-2 bg-gray-800 rounded-full hover:bg-gray-700 transition-colors">
                    <LogoutIcon className="w-6 h-6 text-gray-400" />
                </button>
            </div>
        </header>
    );
};

export default Header;
