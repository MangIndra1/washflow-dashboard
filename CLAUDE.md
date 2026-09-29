# WashFlow Dashboard — Konteks Proyek

Baca file ini di awal sesi sebelum mengerjakan apa pun di repo ini.

## Apa ini

WashFlow adalah sistem manajemen laundry multi-cabang (dashboard Admin + Karyawan).
Proyek ini bagian dari portofolio **Digital Product Mang In** — tujuannya dua:
1. Portofolio yang menunjukkan alur bisnis nyata (bukan sekadar kumpulan halaman UI).
2. Basis untuk paket produk yang bisa dijual ke pemilik laundry (setup + otomasi WhatsApp via n8n).

UI/UX awal dibuat dengan **Figma Make**. Halaman-halamannya (`src/pages/`) dipakai sebagai
lapisan tampilan — data dan logikanya sedang dibangun ulang dari nol supaya sungguhan
berfungsi (bukan mock data statis).

## Model bisnis: single-tenant

**Satu deploy + satu project Supabase per klien laundry.** Jangan membangun arsitektur
multi-tenant (banyak laundry dalam satu aplikasi) kecuali diminta eksplisit — itu baru
masuk akal kalau sudah ada >5 klien membayar.

## Stack & alasan

- **Vite + React + TypeScript** — lanjutan langsung dari kode Figma Make, tanpa migrasi framework.
- **Supabase** (Postgres + Auth + Row Level Security + Realtime) — database sungguhan
  tanpa perlu menulis server sendiri. Lebih cepat untuk solo developer dibanding Express + Postgres manual.
- **TanStack Query** + `supabase-js` — data fetching, cache, status loading/error.
- **react-hook-form + zod** — validasi form (order, nomor HP, berat).
- **n8n** — otomasi WhatsApp saat status order berubah jadi "siap diambil". Ini fitur pembeda utama, bukan pelengkap.
- Styling: Tailwind CSS v4. Halaman warisan Figma Make memakai elemen HTML mentah + kelas Tailwind
  (belum memakai shadcn). `src/components/ui/` berisi 21 komponen shadcn yang disiapkan untuk form/tabel
  M1–M3; ganti elemen mentah dengan komponen ini **saat halaman terkait dikerjakan**, bukan sekaligus.
  Komponen shadcn lain ditambah sesuai kebutuhan: `npx shadcn@latest add <nama>`.

## Struktur folder

```
src/
  app/          bootstrap: App.tsx, router.tsx (halaman dimuat lazy, dijaga RequireRole)
  components/
    ui/         komponen shadcn (vendor — jangan diedit sembarangan)
    shared/     komponen buatan sendiri lintas fitur: MetricCard, Modal, StatusBadge, FormField, PageLoader
    layout/     AdminLayout, EmployeeLayout
  features/     satu folder per domain bisnis (auth sudah ada; orders, customers, ... diisi M1–M6)
                isi tipikal: api.ts (query Supabase), hooks.ts, schemas.ts (zod), types.ts, components/
  pages/        tipis — hanya merakit fitur menjadi halaman (admin/, employee/, LoginPage)
  lib/          utils.ts (cn), supabase.ts (client), nanti format.ts
  types/        database.ts — tipe Supabase (regenerasi: npm run db:types)
  data/         mockData.ts — sementara, dihapus bertahap
  styles/
docs/           spesifikasi awal (saas-product-spec.md, admin-employee-dashboard.md)
supabase/       migrations/ (skema, RLS), seed.sql, demo-users.sql
```

Aturan: logika bisnis hidup di `features/`, halaman dibuat setipis mungkin.

## Aturan kode

- Impor memakai alias `@/` (= `src/`), bukan path relatif `../../`.
- `npm run typecheck` harus tetap bersih (0 error) sebelum commit. TypeScript strict mode aktif.
- Jangan menambah dependency baru tanpa alasan jelas — banyak dependency Figma Make asli
  (MUI, react-dnd, react-slick, dll.) sudah dibuang karena tidak dipakai. Cek dulu dengan grep
  sebelum menambah package baru.
- File di `src/app/data/mockData.ts` adalah data contoh sementara. Setiap halaman yang masih
  mengimpor dari file ini adalah kandidat untuk dipindah ke query Supabase.
- Pertahankan bahasa Indonesia untuk UI-facing text begitu lokalisasi (M7) mulai dikerjakan;
  untuk sekarang UI masih berbahasa Inggris (warisan Figma Make), belum perlu diterjemahkan
  kecuali sedang mengerjakan milestone M7.

## Skema database (sudah diimplementasi di `supabase/migrations/`; bagian di bawah ringkasan)

- `branches` — cabang, jam buka, status.
- `profiles` — terhubung ke `auth.users`; kolom `role` (admin/employee), `branch_id`.
- `services` — nama layanan, satuan (kg/pcs/pasang), harga, estimasi durasi, aktif.
- `customers` — nama, no. WA (unik), poin member, tier.
- `orders` — kode order, customer, cabang, kasir, status, total, diskon, status bayar, `due_at`, `tracking_token`.
- `order_items` — satu order bisa berisi beberapa layanan.
- `order_status_logs` — riwayat perubahan status; ini yang memicu webhook n8n → WA.
- `payments` — mendukung DP/pembayaran sebagian.
- `inventory_items` + `inventory_movements` — stok bahan per cabang.
- `promotions` — kode promo, tipe, nilai, periode.
- Laporan keuangan & komisi dihitung lewat **SQL view**, bukan disimpan sebagai kolom statis.
- Tracking publik pelanggan lewat RPC `get_order_by_token(token)` — jangan expose tabel `orders`
  langsung ke akses anonim.

## Roadmap

- [x] **M0** — Setup repo, pembersihan dependency, `tsconfig`, struktur folder.
- [x] **M0.5** — Restrukturisasi folder (feature-based), alias `@/`, hapus 26 komponen shadcn & 22 dependency tak terpakai, Modal/StatusBadge dibangun ulang di atas shadcn, lazy route.
- [x] **M1** — Skema Supabase + RLS per cabang + seed demo + login email/password + route guard per role. (Sign-up publik dimatikan; staf dibuat admin lewat Dashboard.)
- [ ] **M2** — CRUD cabang, layanan, karyawan (menggantikan mock data di halaman admin terkait).
- [ ] **M3** — Alur inti: cari/tambah pelanggan → order baru → kanban status → pembayaran → struk. *(Titik "layak dipamerkan" pertama.)*
- [ ] **M4** — Dashboard & laporan dari query nyata (bukan angka statis), export CSV.
- [ ] **M5** — Halaman `/track/:token` publik + QR di struk, webhook n8n → WA saat status "siap". *(Fitur pembeda utama.)*
- [ ] **M6** — Inventaris, promo, membership, komisi (menggantikan mock data terkait).
- [ ] **M7** — Lokalisasi penuh ke Bahasa Indonesia + Rupiah, data demo Indonesia, deploy, case study.

## Utang teknis yang diketahui (dari review awal)

- Chunk `recharts` ~385 KB (hanya dimuat halaman yang berisi grafik). Sudah dipecah per route; optimasi lanjutan opsional.
- Halaman masih memakai elemen HTML mentah (±78 `<button>`, ±66 input/select/table) — migrasi ke komponen shadcn bertahap per fitur.
- Mata uang & bahasa masih Inggris/USD (warisan Figma Make) — dijadwalkan di M7, jangan
  dikerjakan lebih awal supaya tidak bentrok dengan perubahan struktur data di M1–M3.

## Model keamanan (M1) — wajib dipahami sebelum menambah fitur

- Frontend hanya memakai **publishable key** (`VITE_SUPABASE_PUBLISHABLE_KEY`). Secret/service_role key dan password database tidak boleh masuk repo maupun `.env.local`. `.env.local` tidak boleh di-commit.
- **RLS wajib aktif di setiap tabel baru** (`alter table ... enable row level security` + policy). Default privilege Supabase bisa memberi akses ke `anon` — jangan mengandalkan default.
- Role **tidak pernah** dibaca dari metadata sign-up; `handle_new_user` selalu membuat role `employee` tanpa cabang. Admin/cabang ditetapkan manual (`demo-users.sql`).
- Fungsi helper RLS (`is_staff`, `is_admin`, `my_branch_id`) ada di schema `private` (tidak terekspos Data API).
- Uang disimpan sebagai bigint Rupiah. Kolom uang di `orders` dilindungi trigger (klien tidak bisa memalsukan total/paid_amount); harga item di-snapshot dari `services` oleh trigger; `paid_amount`/`payment_status` dihitung dari `payments`.
- **Celah yang diketahui:** karyawan masih bisa mengisi `discount` sembarang pada order. Rencana M3: pindahkan pembuatan order + diskon ke RPC yang memvalidasi (promo/tier).
- `legacyBranchId` di `AuthContext` hanyalah jembatan sementara untuk halaman karyawan yang masih memakai mockData — hapus di M3.
- Komponen shadcn `Input`/`Textarea` sudah diberi `forwardRef` (React 18) supaya cocok dengan `register()` react-hook-form. Komponen lain yang dipakai dengan `register` harus diperlakukan sama.
