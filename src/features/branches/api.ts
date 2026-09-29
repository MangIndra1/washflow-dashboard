import { supabase } from '@/lib/supabase';
import type { Tables, TablesInsert } from '@/types/database';

export type Branch = Tables<'branches'>;

export interface BranchListItem extends Branch {
  manager: { id: string; full_name: string } | null;
  ordersToday: number;
  orders30d: number;
  revenue30d: number;
  customers: number;
}

export type BranchInput = Pick<TablesInsert<'branches'>, 'code' | 'name' | 'address' | 'phone' | 'status' | 'open_time' | 'close_time' | 'manager_id'> & { id?: string };

export async function fetchBranches(): Promise<BranchListItem[]> {
  const [branches, stats] = await Promise.all([
    supabase.from('branches').select('*, manager:profiles!branches_manager_id_fkey(id, full_name)').order('code'),
    supabase.from('branch_stats').select('*'),
  ]);
  if (branches.error) throw branches.error;
  if (stats.error) throw stats.error;

  const byId = new Map(stats.data.map((s) => [s.branch_id, s]));
  return branches.data.map((b) => {
    const s = byId.get(b.id);
    return {
      ...b,
      ordersToday: s?.orders_today ?? 0,
      orders30d: s?.orders_30d ?? 0,
      revenue30d: s?.revenue_30d ?? 0,
      customers: s?.customers_count ?? 0,
    };
  });
}

export async function saveBranch({ id, ...values }: BranchInput): Promise<void> {
  const { error } = id
    ? await supabase.from('branches').update(values).eq('id', id)
    : await supabase.from('branches').insert(values);
  if (error) throw error;
}

export async function deleteBranch(id: string): Promise<void> {
  const { error } = await supabase.from('branches').delete().eq('id', id);
  if (error) throw error;
}
