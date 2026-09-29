-- =============================================================================
-- WashFlow: keamanan: helper role, trigger integritas, grant, Row Level Security
-- Prinsip: default TERTUTUP. anon tidak punya akses apa pun; user login hanya
-- melihat data sesuai role & cabangnya.
-- =============================================================================

-- ─── HELPER (schema private, tidak terekspos lewat Data API) ────────────────
-- "staff" = aktif DAN sudah ditugaskan (admin, atau karyawan yang punya cabang).
-- User baru yang belum ditugaskan tidak melihat data bisnis apa pun.
create function private.is_staff() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles p
                 where p.id = (select auth.uid()) and p.is_active
                   and (p.role = 'admin' or p.branch_id is not null));
$$;

create function private.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles p
                 where p.id = (select auth.uid()) and p.is_active and p.role = 'admin');
$$;

create function private.my_branch_id() returns uuid
language sql stable security definer set search_path = '' as $$
  select p.branch_id from public.profiles p where p.id = (select auth.uid()) and p.is_active;
$$;

revoke all on function private.is_staff(), private.is_admin(), private.my_branch_id() from public, anon;
grant usage on schema private to authenticated;
grant execute on function private.is_staff(), private.is_admin(), private.my_branch_id() to authenticated;

-- ─── TRIGGER INTEGRITAS ──────────────────────────────────────────────────────
-- 1) Kolom uang di orders hanya boleh diubah oleh trigger internal (kedalaman trigger > 1).
--    Penulisan langsung dari client (kedalaman 1) dikembalikan ke nilai lama / nol,
--    sehingga total & status pembayaran tidak bisa dipalsukan lewat API.
create function private.trg_orders_protect_money() returns trigger
language plpgsql set search_path = '' as $$
begin
  -- hanya untuk role API (login/anon); admin yang mengedit lewat SQL Editor (role postgres) tidak dibatasi
  if pg_trigger_depth() = 1 and current_user in ('authenticated', 'anon') then
    if tg_op = 'INSERT' then
      new.subtotal := 0; new.total := 0; new.paid_amount := 0; new.payment_status := 'unpaid';
    else
      new.subtotal := old.subtotal; new.total := old.total;
      new.paid_amount := old.paid_amount; new.payment_status := old.payment_status;
    end if;
  end if;
  return new;
end $$;

create trigger orders_protect_money before insert or update on public.orders
  for each row execute function private.trg_orders_protect_money();

-- 2) Harga item selalu diambil dari master layanan (snapshot), bukan dari client.
create function private.trg_order_items_snapshot() returns trigger
language plpgsql security definer set search_path = '' as $$
declare s record;
begin
  if tg_op = 'INSERT' or new.service_id is distinct from old.service_id then
    select name, unit, price into s from public.services where id = new.service_id;
    if not found then
      raise exception 'Layanan tidak ditemukan: %', new.service_id using errcode = '23503';
    end if;
    new.service_name := s.name; new.unit := s.unit; new.unit_price := s.price;
  else
    new.service_name := old.service_name; new.unit := old.unit; new.unit_price := old.unit_price;
  end if;
  return new;
end $$;

-- kolom snapshot punya default agar tipe Insert di client tidak mewajibkan (nilainya ditimpa trigger)
alter table public.order_items
  alter column service_name set default '',
  alter column unit set default 'kg',
  alter column unit_price set default 0;

create trigger order_items_snapshot before insert or update on public.order_items
  for each row execute function private.trg_order_items_snapshot();

-- 3) Poin loyalitas hanya boleh diubah admin / proses sistem (bukan karyawan lewat API).
create function private.trg_customers_protect_points() returns trigger
language plpgsql set search_path = '' as $$
begin
  if current_user in ('authenticated', 'anon') and not (select private.is_admin()) then
    if tg_op = 'INSERT' then new.points := 0; else new.points := old.points; end if;
  end if;
  return new;
end $$;

create trigger customers_protect_points before insert or update on public.customers
  for each row execute function private.trg_customers_protect_points();

-- ─── GRANT ───────────────────────────────────────────────────────────────────
revoke all on all tables    in schema public from anon;
revoke all on all sequences in schema public from anon;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant usage, select on sequence public.order_code_seq to authenticated;
-- riwayat status hanya ditulis oleh trigger
revoke insert, update, delete on public.order_status_logs from authenticated;

-- ─── ROW LEVEL SECURITY ──────────────────────────────────────────────────────
alter table public.branches          enable row level security;
alter table public.profiles          enable row level security;
alter table public.services          enable row level security;
alter table public.membership_tiers  enable row level security;
alter table public.customers         enable row level security;
alter table public.promotions        enable row level security;
alter table public.orders            enable row level security;
alter table public.order_items       enable row level security;
alter table public.payments          enable row level security;
alter table public.order_status_logs enable row level security;
alter table public.inventory_items   enable row level security;

-- profiles: lihat diri sendiri; admin lihat semua; karyawan lihat rekan sedang satu cabang
create policy profiles_select on public.profiles for select to authenticated using (
  id = (select auth.uid())
  or (select private.is_admin())
  or (branch_id is not null and branch_id = (select private.my_branch_id()))
);
create policy profiles_admin_insert on public.profiles for insert to authenticated
  with check ((select private.is_admin()));
create policy profiles_admin_update on public.profiles for update to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));
create policy profiles_admin_delete on public.profiles for delete to authenticated
  using ((select private.is_admin()));

-- branches
create policy branches_select on public.branches for select to authenticated using (
  (select private.is_admin()) or id = (select private.my_branch_id())
);
create policy branches_admin_write on public.branches for all to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));

-- data master (layanan, tier, promo): staff baca, admin tulis
create policy services_select on public.services for select to authenticated using ((select private.is_staff()));
create policy services_admin_write on public.services for all to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));

create policy tiers_select on public.membership_tiers for select to authenticated using ((select private.is_staff()));
create policy tiers_admin_write on public.membership_tiers for all to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));

create policy promotions_select on public.promotions for select to authenticated using ((select private.is_staff()));
create policy promotions_admin_write on public.promotions for all to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));

-- customers: dipakai lintas cabang; staff baca/tambah/ubah, hanya admin hapus
create policy customers_select on public.customers for select to authenticated using ((select private.is_staff()));
create policy customers_insert on public.customers for insert to authenticated with check ((select private.is_staff()));
create policy customers_update on public.customers for update to authenticated
  using ((select private.is_staff())) with check ((select private.is_staff()));
create policy customers_admin_delete on public.customers for delete to authenticated
  using ((select private.is_admin()));

-- orders: admin semua; karyawan hanya cabangnya
create policy orders_select on public.orders for select to authenticated using (
  (select private.is_admin()) or branch_id = (select private.my_branch_id())
);
create policy orders_insert on public.orders for insert to authenticated with check (
  (select private.is_admin())
  or (branch_id = (select private.my_branch_id()) and cashier_id = (select auth.uid()))
);
create policy orders_update on public.orders for update to authenticated
  using ((select private.is_admin())
         or (branch_id = (select private.my_branch_id()) and status <> 'completed'))
  with check ((select private.is_admin()) or branch_id = (select private.my_branch_id()));
create policy orders_admin_delete on public.orders for delete to authenticated
  using ((select private.is_admin()));

-- order_items: mengikuti visibilitas order; karyawan hanya boleh mengubah selama order belum completed
create policy order_items_select on public.order_items for select to authenticated
  using (exists (select 1 from public.orders o where o.id = order_id));
create policy order_items_write on public.order_items for all to authenticated
  using (exists (select 1 from public.orders o
                 where o.id = order_id and ((select private.is_admin()) or o.status <> 'completed')))
  with check (exists (select 1 from public.orders o
                      where o.id = order_id and ((select private.is_admin()) or o.status <> 'completed')));

-- payments: staff cabang boleh mencatat; koreksi/hapus hanya admin
create policy payments_select on public.payments for select to authenticated
  using (exists (select 1 from public.orders o where o.id = order_id));
create policy payments_insert on public.payments for insert to authenticated with check (
  exists (select 1 from public.orders o where o.id = order_id)
  and ((select private.is_admin()) or received_by = (select auth.uid()))
);
create policy payments_admin_update on public.payments for update to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));
create policy payments_admin_delete on public.payments for delete to authenticated
  using ((select private.is_admin()));

-- riwayat status: baca mengikuti visibilitas order (tulis hanya via trigger)
create policy order_status_logs_select on public.order_status_logs for select to authenticated
  using (exists (select 1 from public.orders o where o.id = order_id));

-- inventory: karyawan baca stok cabangnya; ubah hanya admin (pergerakan stok oleh karyawan > M6)
create policy inventory_select on public.inventory_items for select to authenticated using (
  (select private.is_admin()) or branch_id = (select private.my_branch_id())
);
create policy inventory_admin_write on public.inventory_items for all to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));
