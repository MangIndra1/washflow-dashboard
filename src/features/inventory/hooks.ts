import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { deleteCatalog, fetchTransferDestinations, transferStock, fetchCatalog, fetchItems, fetchMovements, recordStock, saveBranchItem, saveCatalog, stockStatus } from './api';

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
export function useCatalog() { return useQuery({ queryKey: ['inventory', 'catalog'], queryFn: fetchCatalog }); }
export function useSaveBranchItem() { const r = useRefresh(); return useMutation({ mutationFn: saveBranchItem, onSuccess: r }); }
export function useSaveCatalog() { const r = useRefresh(); return useMutation({ mutationFn: saveCatalog, onSuccess: r }); }
export function useDeleteCatalog() { const r = useRefresh(); return useMutation({ mutationFn: deleteCatalog, onSuccess: r }); }
export function useRecordStock() { const r = useRefresh(); return useMutation({ mutationFn: recordStock, onSuccess: r }); }
export function useTransferDestinations(itemId: string | null) {
  return useQuery({ queryKey: ['inventory', 'destinations', itemId], queryFn: () => fetchTransferDestinations(itemId!), enabled: !!itemId });
}
export function useTransferStock() { const r = useRefresh(); return useMutation({ mutationFn: transferStock, onSuccess: r }); }
