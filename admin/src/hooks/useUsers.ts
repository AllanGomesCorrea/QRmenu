import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';

export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'MANAGER' | 'KITCHEN' | 'WAITER' | 'CASHIER';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
}

export interface UsersResponse {
  data: User[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export function useUsers(page = 1, limit = 20) {
  return useQuery<UsersResponse>({
    queryKey: ['users', page, limit],
    queryFn: async () => {
      const response = await api.get('/users', { params: { page, limit } });
      return response.data;
    },
  });
}

export interface CreateUserDto {
  name: string;
  email: string;
  password: string;
  phone?: string;
  role: UserRole;
}

export interface UpdateUserDto {
  name?: string;
  email?: string;
  password?: string;
  phone?: string;
  role?: UserRole;
  isActive?: boolean;
}

export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateUserDto) => {
      const response = await api.post('/users', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateUserDto }) => {
      const response = await api.patch(`/users/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete(`/users/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}
