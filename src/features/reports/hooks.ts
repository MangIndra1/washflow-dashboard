import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { fetchActiveCount, fetchAdminReport, fetchOrderPage, fetchOverdueOrders, fetchRecentOrders, type OrderPageQuery } from './api';

const REFRESH_MS = 60_000;

export function useAdminReport(from: string, to: string, branchId: string | null) {
  return useQuery({
    queryKey: ['reports', 'summary', from, to, branchId],
    queryFn: () => fetchAdminReport(from, to, branchId),
    placeholderData: keepPreviousData,
    refetchInterval: REFRESH_MS,
  });
}

export function useOverdueOrders(limit = 5) {
  return useQuery({ queryKey: ['reports', 'overdue', limit], queryFn: () => fetchOverdueOrders(limit), refetchInterval: 30_000 });
}
export function useActiveCount() {
  return useQuery({ queryKey: ['reports', 'active-count'], queryFn: fetchActiveCount, refetchInterval: REFRESH_MS });
}
export function useOrderPage(q: OrderPageQuery) {
  return useQuery({ queryKey: ['reports', 'orders', q], queryFn: () => fetchOrderPage(q), placeholderData: keepPreviousData });
}
export function useRecentOrders(limit = 6) {
  return useQuery({ queryKey: ['reports', 'recent', limit], queryFn: () => fetchRecentOrders(limit), refetchInterval: REFRESH_MS });
}
