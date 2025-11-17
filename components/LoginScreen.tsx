import React, { useState } from 'react';
import type { User } from '../types';
import * as api from '../services/api';

interface LoginScreenProps {
    onLogin: (user: User) => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

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
        <div className="min-h-screen bg-gray-900 text-gray-200 flex items-center justify-center p-4 font-sans">
            <div className="w-full max-w-sm">
                 <h1 className="text-3xl font-bold text-center mb-6 text-gray-300 tracking-wider uppercase">
                    AD ERP
                 </h1>
                <div className="bg-black/20 backdrop-blur-xl border border-gray-700/50 rounded-3xl shadow-2xl shadow-purple-500/10 p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="username" className="block mb-2 text-sm font-medium text-gray-400">Usuario</label>
                            <input
                                type="text"
                                id="username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-purple-500 focus:border-purple-500 block w-full p-2.5"
                                required
                                autoFocus
                                disabled={isLoading}
                            />
                        </div>
                        <div>
                            <label htmlFor="password" className="block mb-2 text-sm font-medium text-gray-400">Contraseña</label>
                            <input
                                type="password"
                                id="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-purple-500 focus:border-purple-500 block w-full p-2.5"
                                required
                                disabled={isLoading}
                            />
                        </div>
                        {error && <p className="text-sm text-red-400 text-center">{error}</p>}
                        <button 
                            type="submit" 
                            className="w-full text-white bg-purple-600 hover:bg-purple-700 focus:ring-4 focus:outline-none focus:ring-purple-800 font-medium rounded-lg text-sm px-5 py-2.5 text-center transition-colors disabled:bg-purple-800 disabled:cursor-not-allowed"
                            disabled={isLoading}
                        >
                            {isLoading ? 'Ingresando...' : 'Ingresar'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default LoginScreen;