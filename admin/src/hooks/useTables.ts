import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';

export interface Table {
  id: string;
  number: number;
  name?: string;
  capacity: number;
  qrCode: string;
  qrCodeUrl?: string;
  status: 'INACTIVE' | 'ACTIVE' | 'OCCUPIED' | 'BILL_REQUESTED' | 'CLOSED';
  section?: string;
  _count?: {
    sessions: number;
  };
}

export interface TableStats {
  total: number;
  active: number;
  occupied: number;
  billRequested: number;
  available: number;
  inactive: number;
}

export function useTables() {
  return useQuery<Table[]>({
    queryKey: ['tables'],
    queryFn: async () => {
      const response = await api.get('/tables');
      return response.data;
    },
  });
}

export function useTableStats() {
  return useQuery<TableStats>({
    queryKey: ['table-stats'],
    queryFn: async () => {
      const response = await api.get('/tables/stats');
      return response.data;
    },
  });
}

export function useCreateTable() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      number: number;
      name?: string;
      capacity?: number;
      section?: string;
    }) => {
      const response = await api.post('/tables', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      queryClient.invalidateQueries({ queryKey: ['table-stats'] });
    },
  });
}

export function useCreateBulkTables() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { count: number; section?: string }) => {
      const response = await api.post('/tables/bulk', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      queryClient.invalidateQueries({ queryKey: ['table-stats'] });
    },
  });
}

export function useUpdateTable() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Table> }) => {
      const response = await api.patch(`/tables/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tables'] });
    },
  });
}

export function useDeleteTable() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/tables/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      queryClient.invalidateQueries({ queryKey: ['table-stats'] });
    },
  });
}

export function useActivateTable() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.post(`/tables/${id}/activate`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      queryClient.invalidateQueries({ queryKey: ['table-stats'] });
    },
  });
}

export function useCloseTable() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.post(`/tables/${id}/close`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      queryClient.invalidateQueries({ queryKey: ['table-stats'] });
    },
  });
}

export function useGetQRCode() {
  return useMutation({
    mutationFn: async ({ id, format }: { id: string; format?: 'dataurl' | 'svg' }) => {
      const response = await api.get(`/tables/${id}/qrcode?format=${format || 'dataurl'}`);
      return response.data;
    },
  });
}

