import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';
import type { MenuResponse, MenuItem } from '@/types';

export function useMenu(slug: string) {
  return useQuery<MenuResponse>({
    queryKey: ['menu', slug],
    queryFn: async () => {
      const response = await api.get(`/public/menu/${slug}`);
      return response.data;
    },
    enabled: !!slug,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useMenuItem(slug: string, itemId: string) {
  return useQuery<MenuItem>({
    queryKey: ['menu-item', slug, itemId],
    queryFn: async () => {
      const response = await api.get(`/public/menu/${slug}/item/${itemId}`);
      return response.data;
    },
    enabled: !!slug && !!itemId,
  });
}

export function useMenuSearch(slug: string, query: string) {
  return useQuery<MenuItem[]>({
    queryKey: ['menu-search', slug, query],
    queryFn: async () => {
      const response = await api.get(`/public/menu/${slug}/search?q=${encodeURIComponent(query)}`);
      return response.data;
    },
    enabled: !!slug && query.length >= 2,
  });
}

