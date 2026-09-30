-- =============================================================================
-- WashFlow M5b: antrean notifikasi WhatsApp (outbox) untuk otomasi n8n
-- =============================================================================
-- Alur: pesanan berubah ke "Siap Diambil" -> trigger memasukkan 1 baris ke `notifications`
-- -> n8n mengambilnya lewat claim_notifications(), mengirim template WhatsApp Cloud API,
-- lalu melaporkan hasilnya lewat complete_notification().
-- Kenapa outbox, bukan webhook langsung: status pengiriman tersimpan (bisa diaudit dan dicoba ulang),
-- tidak ada pesan ganda saat n8n mati lalu hidup lagi, dan database tidak perlu tahu alamat n8n.

-- ─── 1. Pengaturan otomasi (satu baris per instalasi) ────────────────────────
-- Bawaan MATI: instalasi tanpa n8n tidak menumpuk antrean, dan klien harus sengaja mengaktifkan
-- (dan sebaiknya sudah memberi tahu pelanggan bahwa nomor mereka dipakai untuk notifikasi pesanan).
create table public.automation_settings (
  id                 boolean primary key default true check (id),
  wa_notify_enabled  boolean not null default false,
  updated_at         timestamptz not null default now(),
  updated_by         uuid
);
insert into public.automation_settings (id) values (true);

alter table public.automation_settings enable row level security;
create policy automation_settings_select on public.automation_settings for select to authenticated
  using ((select private.is_admin()));
create policy automation_settings_update on public.automation_settings for update to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));
revoke all on public.automation_settings from anon, public, authenticated;
grant select on public.automation_settings to authenticated;
grant update (wa_notify_enabled, updated_at, updated_by) on public.automation_settings to authenticated;

-- ─── 2. Outbox ───────────────────────────────────────────────────────────────
create table public.notifications (
  id              uuid primary key default gen_random_uuid(),
  order_id        uuid not null references public.orders (id) on delete cascade,
  kind            text not null default 'ready' check (kind in ('ready')),
  status          text not null default 'pending' check (status in ('pending', 'sending', 'sent', 'failed', 'skipped')),
  attempts        integer not null default 0 check (attempts >= 0),
  next_attempt_at timestamptz not null default now(),
  locked_at       timestamptz,
  wa_message_id   text,
  error           text,
  created_at      timestamptz not null default now(),
  sent_at         timestamptz,
  unique (order_id, kind)            -- satu notifikasi per pesanan per jenis, apa pun yang terjadi pada statusnya
);
create index notifications_queue_idx on public.notifications (status, next_attempt_at) where status in ('pending', 'sending');

alter table public.notifications enable row level security;
-- Staf hanya bisa MELIHAT status (mengikuti visibilitas pesanan/cabang). Tidak ada policy tulis:
-- penulisan hanya lewat trigger dan dua fungsi khusus service_role di bawah.
create policy notifications_select on public.notifications for select to authenticated
  using (exists (select 1 from public.orders o where o.id = order_id));
revoke all on public.notifications from anon, public, authenticated;
grant select on public.notifications to authenticated;

-- ─── 3. Trigger: pesanan menjadi Siap Diambil ────────────────────────────────
create function private.trg_orders_notify_ready() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.status = 'ready' and old.status is distinct from 'ready'
     and (select wa_notify_enabled from public.automation_settings where id) then
    insert into public.notifications (order_id, kind) values (new.id, 'ready')
      on conflict (order_id, kind) do nothing;          -- pesanan yang dimundurkan lalu Siap lagi tidak dikirim ulang
  end if;
  return new;
end;
$$;
revoke all on function private.trg_orders_notify_ready() from public, anon, authenticated;
create trigger orders_notify_ready after update of status on public.orders
  for each row execute function private.trg_orders_notify_ready();

-- ─── 4. Fungsi untuk n8n (HANYA service_role) ────────────────────────────────
-- Mengambil paling banyak p_limit notifikasi yang siap dikirim dan menguncinya (status sending).
-- FOR UPDATE SKIP LOCKED: dua eksekusi n8n yang berjalan bersamaan tidak akan mengambil baris yang sama.
create function public.claim_notifications(p_limit integer default 10) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_result jsonb;
begin
  p_limit := greatest(1, least(coalesce(p_limit, 10), 50));

  -- Pesan yang sudah terlalu lama menunggu tidak lagi relevan (mis. n8n baru dinyalakan setelah berhari-hari).
  update public.notifications set status = 'skipped', error = 'kedaluwarsa (lebih dari 6 jam menunggu)'
    where status = 'pending' and created_at < now() - interval '6 hours';
  -- Pengirim yang hilang di tengah jalan (n8n mati): kembalikan ke antrean. attempts sudah terhitung.
  update public.notifications set status = 'pending', locked_at = null
    where status = 'sending' and locked_at < now() - interval '10 minutes';
  -- Pesanan sudah tidak lagi Siap (dimundurkan atau sudah diambil): tidak perlu diberi tahu.
  update public.notifications n set status = 'skipped', error = 'status pesanan sudah berubah'
    from public.orders o
    where n.order_id = o.id and n.status = 'pending' and o.status <> 'ready';

  with picked as (
    select n.id from public.notifications n
    where n.status = 'pending' and n.next_attempt_at <= now()
    order by n.created_at
    limit p_limit
    for update skip locked
  ), locked as (
    update public.notifications n
       set status = 'sending', locked_at = now(), attempts = n.attempts + 1
      from picked where n.id = picked.id
    returning n.*
  )
  select coalesce(jsonb_agg(jsonb_build_object(
      'notification_id', l.id,
      'kind', l.kind,
      'attempt', l.attempts,
      'order_code', o.code,
      'track_token', o.track_token,
      'payment_status', o.payment_status,
      'total', o.total,
      'sisa', greatest(0, o.total - o.paid_amount),
      -- Format yang diminta WhatsApp Cloud API: angka saja dengan kode negara, tanpa plus. 0812... menjadi 62812...
      'phone', case when c.phone like '0%' then '62' || substr(c.phone, 2) else ltrim(c.phone, '+') end,
      'customer_first_name', split_part(btrim(c.name), ' ', 1),
      'branch_name', b.name,
      'branch_phone', b.phone
    ) order by l.created_at), '[]'::jsonb)
    into v_result
    from locked l
    join public.orders o on o.id = l.order_id
    join public.customers c on c.id = o.customer_id
    join public.branches b on b.id = o.branch_id;

  return v_result;
end;
$$;

-- Melaporkan hasil pengiriman; mengembalikan {"status": ...} (objek JSON, supaya node HTTP n8n bisa membacanya).
-- Hanya berlaku untuk baris yang sedang `sending`, jadi panggilan ganda aman.
-- Gagal: dicoba ulang dengan jeda 5 menit x percobaan, maksimal 3 percobaan, kecuali p_retry = false.
create function public.complete_notification(
  p_id uuid, p_ok boolean, p_wa_message_id text default null, p_error text default null, p_retry boolean default true
) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  n public.notifications;
  v_status text;
begin
  select * into n from public.notifications where id = p_id for update;
  if not found then return jsonb_build_object('status', 'not_found'); end if;
  if n.status <> 'sending' then return jsonb_build_object('status', n.status); end if;

  if p_ok then
    v_status := 'sent';
    update public.notifications set status = 'sent', sent_at = now(), locked_at = null,
      wa_message_id = left(p_wa_message_id, 200), error = null where id = p_id;
  elsif p_retry and n.attempts < 3 then
    v_status := 'pending';
    update public.notifications set status = 'pending', locked_at = null, error = left(coalesce(p_error, 'gagal'), 500),
      next_attempt_at = now() + interval '5 minutes' * n.attempts where id = p_id;
  else
    v_status := 'failed';
    update public.notifications set status = 'failed', locked_at = null, error = left(coalesce(p_error, 'gagal'), 500) where id = p_id;
  end if;
  return jsonb_build_object('status', v_status);
end;
$$;

revoke all on function public.claim_notifications(integer) from public, anon, authenticated;
revoke all on function public.complete_notification(uuid, boolean, text, text, boolean) from public, anon, authenticated;
grant execute on function public.claim_notifications(integer) to service_role;
grant execute on function public.complete_notification(uuid, boolean, text, text, boolean) to service_role;
