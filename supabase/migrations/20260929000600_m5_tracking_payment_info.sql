-- =============================================================================
-- WashFlow M5: pelacakan publik lewat token, dan info pembayaran (QRIS + rekening)
-- =============================================================================

-- ─── 1. Token pelacakan ──────────────────────────────────────────────────────
-- 122 bit acak (uuid v4 tanpa tanda hubung). Tidak bisa ditebak, tidak sama dengan id/kode pesanan.
-- Karyawan tidak punya grant update untuk kolom ini (hanya status dan notes).
alter table public.orders add column track_token text not null default replace(gen_random_uuid()::text, '-', '');
create unique index orders_track_token_key on public.orders (track_token);

-- ─── 2. Info pembayaran (satu baris per instalasi) ───────────────────────────
-- QRIS disimpan sebagai teks payload (hasil baca gambar QR di aplikasi), bukan gambar,
-- sehingga kecil, tajam saat dicetak, dan bisa diperiksa checksum-nya.
create table public.payment_info (
  id             boolean primary key default true check (id),
  qris_payload   text check (qris_payload is null or (length(qris_payload) between 30 and 700 and qris_payload like '000201%')),
  qris_merchant  text check (qris_merchant is null or length(qris_merchant) <= 100),
  banks          jsonb not null default '[]'::jsonb check (jsonb_typeof(banks) = 'array' and jsonb_array_length(banks) <= 5),
  note           text check (note is null or length(note) <= 300),
  updated_at     timestamptz not null default now(),
  updated_by     uuid
);
insert into public.payment_info (id) values (true);

alter table public.payment_info enable row level security;
create policy payment_info_select on public.payment_info for select to authenticated using ((select private.is_staff()));
create policy payment_info_update on public.payment_info for update to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));

-- Supabase memberi hak penuh ke anon/authenticated pada tabel baru: cabut lalu beri seperlunya.
revoke all on public.payment_info from anon, public, authenticated;
grant select on public.payment_info to authenticated;
grant update (qris_payload, qris_merchant, banks, note, updated_at, updated_by) on public.payment_info to authenticated;

-- ─── 3. Pelacakan publik ─────────────────────────────────────────────────────
-- Satu-satunya pintu anon ke data pesanan. Mengembalikan data seperlunya untuk pelanggan
-- (tanpa nomor telepon, tanpa nama kasir, hanya nama depan). Token salah atau tidak dikenal
-- selalu mengembalikan null, tanpa membedakan penyebabnya.
create function public.track_order(p_token text) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare
  o public.orders;
  v_branch jsonb;
  v_name text;
  v_pi jsonb;
begin
  if p_token is null or p_token !~ '^[0-9a-f]{32}$' then
    return null;
  end if;
  select * into o from public.orders where track_token = p_token;
  if not found then
    return null;
  end if;

  select jsonb_build_object('name', b.name, 'address', b.address, 'phone', b.phone) into v_branch
    from public.branches b where b.id = o.branch_id;
  select split_part(btrim(c.name), ' ', 1) into v_name from public.customers c where c.id = o.customer_id;

  if o.payment_status <> 'paid' then
    select jsonb_build_object('qris_payload', qris_payload, 'qris_merchant', qris_merchant, 'banks', banks, 'note', note)
      into v_pi from public.payment_info;
  end if;

  return jsonb_build_object(
    'code', o.code, 'status', o.status, 'payment_status', o.payment_status,
    'total', o.total, 'paid_amount', o.paid_amount, 'discount', o.discount, 'discount_label', o.discount_label,
    'created_at', o.created_at, 'due_at', o.due_at, 'completed_at', o.completed_at,
    'branch', v_branch, 'customer_first_name', v_name,
    'items', (select coalesce(jsonb_agg(jsonb_build_object(
        'service_name', i.service_name, 'quantity', i.quantity, 'unit', i.unit, 'line_total', i.line_total)
        order by i.created_at), '[]'::jsonb) from public.order_items i where i.order_id = o.id),
    'timeline', (select coalesce(jsonb_agg(jsonb_build_object('status', l.to_status, 'at', l.changed_at)
        order by l.changed_at), '[]'::jsonb) from public.order_status_logs l where l.order_id = o.id),
    'payment_info', v_pi
  );
end;
$$;

revoke all on function public.track_order(text) from public, anon, authenticated;
grant execute on function public.track_order(text) to anon, authenticated;
