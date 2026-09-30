# WashFlow Dashboard

Sistem manajemen laundry multi-cabang, dashboard Admin dan Karyawan untuk order, cabang, layanan, inventaris, laporan keuangan, komisi, dan membership.

Bagian portofolio **Digital Product Mang In**.

## Status proyek

**Dalam pengembangan.** UI/UX dari Figma Make sedang dihubungkan ke database sungguhan. Selesai: skema database + RLS + login Supabase + route guard per role (M1). Halaman lain masih memakai data contoh sementara. Lihat `CLAUDE.md` untuk konteks dan roadmap lengkap.

## Stack

- React 18 + TypeScript + Vite
- Tailwind CSS v4 + shadcn/ui (Radix UI) untuk komponen form/tabel
- react-router, react-hook-form, recharts
- Supabase (Postgres, Auth, Row Level Security), skema di `supabase/migrations/`

## Menjalankan secara lokal

1. `npm install`
2. Salin `.env.example` menjadi `.env.local`, isi `VITE_SUPABASE_URL` dan `VITE_SUPABASE_PUBLISHABLE_KEY` (hanya publishable key; **jangan** pernah memasukkan secret/service_role key).
3. Siapkan database (sekali saja):

```bash
npx supabase login
npx supabase link --project-ref <project-ref>
npx supabase db push --include-seed   # skema + RLS + tingkat keanggotaan bawaan (tanpa data contoh)
```

4. Buat admin pertama: di Dashboard Supabase buka Authentication > Users > Add user (centang Auto Confirm User), lalu ganti email di `supabase/bootstrap-admin.sql` dan jalankan di SQL Editor. Setelah login, buat cabang, layanan, dan karyawan lewat aplikasi.

   Untuk project demo/portofolio dengan data contoh, jalankan `supabase/demo/seed.sql` lalu `supabase/demo/demo-users.sql` (bukan untuk klien). Untuk membersihkan project yang sudah terlanjur berisi data demo, pakai `supabase/clean-demo-data.sql` (baca komentar di dalamnya dulu; tidak bisa dibatalkan).
5. Deploy dua Edge Function untuk akun karyawan (sekali saja, setelah `link`; ulangi bila kodenya berubah):

```bash
npx supabase functions deploy create-staff --no-verify-jwt --use-api
npx supabase functions deploy reset-staff-password --no-verify-jwt --use-api
```

   Kedua fungsi memeriksa sendiri bahwa pemanggilnya admin aktif. Tanpa deploy ini, tombol Tambah Karyawan dan Atur Ulang Kata Sandi akan menampilkan pesan bahwa fungsi belum di-deploy; mengubah karyawan yang sudah ada tetap berfungsi.
6. `npm run dev`

Perintah lain:

```bash
npm run build       # build produksi
npm run typecheck   # cek tipe TypeScript tanpa build
npm run preview     # preview hasil build
npm run db:types    # regenerasi src/types/database.ts dari database (jalankan di Git Bash)
```

## Struktur folder

```
src/
  app/          bootstrap (App.tsx, router.tsx)
  components/   ui/ (shadcn), shared/ (komponen buatan sendiri), layout/
  features/     logika per domain bisnis (auth sudah ada; sisanya bertahap)
  pages/        halaman admin/ dan employee/
  lib/          utilitas, supabase.ts (client)
  types/        database.ts (tipe hasil generate dari skema)
  data/         mockData.ts, sementara, akan digantikan Supabase
  styles/
docs/           spesifikasi awal
supabase/       migrations/ (skema + RLS), seed.sql (bersih), bootstrap-admin.sql, clean-demo-data.sql, demo/ (data contoh)
```

Impor memakai alias `@/` (= `src/`).

## Kredit

Komponen UI dibangun dari [shadcn/ui](https://ui.shadcn.com/) (lisensi MIT).
