-- =============================================================================
-- WashFlow: menjadikan SATU akun sebagai admin (langkah pertama di project baru)
-- LANGKAH: (1) Dashboard Supabase > Authentication > Users > Add user (centang "Auto Confirm User");
--          (2) ganti email di bawah dengan email akun itu, lalu jalankan di SQL Editor.
-- Aman dijalankan ulang. Akun baru selalu berperan karyawan tanpa cabang (demi keamanan),
-- jadi langkah ini memang wajib untuk admin pertama.
-- =============================================================================

update public.profiles
   set role = 'admin', branch_id = null, is_active = true,
       full_name = coalesce(nullif(full_name, ''), 'Admin'), job_title = 'Pemilik Usaha'
 where id = (select id from auth.users where lower(email) = lower('GANTI-DENGAN-EMAIL-ANDA@example.com'));

-- Cek hasil: harus tampil 1 baris dengan role = admin dan is_active = true
select email, role, is_active from public.profiles where lower(email) = lower('GANTI-DENGAN-EMAIL-ANDA@example.com');
