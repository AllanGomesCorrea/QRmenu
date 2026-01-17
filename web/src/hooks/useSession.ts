import { useQuery, useMutation } from '@tanstack/react-query';
import api from '@/services/api';
import { useSessionStore } from '@/stores/sessionStore';

interface TableStatus {
  table: {
    id: string;
    number: number;
    name?: string;
    status: string;
    activeSessions: number;
  };
  restaurant: {
    id: string;
    name: string;
    slug: string;
    logoUrl?: string;
    isActive: boolean;
  };
  canJoin: boolean;
}

interface ExistingSessionCheck {
  hasSession: boolean;
  session?: {
    id: string;
    customerName: string;
    isVerified: boolean;
  };
}

export function useTableStatus(qrCode: string) {
  return useQuery<TableStatus>({
    queryKey: ['table-status', qrCode],
    queryFn: async () => {
      const response = await api.get(`/sessions/table/${qrCode}/status`);
      return response.data;
    },
    enabled: !!qrCode,
    retry: false,
  });
}

export function useCheckExistingSession(qrCode: string, fingerprint: string | null) {
  return useQuery<ExistingSessionCheck>({
    queryKey: ['check-session', qrCode, fingerprint],
    queryFn: async () => {
      const response = await api.get(
        `/sessions/table/${qrCode}/check?fingerprint=${fingerprint}`
      );
      return response.data;
    },
    enabled: !!qrCode && !!fingerprint,
    retry: false,
  });
}

export function useRequestCode() {
  return useMutation({
    mutationFn: async (data: { customerPhone: string; qrCode: string }) => {
      const response = await api.post('/sessions/request-code', data);
      return response.data;
    },
  });
}

export function useCreateSession() {
  return useMutation({
    mutationFn: async (data: {
      customerName: string;
      customerPhone: string;
      qrCode: string;
      deviceFingerprint: string;
      userAgent?: string;
    }) => {
      const response = await api.post('/sessions/create', data);
      return response.data;
    },
  });
}

export function useVerifyCode() {
  const setSession = useSessionStore((state) => state.setSession);

  return useMutation({
    mutationFn: async (data: {
      code: string;
      customerPhone: string;
      qrCode: string;
      deviceFingerprint: string;
    }) => {
      const response = await api.post('/sessions/verify', data);
      return response.data;
    },
    onSuccess: (data) => {
      if (data.session && data.sessionToken) {
        setSession(
          {
            id: data.session.id,
            customerName: data.session.customerName,
            customerPhone: data.session.customerPhone,
            isVerified: data.session.isVerified,
            tableId: data.session.tableId,
            tableNumber: data.session.table.number,
            restaurantId: data.session.table.restaurant.id,
            restaurantSlug: data.session.table.restaurant.slug,
            restaurantName: data.session.table.restaurant.name,
          },
          data.sessionToken
        );
      }
    },
  });
}

