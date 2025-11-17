
import type { FlowerItem, FixedItem, User, StockItem, Order, Event, FixedExpense, FinancialSummary, Client } from '../types';
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
const fetchData = async <T>(endpoint: string, user: User, fallbackData: T): Promise<T> => {
    if (!user?._id) {
        console.warn(`Usuario no proporcionado para ${endpoint}, devolviendo datos de respaldo.`);
        return fallbackData;
    }
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}?userId=${user._id}&role=${user.role}`);
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
export const fetchFlowerItems = (user: User): Promise<FlowerItem[]> => fetchData('/api/flowers', user, DEFAULT_FLOWER_ITEMS);
export const updateFlowerItems = (items: FlowerItem[], userId: string): Promise<FlowerItem[]> => updateData('/api/flowers', items, userId);
export const fetchFixedItems = (user: User): Promise<FixedItem[]> => fetchData('/api/fixed-items', user, DEFAULT_FIXED_ITEMS);
export const updateFixedItems = (items: FixedItem[], userId: string): Promise<FixedItem[]> => updateData('/api/fixed-items', items, userId);

// --- Stock ---
export const fetchStock = (user: User): Promise<StockItem[]> => fetchData('/api/stock', user, []);
export const updateStock = (stockUpdate: { itemId: string; change: number; type: 'flower' | 'fixed'; userId: string }): Promise<StockItem> => postData('/api/stock/update', stockUpdate);

// --- Orders ---
export const fetchOrders = (user: User): Promise<Order[]> => fetchData('/api/orders', user, []);
export const createOrder = (order: Omit<Order, 'createdAt' | '_id'>): Promise<Order> => postData('/api/orders', order);

// --- Clients ---
export const fetchClients = (user: User): Promise<Client[]> => fetchData('/api/clients', user, []);
export const createClient = (client: Omit<Client, '_id'>): Promise<Client> => postData('/api/clients', client);

// --- Calendar / Events ---
export const fetchEvents = (user: User): Promise<Event[]> => fetchData('/api/events', user, []);

// --- Finance ---
export const fetchFixedExpenses = (user: User): Promise<FixedExpense[]> => fetchData('/api/fixed-expenses', user, []);
export const fetchFinancialSummary = (user: User): Promise<FinancialSummary> => fetchData('/api/finance/summary', user, { totalRevenue: 0, totalCostOfGoods: 0, wastedGoodsCost: 0, fixedExpenses: 0, netProfit: 0 });