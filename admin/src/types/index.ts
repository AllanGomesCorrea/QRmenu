export interface MenuCategory {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  sortOrder: number;
  isActive: boolean;
  _count?: {
    items: number;
  };
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
  sortOrder: number;
  categoryId: string;
  category: {
    id: string;
    name: string;
  };
  extras: MenuItemExtra[];
}

