
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
  
// Placeholder types for future modules
export interface Order {
    id: string;
    customerName: string;
    address: string;
    deliveryDate: string;
    // ... more fields
}

export interface StockItem {
    id: string;
    itemId: string; // foreign key to FlowerItem or FixedItem
    quantity: number;
    // ... more fields
}
