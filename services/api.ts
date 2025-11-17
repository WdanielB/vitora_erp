
import type { FlowerItem, FixedItem, User, StockItem, Order, Event, FixedExpense, FinancialSummary } from '../types';
import { DEFAULT_FLOWER_ITEMS, DEFAULT_FIXED_ITEMS } from '../constants';

const API_BASE_URL = 'https://ad-erp-backend.onrender.com';

// --- Authentication ---
export const login = async (username: string, password: string): Promise<User> => {
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

// --- Generic Fetch and Update Functions ---
const fetchData = async <T>(endpoint: string, userId: string, fallbackData: T): Promise<T> => {
    if (!userId) {
        console.warn(`UserId no proporcionado para ${endpoint}, devolviendo datos de respaldo.`);
        return fallbackData;
    }
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}?userId=${userId}`);
        if (!response.ok) {
            throw new Error(`El servidor respondió con el estado: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.warn(`API: Falló la obtención de datos para ${endpoint}.`, error);
        return fallbackData; // Devuelve datos por defecto en caso de error de red
    }
};

const postData = async <T, R>(endpoint: string, data: T): Promise<R> => {
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`El servidor respondió con el estado: ${response.status} - ${errorText}`);
        }
        return await response.json();
    } catch (error) {
        console.error(`API: Falló el POST en ${endpoint}.`, error);
        throw error;
    }
};


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
        return await response.json();
    } catch (error) {
        console.error(`API: Falló la actualización de datos en ${endpoint}.`, error);
        throw error;
    }
};

// --- Products ---
export const fetchFlowerItems = (userId: string): Promise<FlowerItem[]> => fetchData('/api/flowers', userId, DEFAULT_FLOWER_ITEMS);
export const updateFlowerItems = (items: FlowerItem[], userId: string): Promise<FlowerItem[]> => updateData('/api/flowers', items, userId);
export const fetchFixedItems = (userId: string): Promise<FixedItem[]> => fetchData('/api/fixed-items', userId, DEFAULT_FIXED_ITEMS);
export const updateFixedItems = (items: FixedItem[], userId: string): Promise<FixedItem[]> => updateData('/api/fixed-items', items, userId);

// --- Stock ---
export const fetchStock = (userId: string): Promise<StockItem[]> => fetchData('/api/stock', userId, []);
export const updateStock = (stockUpdate: { itemId: string; change: number; type: 'flower' | 'fixed'; userId: string }): Promise<StockItem> => postData('/api/stock/update', stockUpdate);

// --- Orders ---
export const fetchOrders = (userId: string): Promise<Order[]> => fetchData('/api/orders', userId, []);
export const createOrder = (order: Omit<Order, 'createdAt'>): Promise<Order> => postData('/api/orders', order);

// --- Calendar / Events ---
export const fetchEvents = (userId: string): Promise<Event[]> => fetchData('/api/events', userId, []);

// --- Finance ---
export const fetchFixedExpenses = (userId: string): Promise<FixedExpense[]> => fetchData('/api/fixed-expenses', userId, []);
export const fetchFinancialSummary = (userId: string): Promise<FinancialSummary> => fetchData('/api/finance/summary', userId, { totalRevenue: 0, totalCostOfGoods: 0, wastedGoodsCost: 0, fixedExpenses: 0, netProfit: 0 });
