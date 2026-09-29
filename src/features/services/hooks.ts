import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';
import { deleteService, fetchServices, saveService, setServiceActive } from './api';

export const serviceKeys = { all: ['services'] as const };

export function useServices() {
  return useQuery({ queryKey: serviceKeys.all, queryFn: fetchServices });
}

function useInvalidate() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: serviceKeys.all });
}

export function useSaveService() {
  const invalidate = useInvalidate();
  return useMutation({ mutationFn: saveService, onSuccess: invalidate });
}

export function useToggleService() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => setServiceActive(id, isActive),
    onSuccess: invalidate,
  });
}

export function useDeleteService() {
  const invalidate = useInvalidate();
  return useMutation({ mutationFn: deleteService, onSuccess: invalidate });
}

/** Layanan aktif untuk form order (tanpa statistik). */
export function useActiveServices() {
  return useQuery({
    queryKey: ['services', 'active'],
    queryFn: async () => {
      const { data, error } = await supabase.from('services').select('*').eq('is_active', true).order('sort_order').order('name');
      if (error) throw error;
      return data;
    },
  });
}
