import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { customerKeys } from '@/features/customers/hooks';
import { createOrder, fetchOrderDetail, quoteOrder, recordPayment, type CartLine } from './api';

export const orderKeys = {
  all: ['orders'] as const,
  detail: (id: string) => ['orders', 'detail', id] as const,
};

export function useQuote(customerId: string | null, lines: CartLine[], promoCode: string) {
  return useQuery({
    queryKey: ['quote', customerId, lines, promoCode],
    queryFn: () => quoteOrder(customerId!, lines, promoCode),
    enabled: !!customerId && lines.length > 0,
    placeholderData: keepPreviousData,
    staleTime: 0,
    retry: false,
  });
}

export function useCreateOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createOrder,
    onSuccess: () => Promise.all([
      qc.invalidateQueries({ queryKey: orderKeys.all }),
      qc.invalidateQueries({ queryKey: customerKeys.all }),
    ]),
  });
}

export function useOrderDetail(id: string | undefined) {
  return useQuery({ queryKey: orderKeys.detail(id ?? ''), queryFn: () => fetchOrderDetail(id!), enabled: !!id });
}

export function useRecordPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { orderId: string; amount: number; method: import('./api').PaymentMethod }) =>
      recordPayment(v.orderId, v.amount, v.method),
    onSuccess: () => Promise.all([
      qc.invalidateQueries({ queryKey: orderKeys.all }),
      qc.invalidateQueries({ queryKey: customerKeys.all }),
    ]),
  });
}
