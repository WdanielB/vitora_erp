
import type { FlowerItem, FixedItem, User, StockItem, Order, Event, FixedExpense, FinancialSummary, Client, StockMovement, View } from '../types';

const API_BASE_URL = 'https://ad-erp-backend.onrender.com';

// --- Authentication ---
export const login = async (username: string, password: string): Promise<User> => {
    const response = await fetch(`${API_BASE_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
        let errorData;
        try {
           errorData = await response.json();
        } catch(e) {
            throw new Error('Error de conexión con el servidor.');
        }
        throw new Error(errorData.error || 'Error de autenticación');
    }
    return response.json();
};

// --- Generic Fetch and Update Functions ---
const fetchData = async <T>(endpoint: string, user: User, selectedUserId: string | null = null): Promise<T> => {
    if (!user?._id) {
        throw new Error("Usuario no autenticado.");
    }
    try {
        const params = new URLSearchParams({ userId: user._id, role: user.role });
        if (user.role === 'admin' && selectedUserId) {
            params.append('selectedUserId', selectedUserId);
        }

        const response = await fetch(`${API_BASE_URL}${endpoint}?${params.toString()}`);
        if (!response.ok) {
            throw new Error(`El servidor respondió con el estado: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.warn(`API: Falló la obtención de datos para ${endpoint}.`, error);
        throw error;
    }
};


const postData = async <T, R>(endpoint: string, data: T): Promise<R> => {
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        
        const text = await response.text();
        if (!response.ok) {
            throw new Error(`El servidor respondió con el estado: ${response.status} - ${text}`);
        }
        
        // Handle empty response body
        if (!text) {
            return {} as R;
        }

        return JSON.parse(text);
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

// --- Users (for Admin) ---
export const fetchUsers = (user: User): Promise<User[]> => fetchData('/api/users', user);

// --- PIN Management ---
export const updateUserPins = (userId: string, pins: { [key in View]?: string }): Promise<User> => {
    return postData(`/api/users/pins`, { userId, pins });
};

// --- Products ---
export const fetchFlowerItems = (user: User, selectedUserId?: string | null): Promise<FlowerItem[]> => fetchData('/api/flowers', user, selectedUserId);
export const updateFlowerItems = (items: FlowerItem[], userId: string): Promise<FlowerItem[]> => updateData('/api/flowers', items, userId);
export const fetchFixedItems = (user: User, selectedUserId?: string | null): Promise<FixedItem[]> => fetchData('/api/fixed-items', user, selectedUserId);
export const updateFixedItems = (items: FixedItem[], userId: string): Promise<FixedItem[]> => updateData('/api/fixed-items', items, userId);

// --- Stock ---
export const fetchStock = (user: User, selectedUserId?: string | null): Promise<StockItem[]> => fetchData('/api/stock', user, selectedUserId);
export const updateStockBatch = (updates: { itemId: string; change: number; type: 'flower' | 'fixed'; userId: string, movementType: 'compra' | 'merma' | 'ajuste' }[]): Promise<any> => postData('/api/stock/update-batch', { updates });
export const fetchStockHistory = (itemId: string, user: User, selectedUserId?: string | null): Promise<StockMovement[]> => fetchData(`/api/stock/history/${itemId}`, user, selectedUserId);


// --- Orders ---
export const fetchOrders = (user: User, selectedUserId?: string | null): Promise<Order[]> => fetchData('/api/orders', user, selectedUserId);
export const createOrder = (order: Omit<Order, 'createdAt' | '_id'>): Promise<Order> => postData('/api/orders', order);

// --- Clients ---
export const fetchClients = (user: User, selectedUserId?: string | null): Promise<Client[]> => fetchData('/api/clients', user, selectedUserId);
export const createClient = (client: Omit<Client, '_id'>): Promise<Client> => postData('/api/clients', client);

// --- Calendar / Events ---
export const fetchEvents = (user: User, selectedUserId?: string | null): Promise<Event[]> => fetchData('/api/events', user, selectedUserId);

// --- Finance ---
export const fetchFixedExpenses = (user: User, selectedUserId?: string | null): Promise<FixedExpense[]> => fetchData('/api/fixed-expenses', user, selectedUserId);
export const fetchFinancialSummary = (user: User, selectedUserId?: string | null): Promise<FinancialSummary> => fetchData('/api/finance/summary', user, selectedUserId);