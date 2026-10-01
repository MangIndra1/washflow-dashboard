import type { Tables } from '@/types/database';

export type PromoStatus = 'active' | 'scheduled' | 'expired' | 'exhausted' | 'inactive';

export const PROMO_STATUS_LABEL: Record<PromoStatus, string> = {
  active: 'Aktif', scheduled: 'Terjadwal', expired: 'Kedaluwarsa', exhausted: 'Kuota habis', inactive: 'Nonaktif',
};

/** Tanggal lokal perangkat sebagai YYYY-MM-DD (kolom valid_from/valid_to bertipe date, tanpa zona waktu). */
export function todayLocal(d: Date = new Date()): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function addDaysLocal(days: number, from: Date = new Date()): string {
  const d = new Date(from);
  d.setDate(d.getDate() + days);
  return todayLocal(d);
}

/**
 * Status tampilan sebuah promo. Cermin aturan `private.price_order` di database
 * (aktif, rentang tanggal, kuota), ditambah label "Nonaktif" lebih dulu.
 */
export function promoStatus(
  p: Pick<Tables<'promotions'>, 'is_active' | 'valid_from' | 'valid_to' | 'max_usage'>,
  usage: number,
  today: string = todayLocal(),
): PromoStatus {
  if (!p.is_active) return 'inactive';
  if (today > p.valid_to) return 'expired';
  if (today < p.valid_from) return 'scheduled';
  if (p.max_usage !== null && usage >= p.max_usage) return 'exhausted';
  return 'active';
}
