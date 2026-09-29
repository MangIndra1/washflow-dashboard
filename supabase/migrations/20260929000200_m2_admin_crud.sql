-- =============================================================================
-- WashFlow M2: pendukung CRUD cabang, layanan, karyawan
--   1. profiles: kolom email dan job_title, grant update per kolom
--   2. pengaman: admin aktif terakhir tidak boleh dinonaktifkan atau diturunkan
--   3. tampilan statistik (security_invoker, ikut RLS pemanggil)
--   4. default kategori layanan berbahasa Indonesia
-- =============================================================================

-- ─── 1. profiles ─────────────────────────────────────────────────────────────
alter table public.profiles
  add column email     text,
  add column job_title text not null default 'Operator'
    check (char_length(job_title) between 2 and 40);

update public.profiles p set email = u.email from auth.users u where u.id = p.id;

create unique index profiles_email_key on public.profiles (lower(email)) where email is not null;

-- User baru: role tetap 'employee', tanpa cabang. Email disalin dari auth.users.
create or replace function private.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, full_name, email)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data ->> 'full_name', ''), split_part(coalesce(new.email, ''), '@', 1), 'User'),
    new.email
  );
  return new;
end $$;

-- Update hanya lewat kolom yang memang boleh diubah admin.
-- id, email, created_at tidak bisa diubah dari Data API.
revoke update on public.profiles from authenticated;
grant update (full_name, phone, role, branch_id, is_active, commission_rate, job_title)
  on public.profiles to authenticated;

-- ─── 2. Pengaman admin terakhir ──────────────────────────────────────────────
create function private.keep_one_active_admin() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if old.role = 'admin' and old.is_active
     and (tg_op = 'DELETE' or new.role <> 'admin' or not new.is_active) then
    if not exists (
      select 1 from public.profiles
       where role = 'admin' and is_active and id <> old.id
    ) then
      raise exception 'Harus ada minimal satu admin aktif.' using errcode = 'P0001';
    end if;
  end if;
  return case when tg_op = 'DELETE' then old else new end;
end $$;

create trigger trg_profiles_keep_admin
  before update or delete on public.profiles
  for each row execute function private.keep_one_active_admin();

-- ─── 3. Tampilan statistik (30 hari terakhir) ────────────────────────────────
create view public.branch_stats with (security_invoker = true) as
select b.id as branch_id,
       count(o.id) filter (
         where (o.created_at at time zone 'Asia/Makassar')::date = (now() at time zone 'Asia/Makassar')::date
       )::int                                                            as orders_today,
       count(o.id) filter (where o.created_at >= now() - interval '30 days')::int as orders_30d,
       coalesce(sum(o.total) filter (where o.created_at >= now() - interval '30 days'), 0)::bigint as revenue_30d,
       count(distinct o.customer_id)::int                                as customers_count
  from public.branches b
  left join public.orders o on o.branch_id = b.id
 group by b.id;

create view public.service_stats with (security_invoker = true) as
select s.id as service_id,
       count(distinct oi.order_id) filter (where o.created_at >= now() - interval '30 days')::int as orders_30d,
       coalesce(sum(oi.line_total) filter (where o.created_at >= now() - interval '30 days'), 0)::bigint as revenue_30d
  from public.services s
  left join public.order_items oi on oi.service_id = s.id
  left join public.orders o on o.id = oi.order_id
 group by s.id;

create view public.employee_stats with (security_invoker = true) as
select p.id as profile_id,
       count(o.id) filter (where o.created_at >= now() - interval '30 days')::int as orders_30d,
       coalesce(round(sum(o.total) filter (where o.created_at >= now() - interval '30 days')
                      * p.commission_rate / 100), 0)::bigint                        as commission_30d
  from public.profiles p
  left join public.orders o on o.cashier_id = p.id
 group by p.id, p.commission_rate;

revoke all on public.branch_stats, public.service_stats, public.employee_stats from anon, public;
grant select on public.branch_stats, public.service_stats, public.employee_stats to authenticated;

-- ─── 4. Default kategori layanan ─────────────────────────────────────────────
alter table public.services alter column category set default 'Reguler';
update public.services set category = 'Reguler' where category = 'Regular';
