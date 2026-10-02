-- =============================================================================
-- WashFlow M6d: Inventaris nyata (buku pergerakan stok, catat Terima/Pakai/Koreksi)
-- =============================================================================
-- Aturan:
--   * Stok (inventory_items.current_stock) HANYA berubah lewat record_stock() atau trigger stok awal.
--     API langsung (karyawan maupun admin) tidak bisa mengubah angka stok.
--   * Setiap perubahan tercatat di stock_movements (siapa, kapan, jumlah, saldo, alasan).
--   * Karyawan: Terima (+) dan Pakai (-) untuk cabangnya sendiri. Koreksi (stok hasil hitung) hanya admin dan wajib beralasan.
--   * Stok tidak boleh minus. Barang yang punya riwayat selain stok awal tidak bisa dihapus, cukup dinonaktifkan.

alter table public.inventory_items add column is_active boolean not null default true;
alter table public.inventory_items add constraint inventory_items_name_len check (length(btrim(name)) between 1 and 80);
alter table public.inventory_items add constraint inventory_items_unit_len check (length(btrim(unit)) between 1 and 20);

create table public.stock_movements (
  id              uuid primary key default gen_random_uuid(),
  item_id         uuid not null references public.inventory_items (id) on delete cascade,
  branch_id       uuid not null references public.branches (id) on delete cascade,
  kind            text not null check (kind in ('opening', 'in', 'out', 'adjust')),
  quantity        numeric(12,2) not null check (quantity <> 0),
  balance_after   numeric(12,2) not null check (balance_after >= 0),
  note            text check (note is null or length(note) <= 200),
  created_by      uuid references public.profiles (id) on delete set null,
  created_by_name text,
  created_at      timestamptz not null default clock_timestamp()
);
create index stock_movements_item_idx on public.stock_movements (item_id, created_at desc);
create index stock_movements_branch_idx on public.stock_movements (branch_id, created_at desc);

alter table public.stock_movements enable row level security;
create policy stock_movements_select on public.stock_movements for select to authenticated using (
  (select private.is_admin()) or branch_id = (select private.my_branch_id())
);
revoke all on public.stock_movements from public, anon, authenticated;
grant select on public.stock_movements to authenticated;

-- ─── Angka stok tidak boleh diubah lewat API langsung ───────────────────────
create function private.trg_inventory_protect_stock() returns trigger
language plpgsql set search_path = '' as $$
begin
  if current_user in ('authenticated', 'anon') then
    if tg_op = 'INSERT' then
      new.current_stock := coalesce(new.current_stock, 0);
    elsif new.current_stock is distinct from old.current_stock then
      new.current_stock := old.current_stock;
    end if;
    if tg_op = 'UPDATE' then new.branch_id := old.branch_id; end if;
  end if;
  return new;
end $$;
create trigger inventory_protect_stock before insert or update on public.inventory_items
  for each row execute function private.trg_inventory_protect_stock();

-- Stok awal saat barang dibuat (tercatat sebagai pergerakan "opening")
create function private.trg_inventory_opening() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.current_stock > 0 then
    insert into public.stock_movements (item_id, branch_id, kind, quantity, balance_after, note, created_by, created_by_name)
    values (new.id, new.branch_id, 'opening', new.current_stock, new.current_stock, 'Stok awal', (select auth.uid()),
            (select full_name from public.profiles where id = (select auth.uid())));
  end if;
  return new;
end $$;
create trigger inventory_opening after insert on public.inventory_items
  for each row execute function private.trg_inventory_opening();

-- Barang yang sudah punya riwayat tidak boleh dihapus
create function private.trg_inventory_guard_delete() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if exists (select 1 from public.stock_movements where item_id = old.id and kind <> 'opening') then
    raise exception 'Barang ini sudah punya riwayat stok, jadi tidak bisa dihapus. Nonaktifkan saja.' using errcode = 'P0001';
  end if;
  return old;
end $$;
create trigger inventory_guard_delete before delete on public.inventory_items
  for each row execute function private.trg_inventory_guard_delete();

-- ─── Catat pergerakan stok ───────────────────────────────────────────────────
-- p_kind: 'in' (terima, +qty), 'out' (pakai, -qty), 'adjust' (admin: qty = stok hasil hitung).
create function public.record_stock(p_item_id uuid, p_kind text, p_qty numeric, p_note text default null) returns numeric
language plpgsql security definer set search_path = '' as $$
declare
  v_uid   uuid := (select auth.uid());
  v_item  public.inventory_items;
  v_admin boolean := (select private.is_admin());
  v_note  text := nullif(btrim(coalesce(p_note, '')), '');
  v_delta numeric;
  v_new   numeric;
begin
  if v_uid is null or not (select private.is_staff()) then
    raise exception 'Anda tidak punya izin untuk mencatat stok.' using errcode = 'P0001';
  end if;
  if p_kind not in ('in', 'out', 'adjust') then
    raise exception 'Jenis pergerakan stok tidak dikenal.' using errcode = 'P0001';
  end if;
  if p_qty is null or p_qty <> round(p_qty, 2) then
    raise exception 'Jumlah maksimal 2 angka di belakang koma.' using errcode = 'P0001';
  end if;
  if v_note is not null and length(v_note) > 200 then
    raise exception 'Catatan maksimal 200 karakter.' using errcode = 'P0001';
  end if;

  select * into v_item from public.inventory_items where id = p_item_id for update;
  if not found then
    raise exception 'Barang tidak ditemukan.' using errcode = 'P0001';
  end if;
  if not v_admin and v_item.branch_id is distinct from (select private.my_branch_id()) then
    raise exception 'Barang ini bukan milik cabang Anda.' using errcode = 'P0001';
  end if;

  if p_kind = 'adjust' then
    if not v_admin then
      raise exception 'Hanya administrator yang dapat mengoreksi stok.' using errcode = 'P0001';
    end if;
    if p_qty < 0 or p_qty > 1000000 then
      raise exception 'Stok hasil hitung harus antara 0 dan 1.000.000.' using errcode = 'P0001';
    end if;
    if v_note is null or length(v_note) < 3 then
      raise exception 'Alasan koreksi wajib diisi (minimal 3 karakter).' using errcode = 'P0001';
    end if;
    v_delta := p_qty - v_item.current_stock;
    if v_delta = 0 then
      raise exception 'Stok hasil hitung sama dengan stok tercatat.' using errcode = 'P0001';
    end if;
  else
    if not v_item.is_active then
      raise exception 'Barang ini nonaktif.' using errcode = 'P0001';
    end if;
    if p_qty <= 0 or p_qty > 1000000 then
      raise exception 'Jumlah harus lebih dari 0 dan maksimal 1.000.000.' using errcode = 'P0001';
    end if;
    v_delta := case when p_kind = 'in' then p_qty else -p_qty end;
  end if;

  v_new := v_item.current_stock + v_delta;
  if v_new < 0 then
    raise exception 'Stok tidak cukup. Tersedia % %.', v_item.current_stock, v_item.unit using errcode = 'P0001';
  end if;

  insert into public.stock_movements (item_id, branch_id, kind, quantity, balance_after, note, created_by, created_by_name)
  values (v_item.id, v_item.branch_id, p_kind, v_delta, v_new, v_note, v_uid,
          (select full_name from public.profiles where id = v_uid));
  update public.inventory_items
     set current_stock = v_new,
         last_restocked = case when p_kind = 'in' then (now() at time zone 'Asia/Makassar')::date else last_restocked end
   where id = v_item.id;
  return v_new;
end $$;
revoke all on function public.record_stock(uuid, text, numeric, text) from public, anon;
grant execute on function public.record_stock(uuid, text, numeric, text) to authenticated;
