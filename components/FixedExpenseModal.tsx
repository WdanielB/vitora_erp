
import React, { useState, useEffect } from 'react';
import type { FixedExpense } from '../types.ts';

interface FixedExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (expense: Omit<FixedExpense, '_id'> | FixedExpense) => void;
  expense: FixedExpense | null;
  userId: string;
}

const FixedExpenseModal: React.FC<FixedExpenseModalProps> = ({ isOpen, onClose, onSave, expense, userId }) => {
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');

  useEffect(() => {
    if (isOpen) {
      setName(expense?.name || '');
      setAmount(expense?.amount.toString() || '');
    }
  }, [isOpen, expense]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNumber = parseFloat(amount);
    if (!name.trim() || isNaN(amountNumber) || amountNumber <= 0) return;

    if (expense) {
      onSave({ ...expense, name: name.trim(), amount: amountNumber });
    } else {
      onSave({ name: name.trim(), amount: amountNumber, userId });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4" onClick={onClose}>
      <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6 w-full max-w-sm shadow-2xl shadow-purple-500/20" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-xl font-bold mb-4 text-purple-300">{expense ? 'Editar Gasto Fijo' : 'Nuevo Gasto Fijo'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="expense-name" className="block mb-1 text-sm font-medium text-gray-400">Nombre del Gasto</label>
            <input
              type="text" id="expense-name" value={name} onChange={(e) => setName(e.target.value)}
              className="bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-purple-500 focus:border-purple-500 block w-full p-2.5"
              required autoFocus
            />
          </div>
          <div>
            <label htmlFor="expense-amount" className="block mb-1 text-sm font-medium text-gray-400">Monto (S/)</label>
            <input
              type="number" id="expense-amount" value={amount} onChange={(e) => setAmount(e.target.value)}
              className="bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-purple-500 focus:border-purple-500 block w-full p-2.5"
              required step="0.01" min="0"
            />
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

export default FixedExpenseModal;