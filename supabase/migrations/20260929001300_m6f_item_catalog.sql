-- =============================================================================
-- WashFlow M6f: Katalog barang pusat + stok per cabang
-- =============================================================================
-- Admin membuat barang SEKALI di katalog (nama, kategori, satuan, harga, pemasok).
-- Setiap cabang otomatis punya baris stok untuk barang itu (stok 0), dan kolom milik cabang
-- (stok, minimum, titik pesan ulang, aktif) diatur per cabang. Cabang baru otomatis mendapat semua barang katalog.
-- Kolom nama/kategori/satuan/harga/pemasok di inventory_items adalah SALINAN dari katalog (disinkronkan trigger)
-- dan tidak bisa diubah langsung lewat API.

create table public.inventory_catalog (
  id                    uuid primary key default gen_random_uuid(),
  name                  text not null check (length(btrim(name)) between 1 and 80),
  category              text not null default 'Lainnya',
  unit                  text not null check (length(btrim(unit)) between 1 and 20),
  unit_cost             bigint not null default 0 check (unit_cost >= 0),
  supplier              text,
  default_min_stock     numeric(12,2) not null default 0 check (default_min_stock >= 0),
  default_reorder_point numeric(12,2) not null default 0 check (default_reorder_point >= 0),
  is_active             boolean not null default true,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  constraint inventory_catalog_reorder check (default_reorder_point >= default_min_stock)
);
create unique index inventory_catalog_name_key on public.inventory_catalog (lower(btrim(name)));

alter table public.inventory_items add column catalog_id uuid references public.inventory_catalog (id) on delete cascade;

-- Isi katalog dari barang yang sudah ada (satu entri per nama)
insert into public.inventory_catalog (name, category, unit, unit_cost, supplier, default_min_stock, default_reorder_point, is_active)
select distinct on (lower(btrim(name))) btrim(name), category, unit, unit_cost, supplier, min_stock, reorder_point, true
  from public.inventory_items order by lower(btrim(name)), created_at;
update public.inventory_items i set catalog_id = c.id from public.inventory_catalog c where lower(btrim(i.name)) = lower(btrim(c.name));
alter table public.inventory_items alter column catalog_id set not null;
create unique index inventory_items_catalog_branch_key on public.inventory_items (catalog_id, branch_id);

alter table public.inventory_catalog enable row level security;
create policy inventory_catalog_select on public.inventory_catalog for select to authenticated using ((select private.is_staff()));
create policy inventory_catalog_admin_write on public.inventory_catalog for all to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));
revoke all on public.inventory_catalog from public, anon;
grant select, insert, update, delete on public.inventory_catalog to authenticated;
create trigger touch_updated_at before update on public.inventory_catalog for each row execute function private.touch_updated_at();

-- ─── Barang cabang: dibuat lewat katalog, kolom katalog tidak bisa diubah langsung ──
create or replace function private.trg_inventory_protect_stock() returns trigger
language plpgsql set search_path = '' as $$
begin
  if current_user in ('authenticated', 'anon') then
    if tg_op = 'INSERT' then
      raise exception 'Barang dibuat lewat Katalog Barang, bukan per cabang.' using errcode = 'P0001';
    end if;
    new.current_stock := old.current_stock;
    new.branch_id := old.branch_id;
    new.catalog_id := old.catalog_id;
    new.name := old.name; new.category := old.category; new.unit := old.unit;
    new.unit_cost := old.unit_cost; new.supplier := old.supplier;
  end if;
  return new;
end $$;
drop trigger inventory_protect_stock on public.inventory_items;
create trigger inventory_protect_stock before insert or update on public.inventory_items
  for each row execute function private.trg_inventory_protect_stock();

-- Insert dari SQL/seed tanpa katalog: cari atau buat entri katalog (tanpa menyebar ke cabang lain)
create function private.trg_inventory_autocatalog() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.catalog_id is null then
    select id into new.catalog_id from public.inventory_catalog where lower(btrim(name)) = lower(btrim(new.name));
    if new.catalog_id is null then
      perform set_config('app.skip_fanout', '1', true);
      insert into public.inventory_catalog (name, category, unit, unit_cost, supplier, default_min_stock, default_reorder_point)
      values (btrim(new.name), new.category, new.unit, new.unit_cost, new.supplier, new.min_stock, new.reorder_point)
      returning id into new.catalog_id;
      perform set_config('app.skip_fanout', '', true);
    end if;
  end if;
  return new;
end $$;
create trigger inventory_autocatalog before insert on public.inventory_items
  for each row execute function private.trg_inventory_autocatalog();

-- Entri katalog baru: buat baris stok (0) di semua cabang
create function private.trg_catalog_fanout() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if coalesce(current_setting('app.skip_fanout', true), '') = '1' then return new; end if;
  insert into public.inventory_items (catalog_id, branch_id, name, category, unit, unit_cost, supplier, min_stock, reorder_point, current_stock, is_active)
  select new.id, b.id, new.name, new.category, new.unit, new.unit_cost, new.supplier, new.default_min_stock, new.default_reorder_point, 0, new.is_active
    from public.branches b
  on conflict do nothing;
  return new;
end $$;
create trigger catalog_fanout after insert on public.inventory_catalog
  for each row execute function private.trg_catalog_fanout();

-- Cabang baru: dapat semua barang katalog
create function private.trg_branch_inventory() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.inventory_items (catalog_id, branch_id, name, category, unit, unit_cost, supplier, min_stock, reorder_point, current_stock, is_active)
  select c.id, new.id, c.name, c.category, c.unit, c.unit_cost, c.supplier, c.default_min_stock, c.default_reorder_point, 0, c.is_active
    from public.inventory_catalog c
  on conflict do nothing;
  return new;
end $$;
create trigger branch_inventory after insert on public.branches
  for each row execute function private.trg_branch_inventory();

-- Ubah katalog: satuan terkunci bila sudah ada pergerakan; salin perubahan ke semua cabang
create function private.trg_catalog_guard() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.unit is distinct from old.unit and exists (
       select 1 from public.stock_movements m join public.inventory_items i on i.id = m.item_id
        where i.catalog_id = old.id and m.kind <> 'opening') then
    raise exception 'Satuan tidak bisa diubah karena barang ini sudah punya riwayat stok.' using errcode = 'P0001';
  end if;
  return new;
end $$;
create trigger catalog_guard before update on public.inventory_catalog
  for each row execute function private.trg_catalog_guard();

create function private.trg_catalog_sync() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  update public.inventory_items
     set name = new.name, category = new.category, unit = new.unit, unit_cost = new.unit_cost, supplier = new.supplier,
         is_active = case when new.is_active is distinct from old.is_active then new.is_active else is_active end
   where catalog_id = new.id;
  return new;
end $$;
create trigger catalog_sync after update on public.inventory_catalog
  for each row execute function private.trg_catalog_sync();

-- Hapus barang cabang lewat API tidak diizinkan (nonaktifkan per cabang); hapus lewat katalog.
create or replace function private.trg_inventory_guard_delete() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if exists (select 1 from public.stock_movements where item_id = old.id and kind <> 'opening') then
    raise exception 'Barang ini sudah punya riwayat stok, jadi tidak bisa dihapus. Nonaktifkan saja.' using errcode = 'P0001';
  end if;
  return old;
end $$;
create function private.trg_inventory_block_api_delete() returns trigger
language plpgsql set search_path = '' as $$
begin
  if current_user in ('authenticated', 'anon') then
    raise exception 'Barang dihapus lewat Katalog Barang. Untuk satu cabang, nonaktifkan barangnya.' using errcode = 'P0001';
  end if;
  return old;
end $$;
create trigger inventory_block_api_delete before delete on public.inventory_items
  for each row execute function private.trg_inventory_block_api_delete();
