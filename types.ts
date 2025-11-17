
export interface CostHistoryEntry {
  date: string;
  costo?: number; // Para items fijos
  costoPaquete?: number; // Para flores
}

export interface Item {
  id: string;
  name: string;
  price: number;
  visible: boolean;
  imageUrl?: string;
  costo?: number;
  costHistory?: CostHistoryEntry[];
  userId: string;
}

export interface FlowerItem extends Item {
  imageUrl: string;
  costoPaquete?: number;
  cantidadPorPaquete?: number;
  merma?: number;
}

export type FixedItem = Item;

export type UserRole = 'admin' | 'florist' | 'cashier' | 'driver';
export interface User {
    _id: string;
    username: string;
    role: UserRole;
    avatarUrl?: string; // for the logo
}

export type View = 
  | 'dashboard'
  | 'quotation'
  | 'stock'
  | 'orders'
  | 'calendar'
  | 'finance'
  | 'settings';
  
export type OrderStatus = 'pendiente' | 'en armado' | 'entregado' | 'cancelado';

export interface Order {
    _id?: string;
    userId: string;
    customerName: string;
    address: string;
    deliveryDate: string;
    status: OrderStatus;
    total: number;
    items: { itemId: string, name: string, quantity: number, price: number, unitCost: number }[];
    floristNote?: string;
    createdAt: string;
}

export interface StockItem {
    _id?: string;
    itemId: string; // Corresponds to FlowerItem or FixedItem id
    userId: string;
    name: string;
    type: 'flower' | 'fixed';
    quantity: number; // For flowers, this is in stems. For fixed, in units.
    criticalStock: number;
}

export interface FinancialSummary {
    totalRevenue: number;
    totalCostOfGoods: number;
    wastedGoodsCost: number; // This might be complex to calculate, placeholder for now
    fixedExpenses: number;
    netProfit: number;
}

export interface Event {
    _id?: string;
    userId: string;
    name: string;
    date: string;
}

export interface FixedExpense {
    _id?: string;
    userId: string;
    name: string;
    amount: number;
}
