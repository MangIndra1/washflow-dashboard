-- =============================================================================
-- WashFlow: skema database v1
-- Model bisnis: single-tenant (satu project Supabase per klien laundry).
-- Uang disimpan sebagai bigint dalam Rupiah utuh (tanpa desimal).
-- =============================================================================

create schema if not exists private;   -- fungsi internal; TIDAK diekspos ke Data API

-- ─── ENUM ────────────────────────────────────────────────────────────────────
create type public.app_role       as enum ('admin', 'employee');
create type public.branch_status  as enum ('active', 'maintenance', 'closed');
create type public.service_unit   as enum ('kg', 'pcs', 'pasang', 'm2');
create type public.order_status   as enum ('received', 'washing', 'drying', 'ironing', 'ready', 'completed');
create type public.payment_status as enum ('unpaid', 'partial', 'paid');
create type public.payment_method as enum ('cash', 'qris', 'transfer');
create type public.promo_type     as enum ('percent', 'fixed');

-- ─── UTIL: updated_at ────────────────────────────────────────────────────────
create function private.touch_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end $$;

-- ─── BRANCHES ────────────────────────────────────────────────────────────────
create table public.branches (
  id          uuid primary key default gen_random_uuid(),
  code        text not null unique check (code ~ '^[A-Z0-9]{2,6}$'),
  name        text not null,
  address     text,
  phone       text,
  status      public.branch_status not null default 'active',
  open_time   time not null default '08:00',
  close_time  time not null default '20:00',
  manager_id  uuid,                                   -- FK ke profiles ditambah di bawah
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ─── PROFILES (1:1 dengan auth.users) ────────────────────────────────────────
create table public.profiles (
  id              uuid primary key references auth.users (id) on delete cascade,
  full_name       text not null,
  phone           text,
  role            public.app_role not null default 'employee',
  branch_id       uuid references public.branches (id) on delete set null,
  is_active       boolean not null default true,
  commission_rate numeric(4,2) not null default 0 check (commission_rate between 0 and 100),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index profiles_branch_id_idx on public.profiles (branch_id);

alter table public.branches
  add constraint branches_manager_id_fkey
  foreign key (manager_id) references public.profiles (id) on delete set null;

-- ─── SERVICES ────────────────────────────────────────────────────────────────
create table public.services (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique,
  category    text not null default 'Regular',
  unit        public.service_unit not null,
  price       bigint not null check (price >= 0),          -- Rupiah per unit
  est_hours   integer not null check (est_hours > 0),
  description text,
  is_active   boolean not null default true,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ─── MEMBERSHIP ──────────────────────────────────────────────────────────────
create table public.membership_tiers (
  id               uuid primary key default gen_random_uuid(),
  name             text not null unique,
  min_points       integer not null unique check (min_points >= 0),
  discount_percent numeric(4,2) not null default 0 check (discount_percent between 0 and 100),
  color            text,
  benefits         text[] not null default '{}',
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- ─── CUSTOMERS (dipakai bersama oleh semua cabang) ───────────────────────────
create table public.customers (
  id                  uuid primary key default gen_random_uuid(),
  name                text not null,
  phone               text not null unique check (phone ~ '^\+?[0-9]{8,15}$'),   -- nomor WA
  email               text,
  address             text,
  points              integer not null default 0 check (points >= 0),
  preferred_branch_id uuid references public.branches (id) on delete set null,
  notes               text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create index customers_name_idx on public.customers (lower(name));

-- ─── PROMOTIONS ──────────────────────────────────────────────────────────────
create table public.promotions (
  id          uuid primary key default gen_random_uuid(),
  code        text not null unique check (code = upper(code)),
  name        text not null,
  type        public.promo_type not null,
  value       bigint not null check (value > 0),          -- persen (1-100) atau Rupiah
  min_order   bigint not null default 0 check (min_order >= 0),
  max_usage   integer check (max_usage is null or max_usage > 0),
  valid_from  date not null,
  valid_to    date not null,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  check (type <> 'percent' or value <= 100),
  check (valid_to >= valid_from)
);

-- ─── ORDERS ──────────────────────────────────────────────────────────────────
create sequence public.order_code_seq;

create table public.orders (
  id             uuid primary key default gen_random_uuid(),
  code           text not null unique default (
                   'WF-' || to_char(now() at time zone 'Asia/Makassar', 'YYMM')
                   || '-' || lpad(nextval('public.order_code_seq')::text, 5, '0')),
  branch_id      uuid not null references public.branches (id),
  customer_id    uuid not null references public.customers (id),
  cashier_id     uuid references public.profiles (id) on delete set null,
  promo_id       uuid references public.promotions (id) on delete set null,
  status         public.order_status not null default 'received',
  subtotal       bigint not null default 0 check (subtotal >= 0),   -- dihitung trigger dari order_items
  discount       bigint not null default 0 check (discount >= 0),
  total          bigint not null default 0 check (total >= 0),     -- dihitung trigger
  paid_amount    bigint not null default 0 check (paid_amount >= 0),-- dihitung trigger dari payments
  payment_status public.payment_status not null default 'unpaid',   -- dihitung trigger
  notes          text,
  due_at         timestamptz,
  tracking_token uuid not null unique default gen_random_uuid(),    -- untuk halaman tracking publik (M5)
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  completed_at   timestamptz
);
create index orders_branch_created_idx on public.orders (branch_id, created_at desc);
create index orders_customer_idx       on public.orders (customer_id);
create index orders_status_idx         on public.orders (status);

create table public.order_items (
  id           uuid primary key default gen_random_uuid(),
  order_id     uuid not null references public.orders (id) on delete cascade,
  service_id   uuid references public.services (id) on delete set null,
  service_name text not null,                                   -- snapshot: riwayat tidak berubah saat layanan diedit
  unit         public.service_unit not null,                    -- snapshot
  unit_price   bigint not null check (unit_price >= 0),         -- snapshot
  quantity     numeric(10,2) not null check (quantity > 0),
  line_total   bigint generated always as ((round(quantity * unit_price))::bigint) stored,
  created_at   timestamptz not null default now()
);
create index order_items_order_idx on public.order_items (order_id);

create table public.payments (
  id          uuid primary key default gen_random_uuid(),
  order_id    uuid not null references public.orders (id) on delete cascade,
  amount      bigint not null check (amount > 0),
  method      public.payment_method not null default 'cash',
  received_by uuid references public.profiles (id) on delete set null,
  paid_at     timestamptz not null default now()
);
create index payments_order_idx on public.payments (order_id);

create table public.order_status_logs (
  id          uuid primary key default gen_random_uuid(),
  order_id    uuid not null references public.orders (id) on delete cascade,
  from_status public.order_status,
  to_status   public.order_status not null,
  changed_by  uuid,                                              -- auth.uid(); null bila dari SQL/seed
  changed_at  timestamptz not null default now()
);
create index order_status_logs_order_idx on public.order_status_logs (order_id, changed_at);

-- ─── INVENTORY (per cabang) ──────────────────────────────────────────────────
create table public.inventory_items (
  id             uuid primary key default gen_random_uuid(),
  branch_id      uuid not null references public.branches (id) on delete cascade,
  name           text not null,
  category       text not null default 'Lainnya',
  unit           text not null,
  current_stock  numeric(12,2) not null default 0 check (current_stock >= 0),
  min_stock      numeric(12,2) not null default 0 check (min_stock >= 0),
  reorder_point  numeric(12,2) not null default 0 check (reorder_point >= 0),
  unit_cost      bigint not null default 0 check (unit_cost >= 0),
  supplier       text,
  last_restocked date,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (branch_id, name)
);

-- ─── TRIGGER: updated_at ─────────────────────────────────────────────────────
do $$
declare t text;
begin
  foreach t in array array['branches','profiles','services','membership_tiers','customers','promotions','orders','inventory_items']
  loop
    execute format('create trigger touch_updated_at before update on public.%I
                    for each row execute function private.touch_updated_at()', t);
  end loop;
end $$;

-- ─── TRIGGER: profil otomatis untuk user baru ────────────────────────────────
-- PENTING: role TIDAK PERNAH dibaca dari metadata signup (metadata bisa dimanipulasi user).
-- User baru selalu 'employee' tanpa cabang, jadi tidak melihat data apa pun sampai admin menugaskan.
create function private.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data ->> 'full_name', ''), split_part(coalesce(new.email, ''), '@', 1), 'User')
  );
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

-- ─── TRIGGER: hitung ulang total & status pembayaran order ───────────────────
create function private.refresh_order_money(p_order_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_sub  bigint;
  v_paid bigint;
begin
  select coalesce(sum(line_total), 0) into v_sub  from public.order_items where order_id = p_order_id;
  select coalesce(sum(amount), 0)     into v_paid from public.payments    where order_id = p_order_id;

  update public.orders o
     set subtotal       = v_sub,
         total          = greatest(v_sub - o.discount, 0),
         paid_amount    = v_paid,
         payment_status = case
                            when v_paid <= 0                              then 'unpaid'::public.payment_status
                            when v_paid >= greatest(v_sub - o.discount, 0) then 'paid'::public.payment_status
                            else 'partial'::public.payment_status
                          end
   where o.id = p_order_id;
end $$;

create function private.trg_refresh_order_money() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'DELETE' then
    perform private.refresh_order_money(old.order_id);
  else
    perform private.refresh_order_money(new.order_id);
    -- item/pembayaran dipindah ke order lain: hitung ulang order lama juga
    if tg_op = 'UPDATE' and old.order_id is distinct from new.order_id then
      perform private.refresh_order_money(old.order_id);
    end if;
  end if;
  return null;
end $$;

create trigger order_items_refresh after insert or update or delete on public.order_items
  for each row execute function private.trg_refresh_order_money();
create trigger payments_refresh after insert or update or delete on public.payments
  for each row execute function private.trg_refresh_order_money();

create function private.trg_orders_discount_changed() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  perform private.refresh_order_money(new.id);
  return null;
end $$;

create trigger orders_discount_changed after update of discount on public.orders
  for each row when (old.discount is distinct from new.discount)
  execute function private.trg_orders_discount_changed();

-- ─── TRIGGER: riwayat status + completed_at ──────────────────────────────────
create function private.trg_orders_completed_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.status = 'completed' and old.status <> 'completed' then
    new.completed_at := now();
  elsif new.status <> 'completed' then
    new.completed_at := null;
  end if;
  return new;
end $$;

create trigger orders_completed_at before update of status on public.orders
  for each row execute function private.trg_orders_completed_at();

create function private.trg_log_order_status() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    insert into public.order_status_logs (order_id, from_status, to_status, changed_by)
    values (new.id, null, new.status, auth.uid());
  elsif new.status is distinct from old.status then
    insert into public.order_status_logs (order_id, from_status, to_status, changed_by)
    values (new.id, old.status, new.status, auth.uid());
  end if;
  return null;
end $$;

create trigger orders_log_status after insert or update of status on public.orders
  for each row execute function private.trg_log_order_status();
