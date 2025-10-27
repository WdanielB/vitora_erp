
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

export type View = 'main' | 'settings' | 'costs' | 'history';
