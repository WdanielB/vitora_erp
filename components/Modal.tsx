
import React, { useState, useEffect } from 'react';
import type { Item, FlowerItem, ProductItem } from '../types.ts';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: Omit<Item, 'id'> & { imageUrl?: string, category?: string, costo?: number, costoPaquete?: number, cantidadPorPaquete?: number, merma?: number }) => void;
  item: Item | FlowerItem | ProductItem | null;
  itemType: 'flower' | 'fixed' | 'product' | null; 
}

const PRODUCT_CATEGORIES = [
    'Ramo',
    'Box',
    'Peluche',
    'Chocolate',
    'Bebida',
    'Adicionales'
];

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, onSave, item, itemType }) => {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [category, setCategory] = useState('Adicionales');
  
  // Cost Fields
  const [costo, setCosto] = useState('0');
  const [costoPaquete, setCostoPaquete] = useState('0');
  const [cantidadPorPaquete, setCantidadPorPaquete] = useState('0');
  const [merma, setMerma] = useState('0');

  useEffect(() => {
    if (isOpen) {
      setName(item?.name || '');
      setPrice(item?.price.toString() || '');
      
      // Handle Image URL
      if (item && 'imageUrl' in item) {
          setImageUrl(item.imageUrl || '');
      } else {
          setImageUrl('');
      }

      // Handle Category
      if (item && 'category' in item) {
          setCategory((item as ProductItem).category || 'Adicionales');
      } else {
          setCategory('Adicionales');
      }
      
      // Initialize Cost Fields
      if (itemType === 'flower' && item) {
          const f = item as FlowerItem;
          setCostoPaquete(f.costoPaquete?.toString() || '0');
          setCantidadPorPaquete(f.cantidadPorPaquete?.toString() || '0');
          setMerma(f.merma?.toString() || '0');
          // Reset product fields
          setCosto('0');
      } else if ((itemType === 'fixed' || itemType === 'product') && item) {
          const p = item as ProductItem;
          setCosto(p.costo?.toString() || '0');
          // Reset flower fields
          setCostoPaquete('0');
          setCantidadPorPaquete('0');
          setMerma('0');
      } else {
          // New Item defaults
          setCosto('0');
          setCostoPaquete('0');
          setCantidadPorPaquete('0');
          setMerma('0');
      }
    }
  }, [isOpen, item, itemType]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const priceNumber = parseFloat(price);
    if (name.trim() && !isNaN(priceNumber) && priceNumber >= 0) {
      const savedData: any = {
        name: name.trim(),
        price: priceNumber,
        visible: item?.visible ?? true,
        imageUrl: imageUrl.trim(),
      };
      
      if (itemType === 'fixed' || itemType === 'product') { // Products
          savedData.category = category;
          savedData.costo = parseFloat(costo) || 0;
      }
      
      if (itemType === 'flower') {
          savedData.costoPaquete = parseFloat(costoPaquete) || 0;
          savedData.cantidadPorPaquete = parseInt(cantidadPorPaquete) || 0;
          savedData.merma = parseInt(merma) || 0;
      }
      
      // @ts-ignore
      onSave(savedData);
    }
  };

  if (!isOpen) return null;

  const isProduct = itemType === 'fixed' || itemType === 'product';
  const isFlower = itemType === 'flower';

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-gray-800 border border-gray-700 rounded-2xl p-6 w-full max-w-lg shadow-2xl shadow-purple-500/20 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold mb-4 text-purple-300">{item ? 'Editar Item' : 'Añadir Item'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block mb-1 text-sm font-medium text-gray-400">Nombre del Item</label>
            <input type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} className="bg-gray-700 border border-gray-600 text-white text-sm rounded-lg block w-full p-2.5" required />
          </div>
          
          {isProduct && (
             <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label htmlFor="category" className="block mb-1 text-sm font-medium text-gray-400">Categoría</label>
                    <select id="category" value={category} onChange={(e) => setCategory(e.target.value)} className="bg-gray-700 border border-gray-600 text-white text-sm rounded-lg block w-full p-2.5">
                        {PRODUCT_CATEGORIES.map(cat => (<option key={cat} value={cat}>{cat}</option>))}
                    </select>
                 </div>
                 <div>
                    <label htmlFor="costo" className="block mb-1 text-sm font-medium text-gray-400">Costo Unitario (S/)</label>
                    <input type="number" id="costo" value={costo} onChange={(e) => setCosto(e.target.value)} className="bg-gray-700 border border-gray-600 text-white text-sm rounded-lg block w-full p-2.5" step="0.01" min="0" />
                 </div>
             </div>
          )}
          
          {isFlower && (
              <div className="grid grid-cols-3 gap-3 bg-gray-700/30 p-3 rounded-lg border border-gray-600/50">
                  <div>
                    <label htmlFor="costoPaquete" className="block mb-1 text-xs font-medium text-gray-400">Costo Paq.</label>
                    <input type="number" id="costoPaquete" value={costoPaquete} onChange={(e) => setCostoPaquete(e.target.value)} className="bg-gray-700 border border-gray-600 text-white text-sm rounded-lg block w-full p-2" step="0.01" min="0" />
                  </div>
                  <div>
                    <label htmlFor="cantidad" className="block mb-1 text-xs font-medium text-gray-400">Cant/Paq</label>
                    <input type="number" id="cantidad" value={cantidadPorPaquete} onChange={(e) => setCantidadPorPaquete(e.target.value)} className="bg-gray-700 border border-gray-600 text-white text-sm rounded-lg block w-full p-2" step="1" min="0" />
                  </div>
                   <div>
                    <label htmlFor="merma" className="block mb-1 text-xs font-medium text-gray-400">Merma</label>
                    <input type="number" id="merma" value={merma} onChange={(e) => setMerma(e.target.value)} className="bg-gray-700 border border-gray-600 text-white text-sm rounded-lg block w-full p-2" step="1" min="0" />
                  </div>
              </div>
          )}

          <div>
            <label htmlFor="price" className="block mb-1 text-sm font-medium text-gray-400">Precio Venta Público (S/)</label>
            <input type="number" id="price" value={price} onChange={(e) => setPrice(e.target.value)} className="bg-gray-700 border border-gray-600 text-white text-sm rounded-lg block w-full p-2.5" required step="0.01" min="0" />
          </div>
          
          <div>
            <label htmlFor="imageUrl" className="block mb-1 text-sm font-medium text-gray-400">URL de la Imagen</label>
            <input type="text" id="imageUrl" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} className="bg-gray-700 border border-gray-600 text-white text-sm rounded-lg block w-full p-2.5" placeholder="https://example.com/image.jpg" />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="py-2 px-4 text-sm font-medium text-gray-300 bg-gray-600 rounded-lg hover:bg-gray-500 transition-colors">Cancelar</button>
            <button type="submit" className="py-2 px-4 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors">Guardar</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Modal;
