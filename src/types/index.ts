export type OrderStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';

export interface ColorTheme {
  bg: string;
  accent: string;
}

export interface CartItem {
  productId: string;
  variantId: string;
  name: string;
  scent: string;
  price: number;       // In ZAR cents
  quantity: number;
  modelPath: string;
  imageUrl: string;
}

export interface FilterState {
  scent: string | null;
  waxType: string | null;
  burnTimeRange: [number, number] | null;
  searchQuery: string;
}
