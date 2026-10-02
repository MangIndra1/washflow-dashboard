import { supabase } from '@/lib/supabase';
import { localTimeZone } from '@/features/reports/api';
import type { Tables } from '@/types/database';

export type CommissionEntry = Pick<Tables<'commission_entries'>,
  'id' | 'order_id' | 'order_code' | 'employee_id' | 'employee_name' | 'base_amount' | 'rate' | 'amount' | 'source' | 'earned_at' | 'payout_id'>;
export type CommissionPayout = Tables<'commission_payouts'>;

export interface CommissionEmployee {
  id: string | null; name: string; branch: string | null; current_rate: number | null; active: boolean | null;
  orders: number; base: number; amount: number; unpaid: number; paid: number;
}
export interface CommissionReport {
  totals: { orders: number; base: number; amount: number; unpaid: number; paid: number };
  employees: CommissionEmployee[];
}

export async function fetchCommissionReport(from: string, to: string, branchId: string | null): Promise<CommissionReport> {
  const { data, error } = await supabase.rpc('commission_report', { p_from: from, p_to: to, p_branch: branchId ?? undefined });
  if (error) throw error;
  return data as unknown as CommissionReport;
}

const ENTRY_COLS = 'id, order_id, order_code, employee_id, employee_name, base_amount, rate, amount, source, earned_at, payout_id';

/** Rincian per pesanan. employeeId null = semua karyawan (dipakai untuk ekspor). */
export async function fetchCommissionEntries(from: string, to: string, employeeId: string | null, branchId: string | null, limit = 1000): Promise<CommissionEntry[]> {
  let q = supabase.from('commission_entries').select(ENTRY_COLS).gte('earned_at', from).lt('earned_at', to)
    .order('earned_at', { ascending: false }).limit(limit);
  if (employeeId) q = q.eq('employee_id', employeeId);
  if (branchId) q = q.eq('branch_id', branchId);
  const { data, error } = await q;
  if (error) throw error;
  return data ?? [];
}

export async function fetchPayouts(limit = 50): Promise<CommissionPayout[]> {
  const { data, error } = await supabase.from('commission_payouts').select('*').order('paid_at', { ascending: false }).limit(limit);
  if (error) throw error;
  return data ?? [];
}

export async function payCommissions(input: { employeeId: string; from: string; to: string; note: string }): Promise<{ total: number; entries: number }> {
  const { data, error } = await supabase.rpc('pay_commissions', {
    p_employee_id: input.employeeId, p_from: input.from, p_to: input.to, p_note: input.note.trim() || undefined, p_tz: localTimeZone(),
  });
  if (error) throw error;
  return data as unknown as { total: number; entries: number };
}

export async function voidPayout(id: string): Promise<number> {
  const { data, error } = await supabase.rpc('void_commission_payout', { p_payout_id: id });
  if (error) throw error;
  return data;
}

export async function recalcCommissions(since: string | null): Promise<{ orders: number; amount: number }> {
  const { data, error } = await supabase.rpc('recalc_commissions', { p_since: since ?? undefined });
  if (error) throw error;
  return data as unknown as { orders: number; amount: number };
}

/** Komisi milik pengguna yang login (RLS membatasi ke barisnya sendiri). */
export async function fetchMyCommission(from: string, to: string): Promise<{ orders: number; amount: number; unpaid: number }> {
  const { data, error } = await supabase.from('commission_entries').select('amount, payout_id').gte('earned_at', from).lt('earned_at', to).limit(5000);
  if (error) throw error;
  const rows = data ?? [];
  return {
    orders: rows.length,
    amount: rows.reduce((s, r) => s + r.amount, 0),
    unpaid: rows.filter((r) => !r.payout_id).reduce((s, r) => s + r.amount, 0),
  };
}
