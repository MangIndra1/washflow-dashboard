import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { fetchPaymentInfo, savePaymentInfo, type PaymentInfo } from './api';

export const paymentInfoKey = ['payment-info'] as const;

export function usePaymentInfo() {
  return useQuery({ queryKey: paymentInfoKey, queryFn: fetchPaymentInfo, staleTime: 5 * 60_000 });
}

export function useSavePaymentInfo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ info, userId }: { info: PaymentInfo; userId: string }) => savePaymentInfo(info, userId),
    onSuccess: () => qc.invalidateQueries({ queryKey: paymentInfoKey }),
  });
}
