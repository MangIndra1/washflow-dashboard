/** Perubahan persen; undefined bila periode pembanding kosong (tidak bisa dibandingkan). */
export function pctChange(cur: number, prev: number): number | undefined {
  if (!prev) return undefined;
  return Math.round(((cur - prev) / prev) * 1000) / 10;
}

/** "2026-09-30" menjadi "30 Sep". */
export function labelHari(day: string): string {
  const [y, m, d] = day.split('-').map(Number);
  return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short' }).format(new Date(y, m - 1, d));
}
