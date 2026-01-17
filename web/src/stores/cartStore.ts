import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { CartItem, MenuItem, MenuItemExtra } from '@/types';

interface CartState {
  items: CartItem[];
  restaurantSlug: string | null;
  
  // Actions
  addItem: (
    data: {
      menuItem: MenuItem;
      quantity: number;
      selectedExtras: MenuItemExtra[];
      notes?: string;
    },
    restaurantSlug: string
  ) => void;
  updateItemQuantity: (itemId: string, quantity: number) => void;
  removeItem: (itemId: string) => void;
  clearCart: () => void;
  
  // Computed
  getSubtotal: () => number;
  getItemCount: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      restaurantSlug: null,

      addItem: (data, restaurantSlug) => {
        const { items, restaurantSlug: currentSlug } = get();

        // If cart has items from different restaurant, clear it
        if (currentSlug && currentSlug !== restaurantSlug && items.length > 0) {
          set({ items: [], restaurantSlug });
        }

        const extrasTotal = data.selectedExtras.reduce(
          (sum, extra) => sum + extra.price,
          0
        );
        const totalPrice = (data.menuItem.price + extrasTotal) * data.quantity;

        const newItem: CartItem = {
          id: uuidv4(),
          menuItem: data.menuItem,
          quantity: data.quantity,
          selectedExtras: data.selectedExtras,
          notes: data.notes,
          totalPrice,
        };

        set((state) => ({
          items: [...state.items, newItem],
          restaurantSlug,
        }));
      },

      updateItemQuantity: (itemId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(itemId);
          return;
        }

        set((state) => ({
          items: state.items.map((item) => {
            if (item.id !== itemId) return item;

            const extrasTotal = item.selectedExtras.reduce(
              (sum, extra) => sum + extra.price,
              0
            );
            const totalPrice = (item.menuItem.price + extrasTotal) * quantity;

            return { ...item, quantity, totalPrice };
          }),
        }));
      },

      removeItem: (itemId) => {
        set((state) => {
          const newItems = state.items.filter((item) => item.id !== itemId);
          return {
            items: newItems,
            restaurantSlug: newItems.length > 0 ? state.restaurantSlug : null,
          };
        });
      },

      clearCart: () => {
        set({ items: [], restaurantSlug: null });
      },

      getSubtotal: () => {
        return get().items.reduce((sum, item) => sum + item.totalPrice, 0);
      },

      getItemCount: () => {
        return get().items.reduce((sum, item) => sum + item.quantity, 0);
      },
    }),
    {
      name: 'qrmenu-cart',
    }
  )
);

