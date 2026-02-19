import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from './authStore';

describe('authStore', () => {
  beforeEach(() => {
    // Reset store state
    useAuthStore.setState({
      user: null,
      restaurant: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      selectedRestaurant: null,
    });
    localStorage.clear();
  });

  describe('setAuth', () => {
    it('should set authentication data', () => {
      const authData = {
        user: { id: 'u1', name: 'Admin', email: 'admin@test.com', role: 'ADMIN', isSuperAdmin: false },
        restaurant: { id: 'r1', name: 'Test Restaurant', slug: 'test' },
        accessToken: 'jwt-token',
        refreshToken: 'refresh-token',
      };

      useAuthStore.getState().setAuth(authData);

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(true);
      expect(state.user?.email).toBe('admin@test.com');
      expect(state.restaurant?.name).toBe('Test Restaurant');
      expect(state.accessToken).toBe('jwt-token');
    });
  });

  describe('logout', () => {
    it('should clear all auth data', () => {
      // Set auth first
      useAuthStore.getState().setAuth({
        user: { id: 'u1', name: 'Admin', email: 'admin@test.com', role: 'ADMIN', isSuperAdmin: false },
        restaurant: { id: 'r1', name: 'Test', slug: 'test' },
        accessToken: 'token',
        refreshToken: 'refresh',
      });

      // Logout
      useAuthStore.getState().logout();

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBeNull();
      expect(state.restaurant).toBeNull();
      expect(state.accessToken).toBeNull();
      expect(state.selectedRestaurant).toBeNull();
    });
  });

  describe('Super Admin - selectedRestaurant', () => {
    it('should set selected restaurant for super admin', () => {
      useAuthStore.getState().setAuth({
        user: { id: 'u1', name: 'Super', email: 'super@test.com', role: 'SUPER_ADMIN', isSuperAdmin: true },
        restaurant: null,
        accessToken: 'token',
        refreshToken: 'refresh',
      });

      const targetRestaurant = { id: 'r2', name: 'Other Restaurant', slug: 'other' };
      useAuthStore.getState().setSelectedRestaurant(targetRestaurant);

      expect(useAuthStore.getState().selectedRestaurant?.id).toBe('r2');
    });

    it('should clear selected restaurant', () => {
      useAuthStore.getState().setSelectedRestaurant({ id: 'r2', name: 'Other', slug: 'other' });
      useAuthStore.getState().setSelectedRestaurant(null);

      expect(useAuthStore.getState().selectedRestaurant).toBeNull();
    });

    it('getEffectiveRestaurant should return selectedRestaurant for super admin', () => {
      useAuthStore.getState().setAuth({
        user: { id: 'u1', name: 'Super', email: 'super@test.com', role: 'SUPER_ADMIN', isSuperAdmin: true },
        restaurant: { id: 'r1', name: 'Own Restaurant', slug: 'own' },
        accessToken: 'token',
        refreshToken: 'refresh',
      });

      const selected = { id: 'r2', name: 'Selected Restaurant', slug: 'selected' };
      useAuthStore.getState().setSelectedRestaurant(selected);

      const effective = useAuthStore.getState().getEffectiveRestaurant();
      expect(effective?.id).toBe('r2');
      expect(effective?.name).toBe('Selected Restaurant');
    });

    it('getEffectiveRestaurant should return own restaurant for non-super-admin', () => {
      useAuthStore.getState().setAuth({
        user: { id: 'u1', name: 'Admin', email: 'admin@test.com', role: 'ADMIN', isSuperAdmin: false },
        restaurant: { id: 'r1', name: 'My Restaurant', slug: 'mine' },
        accessToken: 'token',
        refreshToken: 'refresh',
      });

      const effective = useAuthStore.getState().getEffectiveRestaurant();
      expect(effective?.id).toBe('r1');
      expect(effective?.name).toBe('My Restaurant');
    });

    it('getEffectiveRestaurant should return own restaurant if no selectedRestaurant', () => {
      useAuthStore.getState().setAuth({
        user: { id: 'u1', name: 'Super', email: 'super@test.com', role: 'SUPER_ADMIN', isSuperAdmin: true },
        restaurant: { id: 'r1', name: 'Own Restaurant', slug: 'own' },
        accessToken: 'token',
        refreshToken: 'refresh',
      });

      const effective = useAuthStore.getState().getEffectiveRestaurant();
      expect(effective?.id).toBe('r1');
    });
  });
});
