import type { FlowerItem, FixedItem } from '../types';
import { DEFAULT_FLOWER_ITEMS, DEFAULT_FIXED_ITEMS } from '../constants';

// Reemplaza esta URL con la URL de tu Web Service de Render
const API_BASE_URL = 'https://vitora-backend.onrender.com'; 

// --- API Functions ---

// Flowers
export const fetchFlowerItems = async (): Promise<FlowerItem[]> => {
  console.log("API: Fetching flower items from real backend...");
  // Esta es la nueva lógica que llama a tu backend real.
  const response = await fetch(`${API_BASE_URL}/api/flowers`);
  if (!response.ok) {
    throw new Error('No se pudieron cargar los datos de las flores desde el servidor.');
  }
  return response.json();
};

export const updateFlowerItems = async (items: FlowerItem[]): Promise<FlowerItem[]> => {
    // TODO: Implementar el endpoint en el backend para actualizar las flores.
    // Por ahora, lo mantenemos en localStorage para que la app no se rompa.
    console.warn("API: updateFlowerItems todavía usa localStorage. Se necesita endpoint en backend.");
    saveItemsToStorage('flowerItems', items);
    return items;
};

// Fixed Items
export const fetchFixedItems = async (): Promise<FixedItem[]> => {
  // TODO: Implementar el endpoint en el backend para los items fijos.
  // Por ahora, lo mantenemos en localStorage para que la app no se rompa.
  console.warn("API: fetchFixedItems todavía usa localStorage. Se necesita endpoint en backend.");
  return getItemsFromStorage<FixedItem[]>('fixedItems', DEFAULT_FIXED_ITEMS);
};

export const updateFixedItems = async (items: FixedItem[]): Promise<FixedItem[]> => {
    // TODO: Implementar el endpoint en el backend para actualizar los items fijos.
    console.warn("API: updateFixedItems todavía usa localStorage. Se necesita endpoint en backend.");
    saveItemsToStorage('fixedItems', items);
    return items;
};


// --- Funciones de LocalStorage (para las partes no migradas) ---

const getItemsFromStorage = <T,>(key: string, defaultValue: T): T => {
  try {
    const item = window.localStorage.getItem(key);
    if (item) {
      return JSON.parse(item);
    }
    window.localStorage.setItem(key, JSON.stringify(defaultValue));
    return defaultValue;
  } catch (error) {
    console.error(`Error reading from localStorage key “${key}”:`, error);
    return defaultValue;
  }
};

const saveItemsToStorage = <T,>(key: string, value: T) => {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error saving to localStorage key “${key}”:`, error);
  }
};
