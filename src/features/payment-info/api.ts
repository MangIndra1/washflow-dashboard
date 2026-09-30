import { supabase } from '@/lib/supabase';

export interface BankAccount { bank: string; number: string; holder: string }
export interface PaymentInfo {
  qris_payload: string | null;
  qris_merchant: string | null;
  banks: BankAccount[];
  note: string | null;
}

export function parseBanks(value: unknown): BankAccount[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((v) => {
    if (!v || typeof v !== 'object') return [];
    const o = v as Record<string, unknown>;
    return typeof o.bank === 'string' && typeof o.number === 'string'
      ? [{ bank: o.bank, number: o.number, holder: typeof o.holder === 'string' ? o.holder : '' }] : [];
  });
}

export async function fetchPaymentInfo(): Promise<PaymentInfo> {
  const { data, error } = await supabase.from('payment_info').select('qris_payload, qris_merchant, banks, note').maybeSingle();
  if (error) throw error;
  return { qris_payload: data?.qris_payload ?? null, qris_merchant: data?.qris_merchant ?? null, banks: parseBanks(data?.banks), note: data?.note ?? null };
}

export async function savePaymentInfo(info: PaymentInfo, userId: string): Promise<void> {
  const { error } = await supabase.from('payment_info').update({
    qris_payload: info.qris_payload, qris_merchant: info.qris_merchant,
    banks: info.banks.map((b) => ({ bank: b.bank.trim(), number: b.number.trim(), holder: b.holder.trim() })),
    note: info.note?.trim() || null, updated_at: new Date().toISOString(), updated_by: userId,
  }).eq('id', true);
  if (error) throw error;
}
