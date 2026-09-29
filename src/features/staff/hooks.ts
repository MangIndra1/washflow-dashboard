import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { createStaff, fetchStaff, setStaffActive, updateStaff } from './api';

export const staffKeys = { all: ['staff'] as const };

export function useStaff() {
  return useQuery({ queryKey: staffKeys.all, queryFn: fetchStaff });
}

/** Perubahan karyawan memengaruhi pilihan manajer di halaman cabang. */
function useInvalidate() {
  const qc = useQueryClient();
  return () => Promise.all([
    qc.invalidateQueries({ queryKey: staffKeys.all }),
    qc.invalidateQueries({ queryKey: ['branches'] }),
  ]);
}

export function useUpdateStaff() {
  const invalidate = useInvalidate();
  return useMutation({ mutationFn: updateStaff, onSuccess: invalidate });
}

export function useToggleStaff() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => setStaffActive(id, isActive),
    onSuccess: invalidate,
  });
}

export function useCreateStaff() {
  const invalidate = useInvalidate();
  return useMutation({ mutationFn: createStaff, onSuccess: invalidate });
}
