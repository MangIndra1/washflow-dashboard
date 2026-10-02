-- =============================================================================
-- WashFlow M6b: Keanggotaan (poin otomatis, aturan yang bisa diatur admin, riwayat poin)
-- =============================================================================
-- Sebelumnya customers.points tidak pernah bertambah (hanya diisi seed). Sekarang:
--   * loyalty_settings : saklar program + "setiap belanja Rp X = 1 poin" (admin yang mengatur)
--   * points_log       : buku besar poin (earn = dari pesanan, adjust = penyesuaian admin)
--   * poin masuk SEKALI per pesanan, saat status berubah menjadi Selesai (sudah lunas)
--   * poin hanya boleh berubah lewat fungsi resmi (trigger, adjust_points, recalc), tidak lewat API langsung
-- Tier (membership_tiers) tetap tabel master yang diatur admin lewat RLS (nama bebas).

-- ─── 1. Pengaturan program ───────────────────────────────────────────────────
create table public.loyalty_settings (
  id               boolean primary key default true check (id),
  enabled          boolean not null default true,
  rupiah_per_point integer not null default 10000 check (rupiah_per_point between 1000 and 10000000),
  updated_at       timestamptz not null default now()
);
insert into public.loyalty_settings (id) values (true);

create trigger touch_updated_at before update on public.loyalty_settings
  for each row execute function private.touch_updated_at();

alter table public.loyalty_settings enable row level security;
create policy loyalty_settings_select on public.loyalty_settings for select to authenticated
  using ((select private.is_staff()));
create policy loyalty_settings_update on public.loyalty_settings for update to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));
revoke all on public.loyalty_settings from anon, public, authenticated;
grant select on public.loyalty_settings to authenticated;
grant update (enabled, rupiah_per_point) on public.loyalty_settings to authenticated;

-- ─── 2. Buku besar poin ──────────────────────────────────────────────────────
create table public.points_log (
  id            uuid primary key default gen_random_uuid(),
  customer_id   uuid not null references public.customers (id) on delete cascade,
  order_id      uuid references public.orders (id) on delete set null,
  kind          text not null check (kind in ('earn', 'adjust')),
  points        integer not null check (points <> 0),
  balance_after integer not null check (balance_after >= 0),
  note          text,
  created_by    uuid references public.profiles (id) on delete set null,
  created_at    timestamptz not null default clock_timestamp(),   -- urutan tetap jelas walau dibuat dalam satu transaksi
  constraint points_log_adjust_note check (kind <> 'adjust' or (note is not null and length(btrim(note)) >= 3))
);
-- satu pesanan hanya boleh memberi poin satu kali (idempotent, aman dari klik ganda atau pemicu ulang)
create unique index points_log_one_earn_per_order on public.points_log (order_id) where kind = 'earn';
create index points_log_customer_idx on public.points_log (customer_id, created_at desc);

alter table public.points_log enable row level security;
create policy points_log_select on public.points_log for select to authenticated
  using ((select private.is_staff()));
revoke all on public.points_log from anon, public, authenticated;
grant select on public.points_log to authenticated;

-- ─── 3. Poin hanya berubah lewat proses resmi (bukan API langsung, admin pun tidak) ──
create or replace function private.trg_customers_protect_points() returns trigger
language plpgsql set search_path = '' as $$
begin
  if current_user in ('authenticated', 'anon') then
    if tg_op = 'INSERT' then new.points := 0; else new.points := old.points; end if;
  end if;
  return new;
end $$;

-- ─── 4. Poin otomatis saat pesanan Selesai ───────────────────────────────────
create function private.trg_orders_award_points() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  v_set record;
  v_pts integer;
  v_bal integer;
begin
  if new.customer_id is null then return new; end if;
  select enabled, rupiah_per_point into v_set from public.loyalty_settings where id;
  if not v_set.enabled then return new; end if;
  v_pts := (new.total / v_set.rupiah_per_point)::integer;   -- pembagian bulat ke bawah, dari total setelah diskon
  if v_pts <= 0 then return new; end if;

  select points into v_bal from public.customers where id = new.customer_id for update;
  if not found then return new; end if;

  insert into public.points_log (customer_id, order_id, kind, points, balance_after, note)
  values (new.customer_id, new.id, 'earn', v_pts, v_bal + v_pts, 'Pesanan ' || new.code)
  on conflict (order_id) where kind = 'earn' do nothing;
  if found then
    update public.customers set points = v_bal + v_pts where id = new.customer_id;
  end if;
  return new;
end $$;
revoke all on function private.trg_orders_award_points() from public, anon, authenticated;

create trigger orders_award_points after update of status on public.orders
  for each row when (new.status = 'completed' and old.status is distinct from 'completed')
  execute function private.trg_orders_award_points();

-- ─── 5. Penyesuaian manual (admin) ───────────────────────────────────────────
create function public.adjust_points(p_customer_id uuid, p_delta integer, p_note text) returns integer
language plpgsql security definer set search_path = '' as $$
declare
  v_bal  integer;
  v_note text := btrim(coalesce(p_note, ''));
begin
  if not (select private.is_admin()) then
    raise exception 'Hanya administrator yang dapat mengubah poin.' using errcode = 'P0001';
  end if;
  if p_delta is null or p_delta = 0 or abs(p_delta) > 1000000 then
    raise exception 'Jumlah poin harus bilangan bulat bukan nol (maksimal 1.000.000).' using errcode = 'P0001';
  end if;
  if length(v_note) < 3 or length(v_note) > 200 then
    raise exception 'Alasan penyesuaian wajib diisi (3 sampai 200 karakter).' using errcode = 'P0001';
  end if;

  select points into v_bal from public.customers where id = p_customer_id for update;
  if not found then
    raise exception 'Pelanggan tidak ditemukan.' using errcode = 'P0001';
  end if;
  if v_bal + p_delta < 0 then
    raise exception 'Poin tidak boleh kurang dari 0. Poin pelanggan saat ini % poin.', v_bal using errcode = 'P0001';
  end if;

  insert into public.points_log (customer_id, kind, points, balance_after, note, created_by)
  values (p_customer_id, 'adjust', p_delta, v_bal + p_delta, v_note, (select auth.uid()));
  update public.customers set points = v_bal + p_delta where id = p_customer_id;
  return v_bal + p_delta;
end $$;
revoke all on function public.adjust_points(uuid, integer, text) from public, anon;
grant execute on function public.adjust_points(uuid, integer, text) to authenticated;

-- ─── 6. Hitung ulang dari pesanan lama yang sudah Selesai (admin, aman diulang) ──
create function public.recalc_loyalty_points() returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_set    record;
  r        record;
  v_pts    integer;
  v_bal    integer;
  v_orders integer := 0;
  v_total  bigint  := 0;
begin
  if not (select private.is_admin()) then
    raise exception 'Hanya administrator yang dapat menghitung ulang poin.' using errcode = 'P0001';
  end if;
  select enabled, rupiah_per_point into v_set from public.loyalty_settings where id;
  if not v_set.enabled then
    raise exception 'Program poin sedang nonaktif. Aktifkan dulu sebelum menghitung ulang.' using errcode = 'P0001';
  end if;

  for r in
    select o.id, o.code, o.customer_id, o.total
      from public.orders o
     where o.status = 'completed' and o.customer_id is not null
       and not exists (select 1 from public.points_log l where l.order_id = o.id and l.kind = 'earn')
     order by o.completed_at nulls last, o.created_at
  loop
    v_pts := (r.total / v_set.rupiah_per_point)::integer;
    continue when v_pts <= 0;
    select points into v_bal from public.customers where id = r.customer_id for update;
    continue when not found;
    insert into public.points_log (customer_id, order_id, kind, points, balance_after, note)
    values (r.customer_id, r.id, 'earn', v_pts, v_bal + v_pts, 'Hitung ulang: pesanan ' || r.code)
    on conflict (order_id) where kind = 'earn' do nothing;
    if found then
      update public.customers set points = v_bal + v_pts where id = r.customer_id;
      v_orders := v_orders + 1; v_total := v_total + v_pts;
    end if;
  end loop;
  return jsonb_build_object('orders', v_orders, 'points', v_total);
end $$;
revoke all on function public.recalc_loyalty_points() from public, anon;
grant execute on function public.recalc_loyalty_points() to authenticated;

-- ─── 7. Tier: validasi dan pengaman ──────────────────────────────────────────
alter table public.membership_tiers
  add constraint membership_tiers_name_len check (length(btrim(name)) between 1 and 30),
  add constraint membership_tiers_color_hex check (color is null or color ~ '^#[0-9A-Fa-f]{6}$'),
  add constraint membership_tiers_benefits_max check (cardinality(benefits) <= 12);

-- tier dasar (0 poin) harus selalu ada, supaya setiap pelanggan punya tier
create function private.trg_tiers_protect_base() returns trigger
language plpgsql set search_path = '' as $$
begin
  if current_user not in ('authenticated', 'anon') then return coalesce(new, old); end if;
  if tg_op = 'DELETE' then
    if old.min_points = 0 then
      raise exception 'Tingkat dasar (0 poin) tidak bisa dihapus. Ubah isinya saja bila perlu.' using errcode = 'P0001';
    end if;
    return old;
  end if;
  if old.min_points = 0 and new.min_points <> 0 then
    raise exception 'Poin minimal tingkat dasar harus tetap 0.' using errcode = 'P0001';
  end if;
  return new;
end $$;
revoke all on function private.trg_tiers_protect_base() from public, anon, authenticated;
create trigger membership_tiers_protect_base before update or delete on public.membership_tiers
  for each row execute function private.trg_tiers_protect_base();

-- jumlah member per tier (satu panggilan, tanpa menarik seluruh pelanggan ke browser)
create view public.tier_stats with (security_invoker = true) as
select t.id as tier_id, count(c.id)::int as member_count
  from (select id, min_points, lead(min_points) over (order by min_points) as next_min from public.membership_tiers) t
  left join public.customers c on c.points >= t.min_points and (t.next_min is null or c.points < t.next_min)
 group by t.id;
revoke all on public.tier_stats from anon, public;
grant select on public.tier_stats to authenticated;

-- ─── 8. Ambang bawaan lama (jutaan rupiah) diturunkan, hanya bila belum pernah diubah admin ──
-- Dengan Rp 10.000 = 1 poin: Silver Rp 200 ribu, Gold Rp 500 ribu, Platinum Rp 800 ribu.
update public.membership_tiers set min_points = 20 where name = 'Silver'   and min_points = 1000;
update public.membership_tiers set min_points = 50 where name = 'Gold'     and min_points = 2500;
update public.membership_tiers set min_points = 80 where name = 'Platinum' and min_points = 5000;
