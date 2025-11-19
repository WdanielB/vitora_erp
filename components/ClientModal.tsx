
import React, { useState } from 'react';
import type { Client } from '../types.ts';
import * as api from '../services/api.ts';

interface ClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClientCreated: () => void;
  userId: string;
}

const ClientModal: React.FC<ClientModalProps> = ({ isOpen, onClose, onClientCreated, userId }) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setIsSaving(true);
    
    const newClient: Omit<Client, '_id'> = {
        name: name.trim(),
        phone: phone.trim(),
        address: address.trim(),
        userId,
    };

    try {
        await api.createClient(newClient);
        onClientCreated(); // Recarga datos en el padre
        setName('');
        setPhone('');
        setAddress('');
        onClose();
    } catch (error) {
        console.error("Failed to create client:", error);
        alert("Error al crear el cliente. Inténtalo de nuevo.");
    } finally {
        setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex justify-center items-center z-[60] p-4"
      onClick={onClose}
    >
      <div 
        className="bg-gray-800 border border-gray-700 rounded-2xl p-6 w-full max-w-sm shadow-2xl shadow-green-500/20"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold mb-4 text-green-300">Nuevo Cliente</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="client-name" className="block mb-1 text-sm font-medium text-gray-400">Nombre del Cliente</label>
            <input
              type="text" id="client-name" value={name} onChange={(e) => setName(e.target.value)}
              className="bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-green-500 focus:border-green-500 block w-full p-2.5"
              required autoFocus
              placeholder="Ej. Juan Pérez"
            />
          </div>
          <div>
            <label htmlFor="client-phone" className="block mb-1 text-sm font-medium text-gray-400">Teléfono (Opcional)</label>
            <input
              type="tel" id="client-phone" value={phone} onChange={(e) => setPhone(e.target.value)}
              className="bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-green-500 focus:border-green-500 block w-full p-2.5"
              placeholder="999 999 999"
            />
          </div>
           <div>
            <label htmlFor="client-address" className="block mb-1 text-sm font-medium text-gray-400">Dirección (Opcional)</label>
            <input
              type="text" id="client-address" value={address} onChange={(e) => setAddress(e.target.value)}
              className="bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-green-500 focus:border-green-500 block w-full p-2.5"
              placeholder="Av. Principal 123"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="py-2 px-4 text-sm font-medium text-gray-300 bg-gray-600 rounded-lg hover:bg-gray-500 transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={isSaving} className="py-2 px-4 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 focus:ring-4 focus:outline-none focus:ring-green-800 transition-colors disabled:bg-green-800">
              {isSaving ? 'Guardando...' : 'Guardar Cliente'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ClientModal;
