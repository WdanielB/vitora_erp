
import React, { useState, useEffect } from 'react';
import type { User } from '../types.ts';
import * as api from '../services/api.ts';
import { EyeIcon } from './icons/EyeIcon.tsx';
import { EyeSlashIcon } from './icons/EyeSlashIcon.tsx';
import { CheckCircleIcon } from './icons/CheckCircleIcon.tsx';

interface LoginScreenProps {
    onLogin: (user: User) => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    
    // Connection Check State
    const [dbStatus, setDbStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');

    useEffect(() => {
        checkConnection();
    }, []);

    const checkConnection = async () => {
        setDbStatus('checking');
        const isConnected = await api.checkBackendHealth();
        setDbStatus(isConnected ? 'connected' : 'disconnected');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const user = await api.login(username, password);
            onLogin(user);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Ocurrió un error inesperado.');
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4 font-sans relative">
            <div className="w-full max-w-[400px] text-center">
                 {/* Brand Header */}
                 <div className="mb-12">
                     <h1 className="text-4xl font-black text-black tracking-wide uppercase mb-2">
                        AD ERP
                     </h1>
                     <p className="text-gray-600 text-lg font-medium">Intelligent Service</p>
                 </div>

                 {/* Welcome Message */}
                 <h2 className="text-2xl font-bold text-black mb-8">Welcome back!</h2>

                 {/* Login Form */}
                 <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Username Input */}
                    <div className="relative text-left">
                        <label htmlFor="username" className="block text-sm font-semibold text-gray-700 mb-1 ml-1">Usuario o Email</label>
                        <div className="relative">
                            <input
                                type="text"
                                id="username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full bg-gray-100 border-none text-gray-800 text-sm rounded-lg focus:ring-2 focus:ring-emerald-500 block p-3 pr-10 transition-all"
                                placeholder="ej. admin"
                                required
                                disabled={isLoading}
                            />
                            {username.length > 0 && (
                                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                    <CheckCircleIcon className="w-5 h-5 text-emerald-500" />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Password Input */}
                    <div className="relative text-left">
                        <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-1 ml-1">Contraseña</label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                id="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-gray-100 border-none text-gray-800 text-sm rounded-lg focus:ring-2 focus:ring-emerald-500 block p-3 pr-10 transition-all tracking-widest"
                                placeholder="••••••"
                                required
                                disabled={isLoading}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700 focus:outline-none"
                            >
                                {showPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                            </button>
                        </div>
                        
                        <div className="text-left mt-2 text-xs text-gray-400 px-1">
                            Use al menos 8 caracteres con 1 número.
                        </div>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="text-sm text-red-500 font-medium bg-red-50 p-2 rounded-md border border-red-100">
                            {error}
                        </div>
                    )}

                    {/* Submit Button */}
                    <button 
                        type="submit" 
                        className="w-full text-white bg-emerald-500 hover:bg-emerald-600 focus:ring-4 focus:outline-none focus:ring-emerald-300 font-bold rounded-full text-sm px-5 py-3 text-center transition-all shadow-lg shadow-emerald-500/30 mt-4 disabled:bg-emerald-300 disabled:cursor-not-allowed"
                        disabled={isLoading}
                    >
                        {isLoading ? 'LOGGING IN...' : 'LOG IN'}
                    </button>

                    {/* Forgot Password Link */}
                    <div className="pt-2">
                        <a href="#" onClick={(e) => e.preventDefault()} className="text-sm text-gray-400 hover:text-emerald-600 hover:underline transition-colors">
                            Forgot password?
                        </a>
                    </div>
                </form>
            </div>
            
            {/* DB Status Indicator */}
            <div className="absolute bottom-4 flex items-center gap-2 cursor-pointer opacity-70 hover:opacity-100 transition-opacity" onClick={checkConnection} title="Click para re-conectar">
                <div className={`w-2.5 h-2.5 rounded-full ${
                    dbStatus === 'checking' ? 'bg-yellow-400 animate-pulse' :
                    dbStatus === 'connected' ? 'bg-green-500' : 'bg-red-500'
                }`}></div>
                <span className="text-xs text-gray-400 font-medium">
                    {dbStatus === 'checking' ? 'Verificando servidor...' :
                     dbStatus === 'connected' ? 'Servidor & DB Conectados' : 'Sin conexión al servidor'}
                </span>
            </div>
        </div>
    );
};

export default LoginScreen;
