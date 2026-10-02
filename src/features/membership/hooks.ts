import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { customerKeys } from '@/features/customers/hooks';
import {
  adjustPoints, deleteTier, fetchLoyaltySettings, fetchMembers, fetchPointsLog, fetchTierCounts,
  recalcPoints, saveLoyaltySettings, saveTier, type MemberQuery,
} from './api';

export const membershipKeys = {
  settings: ['loyalty-settings'] as const,
  counts: ['tier-counts'] as const,
  members: (q: MemberQuery) => ['members', q] as const,
  log: (id: string) => ['points-log', id] as const,
};

export function useLoyaltySettings() {
  return useQuery({ queryKey: membershipKeys.settings, queryFn: fetchLoyaltySettings });
}
export function useTierCounts() {
  return useQuery({ queryKey: membershipKeys.counts, queryFn: fetchTierCounts });
}
export function useMembers(q: MemberQuery) {
  return useQuery({ queryKey: membershipKeys.members(q), queryFn: () => fetchMembers(q), placeholderData: keepPreviousData });
}
export function usePointsLog(customerId: string | null) {
  return useQuery({ queryKey: membershipKeys.log(customerId ?? ''), queryFn: () => fetchPointsLog(customerId!), enabled: !!customerId });
}

/** Tier, aturan poin, atau poin berubah: segarkan semua yang bergantung padanya (termasuk kasir). */
function useRefreshAll() {
  const qc = useQueryClient();
  return () => Promise.all([
    qc.invalidateQueries({ queryKey: ['tiers'] }),
    qc.invalidateQueries({ queryKey: membershipKeys.settings }),
    qc.invalidateQueries({ queryKey: membershipKeys.counts }),
    qc.invalidateQueries({ queryKey: ['members'] }),
    qc.invalidateQueries({ queryKey: ['points-log'] }),
    qc.invalidateQueries({ queryKey: customerKeys.all }),
  ]);
}

export function useSaveLoyaltySettings() {
  const refresh = useRefreshAll();
  return useMutation({ mutationFn: saveLoyaltySettings, onSuccess: refresh });
}
export function useSaveTier() {
  const refresh = useRefreshAll();
  return useMutation({ mutationFn: saveTier, onSuccess: refresh });
}
export function useDeleteTier() {
  const refresh = useRefreshAll();
  return useMutation({ mutationFn: deleteTier, onSuccess: refresh });
}
export function useAdjustPoints() {
  const refresh = useRefreshAll();
  return useMutation({
    mutationFn: ({ customerId, delta, note }: { customerId: string; delta: number; note: string }) => adjustPoints(customerId, delta, note),
    onSuccess: refresh,
  });
}
export function useRecalcPoints() {
  const refresh = useRefreshAll();
  return useMutation({ mutationFn: recalcPoints, onSuccess: refresh });
}
