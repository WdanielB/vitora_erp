
import React, { useState, useEffect } from 'react';
import type { User } from '../types';
import { LogoutIcon } from './icons/LogoutIcon';
import { UserCircleIcon } from './icons/UserCircleIcon';

interface HeaderProps {
    user: User;
    onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ user, onLogout }) => {
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('es-ES', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString('es-ES');
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
