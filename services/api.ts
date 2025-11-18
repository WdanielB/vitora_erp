
import type { FlowerItem, FixedItem, User, StockItem, Order, Event, FixedExpense, FinancialSummary, Client, StockMovement, View } from '../types.ts';

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


const postData = async <T, R>(endpoint: string, data: T, requesterId?: string): Promise<R> => {
    try {
        const headers: HeadersInit = { 'Content-Type': 'application/json' };
        if (requesterId) {
            headers['x-user-id'] = requesterId;
        }

        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'POST',
            headers,
            body: JSON.stringify(data),
        });
        
        const text = await response.text();
        if (!response.ok) {
            console.error(`API: Falló el POST en ${endpoint}. Respuesta: ${text}`);
            throw new Error(`El servidor respondió con el estado: ${response.status} - ${text}`);
        }
        
        if (!text) {
            return {} as R;
        }

        return JSON.parse(text);
    } catch (error) {
        console.error(`API: Falló el POST en ${endpoint}.`, error);
        throw error;
    }
};

const putData = async <T, R>(endpoint: string, data: T, requesterId?: string): Promise<R> => {
    try {
        const headers: HeadersInit = { 'Content-Type': 'application/json' };
        if (requesterId) {
            headers['x-user-id'] = requesterId;
        }
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'PUT',
            headers,
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            throw new Error(`Server responded with status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error(`API: PUT request failed for ${endpoint}.`, error);
        throw error;
    }
};

const deleteData = async (endpoint: string, requesterId?: string): Promise<{ success: boolean }> => {
    try {
        const headers: HeadersInit = {};
        if (requesterId) {
            headers['x-user-id'] = requesterId;
        }
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'DELETE',
            headers,
        });
        if (!response.ok) {
            throw new Error(`Server responded with status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error(`API: DELETE request failed for ${endpoint}.`, error);
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
export const updateUserPins = (userIdToUpdate: string, pins: { [key in View]?: string }, adminId: string): Promise<{ success: boolean }> => {
    return postData(`/api/users/pins`, { userId: userIdToUpdate, pins }, adminId);
};

// --- Products ---
export const fetchFlowerItems = (user: User, selectedUserId?: string | null): Promise<FlowerItem[]> => fetchData('/api/flowers', user, selectedUserId);
export const updateFlowerItems = (items: FlowerItem[], userId: string): Promise<FlowerItem[]> => updateData('/api/flowers', items, userId);
export const fetchFixedItems = (user: User, selectedUserId?: string | null): Promise<FixedItem[]> => fetchData('/api/fixed-items', user, selectedUserId);
export const updateFixedItems = (items: FixedItem[], userId: string): Promise<FixedItem[]> => updateData('/api/fixed-items', items, userId);

// --- Stock ---
export const fetchStock = (user: User, selectedUserId?: string | null): Promise<StockItem[]> => fetchData('/api/stock', user, selectedUserId);
export const updateStockBatch = (updates: { itemId: string; change: number; type: 'flower' | 'fixed'; userId: string, movementType: 'compra' | 'merma' | 'ajuste' }[], userId: string): Promise<{ success: boolean }> => postData('/api/stock/update-batch', { updates }, userId);
export const fetchStockHistory = (itemId: string, user: User, selectedUserId?: string | null): Promise<StockMovement[]> => fetchData(`/api/stock/history/${itemId}`, user, selectedUserId);


// --- Orders ---
export const fetchOrders = (user: User, selectedUserId?: string | null): Promise<Order[]> => fetchData('/api/orders', user, selectedUserId);
export const createOrder = (order: Omit<Order, 'createdAt' | '_id'>, userId: string): Promise<Order> => postData('/api/orders', order, userId);
export const updateOrder = (order: Order, userId: string): Promise<Order> => putData(`/api/orders/${order._id}`, order, userId);
export const deleteOrder = (orderId: string, userId: string): Promise<{ success: boolean }> => deleteData(`/api/orders/${orderId}`, userId);

// --- Clients ---
export const fetchClients = (user: User, selectedUserId?: string | null): Promise<Client[]> => fetchData('/api/clients', user, selectedUserId);
export const createClient = (client: Omit<Client, '_id'>): Promise<Client> => postData('/api/clients', client);

// --- Calendar / Events ---
export const fetchEvents = (user: User, selectedUserId?: string | null): Promise<Event[]> => fetchData('/api/events', user, selectedUserId);
export const createEvent = (event: Omit<Event, '_id'>, userId: string): Promise<Event> => postData('/api/events', event, userId);
export const updateEvent = (event: Event, userId: string): Promise<Event> => putData(`/api/events/${event._id}`, event, userId);
export const deleteEvent = (eventId: string, userId: string): Promise<{ success: boolean }> => deleteData(`/api/events/${eventId}`, userId);


// --- Finance ---
export const fetchFixedExpenses = (user: User, selectedUserId?: string | null): Promise<FixedExpense[]> => fetchData('/api/fixed-expenses', user, selectedUserId);
export const createFixedExpense = (expense: Omit<FixedExpense, '_id'>, userId: string): Promise<FixedExpense> => postData('/api/fixed-expenses', expense, userId);
export const updateFixedExpense = (expense: FixedExpense, userId: string): Promise<FixedExpense> => putData(`/api/fixed-expenses/${expense._id}`, expense, userId);
export const deleteFixedExpense = (expenseId: string, userId: string): Promise<{ success: boolean }> => deleteData(`/api/fixed-expenses/${expenseId}`, userId);
export const fetchFinancialSummary = (user: User, selectedUserId?: string | null): Promise<FinancialSummary> => fetchData('/api/finance/summary', user, selectedUserId);