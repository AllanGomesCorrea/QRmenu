import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';
import { useSessionStore } from '@/stores/sessionStore';

export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'PAID' | 'CANCELLED';
export type OrderItemStatus = 'PENDING' | 'PREPARING' | 'READY' | 'CANCELLED';

export interface OrderItemExtra {
  name: string;
  price: number;
}

export interface OrderItem {
  id: string;
  menuItemId: string;
  name: string;
  quantity: number;
  price: number;
  notes?: string;
  extras: OrderItemExtra[];
  status: OrderItemStatus;
}

export interface Order {
  id: string;
  orderNumber: number;
  status: OrderStatus;
  subtotal: number;
  discount: number;
  total: number;
  notes?: string;
  items: OrderItem[];
  session?: {
    id: string;
    customerName: string;
    customerPhone: string;
  };
  isMyOrder?: boolean; // true if this order belongs to current session
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrderItem {
  menuItemId: string;
  quantity: number;
  notes?: string;
  extras?: { extraId: string }[];
}

export function useMyOrders() {
  const sessionToken = useSessionStore((state) => state.sessionToken);

  return useQuery<Order[]>({
    queryKey: ['my-orders'],
    queryFn: async () => {
      const response = await api.get('/orders/session/my-orders', {
        headers: { 'x-session-token': sessionToken },
      });
      return response.data;
    },
    enabled: !!sessionToken,
    refetchInterval: 15000, // Refetch every 15 seconds
  });
}

export function useCreateOrder() {
  const queryClient = useQueryClient();
  const sessionToken = useSessionStore((state) => state.sessionToken);

  return useMutation({
    mutationFn: async (data: { items: CreateOrderItem[]; notes?: string }) => {
      const response = await api.post('/orders/session', data, {
        headers: { 'x-session-token': sessionToken },
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-orders'] });
    },
  });
}

