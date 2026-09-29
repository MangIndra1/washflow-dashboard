import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { fetchCustomer, fetchCustomerOrders, fetchCustomerStats, fetchTiers, saveCustomer, searchCustomers, type CustomerQuery } from './api';

export const customerKeys = {
  all: ['customers'] as const,
  list: (q: CustomerQuery) => ['customers', 'list', q] as const,
  one: (id: string) => ['customers', 'one', id] as const,
  stats: (id: string) => ['customers', 'stats', id] as const,
  orders: (id: string) => ['customers', 'orders', id] as const,
};

export function useTiers() {
  return useQuery({ queryKey: ['tiers'], queryFn: fetchTiers, staleTime: 5 * 60_000 });
}

export function useCustomerSearch(q: CustomerQuery, enabled = true) {
  return useQuery({
    queryKey: customerKeys.list(q),
    queryFn: () => searchCustomers(q),
    placeholderData: keepPreviousData,
    enabled,
  });
}

export function useCustomer(id: string | null) {
  return useQuery({ queryKey: customerKeys.one(id ?? ''), queryFn: () => fetchCustomer(id!), enabled: !!id });
}

export function useCustomerStats(id: string | null) {
  return useQuery({ queryKey: customerKeys.stats(id ?? ''), queryFn: () => fetchCustomerStats(id!), enabled: !!id });
}

export function useCustomerOrders(id: string | null) {
  return useQuery({ queryKey: customerKeys.orders(id ?? ''), queryFn: () => fetchCustomerOrders(id!), enabled: !!id });
}

export function useSaveCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: saveCustomer,
    onSuccess: () => qc.invalidateQueries({ queryKey: customerKeys.all }),
  });
}
