import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { deleteItem, fetchItems, fetchMovements, recordStock, saveItem, stockStatus } from './api';

export function useStockItems() {
  return useQuery({ queryKey: ['inventory', 'items'], queryFn: fetchItems, refetchInterval: 60_000 });
}
export function useMovements(itemId: string | null) {
  return useQuery({ queryKey: ['inventory', 'movements', itemId], queryFn: () => fetchMovements(itemId!), enabled: !!itemId });
}
/** Barang aktif yang kritis atau menipis (untuk lonceng dan dasbor). */
export function useLowStock() {
  return useQuery({
    queryKey: ['inventory', 'items'], queryFn: fetchItems, refetchInterval: 60_000,
    select: (items) => items.filter((i) => i.is_active && stockStatus(i) !== 'ok'),
  });
}

function useRefresh() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: ['inventory'] });
}
export function useSaveItem() { const r = useRefresh(); return useMutation({ mutationFn: saveItem, onSuccess: r }); }
export function useDeleteItem() { const r = useRefresh(); return useMutation({ mutationFn: deleteItem, onSuccess: r }); }
export function useRecordStock() { const r = useRefresh(); return useMutation({ mutationFn: recordStock, onSuccess: r }); }
