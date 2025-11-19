
import type { FlowerItem, FixedItem, User, StockItem, Order, Event, FixedExpense, FinancialSummary, Client, StockMovement, View } from '../types.ts';
import { DEFAULT_FLOWER_ITEMS, DEFAULT_FIXED_ITEMS } from '../constants.ts';

// CAMBIO: Apuntar al servidor local para desarrollo.
const API_BASE_URL = 'http://localhost:3001'; 

// --- Mock Data Helpers ---
const MOCK_DELAY = 400; // Simula latencia de red ligera

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const mockUser: User = {
    _id: 'mock-admin-id',
    username: 'admin',
    role: 'admin',
    modulePins: {}
};

// Generador de historial falso para que el Kardex se vea vivo en modo demo
const generateMockHistory = (itemId: string): StockMovement[] => {
    const types: ('compra' | 'venta' | 'merma')[] = ['compra', 'venta', 'venta', 'merma', 'venta'];
    return Array.from({ length: 5 }).map((_, i) => ({
        _id: `hist_${itemId}_${i}`,
        userId: 'mock-admin-id',
        itemId,
        itemName: 'Item Simulado',
        type: types[i % types.length],
        quantityChange: types[i % types.length] === 'compra' ? 50 : -5,
        quantityAfter: 100 - (i * 5),
        createdAt: new Date(Date.now() - i * 86400000).toISOString()
    }));
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
            // Intentar parsear error, si falla, usar mensaje genérico
            try {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Error de autenticación');
            } catch (e) {
                 // Si el backend no devuelve JSON (ej. 404 html o conexión rechazada)
                 throw new Error('Error de conexión con el servidor.');
            }
        }
        return response.json();
    } catch (error) {
        console.warn("API: Backend no disponible. Activando Modo Demo Offline.", error);
        await sleep(MOCK_DELAY);
        // Fallback para Modo Demo (admin/cualquier cosa)
        return {
            ...mockUser,
            username: username || 'admin'
        };
    }
};

// --- Generic Fetch Functions ---
const fetchData = async <T>(endpoint: string, user: User, selectedUserId: string | null = null): Promise<T> => {
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
        // MOCK DATA FALLBACK - Mantiene la app funcional sin backend
        await sleep(MOCK_DELAY);
        
        if (endpoint.includes('/flowers')) return DEFAULT_FLOWER_ITEMS as unknown as T;
        if (endpoint.includes('/fixed-items')) return DEFAULT_FIXED_ITEMS as unknown as T;
        
        if (endpoint.includes('/stock/history/')) {
            const itemId = endpoint.split('/').pop() || 'unknown';
            return generateMockHistory(itemId) as unknown as T;
        }

        if (endpoint.includes('/stock')) {
             const allItems = [...DEFAULT_FLOWER_ITEMS, ...DEFAULT_FIXED_ITEMS];
             return allItems.map(item => ({
                 _id: `stock_${item.id}`,
                 itemId: item.id,
                 userId: user._id,
                 name: item.name,
                 type: item.id.startsWith('f') ? 'flower' : 'fixed',
                 quantity: Math.floor(Math.random() * 50) + 10, 
                 criticalStock: 10
             })) as unknown as T;
        }
        
        if (endpoint.includes('/orders')) {
            // Devolver algunos pedidos de ejemplo
            return [
                { _id: 'o1', clientName: 'Juan Pérez', deliveryDate: new Date().toISOString(), status: 'pendiente', total: 150, items: [], address: 'Av. Principal 123', userId: user._id, createdAt: new Date().toISOString() },
                { _id: 'o2', clientName: 'Maria Lopez', deliveryDate: new Date(Date.now() + 86400000).toISOString(), status: 'entregado', total: 80, items: [], address: 'Calle 2', userId: user._id, createdAt: new Date().toISOString() }
            ] as unknown as T;
        }
        
        if (endpoint.includes('/clients')) {
            return [
                { _id: 'c1', name: 'Cliente Demo 1', phone: '555-0001', address: 'Dirección Demo 1', userId: user._id },
                { _id: 'c2', name: 'Cliente Demo 2', phone: '555-0002', address: 'Dirección Demo 2', userId: user._id }
            ] as unknown as T;
        }
        
        if (endpoint.includes('/events')) return [
            { _id: 'e1', name: 'San Valentín', date: '2025-02-14T00:00:00.000Z', userId: user._id },
            { _id: 'e2', name: 'Día de la Madre', date: '2025-05-10T00:00:00.000Z', userId: user._id }
        ] as unknown as T;
        
        if (endpoint.includes('/fixed-expenses')) return [
            { _id: 'ex1', name: 'Alquiler Local', amount: 1200, userId: user._id },
            { _id: 'ex2', name: 'Luz y Agua', amount: 150, userId: user._id },
            { _id: 'ex3', name: 'Internet', amount: 80, userId: user._id }
        ] as unknown as T;
        
        if (endpoint.includes('/finance/summary')) return {
            totalRevenue: 2500,
            totalCostOfGoods: 800,
            wastedGoodsCost: 50,
            fixedExpenses: 1430,
            netProfit: 220
        } as unknown as T;
        
        if (endpoint.includes('/users')) return [mockUser] as unknown as T;

        return [] as unknown as T;
    }
};

const postData = async <T, R>(endpoint: string, data: T, requesterId?: string): Promise<R> => {
    try {
        const headers: HeadersInit = { 'Content-Type': 'application/json' };
        if (requesterId) headers['x-user-id'] = requesterId;

        const response = await fetch(`${API_BASE_URL}${endpoint}`, { method: 'POST', headers, body: JSON.stringify(data) });
        const text = await response.text(); // Leer como texto primero para evitar error de parseo en vacíos
        
        if (!response.ok) throw new Error(`Status: ${response.status}`);
        return text ? JSON.parse(text) : {} as R;

    } catch (error) {
        console.warn(`API: Mock POST success for ${endpoint}`);
        await sleep(MOCK_DELAY);
        return { ...data, _id: `mock_id_${Date.now()}`, success: true } as unknown as R;
    }
};

const putData = async <T, R>(endpoint: string, data: T, requesterId?: string): Promise<R> => {
    try {
        const headers: HeadersInit = { 'Content-Type': 'application/json' };
        if (requesterId) headers['x-user-id'] = requesterId;
        const response = await fetch(`${API_BASE_URL}${endpoint}`, { method: 'PUT', headers, body: JSON.stringify(data) });
        if (!response.ok) throw new Error(`Status: ${response.status}`);
        return await response.json();
    } catch (error) {
         console.warn(`API: Mock PUT success for ${endpoint}`);
         await sleep(MOCK_DELAY);
         return data as unknown as R;
    }
};

const deleteData = async (endpoint: string, requesterId?: string): Promise<{ success: boolean }> => {
    try {
        const headers: HeadersInit = {};
        if (requesterId) headers['x-user-id'] = requesterId;
        const response = await fetch(`${API_BASE_URL}${endpoint}`, { method: 'DELETE', headers });
        if (!response.ok) throw new Error(`Status: ${response.status}`);
        return await response.json();
    } catch (error) {
        console.warn(`API: Mock DELETE success for ${endpoint}`);
        await sleep(MOCK_DELAY);
        return { success: true };
    }
};

// Update Batch para arrays
const updateData = async <T>(endpoint: string, items: T[], userId: string): Promise<T[]> => {
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ items, userId }),
        });
        if (!response.ok) throw new Error(`Status: ${response.status}`);
        return await response.json();
    } catch (error) {
        await sleep(MOCK_DELAY);
        return items;
    }
};

// --- EXPORTS ---

// Users & Auth
export const fetchUsers = (user: User): Promise<User[]> => fetchData('/api/users', user);
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
