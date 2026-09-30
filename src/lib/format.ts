/**
 * Helper format tampilan (locale id-ID). Semua angka uang di aplikasi disimpan
 * sebagai Rupiah utuh (bigint di database), jadi tidak ada konversi desimal.
 */

const rupiah = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
});

const angka = new Intl.NumberFormat('id-ID');

/** 1250000 -> "Rp 1.250.000" */
export function formatRupiah(value: number): string {
  return rupiah.format(Math.round(value)).replace(/ /g, ' ');
}

/** Untuk sumbu grafik dan kartu ringkas: 41800000 -> "Rp 41,8 jt" */
export function formatRupiahRingkas(value: number): string {
  const abs = Math.abs(value);
  const tanda = value < 0 ? '-' : '';
  const potong = (n: number, satuan: string) =>
    `${tanda}Rp ${new Intl.NumberFormat('id-ID', { maximumFractionDigits: 1 }).format(n)} ${satuan}`;
  if (abs >= 1_000_000_000) return potong(abs / 1_000_000_000, 'M');
  if (abs >= 1_000_000) return potong(abs / 1_000_000, 'jt');
  if (abs >= 1_000) return potong(abs / 1_000, 'rb');
  return `${tanda}Rp ${abs}`;
}

/** 12345 -> "12.345" */
export function formatAngka(value: number): string {
  return angka.format(value);
}

/** "2026-02-27" -> "27 Feb 2026" */
export function formatTanggal(value: string | Date): string {
  const d = typeof value === 'string' ? new Date(value.length === 10 ? `${value}T00:00:00` : value) : value;
  if (Number.isNaN(d.getTime())) return '-';
  return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }).format(d);
}

/** Tanggal + jam: "27 Feb 2026, 14.30" */
export function formatTanggalJam(value: string | Date): string {
  const d = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return '-';
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  }).format(d);
}

/** "Rabu, 30 September 2026" */
export function formatTanggalLengkap(value: Date = new Date()): string {
  return new Intl.DateTimeFormat('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(value);
}

/** "14.30" */
export function formatJam(value: string | Date): string {
  const d = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return '-';
  return new Intl.DateTimeFormat('id-ID', { hour: '2-digit', minute: '2-digit' }).format(d);
}
