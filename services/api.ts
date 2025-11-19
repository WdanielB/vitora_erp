
import type { FlowerItem, ProductItem, VariationGift, User, StockItem, Order, Event, FixedExpense, FinancialSummary, Client, StockMovement, PriceRecord, View } from '../types.ts';
import { DEFAULT_FLOWER_ITEMS, DEFAULT_PRODUCTS, DEFAULT_VARIATION_GIFTS } from '../constants.ts';

const API_BASE_URL = 'https://ad-erp-backend.onrender.com'; 

const MOCK_DELAY = 400;
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const checkBackendHealth = async (retries = 5, delay = 2000): Promise<boolean> => {
    for (let i = 0; i < retries; i++) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/health`);
            if (response.ok) return true;
        } catch (error) { if (i < retries - 1) await sleep(delay); }
    }
    return false;
};

export const login = async (username: string, password: string): Promise<User> => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/login`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password }),
        });
        if (!response.ok) {
            let errorMessage = 'Contraseña o usuario incorrecto';
            try { const errorData = await response.json(); if (errorData.error) errorMessage = errorData.error; } catch (e) {}
            throw new Error(errorMessage);
        }
        return await response.json();
    } catch (error: any) {
        if (error.message === 'Failed to fetch' || error.name === 'TypeError') {
             // FALLBACK LOGIN FOR OFFLINE USE
             if (username.toLowerCase() === 'admin' && password === 'admin.1') return { _id: 'local-admin', username: 'ADMIN', role: 'admin', modulePins: { finance: '1234' } };
             if (username.toLowerCase() === 'floreria1' && password === 'user.1') return { _id: 'local-user', username: 'Floreria1', role: 'user' };
        }
        throw error;
    }
};

const fetchData = async <T>(endpoint: string, user: User, selectedUserId: string | null = null): Promise<T> => {
    if (user._id.startsWith('local-')) {
         await sleep(MOCK_DELAY);
         if (endpoint.includes('/flowers')) return DEFAULT_FLOWER_ITEMS as unknown as T;
         if (endpoint.includes('/products')) return DEFAULT_PRODUCTS as unknown as T;
         if (endpoint.includes('/variation-gifts')) return DEFAULT_VARIATION_GIFTS as unknown as T;
         return [] as unknown as T;
    }
    try {
        const params = new URLSearchParams({ userId: user._id, role: user.role });
        if (user.role === 'admin' && selectedUserId) params.append('selectedUserId', selectedUserId);
        const response = await fetch(`${API_BASE_URL}${endpoint}?${params.toString()}`);
        if (!response.ok) throw new Error(`Status: ${response.status}`);
        return await response.json();
    } catch (error) {
        console.warn(`Fallo al cargar ${endpoint}, usando local.`);
        if (endpoint.includes('/flowers')) return DEFAULT_FLOWER_ITEMS as unknown as T;
        return [] as unknown as T;
    }
};

const postData = async <T, R>(endpoint: string, data: T, requesterId?: string): Promise<R> => {
    if (requesterId?.startsWith('local-')) { await sleep(MOCK_DELAY); return {} as R; }
    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    if (requesterId) headers['x-user-id'] = requesterId;
    const response = await fetch(`${API_BASE_URL}${endpoint}`, { method: 'POST', headers, body: JSON.stringify(data) });
    if (!response.ok) throw new Error('Error en POST');
    const text = await response.text();
    return text ? JSON.parse(text) : {} as R;
};

const putData = async <T, R>(endpoint: string, data: T, requesterId?: string): Promise<R> => {
    if (requesterId?.startsWith('local-')) { await sleep(MOCK_DELAY); return {} as R; }
    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    if (requesterId) headers['x-user-id'] = requesterId;
    const response = await fetch(`${API_BASE_URL}${endpoint}`, { method: 'PUT', headers, body: JSON.stringify(data) });
    if (!response.ok) throw new Error('Error en PUT');
    return await response.json();
};

const deleteData = async (endpoint: string, requesterId?: string): Promise<{ success: boolean }> => {
    if (requesterId?.startsWith('local-')) return { success: true };
    const headers: HeadersInit = {};
    if (requesterId) headers['x-user-id'] = requesterId;
    const response = await fetch(`${API_BASE_URL}${endpoint}`, { method: 'DELETE', headers });
    if (!response.ok) {
        const json = await response.json();
        throw new Error(json.error || 'Error al eliminar');
    }
    return await response.json();
};

const updateData = async <T>(endpoint: string, items: T[], userId: string): Promise<T[]> => {
    if (userId.startsWith('local-')) return items;
    const response = await fetch(`${API_BASE_URL}${endpoint}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ items, userId }) });
    if (!response.ok) throw new Error('Error Batch Update');
    return await response.json();
};

// EXPORTS
export const fetchUsers = (user: User) => fetchData<User[]>('/api/users', user);
export const createUser = (u: any, adminId: string) => postData('/api/users', u, adminId);
export const updateUser = (id: string, u: any, adminId: string) => putData(`/api/users/${id}`, u, adminId);
export const deleteUser = (id: string, adminId: string) => deleteData(`/api/users/${id}`, adminId);
export const updateUserPins = (id: string, pins: any, adminId: string) => postData(`/api/users/pins`, { userId: id, pins }, adminId);

export const fetchFlowerItems = (user: User, id?: string | null) => fetchData<FlowerItem[]>('/api/flowers', user, id);
export const updateFlowerItems = (items: FlowerItem[], userId: string) => updateData('/api/flowers', items, userId);

export const fetchProductItems = (user: User, id?: string | null) => fetchData<ProductItem[]>('/api/products', user, id);
export const updateProductItems = (items: ProductItem[], userId: string) => updateData('/api/products', items, userId);

export const fetchVariationGifts = (user: User, id?: string | null) => fetchData<VariationGift[]>('/api/variation-gifts', user, id);
export const updateVariationGifts = (items: VariationGift[], userId: string) => updateData('/api/variation-gifts', items, userId);

export const fetchStock = (user: User, id?: string | null) => fetchData<StockItem[]>('/api/stock', user, id);
export const updateStockBatch = (updates: any[], userId: string) => postData('/api/stock/update-batch', { updates }, userId);
export const fetchStockHistory = (itemId: string, user: User, id?: string | null) => fetchData<StockMovement[]>(`/api/stock/history/${itemId}`, user, id);

export const fetchOrders = (user: User, id?: string | null) => fetchData<Order[]>('/api/orders', user, id);
export const createOrder = (order: any, userId: string) => postData<any, Order>('/api/orders', order, userId);
export const updateOrder = (order: any, userId: string) => putData(`/api/orders/${order._id}`, order, userId);
export const deleteOrder = (id: string, userId: string) => deleteData(`/api/orders/${id}`, userId);

export const fetchClients = (user: User, id?: string | null) => fetchData<Client[]>('/api/clients', user, id);
export const createClient = (client: any) => postData('/api/clients', client);

export const fetchEvents = (user: User, id?: string | null) => fetchData<Event[]>('/api/events', user, id);
export const createEvent = (e: any, u: string) => postData('/api/events', e, u);
export const updateEvent = (e: any, u: string) => putData(`/api/events/${e._id}`, e, u);
export const deleteEvent = (id: string, u: string) => deleteData(`/api/events/${id}`, u);

export const fetchFixedExpenses = (user: User, id?: string | null) => fetchData<FixedExpense[]>('/api/fixed-expenses', user, id);
export const createFixedExpense = (e: any, u: string) => postData('/api/fixed-expenses', e, u);
export const updateFixedExpense = (e: any, u: string) => putData(`/api/fixed-expenses/${e._id}`, e, u);
export const deleteFixedExpense = (id: string, u: string) => deleteData(`/api/fixed-expenses/${id}`, u);

export const fetchFinancialSummary = (user: User, id?: string | null) => fetchData<FinancialSummary>('/api/finance/summary', user, id);
export const fetchRecordPrices = (user: User, id?: string | null) => fetchData<PriceRecord[]>('/api/record-prices', user, id);

// Backup
export const fetchFullBackup = async (userId: string) => {
    const response = await fetch(`${API_BASE_URL}/api/backup/${userId}`);
    if(!response.ok) throw new Error("Backup failed");
    return await response.json();
};
