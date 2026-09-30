-- =============================================================================
-- WashFlow: data awal BERSIH (dipakai `supabase db push --include-seed`)
-- Hanya tingkat keanggotaan bawaan. Tidak ada cabang, pelanggan, pesanan, atau akun.
-- Cabang, layanan, karyawan, dan promo dibuat lewat aplikasi setelah login admin.
-- Data demo fiktif untuk portofolio ada di supabase/demo/ (jalankan hanya di project demo).
-- =============================================================================

insert into public.membership_tiers (name, min_points, discount_percent, color, benefits) values
  ('Bronze',       0,  0, '#B45309', array['Layanan dasar', 'Diskon ulang tahun 5%']),
  ('Silver',    1000,  5, '#64748B', array['Diskon 5% semua order', 'Prioritas pengambilan', 'Diskon ulang tahun 10%']),
  ('Gold',      2500, 10, '#D97706', array['Diskon 10% semua order', 'Prioritas pengerjaan', 'Gratis 1x cuci express/bulan', 'Diskon ulang tahun 15%']),
  ('Platinum',  5000, 15, '#2563EB', array['Diskon 15% semua order', 'Prioritas pengerjaan', 'Gratis 1x cuci express/minggu', 'Layanan pelanggan khusus', 'Diskon ulang tahun 20%']);
