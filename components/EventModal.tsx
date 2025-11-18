
import React, { useState, useEffect } from 'react';
import type { Event, User } from '../types.ts';

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (event: Omit<Event, '_id'> | Event) => void;
  onDelete: (eventId: string) => void;
  event: Event | null;
  selectedDate: Date | null;
  user: User;
}

const EventModal: React.FC<EventModalProps> = ({ isOpen, onClose, onSave, onDelete, event, selectedDate, user }) => {
  const [name, setName] = useState('');
  const [date, setDate] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (event) {
        setName(event.name);
        setDate(new Date(event.date).toISOString().split('T')[0]);
      } else if (selectedDate) {
        setName('');
        setDate(selectedDate.toISOString().split('T')[0]);
      }
    }
  }, [isOpen, event, selectedDate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !date) return;

    if (event) {
      onSave({ ...event, name: name.trim(), date: new Date(date).toISOString() });
    } else {
      onSave({ name: name.trim(), date: new Date(date).toISOString(), userId: user._id });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4" onClick={onClose}>
      <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6 w-full max-w-sm shadow-2xl shadow-purple-500/20" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-xl font-bold mb-4 text-purple-300">{event ? 'Editar Evento' : 'Nuevo Evento'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="event-name" className="block mb-1 text-sm font-medium text-gray-400">Nombre del Evento</label>
            <input
              type="text" id="event-name" value={name} onChange={(e) => setName(e.target.value)}
              className="bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-purple-500 focus:border-purple-500 block w-full p-2.5"
              required autoFocus
            />
          </div>
          <div>
            <label htmlFor="event-date" className="block mb-1 text-sm font-medium text-gray-400">Fecha</label>
            <input
              type="date" id="event-date" value={date} onChange={(e) => setDate(e.target.value)}
              className="bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-purple-500 focus:border-purple-500 block w-full p-2.5"
              required
            />
          </div>
          <div className="flex justify-between items-center pt-2">
            <div>
              {event && (
                <button type="button" onClick={() => onDelete(event._id!)} className="py-2 px-4 text-sm font-medium text-red-400 hover:text-red-300">
                  Eliminar
                </button>
              )}
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={onClose} className="py-2 px-4 text-sm font-medium text-gray-300 bg-gray-600 rounded-lg hover:bg-gray-500 transition-colors">
                Cancelar
              </button>
              <button type="submit" className="py-2 px-4 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors">
                Guardar
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EventModal;