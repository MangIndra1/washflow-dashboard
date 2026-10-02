-- =============================================================================
-- WashFlow M6a-2: laporan admin menampilkan diskon
-- =============================================================================
-- Menambah ke admin_report:
--   totals.gross              = jumlah subtotal (harga normal sebelum diskon) pesanan periode ini
--   totals.discount           = jumlah diskon yang diberikan
--   totals.discounted_orders  = banyak pesanan yang berdiskon
--   discounts[]               = rincian per sumber (label promo atau member), terbesar dulu
-- Nilai pesanan (totals.value) tetap total setelah diskon, jadi gross - discount = value.
-- Tanda tangan fungsi tidak berubah, sehingga hak akses lama tetap berlaku.

create or replace function public.admin_report(
  p_from   timestamptz,
  p_to     timestamptz,
  p_branch uuid default null,
  p_tz     text default 'Asia/Makassar'
) returns jsonb
language plpgsql stable set search_path = '' as $$
declare
  v_len   interval;
  v_pfrom timestamptz;
  v_res   jsonb;
begin
  if not (select private.is_admin()) then
    raise exception 'Hanya administrator yang dapat melihat laporan.' using errcode = 'P0001';
  end if;
  if p_from is null or p_to is null or p_to <= p_from then
    raise exception 'Rentang tanggal tidak valid.' using errcode = 'P0001';
  end if;
  if p_to - p_from > interval '400 days' then
    raise exception 'Rentang laporan maksimal 400 hari.' using errcode = 'P0001';
  end if;
  v_len := p_to - p_from;
  v_pfrom := p_from - v_len;

  with
  o as (
    select id, branch_id, subtotal, discount, discount_label, promo_id, total, paid_amount,
           (created_at at time zone p_tz)::date as day
      from public.orders
     where created_at >= p_from and created_at < p_to and (p_branch is null or branch_id = p_branch)
  ),
  pay as (
    select p.amount, p.method, o2.branch_id, (p.paid_at at time zone p_tz)::date as day
      from public.payments p join public.orders o2 on o2.id = p.order_id
     where p.paid_at >= p_from and p.paid_at < p_to and (p_branch is null or o2.branch_id = p_branch)
  ),
  days as (
    select g::date as day
      from generate_series((p_from at time zone p_tz)::date, ((p_to - interval '1 second') at time zone p_tz)::date, interval '1 day') g
  ),
  od as (select day, count(*) as n, sum(total) as v from o group by day),
  pd as (select day, sum(amount) as r from pay group by day)
  select jsonb_build_object(
    'totals', (select jsonb_build_object(
        'orders', count(*), 'value', coalesce(sum(total), 0),
        'outstanding', coalesce(sum(greatest(total - paid_amount, 0)), 0),
        'gross', coalesce(sum(subtotal), 0),
        'discount', coalesce(sum(discount), 0),
        'discounted_orders', count(*) filter (where discount > 0)) from o),
    'discounts', (select coalesce(jsonb_agg(d order by d.amount desc, d.label), '[]'::jsonb) from (
        select coalesce(o.discount_label, 'Diskon lain') as label,
               case when bool_or(o.promo_id is not null or coalesce(o.discount_label, '') like 'Promo %') then 'promo' else 'member' end as kind,
               count(*) as orders, sum(o.discount) as amount
          from o where o.discount > 0 group by coalesce(o.discount_label, 'Diskon lain')) d),
    'received', (select jsonb_build_object(
        'total', coalesce(sum(amount), 0),
        'cash', coalesce(sum(amount) filter (where method = 'cash'), 0),
        'qris', coalesce(sum(amount) filter (where method = 'qris'), 0),
        'transfer', coalesce(sum(amount) filter (where method = 'transfer'), 0)) from pay),
    'prev', jsonb_build_object(
        'orders', (select count(*) from public.orders
                    where created_at >= v_pfrom and created_at < p_from and (p_branch is null or branch_id = p_branch)),
        'value', (select coalesce(sum(total), 0) from public.orders
                    where created_at >= v_pfrom and created_at < p_from and (p_branch is null or branch_id = p_branch)),
        'received', (select coalesce(sum(p.amount), 0) from public.payments p join public.orders o2 on o2.id = p.order_id
                    where p.paid_at >= v_pfrom and p.paid_at < p_from and (p_branch is null or o2.branch_id = p_branch))),
    'daily', (select coalesce(jsonb_agg(jsonb_build_object(
        'day', d.day, 'orders', coalesce(od.n, 0), 'value', coalesce(od.v, 0), 'received', coalesce(pd.r, 0)) order by d.day), '[]'::jsonb)
        from days d left join od on od.day = d.day left join pd on pd.day = d.day),
    'branches', (select coalesce(jsonb_agg(jsonb_build_object(
        'id', b.id, 'code', b.code, 'name', b.name,
        'orders', coalesce((select count(*) from o where o.branch_id = b.id), 0),
        'value', coalesce((select sum(o.total) from o where o.branch_id = b.id), 0),
        'received', coalesce((select sum(pay.amount) from pay where pay.branch_id = b.id), 0)) order by b.code), '[]'::jsonb)
        from public.branches b where p_branch is null or b.id = p_branch),
    'services', (select coalesce(jsonb_agg(s order by s.value desc), '[]'::jsonb) from (
        select i.service_name as name, count(distinct i.order_id) as orders, sum(i.quantity) as quantity, sum(i.line_total) as value
          from public.order_items i join o on o.id = i.order_id group by i.service_name) s)
  ) into v_res;

  return v_res;
end;
$$;
