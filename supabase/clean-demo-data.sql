-- =============================================================================
-- WashFlow: membersihkan data demo (pesanan, pelanggan, promo, stok, cabang, akun lain)
-- HANYA untuk project yang pernah diisi data demo. TIDAK BISA DIBATALKAN setelah dijalankan.
--
-- Sebelum menjalankan:
--   1. Pastikan akun Anda sudah ada di Authentication > Users dan sudah admin
--      (jalankan supabase/bootstrap-admin.sql, lalu coba login ke aplikasi).
--   2. Ganti email di bawah (satu-satunya tempat) dengan email admin yang DIPERTAHANKAN.
--
-- Yang dihapus : notifikasi, pembayaran, item pesanan, riwayat status, pesanan, pelanggan,
--                promo, inventaris, cabang, dan SEMUA akun selain email di atas.
-- Yang dipertahankan: akun admin itu, tingkat keanggotaan, info pembayaran (QRIS/rekening),
--                pengaturan otomasi, dan LAYANAN (harga contoh; ubah di menu Layanan atau
--                aktifkan baris "hapus layanan" di bawah bila ingin kosong).
-- Seluruh skrip berjalan dalam satu transaksi: bila ada yang gagal, tidak ada yang berubah.
-- Skrip menolak berjalan bila email tidak ditemukan atau bukan admin aktif.
-- =============================================================================

begin;

do $$
declare
  keeper constant text := lower('GANTI-DENGAN-EMAIL-ANDA@example.com');
  keeper_id uuid;
begin
  select u.id into keeper_id
    from auth.users u join public.profiles p on p.id = u.id
   where lower(u.email) = keeper and p.role = 'admin' and p.is_active;
  if keeper_id is null then
    raise exception 'Dibatalkan: % bukan admin aktif (atau belum terdaftar). Jalankan bootstrap-admin.sql dulu dan periksa emailnya.', keeper;
  end if;

  delete from public.notifications;
  delete from public.payments;
  delete from public.order_items;
  delete from public.order_status_logs;
  delete from public.orders;
  delete from public.customers;
  delete from public.promotions;
  delete from public.inventory_items;

  update public.branches set manager_id = null;
  -- Menghapus akun auth ikut menghapus profilnya (cascade). Admin yang dipertahankan tidak tersentuh.
  delete from auth.users where id <> keeper_id;
  delete from public.branches;

  -- delete from public.services;   -- hapus tanda -- di depan baris ini bila layanan contoh juga ingin dikosongkan

  alter sequence public.order_code_seq restart;
end $$;

commit;

-- Hasil: semua kolom "sisa" harus 0 kecuali akun (1) dan tingkat keanggotaan
select
  (select count(*) from public.orders)          as pesanan,
  (select count(*) from public.customers)       as pelanggan,
  (select count(*) from public.promotions)      as promo,
  (select count(*) from public.inventory_items) as inventaris,
  (select count(*) from public.branches)        as cabang,
  (select count(*) from public.profiles)        as akun,
  (select count(*) from public.membership_tiers) as tingkat_member,
  (select count(*) from public.services)        as layanan;
