import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';

export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'DELIVERED' | 'CANCELLED';
export type OrderItemStatus = 'PENDING' | 'PREPARING' | 'READY' | 'DELIVERED' | 'CANCELLED';

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
  table: {
    id: string;
    number: number;
    name?: string;
  };
  session?: {
    customerName: string;
    customerPhone: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface OrderStats {
  totalOrders: number;
  pendingOrders: number;
  preparingOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  revenue: number;
}

export function useKitchenOrders() {
  return useQuery<Order[]>({
    queryKey: ['kitchen-orders'],
    queryFn: async () => {
      const response = await api.get('/orders/kitchen');
      return response.data;
    },
    refetchInterval: 10000, // Refetch every 10 seconds as backup
  });
}

export function useOrders(params?: {
  status?: OrderStatus;
  tableId?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}) {
  return useQuery<{ orders: Order[]; total: number }>({
    queryKey: ['orders', params],
    queryFn: async () => {
      const response = await api.get('/orders', { params });
      return response.data;
    },
  });
}

export function useOrderStats(startDate?: string, endDate?: string) {
  return useQuery<OrderStats>({
    queryKey: ['order-stats', startDate, endDate],
    queryFn: async () => {
      const response = await api.get('/orders/stats', {
        params: { startDate, endDate },
      });
      return response.data;
    },
  });
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orderId, status, reason }: { orderId: string; status: OrderStatus; reason?: string }) => {
      const response = await api.patch(`/orders/${orderId}/status`, { status, reason });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kitchen-orders'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['order-stats'] });
    },
  });
}

export function useUpdateOrderItemStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      orderId, 
      itemId, 
      status 
    }: { 
      orderId: string; 
      itemId: string; 
      status: OrderItemStatus 
    }) => {
      const response = await api.patch(`/orders/${orderId}/items/${itemId}/status`, { status });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kitchen-orders'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}

export function useCancelOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orderId, reason }: { orderId: string; reason: string }) => {
      const response = await api.post(`/orders/${orderId}/cancel`, { reason });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kitchen-orders'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['order-stats'] });
    },
  });
}

