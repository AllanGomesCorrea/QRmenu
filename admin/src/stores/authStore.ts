import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  isSuperAdmin: boolean;
}

interface Restaurant {
  id: string;
  name: string;
  slug: string;
}

interface AuthState {
  user: User | null;
  restaurant: Restaurant | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  // Super Admin: selected restaurant override
  selectedRestaurant: Restaurant | null;
  setAuth: (data: {
    user: User;
    restaurant: Restaurant | null;
    accessToken: string;
    refreshToken: string;
  }) => void;
  logout: () => void;
  // Super Admin: switch restaurant context
  setSelectedRestaurant: (restaurant: Restaurant | null) => void;
  // Get the effective restaurant (selectedRestaurant for Super Admin, or own restaurant)
  getEffectiveRestaurant: () => Restaurant | null;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      restaurant: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      selectedRestaurant: null,
      setAuth: (data) =>
        set({
          user: data.user,
          restaurant: data.restaurant,
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          isAuthenticated: true,
        }),
      logout: () =>
        set({
          user: null,
          restaurant: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          selectedRestaurant: null,
        }),
      setSelectedRestaurant: (restaurant) =>
        set({ selectedRestaurant: restaurant }),
      getEffectiveRestaurant: () => {
        const state = get();
        if (state.user?.isSuperAdmin && state.selectedRestaurant) {
          return state.selectedRestaurant;
        }
        return state.restaurant;
      },
    }),
    {
      name: 'qrmenu-auth',
      partialize: (state) => ({
        user: state.user,
        restaurant: state.restaurant,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
        selectedRestaurant: state.selectedRestaurant,
      }),
    }
  )
);
