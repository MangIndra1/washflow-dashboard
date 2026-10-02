-- =============================================================================
-- WashFlow: data awal BERSIH (dipakai `supabase db push --include-seed`)
-- Hanya tingkat keanggotaan bawaan. Tidak ada cabang, pelanggan, pesanan, atau akun.
-- Cabang, layanan, karyawan, dan promo dibuat lewat aplikasi setelah login admin.
-- Data demo fiktif untuk portofolio ada di supabase/demo/ (jalankan hanya di project demo).
-- =============================================================================

insert into public.membership_tiers (name, min_points, discount_percent, color, benefits) values
  ('Bronze',    0,  0, '#B45309', array['Mengumpulkan poin dari setiap pesanan']),
  ('Silver',   20,  5, '#64748B', array['Diskon 5% untuk setiap pesanan']),
  ('Gold',     50, 10, '#D97706', array['Diskon 10% untuk setiap pesanan']),
  ('Platinum', 80, 15, '#2563EB', array['Diskon 15% untuk setiap pesanan']);
-- Aturan poin default (Rp 10.000 = 1 poin) dibuat oleh migrasi dan bisa diubah admin di menu Keanggotaan.
