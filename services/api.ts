
import type { FlowerItem, FixedItem } from '../types';
import { DEFAULT_FLOWER_ITEMS, DEFAULT_FIXED_ITEMS } from '../constants';

// La URL base ahora se toma de una variable de entorno, lo que es ideal para producción.
// En Render, configurarás una variable de entorno llamada VITE_API_BASE_URL con la URL de tu backend.
const API_BASE_URL = process.env.VITE_API_BASE_URL || 'http://localhost:3001';

// --- Funciones de LocalStorage (para respaldo y caché) ---

const getItemsFromStorage = <T,>(key: string, defaultValue: T): T => {
  try {
    const item = window.localStorage.getItem(key);
    if (item) {
      return JSON.parse(item);
    }
    // Si no hay nada, guarda el valor por defecto para la próxima vez.
    window.localStorage.setItem(key, JSON.stringify(defaultValue));
    return defaultValue;
  } catch (error) {
    console.error(`Error al leer de localStorage con la clave “${key}”:`, error);
    return defaultValue;
  }
};

/**
 * Obtiene items directamente de localStorage. Devuelve null si no hay nada.
 * Esto es útil para saber si hay datos guardados por el usuario versus datos por defecto.
 */
export const getItemsFromStorageOnly = <T,>(key: string): T | null => {
  try {
    const item = window.localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  } catch (error) {
    console.error(`Error al leer de localStorage con la clave “${key}”:`, error);
    return null;
  }
}

const saveItemsToStorage = <T,>(key: string, value: T) => {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error al guardar en localStorage con la clave “${key}”:`, error);
  }
};


// --- Funciones de la API ---

export const fetchFlowerItems = async (): Promise<FlowerItem[]> => {
  try {
    console.log("API: Intentando obtener flores desde el backend...");
    const response = await fetch(`${API_BASE_URL}/api/flowers`);
    if (!response.ok) {
      throw new Error(`El servidor respondió con el estado: ${response.status}`);
    }
    const data = await response.json();
    console.log("API: Flores obtenidas con éxito. Guardando en caché local.");
    saveItemsToStorage('flowerItems', data); // Guardar la última versión buena
    return data;
  } catch (error) {
    console.warn("API: Falló la obtención de flores desde el backend. Usando datos de localStorage.", error);
    return getItemsFromStorage<FlowerItem[]>('flowerItems', DEFAULT_FLOWER_ITEMS);
  }
};

export const updateFlowerItems = async (items: FlowerItem[]): Promise<FlowerItem[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/flowers`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(items),
    });

    if (!response.ok) {
      throw new Error(`El servidor respondió con el estado: ${response.status}`);
    }
    
    const data = await response.json();
    saveItemsToStorage('flowerItems', data); // Actualizar caché
    return data;

  } catch (error) {
    console.error("API: Falló la actualización de flores en el backend.", error);
    // Como fallback, podríamos guardar en localStorage, pero lo ideal es manejar el error en la UI.
    saveItemsToStorage('flowerItems', items); // Guardar localmente si falla el backend
    throw error; // Propagar el error para que la UI pueda reaccionar
  }
};

export const fetchFixedItems = async (): Promise<FixedItem[]> => {
  try {
    console.log("API: Intentando obtener items fijos desde el backend...");
    const response = await fetch(`${API_BASE_URL}/api/fixed-items`);
    if (!response.ok) {
      throw new Error(`El servidor respondió con el estado: ${response.status}`);
    }
    const data = await response.json();
    console.log("API: Items fijos obtenidos con éxito. Guardando en caché local.");
    saveItemsToStorage('fixedItems', data);
    return data;
  } catch (error) {
    console.warn("API: Falló la obtención de items fijos desde el backend. Usando datos de localStorage.", error);
    return getItemsFromStorage<FixedItem[]>('fixedItems', DEFAULT_FIXED_ITEMS);
  }
};

export const updateFixedItems = async (items: FixedItem[]): Promise<FixedItem[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/fixed-items`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(items),
    });

    if (!response.ok) {
      throw new Error(`El servidor respondió con el estado: ${response.status}`);
    }
    
    const data = await response.json();
    saveItemsToStorage('fixedItems', data); // Actualizar caché
    return data;

  } catch (error) {
    console.error("API: Falló la actualización de items fijos en el backend.", error);
    saveItemsToStorage('fixedItems', items); // Guardar localmente si falla el backend
    throw error; // Propagar el error
  }
};
