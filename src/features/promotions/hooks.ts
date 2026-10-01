import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { deletePromotion, fetchPromotions, savePromotion, setPromotionActive } from './api';

export const promotionKeys = { all: ['promotions'] as const };

export function usePromotions() {
  return useQuery({ queryKey: promotionKeys.all, queryFn: fetchPromotions });
}

function useInvalidate() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: promotionKeys.all });
}

export function useSavePromotion() {
  const invalidate = useInvalidate();
  return useMutation({ mutationFn: savePromotion, onSuccess: invalidate });
}

export function useTogglePromotion() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => setPromotionActive(id, isActive),
    onSuccess: invalidate,
  });
}

export function useDeletePromotion() {
  const invalidate = useInvalidate();
  return useMutation({ mutationFn: deletePromotion, onSuccess: invalidate });
}
