import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { fetchNotificationSummary, fetchOrderNotification, fetchWaNotifyEnabled, saveWaNotifyEnabled } from './api';

const key = ['automation', 'wa-notify'] as const;

export function useWaNotifyEnabled() {
  return useQuery({ queryKey: key, queryFn: fetchWaNotifyEnabled });
}

export function useSaveWaNotify() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ enabled, userId }: { enabled: boolean; userId: string }) => saveWaNotifyEnabled(enabled, userId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['automation'] }),
  });
}

export function useNotificationSummary(enabled: boolean) {
  return useQuery({ queryKey: ['automation', 'summary'], queryFn: fetchNotificationSummary, enabled, refetchInterval: 60_000 });
}

/** Status notifikasi WhatsApp sebuah pesanan (null bila belum pernah masuk antrean). */
export function useOrderNotification(orderId: string) {
  return useQuery({ queryKey: ['automation', 'order', orderId], queryFn: () => fetchOrderNotification(orderId), refetchInterval: 30_000 });
}
