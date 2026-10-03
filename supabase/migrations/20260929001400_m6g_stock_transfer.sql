-- =============================================================================
-- WashFlow M6g: Transfer stok antar cabang
-- =============================================================================
-- Satu langkah atomik: stok cabang asal berkurang, cabang tujuan bertambah, dan keduanya tercatat di
-- stock_movements (jenis transfer_out / transfer_in, diikat transfer_id yang sama).
-- Karyawan hanya boleh MENGIRIM dari cabangnya sendiri; admin dari cabang mana pun.
-- Barang tujuan adalah barang katalog yang sama di cabang tujuan (harus aktif).

alter table public.stock_movements add column transfer_id uuid;
alter table public.stock_movements add column counterpart_branch_id uuid references public.branches (id) on delete set null;
alter table public.stock_movements drop constraint stock_movements_kind_check;
alter table public.stock_movements add constraint stock_movements_kind_check
  check (kind in ('opening', 'in', 'out', 'adjust', 'transfer_out', 'transfer_in'));
create index stock_movements_transfer_idx on public.stock_movements (transfer_id) where transfer_id is not null;

-- Barang yang punya riwayat transfer juga tidak boleh dihapus (guard memakai kind <> 'opening', sudah mencakup)

-- Cabang tujuan yang valid untuk satu barang (karyawan tidak bisa membaca tabel cabang lain)
create function public.transfer_destinations(p_item_id uuid) returns table (branch_id uuid, branch_name text, branch_code text)
language plpgsql stable security definer set search_path = '' as $$
declare v_item public.inventory_items;
begin
  if not (select private.is_staff()) then
    raise exception 'Anda tidak punya izin.' using errcode = 'P0001';
  end if;
  select * into v_item from public.inventory_items where id = p_item_id;
  if not found then return; end if;
  if not (select private.is_admin()) and v_item.branch_id is distinct from (select private.my_branch_id()) then
    raise exception 'Barang ini bukan milik cabang Anda.' using errcode = 'P0001';
  end if;
  return query
    select b.id, b.name, b.code
      from public.inventory_items d join public.branches b on b.id = d.branch_id
     where d.catalog_id = v_item.catalog_id and d.branch_id <> v_item.branch_id and d.is_active
     order by b.name;
end $$;
revoke all on function public.transfer_destinations(uuid) from public, anon;
grant execute on function public.transfer_destinations(uuid) to authenticated;

create function public.transfer_stock(p_item_id uuid, p_to_branch uuid, p_qty numeric, p_note text default null) returns numeric
language plpgsql security definer set search_path = '' as $$
declare
  v_uid   uuid := (select auth.uid());
  v_admin boolean := (select private.is_admin());
  v_name  text;
  v_src   public.inventory_items;
  v_dst   public.inventory_items;
  v_note  text := nullif(btrim(coalesce(p_note, '')), '');
  v_tid   uuid := gen_random_uuid();
  v_src_branch text;
  v_dst_branch text;
  v_new_src numeric;
begin
  if v_uid is null or not (select private.is_staff()) then
    raise exception 'Anda tidak punya izin untuk memindahkan stok.' using errcode = 'P0001';
  end if;
  if p_qty is null or p_qty <= 0 or p_qty > 1000000 or p_qty <> round(p_qty, 2) then
    raise exception 'Jumlah harus lebih dari 0, maksimal 1.000.000, dengan paling banyak 2 angka di belakang koma.' using errcode = 'P0001';
  end if;
  if v_note is not null and length(v_note) > 200 then
    raise exception 'Catatan maksimal 200 karakter.' using errcode = 'P0001';
  end if;

  select * into v_src from public.inventory_items where id = p_item_id;
  if not found then
    raise exception 'Barang tidak ditemukan.' using errcode = 'P0001';
  end if;
  if not v_admin and v_src.branch_id is distinct from (select private.my_branch_id()) then
    raise exception 'Anda hanya bisa mengirim stok dari cabang Anda sendiri.' using errcode = 'P0001';
  end if;
  if p_to_branch is null or p_to_branch = v_src.branch_id then
    raise exception 'Pilih cabang tujuan yang berbeda dari cabang asal.' using errcode = 'P0001';
  end if;
  select * into v_dst from public.inventory_items where catalog_id = v_src.catalog_id and branch_id = p_to_branch;
  if not found or not v_dst.is_active then
    raise exception 'Barang ini tidak aktif di cabang tujuan.' using errcode = 'P0001';
  end if;
  if not v_src.is_active then
    raise exception 'Barang ini nonaktif di cabang asal.' using errcode = 'P0001';
  end if;

  -- kunci kedua baris dengan urutan tetap (hindari deadlock bila dua transfer berlawanan arah)
  perform 1 from public.inventory_items where id in (v_src.id, v_dst.id) order by id for update;
  select * into v_src from public.inventory_items where id = v_src.id;
  select * into v_dst from public.inventory_items where id = v_dst.id;
  if v_src.current_stock < p_qty then
    raise exception 'Stok tidak cukup. Tersedia % %.', v_src.current_stock, v_src.unit using errcode = 'P0001';
  end if;

  select full_name into v_name from public.profiles where id = v_uid;
  select name into v_src_branch from public.branches where id = v_src.branch_id;
  select name into v_dst_branch from public.branches where id = v_dst.branch_id;
  v_new_src := v_src.current_stock - p_qty;

  insert into public.stock_movements (item_id, branch_id, kind, quantity, balance_after, note, created_by, created_by_name, transfer_id, counterpart_branch_id)
  values (v_src.id, v_src.branch_id, 'transfer_out', -p_qty, v_new_src,
          left('Dikirim ke ' || v_dst_branch || coalesce(': ' || v_note, ''), 200), v_uid, v_name, v_tid, v_dst.branch_id),
         (v_dst.id, v_dst.branch_id, 'transfer_in', p_qty, v_dst.current_stock + p_qty,
          left('Diterima dari ' || v_src_branch || coalesce(': ' || v_note, ''), 200), v_uid, v_name, v_tid, v_src.branch_id);
  update public.inventory_items set current_stock = v_new_src where id = v_src.id;
  update public.inventory_items set current_stock = v_dst.current_stock + p_qty,
         last_restocked = (now() at time zone 'Asia/Makassar')::date where id = v_dst.id;
  return v_new_src;
end $$;
revoke all on function public.transfer_stock(uuid, uuid, numeric, text) from public, anon;
grant execute on function public.transfer_stock(uuid, uuid, numeric, text) to authenticated;
