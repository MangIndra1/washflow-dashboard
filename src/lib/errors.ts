/**
 * Mengubah error Supabase/Postgres menjadi pesan Bahasa Indonesia untuk pengguna.
 * Urutan: nama constraint spesifik dulu, lalu kode SQLSTATE, lalu pesan umum.
 */
interface PgLikeError {
  code?: string;
  message?: string;
  details?: string | null;
}

const BY_CONSTRAINT: Array<[string, string]> = [
  ['branches_code_key', 'Kode cabang sudah dipakai cabang lain.'],
  ['services_name_key', 'Nama layanan sudah dipakai.'],
  ['profiles_email_key', 'Email sudah terdaftar.'],
  ['inventory_catalog_name_key', 'Nama barang sudah ada di katalog.'],
  ['inventory_catalog_reorder', 'Titik pesan ulang harus sama dengan atau lebih besar dari stok minimum.'],
  ['inventory_items_branch_id_name_key', 'Nama barang sudah ada di cabang ini.'],
  ['promotions_code_key', 'Kode promo sudah dipakai promo lain.'],
  ['membership_tiers_name_key', 'Nama tingkat sudah dipakai tingkat lain.'],
  ['membership_tiers_min_points_key', 'Sudah ada tingkat lain dengan poin minimal ini.'],
  ['membership_tiers_color_hex', 'Warna tidak valid.'],
  ['loyalty_settings_rupiah_per_point_check', 'Nilai belanja per poin harus antara Rp 1.000 dan Rp 10.000.000.'],
  ['customers_phone_key', 'Nomor WhatsApp ini sudah terdaftar atas pelanggan lain.'],
  ['customers_phone_check', 'Nomor WhatsApp tidak valid. Gunakan 8 sampai 15 digit angka.'],
  ['orders_branch_id_fkey', 'Cabang ini sudah punya riwayat pesanan dan tidak bisa dihapus. Ubah statusnya menjadi Tutup.'],
];

export function pesanError(err: unknown, fallback = 'Terjadi kesalahan. Coba lagi.'): string {
  if (!err) return fallback;
  const e = err as PgLikeError;
  const text = `${e.message ?? ''} ${e.details ?? ''}`;

  for (const [constraint, pesan] of BY_CONSTRAINT) {
    if (text.includes(constraint)) return pesan;
  }

  switch (e.code) {
    case '23505': return 'Data yang sama sudah ada.';
    case '23503': return 'Data ini masih dipakai oleh data lain.';
    case '23514': return 'Isian tidak memenuhi aturan data.';
    case '42501': return 'Anda tidak punya izin untuk tindakan ini.';
    case 'P0001': return e.message || fallback; // pesan dari pengaman di database (sudah berbahasa Indonesia)
    default: break;
  }

  if (/row-level security|permission denied/i.test(text)) return 'Anda tidak punya izin untuk tindakan ini.';
  if (/failed to fetch|networkerror|load failed/i.test(text)) return 'Koneksi bermasalah. Periksa internet Anda lalu coba lagi.';
  if (err instanceof Error && err.message && !/^(JWT|PGRST)/.test(err.message)) return err.message;
  return fallback;
}
