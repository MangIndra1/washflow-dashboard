import { supabase } from '@/lib/supabase';
import { parseBanks, type PaymentInfo } from '@/features/payment-info/api';
import type { OrderStatus } from '@/features/orders/api';

export interface TrackData {
  code: string;
  status: OrderStatus;
  payment_status: 'unpaid' | 'partial' | 'paid';
  total: number;
  paid_amount: number;
  discount: number;
  discount_label: string | null;
  created_at: string;
  due_at: string | null;
  completed_at: string | null;
  branch: { name: string; address: string | null; phone: string | null } | null;
  customer_first_name: string | null;
  items: { service_name: string; quantity: number; unit: string; line_total: number }[];
  timeline: { status: OrderStatus; at: string }[];
  payment_info: PaymentInfo | null;
}

/** Token pelacakan: 32 karakter hex. Bentuk lain tidak perlu dikirim ke server. */
export const TOKEN_PATTERN = /^[0-9a-f]{32}$/;

export async function fetchTracking(token: string): Promise<TrackData | null> {
  if (!TOKEN_PATTERN.test(token)) return null;
  const { data, error } = await supabase.rpc('track_order', { p_token: token });
  if (error) throw error;
  if (!data) return null;
  const d = data as unknown as TrackData & { payment_info: (Omit<PaymentInfo, 'banks'> & { banks: unknown }) | null };
  return { ...d, payment_info: d.payment_info ? { ...d.payment_info, banks: parseBanks(d.payment_info.banks) } : null };
}

export function trackingUrl(token: string): string {
  return `${window.location.origin}/track/${token}`;
}
