import type { FlowerItem, FixedItem, User } from '../types';
import { DEFAULT_FLOWER_ITEMS, DEFAULT_FIXED_ITEMS } from '../constants';

// FIX: Se establece directamente la URL del backend de producción para resolver
// los problemas con las variables de entorno. Esto soluciona tanto el error
// "TypeError" como el de "Failed to fetch", asegurando que el frontend
// siempre apunte al backend correcto en Render.com.
const API_BASE_URL = 'https://ad-erp-backend.onrender.com';

// --- Authentication ---
export const login = async (username: string, password: string):Promise<User> => {
    const response = await fetch(`${API_BASE_URL}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error de autenticación');
    }
    return response.json();
};

// --- Funciones de LocalStorage (para respaldo y caché) ---

const getItemsFromStorage = <T,>(key: string, defaultValue: T): T => {
  try {
    const item = window.localStorage.getItem(key);
    if (item) {
      return JSON.parse(item);
    }
    window.localStorage.setItem(key, JSON.stringify(defaultValue));
    return defaultValue;
  } catch (error) {
    console.error(`Error al leer de localStorage con la clave “${key}”:`, error);
    return defaultValue;
  }
};

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

// --- Funciones de la API (Multi-user ready) ---
// Generic fetch function to include userId
const fetchData = async <T>(endpoint: string, userId: string, fallbackData: T): Promise<T> => {
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}?userId=${userId}`);
        if (!response.ok) {
            throw new Error(`El servidor respondió con el estado: ${response.status}`);
        }
        const data = await response.json();
        saveItemsToStorage(endpoint.split('/')[2] + `-${userId}`, data);
        return data;
    } catch (error) {
        console.warn(`API: Falló la obtención de datos para ${endpoint}. Usando datos de localStorage.`, error);
        return getItemsFromStorage<T>(endpoint.split('/')[2] + `-${userId}`, fallbackData);
    }
};

// Generic update function to include userId
const updateData = async <T>(endpoint: string, items: T[], userId: string): Promise<T[]> => {
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ items, userId }),
        });
        if (!response.ok) {
            throw new Error(`El servidor respondió con el estado: ${response.status}`);
        }
        const data = await response.json();
        saveItemsToStorage(endpoint.split('/')[2] + `-${userId}`, data);
        return data;
    } catch (error) {
        console.error(`API: Falló la actualización de datos en ${endpoint}.`, error);
        saveItemsToStorage(endpoint.split('/')[2] + `-${userId}`, items);
        throw error;
    }
};


export const fetchFlowerItems = async (userId: string): Promise<FlowerItem[]> => {
  return fetchData('/api/flowers', userId, DEFAULT_FLOWER_ITEMS);
};

export const updateFlowerItems = async (items: FlowerItem[], userId: string): Promise<FlowerItem[]> => {
  return updateData('/api/flowers', items, userId);
};

export const fetchFixedItems = async (userId: string): Promise<FixedItem[]> => {
  return fetchData('/api/fixed-items', userId, DEFAULT_FIXED_ITEMS);
};

export const updateFixedItems = async (items: FixedItem[], userId: string): Promise<FixedItem[]> => {
  return updateData('/api/fixed-items', items, userId);
};