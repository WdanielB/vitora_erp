
import type { FlowerItem, FixedItem, User, StockItem, Order, Event, FixedExpense, FinancialSummary, Client, StockMovement, View } from '../types.ts';
import { DEFAULT_FLOWER_ITEMS, DEFAULT_FIXED_ITEMS } from '../constants.ts';

// Apuntar al servidor de producción en Render
const API_BASE_URL = 'https://ad-erp-backend.onrender.com'; 

// --- Mock Data Helpers ---
const MOCK_DELAY = 400; // Simula latencia de red ligera

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// --- Health Check con Reintentos (Ping-Pong para Render Cold Start) ---
export const checkBackendHealth = async (retries = 5, delay = 2000): Promise<boolean> => {
    for (let i = 0; i < retries; i++) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/health`);
            if (response.ok) return true;
        } catch (error) {
            // Si falla, esperamos y reintentamos (el servidor puede estar despertando)
            if (i < retries - 1) await sleep(delay);
        }
    }
    return false;
};

// --- Authentication ---
export const login = async (username: string, password: string): Promise<User> => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }),
        });

        if (!response.ok) {
            let errorMessage = 'Contraseña o usuario incorrecto'; // Mensaje por defecto si falla 401/403
            try {
                const errorData = await response.json();
                if (errorData.error) errorMessage = errorData.error;
            } catch (e) {
                // Si la respuesta no es JSON, mantenemos el mensaje genérico
            }
            throw new Error(errorMessage);
        }
        return await response.json();
    } catch (error: any) {
        console.warn("Fallo de conexión con el backend:", error.message);

        // --- FALLBACK / MODO OFFLINE ---
        // Si el servidor está apagado ('Failed to fetch'), permitimos entrar con credenciales locales
        // para demostración o desarrollo sin backend.
        if (error.message === 'Failed to fetch' || error.name === 'TypeError') {
            // Simular validación local
            if (username.toLowerCase() === 'admin' && password === 'admin.1') {
                 console.log("Activando modo offline para Admin");
                 return {
                    _id: 'local-admin',
                    username: 'ADMIN',
                    role: 'admin',
                    modulePins: { finance: '1234', settings: '1234' },
                    createdAt: new Date().toISOString()
                };
            }
            if (username.toLowerCase() === 'floreria1' && password === 'user.1') {
                console.log("Activando modo offline para Floreria1");
                 return {
                    _id: 'local-user',
                    username: 'Floreria1',
                    role: 'user',
                    createdAt: new Date().toISOString()
                };
            }
            // Si no coincide con las credenciales de respaldo, mostramos error genérico
             throw new Error('Contraseña o usuario incorrecto (Offline)');
        }
        throw error;
    }
};

// --- Generic Fetch Functions ---
const fetchData = async <T>(endpoint: string, user: User, selectedUserId: string | null = null): Promise<T> => {
    // Si estamos en modo offline (id local), no intentamos fetch real
    const isOfflineUser = user._id.startsWith('local-');
    
    if (isOfflineUser) {
         await sleep(MOCK_DELAY);
         // Retornar datos mock según el endpoint
         if (endpoint.includes('/flowers')) return DEFAULT_FLOWER_ITEMS as unknown as T;
         if (endpoint.includes('/fixed-items')) return DEFAULT_FIXED_ITEMS as unknown as T;
         if (endpoint.includes('/users')) return [user, { _id: 'local-user', username: 'Floreria1', role: 'user', createdAt: new Date().toISOString() }] as unknown as T;
         if (endpoint.includes('/finance/summary')) return {
            totalRevenue: 1500, totalCostOfGoods: 400, wastedGoodsCost: 50, fixedExpenses: 200, netProfit: 850
        } as unknown as T;
         // Arrays vacíos por defecto para listas dinámicas en offline
         return [] as unknown as T;
    }

    try {
        if (!user?._id) throw new Error("Usuario no autenticado.");
        
        const params = new URLSearchParams({ userId: user._id, role: user.role });
        if (user.role === 'admin' && selectedUserId) {
            params.append('selectedUserId', selectedUserId);
        }

        const response = await fetch(`${API_BASE_URL}${endpoint}?${params.toString()}`);
        if (!response.ok) throw new Error(`Status: ${response.status}`);
        
        return await response.json();
    } catch (error) {
        // MOCK DATA FALLBACK para usuarios reales si se cae la conexión momentáneamente
        console.warn(`Fallo al cargar datos de ${endpoint}, usando datos locales de respaldo.`);
        
        if (endpoint.includes('/flowers')) return DEFAULT_FLOWER_ITEMS as unknown as T;
        if (endpoint.includes('/fixed-items')) return DEFAULT_FIXED_ITEMS as unknown as T;
        
        if (endpoint.includes('/stock') || endpoint.includes('/orders') || endpoint.includes('/events') || endpoint.includes('/users')) {
            return [] as unknown as T;
        }
        
        if (endpoint.includes('/finance/summary')) return {
            totalRevenue: 0, totalCostOfGoods: 0, wastedGoodsCost: 0, fixedExpenses: 0, netProfit: 0
        } as unknown as T;

        return [] as unknown as T;
    }
};

const postData = async <T, R>(endpoint: string, data: T, requesterId?: string): Promise<R> => {
    if (requesterId?.startsWith('local-')) { await sleep(MOCK_DELAY); return {} as R; } // Fake success offline

    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    if (requesterId) headers['x-user-id'] = requesterId;

    const response = await fetch(`${API_BASE_URL}${endpoint}`, { method: 'POST', headers, body: JSON.stringify(data) });
    
    if (!response.ok) {
        const text = await response.text();
        let errorMessage = `Error ${response.status}`;
        try {
            const json = JSON.parse(text);
            if (json.error) errorMessage = json.error;
        } catch (e) {}
        throw new Error(errorMessage);
    }
    const text = await response.text();
    return text ? JSON.parse(text) : {} as R;
};

const putData = async <T, R>(endpoint: string, data: T, requesterId?: string): Promise<R> => {
    if (requesterId?.startsWith('local-')) { await sleep(MOCK_DELAY); return {} as R; }

    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    if (requesterId) headers['x-user-id'] = requesterId;
    const response = await fetch(`${API_BASE_URL}${endpoint}`, { method: 'PUT', headers, body: JSON.stringify(data) });
    if (!response.ok) {
        const text = await response.text();
        let errorMessage = `Error ${response.status}`;
        try {
            const json = JSON.parse(text);
            if (json.error) errorMessage = json.error;
        } catch (e) {}
        throw new Error(errorMessage);
    }
    return await response.json();
};

const deleteData = async (endpoint: string, requesterId?: string): Promise<{ success: boolean }> => {
    if (requesterId?.startsWith('local-')) { await sleep(MOCK_DELAY); return { success: true }; }

    const headers: HeadersInit = {};
    if (requesterId) headers['x-user-id'] = requesterId;
    const response = await fetch(`${API_BASE_URL}${endpoint}`, { method: 'DELETE', headers });
    
    if (!response.ok) {
        const text = await response.text();
        let errorMessage = `Error ${response.status}`;
        try {
            const json = JSON.parse(text);
            if (json.error) errorMessage = json.error;
        } catch (e) {}
        throw new Error(errorMessage);
    }
    
    return await response.json();
};

// Update Batch para arrays
const updateData = async <T>(endpoint: string, items: T[], userId: string): Promise<T[]> => {
    if (userId.startsWith('local-')) { await sleep(MOCK_DELAY); return items; }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items, userId }),
    });
    if (!response.ok) throw new Error(`Status: ${response.status}`);
    return await response.json();
};

// --- EXPORTS ---

// Users & Auth
export const fetchUsers = (user: User): Promise<User[]> => fetchData('/api/users', user);
export const createUser = (userData: Omit<User, '_id' | 'createdAt'> & { password: string }, adminId: string): Promise<{ success: boolean }> => postData('/api/users', userData, adminId);
export const updateUser = (userId: string, userData: Partial<User> & { password?: string }, adminId: string): Promise<{ success: boolean }> => putData(`/api/users/${userId}`, userData, adminId);
export const deleteUser = (userIdToDelete: string, adminId: string): Promise<{ success: boolean }> => deleteData(`/api/users/${userIdToDelete}`, adminId);
export const updateUserPins = (userIdToUpdate: string, pins: { [key in View]?: string }, adminId: string): Promise<{ success: boolean }> => {
    return postData(`/api/users/pins`, { userId: userIdToUpdate, pins }, adminId);
};

// Products
export const fetchFlowerItems = (user: User, selectedUserId?: string | null): Promise<FlowerItem[]> => fetchData('/api/flowers', user, selectedUserId);
export const updateFlowerItems = (items: FlowerItem[], userId: string): Promise<FlowerItem[]> => updateData('/api/flowers', items, userId);
export const fetchFixedItems = (user: User, selectedUserId?: string | null): Promise<FixedItem[]> => fetchData('/api/fixed-items', user, selectedUserId);
export const updateFixedItems = (items: FixedItem[], userId: string): Promise<FixedItem[]> => updateData('/api/fixed-items', items, userId);

// Stock
export const fetchStock = (user: User, selectedUserId?: string | null): Promise<StockItem[]> => fetchData('/api/stock', user, selectedUserId);
export const updateStockBatch = (updates: { itemId: string; change: number; type: 'flower' | 'fixed'; userId: string, movementType: 'compra' | 'merma' | 'ajuste' }[], userId: string): Promise<{ success: boolean }> => postData('/api/stock/update-batch', { updates }, userId);
export const fetchStockHistory = (itemId: string, user: User, selectedUserId?: string | null): Promise<StockMovement[]> => fetchData(`/api/stock/history/${itemId}`, user, selectedUserId);

// Orders
export const fetchOrders = (user: User, selectedUserId?: string | null): Promise<Order[]> => fetchData('/api/orders', user, selectedUserId);
export const createOrder = (order: Omit<Order, 'createdAt' | '_id'>, userId: string): Promise<Order> => postData('/api/orders', order, userId);
export const updateOrder = (order: Order, userId: string): Promise<Order> => putData(`/api/orders/${order._id}`, order, userId);
export const deleteOrder = (orderId: string, userId: string): Promise<{ success: boolean }> => deleteData(`/api/orders/${orderId}`, userId);

// Clients
export const fetchClients = (user: User, selectedUserId?: string | null): Promise<Client[]> => fetchData('/api/clients', user, selectedUserId);
export const createClient = (client: Omit<Client, '_id'>): Promise<Client> => postData('/api/clients', client);

// Calendar
export const fetchEvents = (user: User, selectedUserId?: string | null): Promise<Event[]> => fetchData('/api/events', user, selectedUserId);
export const createEvent = (event: Omit<Event, '_id'>, userId: string): Promise<Event> => postData('/api/events', event, userId);
export const updateEvent = (event: Event, userId: string): Promise<Event> => putData(`/api/events/${event._id}`, event, userId);
export const deleteEvent = (eventId: string, userId: string): Promise<{ success: boolean }> => deleteData(`/api/events/${eventId}`, userId);

// Finance
export const fetchFixedExpenses = (user: User, selectedUserId?: string | null): Promise<FixedExpense[]> => fetchData('/api/fixed-expenses', user, selectedUserId);
export const createFixedExpense = (expense: Omit<FixedExpense, '_id'>, userId: string): Promise<FixedExpense> => postData('/api/fixed-expenses', expense, userId);
export const updateFixedExpense = (expense: FixedExpense, userId: string): Promise<FixedExpense> => putData(`/api/fixed-expenses/${expense._id}`, expense, userId);
export const deleteFixedExpense = (expenseId: string, userId: string): Promise<{ success: boolean }> => deleteData(`/api/fixed-expenses/${expenseId}`, userId);
export const fetchFinancialSummary = (user: User, selectedUserId?: string | null): Promise<FinancialSummary> => fetchData('/api/finance/summary', user, selectedUserId);
