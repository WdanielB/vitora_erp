
import React, { useState, useEffect } from 'react';
import type { User, UserRole } from '../types.ts';

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (userData: { username: string; password?: string; role: UserRole }) => void;
  userToEdit: User | null;
}

const UserModal: React.FC<UserModalProps> = ({ isOpen, onClose, onSave, userToEdit }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('user');

  useEffect(() => {
    if (isOpen) {
      if (userToEdit) {
        setUsername(userToEdit.username);
        setRole(userToEdit.role);
        setPassword(''); // Contraseña siempre vacía al editar por seguridad
      } else {
        setUsername('');
        setPassword('');
        setRole('user');
      }
    }
  }, [isOpen, userToEdit]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;
    
    // Si es nuevo, la contraseña es obligatoria. Si edita, es opcional.
    if (!userToEdit && !password.trim()) {
        alert("La contraseña es obligatoria para nuevos usuarios.");
        return;
    }

    onSave({ 
        username: username.trim(), 
        password: password.trim(), // Si está vacío en edit, el backend lo ignorará
        role 
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center z-50 p-4" onClick={onClose}>
      <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6 w-full max-w-sm shadow-2xl shadow-purple-500/20" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-xl font-bold mb-4 text-purple-300">{userToEdit ? 'Editar Usuario' : 'Nuevo Usuario'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="username" className="block mb-1 text-sm font-medium text-gray-400">Usuario</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-purple-500 focus:border-purple-500 block w-full p-2.5"
              required
              placeholder="ej. Vendedor1"
            />
          </div>
          <div>
            <label htmlFor="password" className="block mb-1 text-sm font-medium text-gray-400">
                {userToEdit ? 'Nueva Contraseña (Opcional)' : 'Contraseña'}
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-purple-500 focus:border-purple-500 block w-full p-2.5"
              placeholder={userToEdit ? "Dejar en blanco para no cambiar" : "••••••"}
            />
          </div>
          <div>
            <label htmlFor="role" className="block mb-1 text-sm font-medium text-gray-400">Rol</label>
            <select
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                 className="bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-purple-500 focus:border-purple-500 block w-full p-2.5"
            >
                <option value="user">Usuario (Empleado)</option>
                <option value="admin">Administrador</option>
            </select>
          </div>
          
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="py-2 px-4 text-sm font-medium text-gray-300 bg-gray-600 rounded-lg hover:bg-gray-500 transition-colors">
              Cancelar
            </button>
            <button type="submit" className="py-2 px-4 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors">
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserModal;
