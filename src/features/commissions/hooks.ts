import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  fetchCommissionEntries, fetchCommissionReport, fetchMyCommission, fetchPayouts,
  payCommissions, recalcCommissions, voidPayout,
} from './api';

export function useCommissionReport(from: string, to: string, branchId: string | null) {
  return useQuery({
    queryKey: ['commissions', 'report', from, to, branchId],
    queryFn: () => fetchCommissionReport(from, to, branchId),
    placeholderData: keepPreviousData,
  });
}
export function useCommissionEntries(from: string, to: string, employeeId: string | null, branchId: string | null, enabled: boolean) {
  return useQuery({
    queryKey: ['commissions', 'entries', from, to, employeeId, branchId],
    queryFn: () => fetchCommissionEntries(from, to, employeeId, branchId),
    enabled,
  });
}
export function usePayouts() {
  return useQuery({ queryKey: ['commissions', 'payouts'], queryFn: () => fetchPayouts() });
}
export function useMyCommission(from: string, to: string) {
  return useQuery({ queryKey: ['commissions', 'mine', from, to], queryFn: () => fetchMyCommission(from, to), refetchInterval: 60_000 });
}

function useRefresh() {
  const qc = useQueryClient();
  return () => Promise.all([
    qc.invalidateQueries({ queryKey: ['commissions'] }),
    qc.invalidateQueries({ queryKey: ['staff'] }),
  ]);
}
export function usePayCommissions() {
  const refresh = useRefresh();
  return useMutation({ mutationFn: payCommissions, onSuccess: refresh });
}
export function useVoidPayout() {
  const refresh = useRefresh();
  return useMutation({ mutationFn: voidPayout, onSuccess: refresh });
}
export function useRecalcCommissions() {
  const refresh = useRefresh();
  return useMutation({ mutationFn: recalcCommissions, onSuccess: refresh });
}
