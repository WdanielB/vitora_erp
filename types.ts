
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
    id: string;
    userId: string;
    customerName: string;
    address: string;
    deliveryDate: string;
    status: OrderStatus;
    total: number;
    items: { itemId: string, name: string, quantity: number, price: number }[];
    floristNote?: string;
}

export interface StockItem {
    id: string; // Corresponds to FlowerItem or FixedItem id
    name: string;
    type: 'flower' | 'fixed';
    quantity: number; // For flowers, this is in stems. For fixed, in units.
    criticalStock: number;
    lastUpdated: string;
}

export interface FinancialSummary {
    totalRevenue: number;
    totalCostOfGoods: number;
    wastedGoodsCost: number;
    fixedExpenses: number;
    netProfit: number;
}
