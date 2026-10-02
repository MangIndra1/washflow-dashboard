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

export interface ItemInput {
  id?: string;
  branch_id: string;
  name: string;
  category: string;
  unit: string;
  min_stock: number;
  reorder_point: number;
  unit_cost: number;
  supplier: string | null;
  is_active: boolean;
  /** Hanya saat membuat barang baru. */
  initial_stock?: number;
}

export async function fetchItems(): Promise<StockItem[]> {
  const { data, error } = await supabase.from('inventory_items').select('*, branch:branches(name, code)').order('name');
  if (error) throw error;
  return (data ?? []) as StockItem[];
}

export async function saveItem(v: ItemInput): Promise<void> {
  const base = {
    name: v.name.trim(), category: v.category, unit: v.unit.trim(), min_stock: v.min_stock, reorder_point: v.reorder_point,
    unit_cost: v.unit_cost, supplier: v.supplier?.trim() || null, is_active: v.is_active,
  };
  if (v.id) {
    const { error } = await supabase.from('inventory_items').update(base).eq('id', v.id);
    if (error) throw error;
  } else {
    const { error } = await supabase.from('inventory_items').insert({ ...base, branch_id: v.branch_id, current_stock: v.initial_stock ?? 0 });
    if (error) throw error;
  }
}

export async function deleteItem(id: string): Promise<void> {
  const { error } = await supabase.from('inventory_items').delete().eq('id', id);
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
