# WashFlow Dashboard — Konteks Proyek

Baca file ini di awal sesi sebelum mengerjakan apa pun di repo ini.

## Apa ini

WashFlow adalah sistem manajemen laundry multi-cabang (dashboard Admin + Karyawan).
Proyek ini bagian dari portofolio **Digital Product Mang In** — tujuannya dua:
1. Portofolio yang menunjukkan alur bisnis nyata (bukan sekadar kumpulan halaman UI).
2. Basis untuk paket produk yang bisa dijual ke pemilik laundry (setup + otomasi WhatsApp via n8n).

UI/UX awal dibuat dengan **Figma Make** dan sudah diekstrak ke `src/app/`. Kode itu
dipakai sebagai lapisan tampilan — data dan logikanya sedang dibangun ulang dari nol
supaya sungguhan berfungsi (bukan mock data statis).

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
- Styling: Tailwind CSS v4 + shadcn/ui (Radix UI). Jangan ganti design system ini.

## Aturan kode

- `npm run typecheck` harus tetap bersih (0 error) sebelum commit. TypeScript strict mode aktif.
- Jangan menambah dependency baru tanpa alasan jelas — banyak dependency Figma Make asli
  (MUI, react-dnd, react-slick, dll.) sudah dibuang karena tidak dipakai. Cek dulu dengan grep
  sebelum menambah package baru.
- File di `src/app/data/mockData.ts` adalah data contoh sementara. Setiap halaman yang masih
  mengimpor dari file ini adalah kandidat untuk dipindah ke query Supabase.
- Pertahankan bahasa Indonesia untuk UI-facing text begitu lokalisasi (M7) mulai dikerjakan;
  untuk sekarang UI masih berbahasa Inggris (warisan Figma Make), belum perlu diterjemahkan
  kecuali sedang mengerjakan milestone M7.

## Skema database (draf — akan diverifikasi ulang saat M1)

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
- [ ] **M1** — Project Supabase + migrasi SQL skema di atas, login email/password, RLS per cabang, route guard per role.
- [ ] **M2** — CRUD cabang, layanan, karyawan (menggantikan mock data di halaman admin terkait).
- [ ] **M3** — Alur inti: cari/tambah pelanggan → order baru → kanban status → pembayaran → struk. *(Titik "layak dipamerkan" pertama.)*
- [ ] **M4** — Dashboard & laporan dari query nyata (bukan angka statis), export CSV.
- [ ] **M5** — Halaman `/track/:token` publik + QR di struk, webhook n8n → WA saat status "siap". *(Fitur pembeda utama.)*
- [ ] **M6** — Inventaris, promo, membership, komisi (menggantikan mock data terkait).
- [ ] **M7** — Lokalisasi penuh ke Bahasa Indonesia + Rupiah, data demo Indonesia, deploy, case study.

## Utang teknis yang diketahui (dari review awal)

- Bundle JS satu chunk ~868 KB — perlu code splitting (`React.lazy` per route) sebelum rilis.
- Login saat ini hanya tombol tanpa password — akan diganti Supabase Auth di M1.
- Mata uang & bahasa masih Inggris/USD (warisan Figma Make) — dijadwalkan di M7, jangan
  dikerjakan lebih awal supaya tidak bentrok dengan perubahan struktur data di M1–M3.
