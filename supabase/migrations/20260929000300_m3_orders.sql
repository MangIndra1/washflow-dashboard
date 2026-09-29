-- =============================================================================
-- WashFlow M3a: alur order yang aman
-- - Order, item, dan pembayaran TIDAK bisa lagi ditulis langsung dari client.
--   Semua lewat fungsi (create_order, record_payment) yang menghitung harga, diskon,
--   dan promo di server. Ini menutup celah "karyawan bisa mengisi diskon sembarang".
-- - Aturan perpindahan status order (selesai hanya jika sudah lunas).
-- - Nomor WhatsApp pelanggan dinormalkan otomatis (+62 / 62 menjadi 0).
-- - View statistik pelanggan.
-- =============================================================================

-- ─── Kolom tambahan pada orders ──────────────────────────────────────────────
alter table public.orders
  add column discount_label text,           -- mis. "Promo HEMAT10K" atau "Member Gold 10%"
  add column client_key     uuid;           -- kunci idempotensi: klik ganda / koneksi putus tidak membuat order ganda
create unique index orders_client_key_key on public.orders (client_key) where client_key is not null;

-- ─── Normalisasi nomor WhatsApp ──────────────────────────────────────────────
create function private.trg_customers_normalize_phone() returns trigger
language plpgsql set search_path = '' as $$
declare p text;
begin
  p := regexp_replace(coalesce(new.phone, ''), '[\s\-\.\(\)]', '', 'g');
  if p ~ '^\+?62[0-9]' then
    p := '0' || regexp_replace(p, '^\+?62', '');
  end if;
  new.phone := p;
  return new;
end $$;

create trigger customers_normalize_phone before insert or update of phone on public.customers
  for each row execute function private.trg_customers_normalize_phone();

-- ─── Hak akses tabel: hanya lewat fungsi ─────────────────────────────────────
revoke insert on public.orders, public.order_items, public.payments from authenticated;
revoke update, delete on public.order_items from authenticated;
-- karyawan/admin lewat API hanya boleh mengubah status dan catatan order
revoke update on public.orders from authenticated;
grant update (status, notes) on public.orders to authenticated;

-- ─── Aturan perpindahan status ───────────────────────────────────────────────
-- Tahap awal sampai "siap" boleh maju/mundur (koreksi salah klik). "Selesai" hanya dari "siap"
-- dan hanya jika sudah lunas. Skrip SQL admin (role postgres) tidak dibatasi.
create function private.trg_orders_status_rules() returns trigger
language plpgsql set search_path = '' as $$
begin
  if current_user not in ('authenticated', 'anon') then return new; end if;
  if new.status = 'completed' then
    if old.status <> 'ready' then
      raise exception 'Pesanan harus berstatus Siap Diambil sebelum diselesaikan.' using errcode = 'P0001';
    end if;
    if new.payment_status <> 'paid' then
      raise exception 'Pesanan belum lunas. Catat pembayaran sebelum menyelesaikan.' using errcode = 'P0001';
    end if;
  end if;
  return new;
end $$;

create trigger orders_status_rules before update of status on public.orders
  for each row when (old.status is distinct from new.status)
  execute function private.trg_orders_status_rules();

-- ─── Perhitungan harga (satu sumber kebenaran) ───────────────────────────────
-- p_items: [{"service_id": "...", "quantity": 2.5}, ...]
-- Mengembalikan jsonb: subtotal, discount, total, discount_label, promo_id, promo_error, info, est_hours, items
-- Aturan diskon: dipilih SATU yang terbesar antara diskon promo dan diskon tingkat member (tidak digabung).
create function private.price_order(p_customer_id uuid, p_items jsonb, p_promo_code text)
returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare
  v_items       jsonb := '[]'::jsonb;
  v_subtotal    bigint := 0;
  v_hours       integer := 0;
  v_points      integer;
  v_tier        record;
  v_member_disc bigint := 0;
  v_promo       record;
  v_promo_disc  bigint := 0;
  v_promo_err   text;
  v_disc        bigint := 0;
  v_label       text;
  v_promo_id    uuid;
  v_info        text;
  v_code        text := upper(btrim(coalesce(p_promo_code, '')));
  r             record;
  v_line        bigint;
  v_today       date := (now() at time zone 'Asia/Makassar')::date;
begin
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Pilih minimal satu layanan.' using errcode = 'P0001';
  end if;
  if jsonb_array_length(p_items) > 30 then
    raise exception 'Maksimal 30 jenis layanan dalam satu pesanan.' using errcode = 'P0001';
  end if;
  if (select count(distinct x.service_id) from jsonb_to_recordset(p_items) as x(service_id uuid, quantity numeric))
     <> jsonb_array_length(p_items) then
    raise exception 'Layanan yang sama dipilih lebih dari sekali.' using errcode = 'P0001';
  end if;

  select c.points into v_points from public.customers c where c.id = p_customer_id;
  if not found then
    raise exception 'Pelanggan tidak ditemukan.' using errcode = 'P0001';
  end if;

  for r in
    select x.service_id, round(x.quantity, 2) as quantity, s.name, s.unit, s.price, s.est_hours, s.is_active
      from jsonb_to_recordset(p_items) as x(service_id uuid, quantity numeric)
      left join public.services s on s.id = x.service_id
  loop
    if r.name is null then
      raise exception 'Layanan tidak ditemukan.' using errcode = 'P0001';
    end if;
    if not r.is_active then
      raise exception 'Layanan "%" sedang tidak aktif.', r.name using errcode = 'P0001';
    end if;
    if r.quantity is null or r.quantity <= 0 or r.quantity > 9999 then
      raise exception 'Jumlah untuk "%" harus lebih dari 0 dan maksimal 9.999.', r.name using errcode = 'P0001';
    end if;
    if r.unit in ('pcs', 'pasang') and r.quantity <> trunc(r.quantity) then
      raise exception 'Jumlah untuk "%" harus bilangan bulat.', r.name using errcode = 'P0001';
    end if;

    v_line := round(r.quantity * r.price)::bigint;
    v_subtotal := v_subtotal + v_line;
    v_hours := greatest(v_hours, r.est_hours);
    v_items := v_items || jsonb_build_array(jsonb_build_object(
      'service_id', r.service_id, 'name', r.name, 'unit', r.unit,
      'unit_price', r.price, 'quantity', r.quantity, 'line_total', v_line));
  end loop;

  -- diskon member
  select t.name, t.discount_percent into v_tier
    from public.membership_tiers t where t.min_points <= v_points
    order by t.min_points desc limit 1;
  if found and v_tier.discount_percent > 0 then
    v_member_disc := round(v_subtotal * v_tier.discount_percent / 100)::bigint;
  end if;

  -- diskon promo
  if v_code <> '' then
    select * into v_promo from public.promotions where code = v_code and is_active;
    if not found then
      v_promo_err := 'Kode promo tidak ditemukan.';
    elsif v_today < v_promo.valid_from then
      v_promo_err := 'Kode promo belum berlaku.';
    elsif v_today > v_promo.valid_to then
      v_promo_err := 'Kode promo sudah tidak berlaku.';
    elsif v_subtotal < v_promo.min_order then
      v_promo_err := 'Minimal order Rp ' || replace(to_char(v_promo.min_order, 'FM999,999,999,999'), ',', '.') || ' untuk promo ini.';
    elsif v_promo.max_usage is not null
          and (select count(*) from public.orders o where o.promo_id = v_promo.id) >= v_promo.max_usage then
      v_promo_err := 'Kuota promo sudah habis.';
    else
      v_promo_disc := case v_promo.type
                        when 'percent' then round(v_subtotal * v_promo.value / 100)::bigint
                        else v_promo.value end;
      v_promo_disc := least(v_promo_disc, v_subtotal);
    end if;
  end if;

  if v_promo_disc > 0 and v_promo_disc >= v_member_disc then
    v_disc := v_promo_disc; v_promo_id := v_promo.id; v_label := 'Promo ' || v_promo.code;
    if v_member_disc > 0 then
      v_info := 'Diskon promo lebih besar dari diskon member, jadi hanya promo yang dipakai.';
    end if;
  elsif v_member_disc > 0 then
    v_disc := v_member_disc;
    v_label := 'Member ' || v_tier.name || ' ' || trim(trailing '.' from trim(trailing '0' from v_tier.discount_percent::text)) || '%';
    if v_promo_disc > 0 then
      v_info := 'Diskon member lebih besar dari promo, jadi hanya diskon member yang dipakai.';
    end if;
  end if;

  return jsonb_build_object(
    'subtotal', v_subtotal, 'discount', v_disc, 'total', v_subtotal - v_disc,
    'discount_label', v_label, 'promo_id', v_promo_id, 'promo_error', v_promo_err,
    'info', v_info, 'est_hours', v_hours, 'items', v_items);
end $$;

revoke all on function private.price_order(uuid, jsonb, text) from public, anon;

-- ─── quote_order: pratinjau harga untuk UI ───────────────────────────────────
create function public.quote_order(p_customer_id uuid, p_items jsonb, p_promo_code text default null)
returns jsonb
language plpgsql stable security definer set search_path = '' as $$
begin
  if not (select private.is_staff()) then
    raise exception 'Anda tidak punya izin untuk tindakan ini.' using errcode = '42501';
  end if;
  return private.price_order(p_customer_id, p_items, p_promo_code) - 'promo_id' - 'items';
end $$;

-- ─── create_order ────────────────────────────────────────────────────────────
-- Karyawan: cabang otomatis cabangnya. Admin: wajib mengisi p_branch_id.
-- p_pay_amount: pembayaran awal (0 = belum bayar). p_client_key: kunci idempotensi dari client.
create function public.create_order(
  p_customer_id uuid,
  p_items       jsonb,
  p_promo_code  text default null,
  p_notes       text default null,
  p_pay_amount  bigint default 0,
  p_pay_method  public.payment_method default 'cash',
  p_branch_id   uuid default null,
  p_client_key  uuid default null
) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  v_uid     uuid := (select auth.uid());
  v_me      record;
  v_branch  uuid;
  v_status  public.branch_status;
  v_price   jsonb;
  v_order   uuid;
  v_notes   text := nullif(btrim(coalesce(p_notes, '')), '');
  v_item    jsonb;
  v_sub     bigint;
  v_existing uuid;
begin
  select p.role, p.branch_id into v_me
    from public.profiles p where p.id = v_uid and p.is_active;
  if not found or (v_me.role = 'employee' and v_me.branch_id is null) then
    raise exception 'Anda tidak punya izin untuk tindakan ini.' using errcode = '42501';
  end if;

  -- idempotensi: kunci yang sama mengembalikan order yang sudah dibuat
  if p_client_key is not null then
    select o.id into v_existing from public.orders o
     where o.client_key = p_client_key and o.cashier_id = v_uid;
    if found then return v_existing; end if;
  end if;

  v_branch := case when v_me.role = 'admin' then p_branch_id else v_me.branch_id end;
  if v_branch is null then
    raise exception 'Pilih cabang untuk pesanan ini.' using errcode = 'P0001';
  end if;
  select b.status into v_status from public.branches b where b.id = v_branch;
  if not found then
    raise exception 'Cabang tidak ditemukan.' using errcode = 'P0001';
  end if;
  if v_status <> 'active' then
    raise exception 'Cabang sedang tidak menerima pesanan.' using errcode = 'P0001';
  end if;

  if v_notes is not null and char_length(v_notes) > 500 then
    raise exception 'Catatan maksimal 500 karakter.' using errcode = 'P0001';
  end if;

  v_price := private.price_order(p_customer_id, p_items, p_promo_code);
  if v_price ->> 'promo_error' is not null then
    raise exception '%', v_price ->> 'promo_error' using errcode = 'P0001';
  end if;
  if p_pay_amount is null or p_pay_amount < 0 then
    raise exception 'Jumlah pembayaran tidak valid.' using errcode = 'P0001';
  end if;
  if p_pay_amount > (v_price ->> 'total')::bigint then
    raise exception 'Pembayaran melebihi total tagihan.' using errcode = 'P0001';
  end if;

  insert into public.orders (branch_id, customer_id, cashier_id, promo_id, discount, discount_label, notes, due_at, client_key)
  values (
    v_branch, p_customer_id, v_uid, (v_price ->> 'promo_id')::uuid,
    (v_price ->> 'discount')::bigint, v_price ->> 'discount_label', v_notes,
    now() + make_interval(hours => (v_price ->> 'est_hours')::int), p_client_key)
  returning id into v_order;

  for v_item in select * from jsonb_array_elements(v_price -> 'items') loop
    insert into public.order_items (order_id, service_id, quantity)
    values (v_order, (v_item ->> 'service_id')::uuid, (v_item ->> 'quantity')::numeric);
  end loop;

  -- harga layanan tidak boleh berubah di tengah transaksi
  select o.subtotal into v_sub from public.orders o where o.id = v_order;
  if v_sub <> (v_price ->> 'subtotal')::bigint then
    raise exception 'Harga layanan baru saja berubah. Coba simpan lagi.' using errcode = 'P0001';
  end if;

  if p_pay_amount > 0 then
    insert into public.payments (order_id, amount, method, received_by)
    values (v_order, p_pay_amount, p_pay_method, v_uid);
  end if;

  return v_order;
end $$;

-- ─── record_payment: pembayaran susulan ──────────────────────────────────────
create function public.record_payment(
  p_order_id uuid,
  p_amount   bigint,
  p_method   public.payment_method default 'cash'
) returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_uid  uuid := (select auth.uid());
  v_me   record;
  v_ord  record;
  v_left bigint;
begin
  select p.role, p.branch_id into v_me from public.profiles p where p.id = v_uid and p.is_active;
  if not found or (v_me.role = 'employee' and v_me.branch_id is null) then
    raise exception 'Anda tidak punya izin untuk tindakan ini.' using errcode = '42501';
  end if;

  select o.id, o.branch_id, o.total, o.paid_amount into v_ord
    from public.orders o where o.id = p_order_id for update;
  if not found or (v_me.role = 'employee' and v_ord.branch_id is distinct from v_me.branch_id) then
    raise exception 'Pesanan tidak ditemukan.' using errcode = 'P0001';
  end if;

  if p_amount is null or p_amount <= 0 then
    raise exception 'Jumlah pembayaran harus lebih dari 0.' using errcode = 'P0001';
  end if;
  v_left := v_ord.total - v_ord.paid_amount;
  if v_left <= 0 then
    raise exception 'Pesanan ini sudah lunas.' using errcode = 'P0001';
  end if;
  if p_amount > v_left then
    raise exception 'Pembayaran melebihi sisa tagihan (Rp %).', replace(to_char(v_left, 'FM999,999,999,999'), ',', '.')
      using errcode = 'P0001';
  end if;

  insert into public.payments (order_id, amount, method, received_by)
  values (p_order_id, p_amount, p_method, v_uid);
end $$;

revoke all on function public.quote_order(uuid, jsonb, text) from public, anon;
revoke all on function public.create_order(uuid, jsonb, text, text, bigint, public.payment_method, uuid, uuid) from public, anon;
revoke all on function public.record_payment(uuid, bigint, public.payment_method) from public, anon;
grant execute on function public.quote_order(uuid, jsonb, text) to authenticated;
grant execute on function public.create_order(uuid, jsonb, text, text, bigint, public.payment_method, uuid, uuid) to authenticated;
grant execute on function public.record_payment(uuid, bigint, public.payment_method) to authenticated;

-- ─── Statistik pelanggan (mengikuti RLS pemanggil: karyawan = cabangnya saja) ─
create view public.customer_stats with (security_invoker = true) as
  select o.customer_id,
         count(*)::int              as orders_count,
         coalesce(sum(o.total), 0)::bigint as total_spent,
         max(o.created_at)          as last_visit
    from public.orders o
   group by o.customer_id;

revoke all on public.customer_stats from anon, public;
grant select on public.customer_stats to authenticated;
