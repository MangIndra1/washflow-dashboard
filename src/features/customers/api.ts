import { supabase } from '@/lib/supabase';
import type { Tables, Views } from '@/types/database';

export type Customer = Tables<'customers'>;
export type Tier = Tables<'membership_tiers'>;
export type CustomerStats = Views<'customer_stats'>;

export interface CustomerInput {
  id?: string;
  name: string;
  phone: string;
  email: string | null;
  address: string | null;
}

/** Tanda yang punya arti khusus di filter PostgREST dibuang dari kata kunci. */
function bersihkanKataKunci(q: string): string {
  return q.replace(/[,()%*\\]/g, ' ').trim();
}

export async function fetchTiers(): Promise<Tier[]> {
  const { data, error } = await supabase.from('membership_tiers').select('*').order('min_points');
  if (error) throw error;
  return data;
}

export interface CustomerQuery {
  search: string;
  /** Batas poin tingkat member yang dipilih (min inklusif, max eksklusif); null = tanpa batas. */
  minPoints?: number | null;
  maxPoints?: number | null;
  limit?: number;
}

export async function searchCustomers({ search, minPoints, maxPoints, limit = 50 }: CustomerQuery): Promise<Customer[]> {
  let query = supabase.from('customers').select('*').order('name').limit(limit);
  const q = bersihkanKataKunci(search);
  if (q) query = query.or(`name.ilike.%${q}%,phone.ilike.%${q}%,email.ilike.%${q}%`);
  if (minPoints != null) query = query.gte('points', minPoints);
  if (maxPoints != null) query = query.lt('points', maxPoints);
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function fetchCustomer(id: string): Promise<Customer | null> {
  const { data, error } = await supabase.from('customers').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data;
}

export async function saveCustomer({ id, ...values }: CustomerInput): Promise<Customer> {
  // Poin tidak pernah dikirim dari sini (dilindungi trigger dan hanya diubah sistem/admin).
  const { data, error } = id
    ? await supabase.from('customers').update(values).eq('id', id).select().single()
    : await supabase.from('customers').insert(values).select().single();
  if (error) throw error;
  return data;
}

export async function fetchCustomerStats(id: string): Promise<CustomerStats | null> {
  const { data, error } = await supabase.from('customer_stats').select('*').eq('customer_id', id).maybeSingle();
  if (error) throw error;
  return data;
}

export interface CustomerOrder {
  id: string;
  code: string;
  created_at: string;
  total: number;
  status: Tables<'orders'>['status'];
  payment_status: Tables<'orders'>['payment_status'];
  notes: string | null;
  order_items: { service_name: string; quantity: number; unit: string }[];
}

export async function fetchCustomerOrders(id: string): Promise<CustomerOrder[]> {
  const { data, error } = await supabase
    .from('orders')
    .select('id, code, created_at, total, status, payment_status, notes, order_items(service_name, quantity, unit)')
    .eq('customer_id', id)
    .order('created_at', { ascending: false })
    .limit(20);
  if (error) throw error;
  return data as CustomerOrder[];
}

/** Tingkat member = tingkat tertinggi yang batas poinnya sudah terlampaui. */
export function tierFor(points: number, tiers: Tier[]): { current: Tier | null; next: Tier | null } {
  const sorted = [...tiers].sort((a, b) => a.min_points - b.min_points);
  let current: Tier | null = null;
  for (const t of sorted) if (points >= t.min_points) current = t;
  const next = sorted.find((t) => t.min_points > points) ?? null;
  return { current, next };
}
