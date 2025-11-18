
import type { FlowerItem, FixedItem, User, StockItem, Order, Event, FixedExpense, FinancialSummary, Client, StockMovement, View } from '../types.ts';
import { DEFAULT_FLOWER_ITEMS, DEFAULT_FIXED_ITEMS } from '../constants.ts';

// CAMBIO: Apuntar al servidor local para desarrollo. 
const API_BASE_URL = 'http://localhost:3001'; 

// --- Mock Data Helpers ---
const MOCK_DELAY = 500; // Simula latencia de red

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const mockUser: User = {
    _id: 'mock-admin-id',
    username: 'admin',
    role: 'admin',
    modulePins: {}
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
            let errorData;
            try {
               errorData = await response.json();
            } catch(e) {
                throw new Error('Error de conexión con el servidor.');
            }
            throw new Error(errorData.error || 'Error de autenticación');
        }
        return response.json();
    } catch (error) {
        console.warn("API: Backend no disponible. Activando Modo Demo Offline.", error);
        // Fallback para Modo Demo
        await sleep(MOCK_DELAY);
        return {
            ...mockUser,
            username: username || 'admin'
        };
    }
};

// --- Generic Fetch and Update Functions ---
const fetchData = async <T>(endpoint: string, user: User, selectedUserId: string | null = null): Promise<T> => {
    try {
        if (!user?._id) {
            throw new Error("Usuario no autenticado.");
        }
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
        console.warn(`API: Falló fetch en ${endpoint}. Usando datos mock.`, error);
        await sleep(MOCK_DELAY);
        
        // MOCK DATA RESPONSES
        if (endpoint.includes('/flowers')) return DEFAULT_FLOWER_ITEMS as unknown as T;
        if (endpoint.includes('/fixed-items')) return DEFAULT_FIXED_ITEMS as unknown as T;
        if (endpoint.includes('/stock')) {
             // Generar stock inicial basado en items
             const allItems = [...DEFAULT_FLOWER_ITEMS, ...DEFAULT_FIXED_ITEMS];
             return allItems.map(item => ({
                 itemId: item.id,
                 userId: user._id,
                 name: item.name,
                 type: item.id.startsWith('f') ? 'flower' : 'fixed',
                 quantity: 50, // Stock simulado
                 criticalStock: 10
             })) as unknown as T;
        }
        if (endpoint.includes('/orders')) return [] as unknown as T; // Sin pedidos iniciales en demo
        if (endpoint.includes('/clients')) return [] as unknown as T;
        if (endpoint.includes('/events')) return [
            { _id: 'e1', name: 'San Valentín', date: new Date().toISOString(), userId: user._id }
        ] as unknown as T;
        if (endpoint.includes('/fixed-expenses')) return [
            { _id: 'ex1', name: 'Alquiler', amount: 1200, userId: user._id },
            { _id: 'ex2', name: 'Luz', amount: 150, userId: user._id }
        ] as unknown as T;
        if (endpoint.includes('/finance/summary')) return {
            totalRevenue: 0,
            totalCostOfGoods: 0,
            wastedGoodsCost: 0,
            fixedExpenses: 1350,
            netProfit: -1350
        } as unknown as T;
        if (endpoint.includes('/users')) return [mockUser] as unknown as T;
        if (endpoint.includes('/stock/history')) return [] as unknown as T;

        return [] as unknown as T;
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
            throw new Error(`El servidor respondió con el estado: ${response.status} - ${text}`);
        }
        
        if (!text) {
            return {} as R;
        }

        return JSON.parse(text);
    } catch (error) {
        console.warn(`API: Falló POST en ${endpoint}. Simulando éxito.`, error);
        await sleep(MOCK_DELAY);
        // Simular respuesta exitosa con ID generado
        return { ...data, _id: `mock_id_${Date.now()}` } as unknown as R;
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
         console.warn(`API: Falló PUT en ${endpoint}. Simulando éxito.`, error);
         await sleep(MOCK_DELAY);
         return data as unknown as R;
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
        console.warn(`API: Falló DELETE en ${endpoint}. Simulando éxito.`, error);
        await sleep(MOCK_DELAY);
        return { success: true };
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
        console.warn(`API: Falló updateData en ${endpoint}. Simulando éxito.`, error);
        await sleep(MOCK_DELAY);
        return items;
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
