import { supabase } from '@/lib/supabase';
import type { Json, Tables } from '@/types/database';

export type Tier = Tables<'membership_tiers'>;
export type LoyaltySettings = Pick<Tables<'loyalty_settings'>, 'enabled' | 'rupiah_per_point'>;
export type Member = Pick<Tables<'customers'>, 'id' | 'name' | 'phone' | 'points' | 'created_at'>;
export type PointsLogRow = Pick<Tables<'points_log'>, 'id' | 'kind' | 'points' | 'balance_after' | 'note' | 'created_at'>;

export interface TierInput {
  id?: string;
  name: string;
  min_points: number;
  discount_percent: number;
  color: string;
  benefits: string[];
}

export async function fetchLoyaltySettings(): Promise<LoyaltySettings> {
  const { data, error } = await supabase.from('loyalty_settings').select('enabled, rupiah_per_point').eq('id', true).single();
  if (error) throw error;
  return data;
}

export async function saveLoyaltySettings(values: LoyaltySettings): Promise<void> {
  const { error } = await supabase.from('loyalty_settings').update(values).eq('id', true);
  if (error) throw error;
}

export async function fetchTierCounts(): Promise<Map<string, number>> {
  const { data, error } = await supabase.from('tier_stats').select('tier_id, member_count');
  if (error) throw error;
  return new Map(data.map((r) => [r.tier_id as string, (r.member_count as number) ?? 0]));
}

export async function saveTier({ id, ...values }: TierInput): Promise<void> {
  const { error } = id
    ? await supabase.from('membership_tiers').update(values).eq('id', id)
    : await supabase.from('membership_tiers').insert(values);
  if (error) throw error;
}

export async function deleteTier(id: string): Promise<void> {
  const { error } = await supabase.from('membership_tiers').delete().eq('id', id);
  if (error) throw error;
}

export interface MemberQuery { search: string; minPoints: number | null; maxPoints: number | null; limit: number }

/** Daftar member, poin terbanyak dulu. Tanda khusus filter PostgREST dibuang dari kata kunci. */
export async function fetchMembers({ search, minPoints, maxPoints, limit }: MemberQuery): Promise<{ rows: Member[]; total: number }> {
  let q = supabase.from('customers').select('id, name, phone, points, created_at', { count: 'exact' })
    .order('points', { ascending: false }).order('name').limit(limit);
  const kata = search.replace(/[,()%*\\]/g, ' ').trim();
  if (kata) q = q.or(`name.ilike.%${kata}%,phone.ilike.%${kata}%`);
  if (minPoints != null) q = q.gte('points', minPoints);
  if (maxPoints != null) q = q.lt('points', maxPoints);
  const { data, error, count } = await q;
  if (error) throw error;
  return { rows: data, total: count ?? data.length };
}

export async function adjustPoints(customerId: string, delta: number, note: string): Promise<number> {
  const { data, error } = await supabase.rpc('adjust_points', { p_customer_id: customerId, p_delta: delta, p_note: note });
  if (error) throw error;
  return data as number;
}

export async function recalcPoints(): Promise<{ orders: number; points: number }> {
  const { data, error } = await supabase.rpc('recalc_loyalty_points');
  if (error) throw error;
  return data as unknown as { orders: number; points: number };
}

export async function fetchPointsLog(customerId: string, limit = 30): Promise<PointsLogRow[]> {
  const { data, error } = await supabase.from('points_log').select('id, kind, points, balance_after, note, created_at')
    .eq('customer_id', customerId).order('created_at', { ascending: false }).limit(limit);
  if (error) throw error;
  return data;
}

export type { Json };
