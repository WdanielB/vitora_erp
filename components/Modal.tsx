
import React, { useState, useEffect } from 'react';
import type { Item, FlowerItem } from '../types';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: Omit<Item, 'id'> & { imageUrl?: string }) => void;
  item: Item | FlowerItem | null;
  itemType: 'flower' | 'fixed' | null;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, onSave, item, itemType }) => {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  useEffect(() => {
    if (isOpen) {
      setName(item?.name || '');
      setPrice(item?.price.toString() || '');
      if (itemType === 'flower' || itemType === 'fixed') {
        setImageUrl(item?.imageUrl || '');
      } else {
        setImageUrl('');
      }
    }
  }, [isOpen, item, itemType]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const priceNumber = parseFloat(price);
    if (name.trim() && !isNaN(priceNumber) && priceNumber >= 0) {
      const savedData: Omit<Item, 'id' | 'userId'> & { imageUrl?: string } = {
        name: name.trim(),
        price: priceNumber,
        visible: item?.visible ?? true,
      };
      if (itemType === 'flower' || itemType === 'fixed') {
        savedData.imageUrl = imageUrl.trim();
      }
      // @ts-ignore - userId will be added by the caller
      onSave(savedData);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-gray-800 border border-gray-700 rounded-2xl p-6 w-full max-w-sm shadow-2xl shadow-purple-500/20"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold mb-4 text-purple-300">{item ? 'Editar Item' : 'Añadir Item'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block mb-1 text-sm font-medium text-gray-400">Nombre del Item</label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-purple-500 focus:border-purple-500 block w-full p-2.5"
              required
            />
          </div>
          <div>
            <label htmlFor="price" className="block mb-1 text-sm font-medium text-gray-400">Precio (S/)</label>
            <input
              type="number"
              id="price"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-purple-500 focus:border-purple-500 block w-full p-2.5"
              required
              step="0.01"
              min="0"
            />
          </div>
          {(itemType === 'flower' || itemType === 'fixed') && (
            <div>
              <label htmlFor="imageUrl" className="block mb-1 text-sm font-medium text-gray-400">URL de la Imagen</label>
              <input
                type="text"
                id="imageUrl"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-purple-500 focus:border-purple-500 block w-full p-2.5"
                placeholder="https://example.com/image.jpg"
              />
            </div>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="py-2 px-4 text-sm font-medium text-gray-300 bg-gray-600 rounded-lg hover:bg-gray-500 transition-colors">
              Cancelar
            </button>
            <button type="submit" className="py-2 px-4 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 focus:ring-4 focus:outline-none focus:ring-purple-800 transition-colors">
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Modal;
