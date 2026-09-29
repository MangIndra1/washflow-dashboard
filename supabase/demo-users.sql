-- =============================================================================
-- WashFlow — menjadikan akun demo sebagai admin / karyawan
-- LANGKAH: (1) buat 3 user di Dashboard → Authentication → Users → Add user
--              (centang "Auto Confirm User") dengan email di bawah;
--          (2) jalankan file ini di SQL Editor.
-- Aman dijalankan ulang. Ganti email jika Anda memakai email lain.
-- =============================================================================

update public.profiles
   set role = 'admin', full_name = 'Owner WashFlow', branch_id = null, is_active = true
 where id = (select id from auth.users where email = 'washflow.admin@example.com');

update public.profiles
   set role = 'employee', full_name = 'Kadek Kasir Denpasar', is_active = true,
       branch_id = (select id from public.branches where code = 'DPS')
 where id = (select id from auth.users where email = 'washflow.kasir.dps@example.com');

update public.profiles
   set role = 'employee', full_name = 'Wayan Kasir Kuta', is_active = true,
       branch_id = (select id from public.branches where code = 'KTA')
 where id = (select id from auth.users where email = 'washflow.kasir.kta@example.com');

-- Cek hasil: harus tampil 3 baris (1 admin, 2 employee dengan cabang)
select u.email, p.role, p.full_name, b.code as branch
  from public.profiles p
  join auth.users u on u.id = p.id
  left join public.branches b on b.id = p.branch_id
 where u.email like 'washflow.%@example.com'
 order by p.role, u.email;
