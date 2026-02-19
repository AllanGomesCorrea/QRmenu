import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useCartStore } from './cartStore';

// Mock uuid
vi.mock('uuid', () => ({
  v4: () => `cart-item-${Math.random().toString(36).substring(7)}`,
}));

describe('cartStore', () => {
  beforeEach(() => {
    useCartStore.setState({
      items: [],
      restaurantSlug: null,
    });
    localStorage.clear();
  });

  const mockMenuItem = {
    id: 'menu-1',
    name: 'X-Burger',
    description: 'Hambúrguer artesanal',
    price: 29.90,
    imageUrl: null,
    categoryId: 'cat-1',
    isAvailable: true,
    extras: [],
  };

  const mockExtra = {
    id: 'extra-1',
    name: 'Bacon Extra',
    price: 5.00,
  };

  describe('addItem', () => {
    it('should add an item to the cart', () => {
      useCartStore.getState().addItem(
        {
          menuItem: mockMenuItem as any,
          quantity: 1,
          selectedExtras: [],
        },
        'test-restaurant',
      );

      const state = useCartStore.getState();
      expect(state.items).toHaveLength(1);
      expect(state.items[0].menuItem.name).toBe('X-Burger');
      expect(state.items[0].quantity).toBe(1);
      expect(state.items[0].totalPrice).toBeCloseTo(29.90);
      expect(state.restaurantSlug).toBe('test-restaurant');
    });

    it('should calculate total with extras', () => {
      useCartStore.getState().addItem(
        {
          menuItem: mockMenuItem as any,
          quantity: 2,
          selectedExtras: [mockExtra as any],
        },
        'test-restaurant',
      );

      const item = useCartStore.getState().items[0];
      // (29.90 + 5.00) * 2 = 69.80
      expect(item.totalPrice).toBeCloseTo(69.80);
    });

    it('should clear cart when adding from different restaurant', () => {
      // Add from restaurant A
      useCartStore.getState().addItem(
        { menuItem: mockMenuItem as any, quantity: 1, selectedExtras: [] },
        'restaurant-a',
      );

      // Add from restaurant B
      useCartStore.getState().addItem(
        { menuItem: { ...mockMenuItem, id: 'menu-2', name: 'Pizza' } as any, quantity: 1, selectedExtras: [] },
        'restaurant-b',
      );

      const state = useCartStore.getState();
      expect(state.items).toHaveLength(1);
      expect(state.items[0].menuItem.name).toBe('Pizza');
      expect(state.restaurantSlug).toBe('restaurant-b');
    });
  });

  describe('updateItemQuantity', () => {
    it('should update quantity and recalculate total', () => {
      useCartStore.getState().addItem(
        { menuItem: mockMenuItem as any, quantity: 1, selectedExtras: [] },
        'test',
      );

      const itemId = useCartStore.getState().items[0].id;
      useCartStore.getState().updateItemQuantity(itemId, 3);

      const item = useCartStore.getState().items[0];
      expect(item.quantity).toBe(3);
      expect(item.totalPrice).toBeCloseTo(89.70); // 29.90 * 3
    });

    it('should remove item when quantity is 0', () => {
      useCartStore.getState().addItem(
        { menuItem: mockMenuItem as any, quantity: 1, selectedExtras: [] },
        'test',
      );

      const itemId = useCartStore.getState().items[0].id;
      useCartStore.getState().updateItemQuantity(itemId, 0);

      expect(useCartStore.getState().items).toHaveLength(0);
    });
  });

  describe('removeItem', () => {
    it('should remove item from cart', () => {
      useCartStore.getState().addItem(
        { menuItem: mockMenuItem as any, quantity: 1, selectedExtras: [] },
        'test',
      );

      const itemId = useCartStore.getState().items[0].id;
      useCartStore.getState().removeItem(itemId);

      expect(useCartStore.getState().items).toHaveLength(0);
    });

    it('should clear restaurantSlug when last item is removed', () => {
      useCartStore.getState().addItem(
        { menuItem: mockMenuItem as any, quantity: 1, selectedExtras: [] },
        'test',
      );

      const itemId = useCartStore.getState().items[0].id;
      useCartStore.getState().removeItem(itemId);

      expect(useCartStore.getState().restaurantSlug).toBeNull();
    });
  });

  describe('clearCart', () => {
    it('should clear all items and restaurant slug', () => {
      useCartStore.getState().addItem(
        { menuItem: mockMenuItem as any, quantity: 1, selectedExtras: [] },
        'test',
      );
      useCartStore.getState().addItem(
        { menuItem: { ...mockMenuItem, id: 'menu-2' } as any, quantity: 2, selectedExtras: [] },
        'test',
      );

      useCartStore.getState().clearCart();

      const state = useCartStore.getState();
      expect(state.items).toHaveLength(0);
      expect(state.restaurantSlug).toBeNull();
    });
  });

  describe('getSubtotal', () => {
    it('should calculate total of all items', () => {
      useCartStore.getState().addItem(
        { menuItem: mockMenuItem as any, quantity: 2, selectedExtras: [] },
        'test',
      );
      useCartStore.getState().addItem(
        { menuItem: { ...mockMenuItem, id: 'menu-2', price: 15 } as any, quantity: 1, selectedExtras: [] },
        'test',
      );

      // 29.90 * 2 + 15 = 74.80
      expect(useCartStore.getState().getSubtotal()).toBeCloseTo(74.80);
    });

    it('should return 0 for empty cart', () => {
      expect(useCartStore.getState().getSubtotal()).toBe(0);
    });
  });

  describe('getItemCount', () => {
    it('should sum all item quantities', () => {
      useCartStore.getState().addItem(
        { menuItem: mockMenuItem as any, quantity: 2, selectedExtras: [] },
        'test',
      );
      useCartStore.getState().addItem(
        { menuItem: { ...mockMenuItem, id: 'menu-2' } as any, quantity: 3, selectedExtras: [] },
        'test',
      );

      expect(useCartStore.getState().getItemCount()).toBe(5);
    });

    it('should return 0 for empty cart', () => {
      expect(useCartStore.getState().getItemCount()).toBe(0);
    });
  });
});
