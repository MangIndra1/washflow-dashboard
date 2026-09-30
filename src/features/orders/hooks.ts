import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { customerKeys } from '@/features/customers/hooks';
import {
  createOrder, fetchActiveOrders, fetchOrderDetail, fetchOrdersInRange, fetchPaymentsInRange, fetchRecentCompleted,
  quoteOrder, recordPayment, updateOrderStatus, type BoardOrder, type CartLine, type OrderStatus, type PaymentMethod,
} from './api';

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
    mutationFn: (v: { orderId: string; amount: number; method: PaymentMethod }) =>
      recordPayment(v.orderId, v.amount, v.method),
    onSuccess: () => Promise.all([
      qc.invalidateQueries({ queryKey: orderKeys.all }),
      qc.invalidateQueries({ queryKey: customerKeys.all }),
    ]),
  });
}

const REFRESH_MS = 30_000;

export function useActiveOrders() {
  return useQuery({ queryKey: ['orders', 'active'], queryFn: fetchActiveOrders, refetchInterval: REFRESH_MS });
}

export function useRecentCompleted() {
  return useQuery({ queryKey: ['orders', 'completed-recent'], queryFn: () => fetchRecentCompleted(2), refetchInterval: REFRESH_MS });
}

/** Awal dan akhir hari ini menurut jam perangkat (kasir bekerja di zona waktunya sendiri). */
export function dayRange(date = new Date()): { from: string; to: string; key: string } {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const end = new Date(start.getTime() + 86_400_000);
  return { from: start.toISOString(), to: end.toISOString(), key: start.toDateString() };
}

export function useDayOrders(range = dayRange()) {
  return useQuery({
    queryKey: ['orders', 'day', range.key],
    queryFn: () => fetchOrdersInRange(range.from, range.to),
    refetchInterval: REFRESH_MS * 2,
  });
}

export function useDayPayments(range = dayRange()) {
  return useQuery({
    queryKey: ['orders', 'payments-day', range.key],
    queryFn: () => fetchPaymentsInRange(range.from, range.to),
    refetchInterval: REFRESH_MS * 2,
  });
}

/** Ubah status dengan pembaruan instan di papan; dikembalikan bila server menolak. */
export function useUpdateOrderStatus() {
  const qc = useQueryClient();
  const activeKey = ['orders', 'active'];
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: OrderStatus }) => updateOrderStatus(id, status),
    onMutate: async ({ id, status }) => {
      await qc.cancelQueries({ queryKey: activeKey });
      const previous = qc.getQueryData<BoardOrder[]>(activeKey);
      if (previous) {
        qc.setQueryData<BoardOrder[]>(activeKey,
          status === 'completed'
            ? previous.filter((o) => o.id !== id)
            : previous.map((o) => (o.id === id ? { ...o, status } : o)));
      }
      return { previous };
    },
    onError: (_e, _v, ctx) => { if (ctx?.previous) qc.setQueryData(activeKey, ctx.previous); },
    onSettled: () => qc.invalidateQueries({ queryKey: orderKeys.all }),
  });
}
