export interface Restaurant {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logoUrl?: string;
  bannerUrl?: string;
  phone: string;
  whatsapp?: string;
  address: string;
  city: string;
  state: string;
  settings: Record<string, unknown>;
}

export interface MenuCategory {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  sortOrder: number;
  items: MenuItem[];
}

export interface MenuItemExtra {
  id: string;
  name: string;
  price: number;
  isRequired: boolean;
}

export interface MenuItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  isAvailable: boolean;
  isFeatured: boolean;
  isVegan: boolean;
  isVegetarian: boolean;
  isGlutenFree: boolean;
  isSpicy: boolean;
  prepTime?: number;
  category: {
    id: string;
    name: string;
  };
  extras: MenuItemExtra[];
}

export interface MenuResponse {
  restaurant: Restaurant;
  categories: MenuCategory[];
  featuredItems: MenuItem[];
}

export interface CartItem {
  id: string;
  menuItem: MenuItem;
  quantity: number;
  selectedExtras: MenuItemExtra[];
  notes?: string;
  totalPrice: number;
}

export interface Cart {
  items: CartItem[];
  subtotal: number;
  restaurantSlug: string;
}

export type TableStatus = 'INACTIVE' | 'ACTIVE' | 'OCCUPIED' | 'BILL_REQUESTED' | 'CLOSED';

export interface Table {
  id: string;
  number: number;
  name?: string;
  capacity: number;
  qrCode: string;
  qrCodeUrl?: string;
  status: TableStatus;
  section?: string;
  restaurant?: Restaurant;
}

export interface TableSession {
  id: string;
  customerName: string;
  customerPhone: string;
  isVerified: boolean;
  deviceFingerprint: string;
  tableId: string;
  table?: Table;
  expiresAt: string;
  createdAt: string;
}

