import { useQuery } from '@tanstack/react-query';
import api from '../services/api';

export type ReportPeriod = 'today' | '7days' | '30days' | 'month' | 'lastMonth';

interface ReportStats {
  totalRevenue: number;
  totalOrders: number;
  avgOrderValue: number;
  avgPrepTime: number;
  revenueChange: number;
  ordersChange: number;
  avgOrderChange: number;
}

interface DailySale {
  day: string;
  date: string;
  orders: number;
  revenue: number;
}

interface TopItem {
  name: string;
  qty: number;
  revenue: number;
}

interface FullReport {
  stats: ReportStats;
  dailySales: DailySale[];
  topItems: TopItem[];
}

export function useFullReport(period: ReportPeriod = '7days') {
  return useQuery<FullReport>({
    queryKey: ['reports', 'full', period],
    queryFn: async () => {
      const { data } = await api.get('/reports', { params: { period } });
      return data;
    },
  });
}

export function useReportStats(period: ReportPeriod = '7days') {
  return useQuery<ReportStats>({
    queryKey: ['reports', 'stats', period],
    queryFn: async () => {
      const { data } = await api.get('/reports/stats', { params: { period } });
      return data;
    },
  });
}

export function useDailySales(period: ReportPeriod = '7days') {
  return useQuery<DailySale[]>({
    queryKey: ['reports', 'daily-sales', period],
    queryFn: async () => {
      const { data } = await api.get('/reports/daily-sales', { params: { period } });
      return data;
    },
  });
}

export function useTopItems(period: ReportPeriod = '7days', limit: number = 5) {
  return useQuery<TopItem[]>({
    queryKey: ['reports', 'top-items', period, limit],
    queryFn: async () => {
      const { data } = await api.get('/reports/top-items', { params: { period, limit } });
      return data;
    },
  });
}

