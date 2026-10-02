-- =============================================================================
-- WashFlow M6c: Komisi karyawan (buku komisi, pembayaran, laporan)
-- =============================================================================
-- Aturan:
--   * Komisi tercatat SEKALI per pesanan, saat status berubah menjadi Selesai (sudah lunas).
--   * Penerima = kasir yang membuat pesanan (orders.cashier_id, diisi server, tidak bisa diubah lewat API).
--   * Dasar = total pesanan setelah diskon. Tarif = profiles.commission_rate PADA SAAT itu (snapshot).
--     Mengubah tarif karyawan tidak mengubah komisi yang sudah tercatat.
--   * Pembayaran dicatat per karyawan per periode (commission_payouts); bisa dibatalkan (voided), tidak dihapus.
--   * Tulis hanya lewat trigger dan fungsi di bawah (tidak ada hak tulis langsung bagi API).
-- Karyawan hanya bisa MELIHAT komisinya sendiri; admin melihat semuanya.

create table public.commission_payouts (
  id            uuid primary key default gen_random_uuid(),
  employee_id   uuid references public.profiles (id) on delete set null,
  employee_name text not null,
  period_from   date not null,
  period_to     date not null,
  total         bigint not null check (total > 0),
  entry_count   integer not null check (entry_count > 0),
  note          text check (note is null or length(note) <= 200),
  paid_at       timestamptz not null default now(),
  paid_by       uuid references public.profiles (id) on delete set null,
  voided_at     timestamptz,
  voided_by     uuid references public.profiles (id) on delete set null,
  constraint commission_payouts_period check (period_to >= period_from)
);
create index commission_payouts_employee_idx on public.commission_payouts (employee_id, paid_at desc);
create index commission_payouts_paid_at_idx on public.commission_payouts (paid_at desc);

create table public.commission_entries (
  id            uuid primary key default gen_random_uuid(),
  order_id      uuid references public.orders (id) on delete set null,
  order_code    text not null,
  employee_id   uuid references public.profiles (id) on delete set null,
  employee_name text not null,
  branch_id     uuid references public.branches (id) on delete set null,
  base_amount   bigint not null check (base_amount >= 0),
  rate          numeric(4,2) not null check (rate between 0 and 100),
  amount        bigint not null check (amount >= 0),
  source        text not null default 'auto' check (source in ('auto', 'recalc')),
  earned_at     timestamptz not null default clock_timestamp(),
  payout_id     uuid references public.commission_payouts (id) on delete set null,
  created_at    timestamptz not null default now()
);
-- satu pesanan hanya boleh menghasilkan satu komisi (idempoten)
create unique index commission_entries_one_per_order on public.commission_entries (order_id) where order_id is not null;
create index commission_entries_employee_idx on public.commission_entries (employee_id, earned_at desc);
create index commission_entries_earned_idx on public.commission_entries (earned_at desc);
create index commission_entries_payout_idx on public.commission_entries (payout_id) where payout_id is not null;

alter table public.commission_entries enable row level security;
alter table public.commission_payouts enable row level security;
create policy commission_entries_select on public.commission_entries for select to authenticated
  using ((select private.is_admin()) or employee_id = (select auth.uid()));
create policy commission_payouts_select on public.commission_payouts for select to authenticated
  using ((select private.is_admin()) or employee_id = (select auth.uid()));
revoke all on public.commission_entries, public.commission_payouts from anon, public, authenticated;
grant select on public.commission_entries, public.commission_payouts to authenticated;

-- ─── Komisi otomatis saat pesanan Selesai ────────────────────────────────────
create function private.trg_orders_award_commission() returns trigger
language plpgsql security definer set search_path = '' as $$
declare v_prof record;
begin
  if new.cashier_id is null then return new; end if;
  select full_name, commission_rate into v_prof from public.profiles where id = new.cashier_id;
  if not found then return new; end if;
  insert into public.commission_entries (order_id, order_code, employee_id, employee_name, branch_id, base_amount, rate, amount, source, earned_at)
  values (new.id, new.code, new.cashier_id, v_prof.full_name, new.branch_id, new.total, v_prof.commission_rate,
          round(new.total * v_prof.commission_rate / 100)::bigint, 'auto', coalesce(new.completed_at, clock_timestamp()))
  on conflict (order_id) where order_id is not null do nothing;
  return new;
end $$;
revoke all on function private.trg_orders_award_commission() from public, anon, authenticated;

create trigger orders_award_commission after update of status on public.orders
  for each row when (new.status = 'completed' and old.status is distinct from 'completed')
  execute function private.trg_orders_award_commission();

-- ─── Hitung ulang pesanan lama yang sudah Selesai (admin, tarif SAAT INI, aman diulang) ──
create function public.recalc_commissions(p_since timestamptz default null) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  r        record;
  v_n      integer := 0;
  v_amount bigint  := 0;
  v_amt    bigint;
begin
  if not (select private.is_admin()) then
    raise exception 'Hanya administrator yang dapat menghitung ulang komisi.' using errcode = 'P0001';
  end if;
  for r in
    select o.id, o.code, o.cashier_id, o.branch_id, o.total, coalesce(o.completed_at, o.created_at) as done_at,
           p.full_name, p.commission_rate
      from public.orders o join public.profiles p on p.id = o.cashier_id
     where o.status = 'completed'
       and (p_since is null or coalesce(o.completed_at, o.created_at) >= p_since)
       and not exists (select 1 from public.commission_entries e where e.order_id = o.id)
     order by coalesce(o.completed_at, o.created_at)
  loop
    v_amt := round(r.total * r.commission_rate / 100)::bigint;
    insert into public.commission_entries (order_id, order_code, employee_id, employee_name, branch_id, base_amount, rate, amount, source, earned_at)
    values (r.id, r.code, r.cashier_id, r.full_name, r.branch_id, r.total, r.commission_rate, v_amt, 'recalc', r.done_at)
    on conflict (order_id) where order_id is not null do nothing;
    if found then v_n := v_n + 1; v_amount := v_amount + v_amt; end if;
  end loop;
  return jsonb_build_object('orders', v_n, 'amount', v_amount);
end $$;
revoke all on function public.recalc_commissions(timestamptz) from public, anon;
grant execute on function public.recalc_commissions(timestamptz) to authenticated;

-- ─── Tandai dibayar (admin): semua komisi belum dibayar milik satu karyawan pada rentang waktu ──
create function public.pay_commissions(
  p_employee_id uuid, p_from timestamptz, p_to timestamptz, p_note text default null, p_tz text default 'Asia/Makassar'
) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_name   text;
  v_count  integer;
  v_total  bigint;
  v_id     uuid;
  v_note   text := nullif(btrim(coalesce(p_note, '')), '');
begin
  if not (select private.is_admin()) then
    raise exception 'Hanya administrator yang dapat mencatat pembayaran komisi.' using errcode = 'P0001';
  end if;
  if p_from is null or p_to is null or p_to <= p_from then
    raise exception 'Rentang tanggal tidak valid.' using errcode = 'P0001';
  end if;
  if v_note is not null and length(v_note) > 200 then
    raise exception 'Catatan maksimal 200 karakter.' using errcode = 'P0001';
  end if;

  with sel as (
    select id, amount, employee_name from public.commission_entries
     where employee_id = p_employee_id and payout_id is null and earned_at >= p_from and earned_at < p_to
     for update
  )
  select count(*), coalesce(sum(amount), 0), max(employee_name) into v_count, v_total, v_name from sel;
  if v_count = 0 or v_total <= 0 then
    raise exception 'Tidak ada komisi yang perlu dibayar pada periode ini.' using errcode = 'P0001';
  end if;

  insert into public.commission_payouts (employee_id, employee_name, period_from, period_to, total, entry_count, note, paid_by)
  values (p_employee_id, v_name, (p_from at time zone p_tz)::date, ((p_to - interval '1 second') at time zone p_tz)::date,
          v_total, v_count, v_note, (select auth.uid()))
  returning id into v_id;

  update public.commission_entries set payout_id = v_id
   where employee_id = p_employee_id and payout_id is null and earned_at >= p_from and earned_at < p_to;
  return jsonb_build_object('payout_id', v_id, 'total', v_total, 'entries', v_count);
end $$;
revoke all on function public.pay_commissions(uuid, timestamptz, timestamptz, text, text) from public, anon;
grant execute on function public.pay_commissions(uuid, timestamptz, timestamptz, text, text) to authenticated;

-- ─── Batalkan pembayaran (admin): komisi kembali berstatus belum dibayar, catatan tetap ada ──
create function public.void_commission_payout(p_payout_id uuid) returns integer
language plpgsql security definer set search_path = '' as $$
declare v_n integer;
begin
  if not (select private.is_admin()) then
    raise exception 'Hanya administrator yang dapat membatalkan pembayaran komisi.' using errcode = 'P0001';
  end if;
  perform 1 from public.commission_payouts where id = p_payout_id and voided_at is null for update;
  if not found then
    raise exception 'Pembayaran tidak ditemukan atau sudah dibatalkan.' using errcode = 'P0001';
  end if;
  update public.commission_entries set payout_id = null where payout_id = p_payout_id;
  get diagnostics v_n = row_count;
  update public.commission_payouts set voided_at = now(), voided_by = (select auth.uid()) where id = p_payout_id;
  return v_n;
end $$;
revoke all on function public.void_commission_payout(uuid) from public, anon;
grant execute on function public.void_commission_payout(uuid) to authenticated;

-- ─── Laporan per karyawan pada rentang waktu (admin) ─────────────────────────
create function public.commission_report(p_from timestamptz, p_to timestamptz, p_branch uuid default null)
returns jsonb
language plpgsql stable set search_path = '' as $$
declare v_res jsonb;
begin
  if not (select private.is_admin()) then
    raise exception 'Hanya administrator yang dapat melihat laporan komisi.' using errcode = 'P0001';
  end if;
  if p_from is null or p_to is null or p_to <= p_from then
    raise exception 'Rentang tanggal tidak valid.' using errcode = 'P0001';
  end if;
  if p_to - p_from > interval '400 days' then
    raise exception 'Rentang laporan maksimal 400 hari.' using errcode = 'P0001';
  end if;

  with e as (
    select * from public.commission_entries
     where earned_at >= p_from and earned_at < p_to and (p_branch is null or branch_id = p_branch)
  )
  select jsonb_build_object(
    'totals', (select jsonb_build_object(
        'orders', count(*), 'base', coalesce(sum(base_amount), 0), 'amount', coalesce(sum(amount), 0),
        'unpaid', coalesce(sum(amount) filter (where payout_id is null), 0),
        'paid', coalesce(sum(amount) filter (where payout_id is not null), 0)) from e),
    'employees', (select coalesce(jsonb_agg(x order by x.amount desc, x.name), '[]'::jsonb) from (
        select e.employee_id as id, max(e.employee_name) as name,
               max(b.name) as branch, max(p.commission_rate) as current_rate, bool_or(p.is_active) as active,
               count(*) as orders, sum(e.base_amount) as base, sum(e.amount) as amount,
               coalesce(sum(e.amount) filter (where e.payout_id is null), 0) as unpaid,
               coalesce(sum(e.amount) filter (where e.payout_id is not null), 0) as paid
          from e
          left join public.profiles p on p.id = e.employee_id
          left join public.branches b on b.id = p.branch_id
         group by e.employee_id, case when e.employee_id is null then e.employee_name end) x)
  ) into v_res;
  return v_res;
end $$;
revoke all on function public.commission_report(timestamptz, timestamptz, uuid) from public, anon;
grant execute on function public.commission_report(timestamptz, timestamptz, uuid) to authenticated;

-- ─── Kolom "Komisi 30 hari" di menu Karyawan kini dari buku komisi (bukan estimasi) ──
create or replace view public.employee_stats with (security_invoker = true) as
select p.id as profile_id,
       (select count(*) from public.orders o where o.cashier_id = p.id and o.created_at >= now() - interval '30 days')::int as orders_30d,
       (select coalesce(sum(e.amount), 0) from public.commission_entries e where e.employee_id = p.id and e.earned_at >= now() - interval '30 days')::bigint as commission_30d
  from public.profiles p;
