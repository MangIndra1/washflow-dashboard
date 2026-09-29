-- =============================================================================
-- WashFlow: data demo (fiktif, Indonesia / Rupiah)
-- Aman dijalankan pada database KOSONG. Untuk mengulang: `supabase db reset` (lokal)
-- atau kosongkan tabel terlebih dahulu. Order dibuat relatif terhadap now() sehingga
-- dashboard selalu terlihat "hidup". Nomor telepon & alamat sepenuhnya fiktif.
-- =============================================================================

-- ─── Membership ──────────────────────────────────────────────────────────────
insert into public.membership_tiers (name, min_points, discount_percent, color, benefits) values
  ('Bronze',       0,  0, '#B45309', array['Layanan dasar', 'Diskon ulang tahun 5%']),
  ('Silver',    1000,  5, '#64748B', array['Diskon 5% semua order', 'Prioritas pengambilan', 'Diskon ulang tahun 10%']),
  ('Gold',      2500, 10, '#D97706', array['Diskon 10% semua order', 'Prioritas pengerjaan', 'Gratis 1x cuci express/bulan', 'Diskon ulang tahun 15%']),
  ('Platinum',  5000, 15, '#2563EB', array['Diskon 15% semua order', 'Prioritas pengerjaan', 'Gratis 1x cuci express/minggu', 'Layanan pelanggan khusus', 'Diskon ulang tahun 20%']);

-- ─── Cabang ──────────────────────────────────────────────────────────────────
insert into public.branches (id, code, name, address, phone, status, open_time, close_time) values
  ('00000000-0000-0000-0000-0000000000b1', 'DPS', 'Cabang Denpasar',  'Jl. Teuku Umar Barat No. 88, Denpasar',      '0361 000 101', 'active',      '07:00', '21:00'),
  ('00000000-0000-0000-0000-0000000000b2', 'KTA', 'Cabang Kuta',      'Jl. Raya Kuta No. 12, Kuta, Badung',          '0361 000 102', 'active',      '08:00', '22:00'),
  ('00000000-0000-0000-0000-0000000000b3', 'JBR', 'Cabang Jimbaran',  'Jl. Raya Uluwatu No. 5, Jimbaran, Badung',    '0361 000 103', 'active',      '08:00', '20:00'),
  ('00000000-0000-0000-0000-0000000000b4', 'UBD', 'Cabang Ubud',      'Jl. Raya Ubud No. 3, Ubud, Gianyar',          '0361 000 104', 'maintenance', '08:00', '20:00');

-- ─── Layanan (harga Rupiah per unit) ─────────────────────────────────────────
insert into public.services (id, name, category, unit, price, est_hours, description, is_active, sort_order) values
  ('00000000-0000-0000-0000-0000000000a1', 'Cuci Kiloan Reguler',  'Reguler',  'kg',     7000,  48, 'Cuci, kering, dan lipat, selesai 2 hari',                      true,  1),
  ('00000000-0000-0000-0000-0000000000a2', 'Cuci Kiloan Express',  'Express',  'kg',    12000,   6, 'Cuci, kering, dan lipat, selesai di hari yang sama',           true,  2),
  ('00000000-0000-0000-0000-0000000000a3', 'Setrika Saja',         'Reguler',  'kg',     5000,  24, 'Setrika dan lipat rapi tanpa cuci',                             true,  3),
  ('00000000-0000-0000-0000-0000000000a4', 'Dry Cleaning',         'Premium',  'pcs',   25000,  72, 'Perawatan khusus jas, gaun, dan pakaian berbahan halus',        true,  4),
  ('00000000-0000-0000-0000-0000000000a5', 'Bed Cover & Selimut',  'Khusus',   'pcs',   35000,  48, 'Cuci bed cover, selimut, dan sprei ukuran besar',               true,  5),
  ('00000000-0000-0000-0000-0000000000a6', 'Cuci Sepatu',          'Khusus',   'pasang',40000,  48, 'Pembersihan dan perawatan sepatu',                             true,  6),
  ('00000000-0000-0000-0000-0000000000a7', 'Cuci Karpet',          'Khusus',   'm2',    25000,  96, 'Cuci karpet per meter persegi',                                 true,  7),
  ('00000000-0000-0000-0000-0000000000a8', 'Cuci Gorden',          'Khusus',   'kg',    15000,  72, 'Cuci dan setrika gorden (layanan sementara dinonaktifkan)',     false, 8);

-- ─── Pelanggan (20) ──────────────────────────────────────────────────────────
insert into public.customers (name, phone, email, address, points, preferred_branch_id)
select v.name, v.phone, v.email, v.address, v.points, (select id from public.branches where code = v.branch)
from (values
  ('Made Wirawan',        '081234560001', 'made.wirawan@example.com',   'Jl. Sudirman No. 4, Denpasar',      2650, 'DPS'),
  ('Ketut Sari',          '081234560002', 'ketut.sari@example.com',     'Jl. Gatot Subroto No. 21, Denpasar', 980, 'DPS'),
  ('Putu Ayu Lestari',    '081234560003', null,                         'Jl. Imam Bonjol No. 9, Denpasar',   1720, 'DPS'),
  ('Kadek Dwi Putra',     '081234560004', 'kadek.dwi@example.com',      'Jl. Diponegoro No. 15, Denpasar',    310, 'DPS'),
  ('Komang Ari Sastra',   '081234560005', null,                         'Jl. Hayam Wuruk No. 30, Denpasar',  5230, 'DPS'),
  ('Wayan Gede Adnyana',  '081234560006', 'wayan.gede@example.com',     'Jl. Raya Kuta No. 44, Kuta',        1480, 'KTA'),
  ('Ni Luh Mira',         '081234560007', null,                         'Jl. Legian No. 18, Kuta',            760, 'KTA'),
  ('Agus Prasetyo',       '081234560008', 'agus.p@example.com',         'Jl. Sunset Road No. 7, Kuta',       2980, 'KTA'),
  ('Rina Kusuma',         '081234560009', 'rina.kusuma@example.com',    'Jl. Pantai Kuta No. 2, Kuta',        450, 'KTA'),
  ('Dewi Anggraini',      '081234560010', null,                         'Jl. Kartika Plaza No. 11, Kuta',    1150, 'KTA'),
  ('I Gusti Ngurah Bagus','081234560011', 'gusti.bagus@example.com',    'Jl. Uluwatu II No. 6, Jimbaran',    3400, 'JBR'),
  ('Yoga Pratama',        '081234560012', null,                         'Jl. Bukit Permai No. 19, Jimbaran',  220, 'JBR'),
  ('Sinta Maharani',      '081234560013', 'sinta.m@example.com',        'Jl. Ungasan No. 8, Jimbaran',       1890, 'JBR'),
  ('Bayu Nugraha',        '081234560014', null,                         'Jl. Goa Gong No. 3, Jimbaran',       640, 'JBR'),
  ('Ayu Wulandari',       '081234560015', 'ayu.w@example.com',          'Jl. Raya Uluwatu No. 77, Jimbaran', 2100, 'JBR'),
  ('Nyoman Suartika',     '081234560016', null,                         'Jl. Teuku Umar No. 55, Denpasar',    890, 'DPS'),
  ('Eka Puspita',         '081234560017', 'eka.puspita@example.com',    'Jl. Kertha Negara No. 12, Denpasar',1310, 'DPS'),
  ('Doni Saputra',        '081234560018', null,                         'Jl. Raya Kuta No. 101, Kuta',        150, 'KTA'),
  ('Lina Marlina',        '081234560019', 'lina.m@example.com',         'Jl. Bypass Ngurah Rai No. 9, Kuta', 4100, 'KTA'),
  ('Rizky Ramadhan',      '081234560020', null,                         'Jl. Puri Gading No. 14, Jimbaran',   510, 'JBR')
) as v(name, phone, email, address, points, branch);

-- ─── Promosi ─────────────────────────────────────────────────────────────────
insert into public.promotions (code, name, type, value, min_order, max_usage, valid_from, valid_to, is_active) values
  ('FIRST20',   'Diskon Pelanggan Baru',   'percent', 20,      0,  100, '2026-09-01', '2026-10-31', true),
  ('WEEKEND15', 'Promo Akhir Pekan',       'percent', 15,  50000,  500, '2026-01-01', '2026-12-31', true),
  ('HEMAT10K',  'Potongan Order Besar',    'fixed',   10000, 100000, 200, '2026-09-01', '2026-10-15', true),
  ('MEMBER10',  'Bonus Member',            'percent', 10,  30000, 1000, '2026-01-01', '2026-12-31', true),
  ('MERDEKA17', 'Spesial Hari Kemerdekaan','percent', 17,  25000,  100, '2026-08-10', '2026-08-20', true),
  ('NATAL2026', 'Promo Natal',             'percent', 20,  75000,  300, '2026-12-01', '2026-12-31', true);

-- ─── Inventaris per cabang aktif ─────────────────────────────────────────────
insert into public.inventory_items (branch_id, name, category, unit, current_stock, min_stock, reorder_point, unit_cost, supplier, last_restocked)
select b.id, i.name, i.category, i.unit,
       round(i.stock * f.factor), i.min_stock, i.reorder_point, i.unit_cost, i.supplier, current_date - i.days_ago
from (values ('DPS', 1.0), ('KTA', 0.8), ('JBR', 1.2)) as f(code, factor)
join public.branches b on b.code = f.code
cross join (values
  ('Deterjen Bubuk',        'Kimia',       'kg',    45,  20,  30,  18000, 'CV Bersih Sejahtera',   6),
  ('Pelembut Pakaian',      'Kimia',       'liter', 18,  15,  20,  24000, 'CV Bersih Sejahtera',  11),
  ('Pemutih',               'Kimia',       'liter', 12,  10,  15,  15000, 'CV Bersih Sejahtera',   9),
  ('Pelarut Dry Cleaning',  'Kimia',       'liter',  8,  10,  15,  95000, 'PT Kimia Nusantara',   16),
  ('Parfum Laundry',        'Kimia',       'liter',  5,   6,   8,  85000, 'PT Kimia Nusantara',   13),
  ('Plastik Kemasan',       'Kemasan',     'pak',   25,  10,  15,  22000, 'UD Plastik Jaya',       4),
  ('Hanger',                'Perlengkapan','pcs',  150, 100, 120,   1500, 'UD Plastik Jaya',      20),
  ('Label Nomor Order',     'Perlengkapan','roll',   6,   5,   8,  35000, 'UD Plastik Jaya',      14)
) as i(name, category, unit, stock, min_stock, reorder_point, unit_cost, supplier, days_ago)
where b.status = 'active';

-- ─── Order + item + pembayaran (±70 order, 30 hari terakhir) ─────────────────
do $$
declare
  v_branches uuid[];
  v_custs    uuid[];
  i int; j int; d int; n_items int;
  b uuid; c uuid; oid uuid;
  created timestamptz; st public.order_status;
  svc record; qty numeric; ot bigint; est_h int; roll double precision; done_at timestamptz;
begin
  perform setseed(0.42);   -- hasil seed dapat diulang
  select array_agg(id order by code) into v_branches from public.branches where status = 'active';
  select array_agg(id order by phone) into v_custs from public.customers;

  for i in 1..70 loop
    d       := floor(power(random(), 1.6) * 30)::int;            -- lebih banyak order baru daripada lama
    b       := v_branches[1 + floor(random() * array_length(v_branches, 1))::int];
    c       := v_custs[1 + floor(random() * array_length(v_custs, 1))::int];
    created := least(now(), date_trunc('day', now()) - make_interval(days => d)
                            + make_interval(hours => 8 + floor(random() * 11)::int, mins => floor(random() * 60)::int));

    if d >= 3 then
      st := case when random() < 0.95 then 'completed' else 'ready' end;
    elsif d >= 1 then
      st := (array['drying','ironing','ready','ready','completed'])[1 + floor(random() * 5)::int]::public.order_status;
    else
      st := (array['received','washing','washing','drying','ironing'])[1 + floor(random() * 5)::int]::public.order_status;
    end if;

    insert into public.orders (branch_id, customer_id, status, created_at, notes)
    values (b, c, st, created, case when random() < 0.15 then 'Mohon dilipat rapi' else null end)
    returning id into oid;

    n_items := 1 + floor(random() * 2.5)::int;                   -- 1..3 item
    for j in 1..n_items loop
      select * into svc from public.services where is_active order by random() limit 1;
      qty := case svc.unit
               when 'kg'     then round((1 + random() * 7)::numeric, 1)
               when 'pcs'    then (1 + floor(random() * 4))::numeric
               when 'pasang' then (1 + floor(random() * 2))::numeric
               else               round((2 + random() * 4)::numeric, 1)
             end;
      insert into public.order_items (order_id, service_id, quantity) values (oid, svc.id, qty);
    end loop;

    select max(s.est_hours) into est_h
      from public.order_items it join public.services s on s.id = it.service_id where it.order_id = oid;
    update public.orders set due_at = created + make_interval(hours => est_h) where id = oid;

    if random() < 0.12 then                                      -- sebagian order mendapat diskon 10%
      update public.orders set discount = (round(subtotal * 0.10 / 1000) * 1000)::bigint where id = oid;
    end if;

    select total into ot from public.orders where id = oid;

    if st = 'completed' then
      done_at := least(now(), created + make_interval(hours => est_h) + make_interval(mins => floor(random() * 240)::int));
      update public.orders set completed_at = done_at where id = oid;
      insert into public.payments (order_id, amount, method, paid_at)
      values (oid, ot, (array['cash','qris','transfer','cash','qris'])[1 + floor(random() * 5)::int]::public.payment_method, done_at);
    else
      roll := random();
      if roll >= 0.35 and roll < 0.75 then                       -- lunas
        insert into public.payments (order_id, amount, method, paid_at)
        values (oid, ot, (array['cash','qris','transfer'])[1 + floor(random() * 3)::int]::public.payment_method,
                least(now(), created + interval '30 minutes'));
      elsif roll >= 0.75 then                                    -- DP 50%
        insert into public.payments (order_id, amount, method, paid_at)
        values (oid, greatest((round(ot * 0.5 / 1000) * 1000)::bigint, 1000), 'cash', least(now(), created + interval '30 minutes'));
      end if;                                                    -- sisanya: belum bayar
    end if;
  end loop;
end $$;

-- Riwayat status realistis (menggantikan log otomatis satu-baris dari trigger saat seed)
truncate public.order_status_logs;
insert into public.order_status_logs (order_id, from_status, to_status, changed_at)
select o.id,
       lag(s.st) over (partition by o.id order by s.ord),
       s.st,
       least(now(), o.created_at + (s.ord - 1) * interval '45 minutes')
from public.orders o
cross join lateral unnest(enum_range(null::public.order_status)) with ordinality as s(st, ord)
where s.ord <= array_position(enum_range(null::public.order_status), o.status);
