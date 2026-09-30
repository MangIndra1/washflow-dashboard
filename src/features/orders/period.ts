export type PeriodKey = 'today' | 'yesterday' | 'last7' | 'thisMonth' | 'lastMonth' | 'custom';

export const PERIOD_LABEL: Record<PeriodKey, string> = {
  today: 'Hari ini', yesterday: 'Kemarin', last7: '7 hari terakhir', thisMonth: 'Bulan ini', lastMonth: 'Bulan lalu', custom: 'Pilih tanggal',
};

export const MAX_EXPORT_DAYS = 92;

export interface Period { from: string; to: string; start: Date; endInclusive: Date; days: number }

function ymd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
export { ymd };

function parseYmd(s: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Rentang hari penuh berdasarkan jam lokal perangkat. `to` eksklusif. Null bila tanggal tidak valid. */
export function resolvePeriod(key: PeriodKey, customFrom = '', customTo = '', now = new Date()): Period | null {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let start: Date;
  let end: Date; // inklusif
  switch (key) {
    case 'today': start = today; end = today; break;
    case 'yesterday': start = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1); end = start; break;
    case 'last7': start = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 6); end = today; break;
    case 'thisMonth': start = new Date(today.getFullYear(), today.getMonth(), 1); end = today; break;
    case 'lastMonth': start = new Date(today.getFullYear(), today.getMonth() - 1, 1); end = new Date(today.getFullYear(), today.getMonth(), 0); break;
    case 'custom': {
      const a = parseYmd(customFrom); const b = parseYmd(customTo);
      if (!a || !b) return null;
      start = a; end = b; break;
    }
  }
  if (end < start) return null;
  const next = new Date(end.getFullYear(), end.getMonth(), end.getDate() + 1);
  const days = Math.round((next.getTime() - start.getTime()) / 86_400_000);
  return { from: start.toISOString(), to: next.toISOString(), start, endInclusive: end, days };
}

export function periodError(key: PeriodKey, p: Period | null): string | null {
  if (!p) return key === 'custom' ? 'Isi tanggal mulai dan tanggal akhir dengan benar (akhir tidak boleh sebelum mulai).' : 'Periode tidak valid.';
  if (p.days > MAX_EXPORT_DAYS) return `Rentang terlalu panjang (maksimal ${MAX_EXPORT_DAYS} hari).`;
  return null;
}

export function periodTag(p: Period): string {
  const a = ymd(p.start); const b = ymd(p.endInclusive);
  return a === b ? a : `${a}_sd_${b}`;
}

/** N hari terakhir termasuk hari ini (jam lokal perangkat). */
export function lastDays(n: number, now = new Date()): Period {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate() - (n - 1));
  const next = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
  return { from: start.toISOString(), to: next.toISOString(), start, endInclusive: today, days: n };
}

/** Tanggal 1 bulan ini sampai hari ini. */
export function monthToDate(now = new Date()): Period {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const start = new Date(today.getFullYear(), today.getMonth(), 1);
  const next = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
  return { from: start.toISOString(), to: next.toISOString(), start, endInclusive: today, days: today.getDate() };
}
