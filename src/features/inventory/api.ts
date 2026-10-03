import { supabase } from '@/lib/supabase';
import type { Tables } from '@/types/database';

export type StockItem = Tables<'inventory_items'> & { branch: { name: string; code: string } | null };
export type StockMovement = Tables<'stock_movements'>;
export type MoveKind = 'in' | 'out' | 'adjust';
export type StockStatus = 'critical' | 'low' | 'ok';

export const KATEGORI = ['Kimia', 'Kemasan', 'Perlengkapan', 'Lainnya'] as const;

/** Kritis: di bawah/sama dengan stok minimum. Menipis: di bawah/sama dengan titik pesan ulang. */
export function stockStatus(i: Pick<Tables<'inventory_items'>, 'current_stock' | 'min_stock' | 'reorder_point'>): StockStatus {
  if (i.current_stock <= i.min_stock) return 'critical';
  if (i.current_stock <= i.reorder_point) return 'low';
  return 'ok';
}

export type CatalogItem = Tables<'inventory_catalog'>;

export interface CatalogInput {
  id?: string;
  name: string;
  category: string;
  unit: string;
  unit_cost: number;
  supplier: string | null;
  default_min_stock: number;
  default_reorder_point: number;
  is_active: boolean;
}

/** Pengaturan milik satu cabang. Nama, satuan, harga, dan pemasok berasal dari katalog. */
export interface BranchItemInput { id: string; min_stock: number; reorder_point: number; is_active: boolean }

export async function fetchItems(): Promise<StockItem[]> {
  const { data, error } = await supabase.from('inventory_items').select('*, branch:branches(name, code)').order('name');
  if (error) throw error;
  return (data ?? []) as StockItem[];
}

export async function saveBranchItem(v: BranchItemInput): Promise<void> {
  const { error } = await supabase.from('inventory_items').update({ min_stock: v.min_stock, reorder_point: v.reorder_point, is_active: v.is_active }).eq('id', v.id);
  if (error) throw error;
}

export async function fetchCatalog(): Promise<CatalogItem[]> {
  const { data, error } = await supabase.from('inventory_catalog').select('*').order('name');
  if (error) throw error;
  return data ?? [];
}

export async function saveCatalog(v: CatalogInput): Promise<void> {
  const row = {
    name: v.name.trim(), category: v.category, unit: v.unit.trim(), unit_cost: v.unit_cost, supplier: v.supplier?.trim() || null,
    default_min_stock: v.default_min_stock, default_reorder_point: v.default_reorder_point, is_active: v.is_active,
  };
  const { error } = v.id ? await supabase.from('inventory_catalog').update(row).eq('id', v.id) : await supabase.from('inventory_catalog').insert(row);
  if (error) throw error;
}

export async function deleteCatalog(id: string): Promise<void> {
  const { error } = await supabase.from('inventory_catalog').delete().eq('id', id);
  if (error) throw error;
}

export async function recordStock(input: { itemId: string; kind: MoveKind; qty: number; note: string }): Promise<number> {
  const { data, error } = await supabase.rpc('record_stock', { p_item_id: input.itemId, p_kind: input.kind, p_qty: input.qty, p_note: input.note.trim() || undefined });
  if (error) throw error;
  return data;
}

export async function fetchMovements(itemId: string, limit = 100): Promise<StockMovement[]> {
  const { data, error } = await supabase.from('stock_movements').select('*').eq('item_id', itemId).order('created_at', { ascending: false }).limit(limit);
  if (error) throw error;
  return data ?? [];
}

export interface TransferDestination { branch_id: string; branch_name: string; branch_code: string }

export async function fetchTransferDestinations(itemId: string): Promise<TransferDestination[]> {
  const { data, error } = await supabase.rpc('transfer_destinations', { p_item_id: itemId });
  if (error) throw error;
  return data ?? [];
}

export async function transferStock(input: { itemId: string; toBranch: string; qty: number; note: string }): Promise<number> {
  const { data, error } = await supabase.rpc('transfer_stock', { p_item_id: input.itemId, p_to_branch: input.toBranch, p_qty: input.qty, p_note: input.note.trim() || undefined });
  if (error) throw error;
  return data;
}
