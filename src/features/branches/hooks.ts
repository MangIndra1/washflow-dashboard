import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { deleteBranch, fetchBranches, saveBranch } from './api';

export const branchKeys = { all: ['branches'] as const };

export function useBranches() {
  return useQuery({ queryKey: branchKeys.all, queryFn: fetchBranches });
}

/** Perubahan cabang memengaruhi nama cabang di daftar karyawan, jadi keduanya disegarkan. */
function useInvalidate() {
  const qc = useQueryClient();
  return () => Promise.all([
    qc.invalidateQueries({ queryKey: branchKeys.all }),
    qc.invalidateQueries({ queryKey: ['staff'] }),
  ]);
}

export function useSaveBranch() {
  const invalidate = useInvalidate();
  return useMutation({ mutationFn: saveBranch, onSuccess: invalidate });
}

export function useDeleteBranch() {
  const invalidate = useInvalidate();
  return useMutation({ mutationFn: deleteBranch, onSuccess: invalidate });
}
