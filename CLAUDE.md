# WashFlow Dashboard: Konteks Proyek

Baca file ini di awal sesi sebelum mengerjakan apa pun di repo ini.

## Apa ini

WashFlow adalah sistem manajemen laundry multi-cabang (dashboard Admin + Karyawan).
Proyek ini bagian dari portofolio **Digital Product Mang In**, tujuannya dua:
1. Portofolio yang menunjukkan alur bisnis nyata (bukan sekadar kumpulan halaman UI).
2. Basis untuk paket produk yang bisa dijual ke pemilik laundry (setup + otomasi WhatsApp via n8n).

UI/UX awal dibuat dengan **Figma Make**. Halaman-halamannya (`src/pages/`) dipakai sebagai
lapisan tampilan, data dan logikanya sedang dibangun ulang dari nol supaya sungguhan
berfungsi (bukan mock data statis).

## Model bisnis: single-tenant

**Satu deploy + satu project Supabase per klien laundry.** Jangan membangun arsitektur
multi-tenant (banyak laundry dalam satu aplikasi) kecuali diminta eksplisit, itu baru
masuk akal kalau sudah ada >5 klien membayar.

## Stack & alasan

- **Vite + React + TypeScript**, lanjutan langsung dari kode Figma Make, tanpa migrasi framework.
- **Supabase** (Postgres + Auth + Row Level Security + Realtime), database sungguhan
  tanpa perlu menulis server sendiri. Lebih cepat untuk solo developer dibanding Express + Postgres manual.
- **TanStack Query** + `supabase-js`, data fetching, cache, status loading/error. Pola: `features/<domain>/api.ts` (query Supabase, melempar error apa adanya) + `hooks.ts` (useQuery/useMutation, invalidasi cache) dan halaman hanya memakai hooks. Pesan error untuk pengguna lewat `pesanError()` di `src/lib/errors.ts`.
- **react-hook-form**, validasi form dengan aturan bawaan (`required`, `pattern`, `validate`) plus constraint database sebagai lapis terakhir. Zod belum dipakai; tambahkan hanya jika validasi bersama antar form mulai berulang. Catatan: field yang `disabled` tidak ikut terkirim oleh react-hook-form, jadi isi nilainya secara manual saat submit.
- **n8n**, otomasi WhatsApp saat status order berubah jadi "siap diambil". Ini fitur pembeda utama, bukan pelengkap.
- Styling: Tailwind CSS v4. Halaman warisan Figma Make memakai elemen HTML mentah + kelas Tailwind
  (belum memakai shadcn). `src/components/ui/` berisi 21 komponen shadcn yang disiapkan untuk form/tabel
  M1-M3; ganti elemen mentah dengan komponen ini **saat halaman terkait dikerjakan**, bukan sekaligus.
  Komponen shadcn lain ditambah sesuai kebutuhan: `npx shadcn@latest add <nama>`.

## Struktur folder

```
src/
  app/          bootstrap: App.tsx, router.tsx (halaman dimuat lazy, dijaga RequireRole)
  components/
    ui/         komponen shadcn (vendor, jangan diedit sembarangan)
    shared/     komponen buatan sendiri lintas fitur: MetricCard, Modal, StatusBadge, FormField, PageLoader
    layout/     AdminLayout, EmployeeLayout
  features/     satu folder per domain bisnis (auth, branches, services, staff sudah ada; orders, customers, ... diisi M3-M6)
                isi tipikal: api.ts (query Supabase), hooks.ts, schemas.ts (zod), types.ts, components/
  pages/        tipis, hanya merakit fitur menjadi halaman (admin/, employee/, LoginPage)
  lib/          utils.ts (cn), supabase.ts (client), nanti format.ts
  types/        database.ts, tipe Supabase (regenerasi: npm run db:types)
  data/         mockData.ts, sementara, dihapus bertahap
  styles/
docs/           spesifikasi awal (saas-product-spec.md, admin-employee-dashboard.md)
supabase/       migrations/ (skema, RLS, M2), seed.sql, demo-users.sql, functions/create-staff (Edge Function)
```

Aturan: logika bisnis hidup di `features/`, halaman dibuat setipis mungkin.

## Aturan kode

- Impor memakai alias `@/` (= `src/`), bukan path relatif `../../`.
- `npm run typecheck` harus tetap bersih (0 error) sebelum commit. TypeScript strict mode aktif.
- Jangan menambah dependency baru tanpa alasan jelas, banyak dependency Figma Make asli
  (MUI, react-dnd, react-slick, dll.) sudah dibuang karena tidak dipakai. Cek dulu dengan grep
  sebelum menambah package baru.
- File di `src/data/mockData.ts` adalah data contoh sementara. Setiap halaman yang masih
  mengimpor dari file ini adalah kandidat untuk dipindah ke query Supabase.
- Semua teks UI berbahasa Indonesia dan uang memakai Rupiah lewat `src/lib/format.ts` (`formatRupiah`, `formatTanggal`). Jangan menulis `$` atau `toFixed` untuk uang, dan hindari tanda pisah panjang di teks tampilan.

## Skema database (sudah diimplementasi di `supabase/migrations/`; bagian di bawah ringkasan)

- `branches`, cabang, jam buka, status.
- `profiles`, terhubung ke `auth.users`; kolom `role` (admin/employee), `branch_id`.
- `services`, nama layanan, satuan (kg/pcs/pasang), harga, estimasi durasi, aktif.
- `customers`, nama, no. WA (unik), poin member, tier.
- `orders`, kode order, customer, cabang, kasir, status, total, diskon, status bayar, `due_at`, `tracking_token`.
- `order_items`, satu order bisa berisi beberapa layanan.
- `order_status_logs`, riwayat perubahan status; ini yang memicu webhook n8n ke WA.
- `payments`, mendukung DP/pembayaran sebagian.
- `inventory_items` + `inventory_movements`, stok bahan per cabang.
- `promotions`, kode promo, tipe, nilai, periode.
- Laporan keuangan & komisi dihitung lewat **SQL view**, bukan disimpan sebagai kolom statis.
- Tracking publik pelanggan lewat RPC `get_order_by_token(token)`, jangan expose tabel `orders`
  langsung ke akses anonim.

## Roadmap

- [x] **M0**: Setup repo, pembersihan dependency, `tsconfig`, struktur folder.
- [x] **M0.5**: Restrukturisasi folder (feature-based), alias `@/`, hapus 26 komponen shadcn & 22 dependency tak terpakai, Modal/StatusBadge dibangun ulang di atas shadcn, lazy route.
- [x] **M1**: Skema Supabase + RLS per cabang + seed demo + login email/password + route guard per role. (Sign-up publik dimatikan; staf dibuat admin lewat Dashboard.)
- [x] **M2**: CRUD cabang, layanan, karyawan dari Supabase (TanStack Query, react-hook-form). Karyawan baru dibuat lewat Edge Function `create-staff` dan `reset-staff-password` (butuh deploy, lihat README).
- [ ] **M3**: Alur inti: cari/tambah pelanggan > order baru > kanban status > pembayaran > struk. *(Titik "layak dipamerkan" pertama.)*
  - [x] **M3a**: pelanggan (cari/tambah/ubah), order baru multi-layanan lewat RPC, pembayaran (lunas/DP/nanti + pembayaran susulan), struk cetak + tautan WhatsApp.
  - [ ] **M3b**: papan pesanan (kanban status) dan daftar pesanan nyata, dasbor karyawan dan ringkasan harian dari query, hapus `legacyBranchId`/mockData karyawan.
- [ ] **M4**: Dashboard & laporan dari query nyata (bukan angka statis), export CSV.
- [ ] **M5**: Halaman `/track/:token` publik + QR di struk, webhook n8n ke WA saat status "siap". *(Fitur pembeda utama.)*
- [ ] **M6**: Inventaris, promo, membership, komisi (menggantikan mock data terkait).
- [ ] **M7** Deploy, case study portofolio, dan penyempurnaan data demo. (Lokalisasi UI ke Bahasa Indonesia dan Rupiah sudah selesai lebih awal; sisa data mock akan diganti query Supabase per milestone.)

## Utang teknis yang diketahui (dari review awal)

- Chunk `recharts` ~385 KB (hanya dimuat halaman yang berisi grafik). Sudah dipecah per route; optimasi lanjutan opsional.
- Halaman masih memakai elemen HTML mentah (±78 `<button>`, ±66 input/select/table), migrasi ke komponen shadcn bertahap per fitur.

## Model keamanan (M1): wajib dipahami sebelum menambah fitur

- Frontend hanya memakai **publishable key** (`VITE_SUPABASE_PUBLISHABLE_KEY`). Secret/service_role key dan password database tidak boleh masuk repo maupun `.env.local`. `.env.local` tidak boleh di-commit.
- **RLS wajib aktif di setiap tabel baru** (`alter table ... enable row level security` + policy). Default privilege Supabase bisa memberi akses ke `anon`, jangan mengandalkan default.
- Role **tidak pernah** dibaca dari metadata sign-up; `handle_new_user` selalu membuat role `employee` tanpa cabang. Admin/cabang ditetapkan manual (`demo-users.sql`).
- Fungsi helper RLS (`is_staff`, `is_admin`, `my_branch_id`) ada di schema `private` (tidak terekspos Data API).
- Uang disimpan sebagai bigint Rupiah. Kolom uang di `orders` dilindungi trigger (klien tidak bisa memalsukan total/paid_amount); harga item di-snapshot dari `services` oleh trigger; `paid_amount`/`payment_status` dihitung dari `payments`.
- Celah diskon sembarang sudah ditutup di M3a: `orders`, `order_items`, dan `payments` tidak bisa di-insert dari client; pembuatan order dan diskon lewat RPC `create_order` (lihat Catatan M3a).
- `legacyBranchId` di `AuthContext` hanyalah jembatan sementara untuk halaman karyawan yang masih memakai mockData, hapus di M3b.
- Komponen shadcn `Input`/`Textarea` sudah diberi `forwardRef` (React 18) supaya cocok dengan `register()` react-hook-form. Komponen lain yang dipakai dengan `register` harus diperlakukan sama.

## Catatan M2

- Kolom `profiles.email` disalin dari `auth.users` oleh trigger dan **tidak bisa diubah dari Data API** (`grant update` per kolom). Kolom yang boleh diubah admin: `full_name, phone, role, branch_id, is_active, commission_rate, job_title`.
- Trigger `keep_one_active_admin` mencegah admin aktif terakhir dinonaktifkan, diturunkan, atau dihapus.
- Statistik cabang, layanan, dan karyawan (30 hari terakhir) dibaca dari view `branch_stats`, `service_stats`, `employee_stats` (`security_invoker`, jadi mengikuti RLS pemanggil). Jika menambah view baru, wajib `security_invoker = true` dan `revoke all ... from anon`.
- Membuat akun karyawan memerlukan hak admin Supabase Auth, sehingga dikerjakan Edge Function `create-staff` (secret key hanya ada di server). Fungsi memverifikasi JWT dan memeriksa role admin dari tabel `profiles`, bukan dari klaim token.
- Menghapus cabang yang punya pesanan ditolak database (FK); UI menyarankan status Tutup. Menghapus layanan aman karena `order_items` menyimpan snapshot nama dan harga.
- Jabatan (`job_title`) hanya label. Manajer resmi sebuah cabang adalah `branches.manager_id`.
- Kata sandi: semua pengguna bisa mengganti sendiri (menu profil, memverifikasi kata sandi lama lewat `signInWithPassword` lalu `updateUser`). Admin mengatur ulang kata sandi karyawan lewat Edge Function `reset-staff-password` (tidak bisa untuk akun sendiri). Belum ada: undangan lewat email dan lupa kata sandi lewat email (butuh SMTP; direncanakan sebelum demo ke klien).
- Header layout memakai `relative z-50` supaya menu profil/notifikasi di atas overlay penutup (z-40). Jangan menurunkannya.

## Catatan M3a

- **Semua penulisan order lewat fungsi database**: `quote_order` (pratinjau harga), `create_order`, `record_payment`. Fungsinya `security definer`, memeriksa peran dan cabang pemanggil, dan `revoke ... from public, anon` (default Supabase memberi execute ke anon, jangan mengandalkannya). Tabel `orders`/`order_items`/`payments` tidak punya grant insert untuk `authenticated`; `orders` hanya bisa di-update kolom `status` dan `notes`.
- **Aturan diskon**: dipilih SATU yang terbesar antara diskon promo dan diskon tingkat member (tidak digabung). Perhitungan hanya ada di `private.price_order`; UI hanya menampilkan hasil `quote_order`. Kuota promo (`max_usage`) dihitung dari jumlah order ber-`promo_id`, belum dikunci terhadap order bersamaan (cukup untuk skala satu laundry).
- **Idempotensi**: `create_order` menerima `p_client_key` (uuid dari client). Kunci sama dari kasir sama mengembalikan order yang sudah ada, jadi klik ganda atau koneksi putus tidak membuat order ganda.
- **Status order**: tahap awal sampai Siap bebas maju/mundur; Selesai hanya dari Siap dan hanya jika lunas (trigger `orders_status_rules`, tidak berlaku untuk skrip SQL role postgres).
- **Nomor WhatsApp** dinormalkan trigger ke format lokal (`+62812...` menjadi `0812...`); tautan `wa.me` diubah kembali oleh `src/lib/whatsapp.ts`.
- Statistik pelanggan lewat view `customer_stats` (`security_invoker`): karyawan hanya melihat angka dari cabangnya.
- Struk dicetak dengan `window.print()`; layout memakai varian `print:` Tailwind untuk menyembunyikan sidebar dan tombol. QR tracking menyusul di M5.
- Pola RPC di frontend: argumen bertipe `type` (bukan `interface`) supaya cocok dengan tipe `Json` dari Supabase.
