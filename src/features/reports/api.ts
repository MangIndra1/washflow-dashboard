import type { Json } from '@/types/database';
import { supabase } from '@/lib/supabase';
import type { PaymentMethod } from '@/features/orders/api';

export interface ReportDay { day: string; orders: number; value: number; received: number }
export interface ReportBranch { id: string; code: string; name: string; orders: number; value: number; received: number }
export interface ReportService { name: string; orders: number; quantity: number; value: number }
export interface ReportDiscount { label: string; kind: 'promo' | 'member'; orders: number; amount: number }
export interface AdminReport {
  totals: { orders: number; value: number; outstanding: number; gross: number; discount: number; discounted_orders: number };
  discounts: ReportDiscount[];
  received: { total: number } & Record<PaymentMethod, number>;
  prev: { orders: number; value: number; received: number };
  daily: ReportDay[];
  branches: ReportBranch[];
  services: ReportService[];
}

export function localTimeZone(): string {
  try { return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Makassar'; } catch { return 'Asia/Makassar'; }
}

export async function fetchAdminReport(from: string, to: string, branchId: string | null): Promise<AdminReport> {
  const { data, error } = await supabase.rpc('admin_report', {
    p_from: from, p_to: to, p_branch: branchId ?? undefined, p_tz: localTimeZone(),
  });
  if (error) throw error;
  return data as unknown as AdminReport;
}

export type { Json };

// ─── Peringatan dan daftar untuk admin ───────────────────────────────────────
export interface OverdueOrder {
  id: string; code: string; due_at: string; status: string;
  customer: { name: string } | null; branch: { name: string; code: string } | null;
}

/** Pesanan belum selesai yang lewat batas waktu, semua cabang (RLS admin). */
export async function fetchOverdueOrders(limit = 5): Promise<{ rows: OverdueOrder[]; count: number }> {
  const now = new Date().toISOString();
  const { data, error, count } = await supabase
    .from('orders')
    .select('id, code, due_at, status, customer:customers(name), branch:branches!orders_branch_id_fkey(name, code)', { count: 'exact' })
    .neq('status', 'completed').lt('due_at', now).order('due_at', { ascending: true }).limit(limit);
  if (error) throw error;
  return { rows: data as unknown as OverdueOrder[], count: count ?? 0 };
}

export async function fetchActiveCount(): Promise<number> {
  const { count, error } = await supabase.from('orders').select('id', { count: 'exact', head: true }).neq('status', 'completed');
  if (error) throw error;
  return count ?? 0;
}

export interface OrderRow {
  id: string; code: string; created_at: string; subtotal: number; discount: number; discount_label: string | null; total: number; paid_amount: number;
  payment_status: 'unpaid' | 'partial' | 'paid'; status: string;
  customer: { name: string; phone: string } | null; branch: { name: string; code: string } | null;
  order_items: { service_name: string }[];
}

const ROW_SELECT = `id, code, created_at, subtotal, discount, discount_label, total, paid_amount, payment_status, status,
  customer:customers(name, phone), branch:branches!orders_branch_id_fkey(name, code), order_items(service_name)`;

export interface OrderPageQuery { from: string; to: string; branchId: string | null; payment: string; page: number; pageSize: number }

export async function fetchOrderPage(q: OrderPageQuery): Promise<{ rows: OrderRow[]; total: number }> {
  let req = supabase.from('orders').select(ROW_SELECT, { count: 'exact' }).gte('created_at', q.from).lt('created_at', q.to);
  if (q.branchId) req = req.eq('branch_id', q.branchId);
  if (q.payment) req = req.eq('payment_status', q.payment as OrderRow['payment_status']);
  const a = q.page * q.pageSize;
  const { data, error, count } = await req.order('created_at', { ascending: false }).order('id').range(a, a + q.pageSize - 1);
  if (error) throw error;
  return { rows: data as unknown as OrderRow[], total: count ?? 0 };
}

export async function fetchRecentOrders(limit = 6): Promise<OrderRow[]> {
  const { data, error } = await supabase.from('orders').select(ROW_SELECT).order('created_at', { ascending: false }).limit(limit);
  if (error) throw error;
  return data as unknown as OrderRow[];
}
