
export interface CostHistoryEntry {
  date: string;
  costo?: number; // Para items fijos
  costoPaquete?: number; // Para flores
}

// Nueva interfaz para el registro histórico de precios en base de datos propia
export interface PriceRecord {
    _id?: string;
    userId: string;
    itemId: string;
    itemName: string;
    type: 'flower' | 'product' | 'gift';
    price: number; // Costo registrado
    date: string;
}

export interface Item {
  _id?: string; // MongoDB ID
  id: string;
  name: string;
  price: number; // Precio de Venta
  visible: boolean;
  imageUrl?: string;
  userId: string;
  costHistory?: CostHistoryEntry[];
}

// Flores: Tienen costo por paquete, cantidad por paquete y merma
export interface FlowerItem extends Item {
  costoPaquete?: number;
  cantidadPorPaquete?: number;
  merma?: number;
  // Helper calculado en frontend, no en DB obligatoriamente
  unitCost?: number; 
}

// Productos (Chocolates, Peluches, Bebidas): Tienen costo unitario directo
export interface ProductItem extends Item {
    costo: number;
    stock: number; // Inventario directo
    category?: string; // New field for product type
}

// Variation Gift (Tipos de Ramos, Cajas): Solo para configuración de cotización
export interface VariationGift extends Item {
    costo: number; // Costo de la base/mano de obra
}

// Deprecated legacy type alias, kept for potential transition compatibility
export type FixedItem = ProductItem; 

export type UserRole = 'admin' | 'user';
export interface User {
    _id: string;
    username: string;
    role: UserRole;
    avatarUrl?: string;
    modulePins?: { [key in View]?: string };
    createdAt?: string;
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

export interface Client {
    _id?: string;
    userId: string;
    name: string;
    phone?: string;
    address?: string;
}

export interface OrderItem {
    itemId?: string; // Optional for custom items
    name: string;
    quantity: number;
    price: number; // Sale price
    unitCost: number;
}

export interface Order {
    _id?: string;
    userId: string;
    clientId: string;
    clientName: string;
    address: string;
    deliveryDate: string;
    status: OrderStatus;
    total: number;
    items: OrderItem[];
    floristNote?: string;
    dedication?: string; // New field
    createdAt: string;
}

export interface StockItem {
    _id?: string;
    itemId: string; // Corresponds to FlowerItem or ProductItem id
    userId: string;
    name: string;
    type: 'flower' | 'product';
    quantity: number; // For flowers, this is in stems. For products, in units.
    criticalStock: number;
}

export interface FinancialSummary {
    totalRevenue: number;
    totalCostOfGoods: number;
    wastedGoodsCost: number;
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

export type StockMovementType = 'compra' | 'venta' | 'merma' | 'ajuste' | 'cancelacion';
export interface StockMovement {
    _id?: string;
    userId: string;
    itemId: string;
    itemName: string;
    type: StockMovementType;
    quantityChange: number;
    quantityAfter: number;
    relatedOrderId?: string;
    createdAt: string;
}
