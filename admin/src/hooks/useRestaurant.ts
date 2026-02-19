import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';

export interface RestaurantDetails {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logoUrl: string | null;
  bannerUrl: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  phone: string | null;
  email: string | null;
  whatsapp: string | null;
  settings: Record<string, unknown> | null;
  isActive: boolean;
  latitude: number | null;
  longitude: number | null;
  _count?: {
    users: number;
    tables: number;
    menuItems: number;
    orders: number;
  };
}

export function useMyRestaurant() {
  return useQuery<RestaurantDetails>({
    queryKey: ['restaurant-me'],
    queryFn: async () => {
      const response = await api.get('/restaurants/me');
      return response.data;
    },
  });
}

export function useUpdateRestaurant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<RestaurantDetails>) => {
      const response = await api.patch('/restaurants/me', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['restaurant-me'] });
    },
  });
}
