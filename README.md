# WashFlow Dashboard

Sistem manajemen laundry multi-cabang — dashboard Admin dan Karyawan untuk order, cabang, layanan, inventaris, laporan keuangan, komisi, dan membership.

Bagian portofolio **Digital Product Mang In**.

## Status proyek

🚧 **UI/UX prototype** (hasil desain di Figma Make) sedang dikembangkan menjadi aplikasi nyata dengan database (Supabase) dan alur data yang fungsional. Lihat `CLAUDE.md` untuk konteks dan roadmap lengkap.

## Stack

- React 18 + TypeScript + Vite
- Tailwind CSS v4 + shadcn/ui (Radix UI) untuk komponen form/tabel
- react-router, react-hook-form, recharts
- Supabase (Postgres, Auth, RLS) — akan diintegrasikan mulai milestone M1

## Menjalankan secara lokal

```bash
npm install
npm run dev
```

Perintah lain:

```bash
npm run build       # build produksi
npm run typecheck   # cek tipe TypeScript tanpa build
npm run preview     # preview hasil build
```

## Struktur folder

```
src/
  app/          bootstrap (App.tsx, router.ts)
  components/   ui/ (shadcn) · shared/ (komponen buatan sendiri) · layout/
  features/     logika per domain bisnis (diisi bertahap)
  pages/        halaman admin/ dan employee/
  lib/          utilitas
  data/         mockData.ts — sementara, akan digantikan Supabase
  styles/
docs/           spesifikasi awal
supabase/       migrasi & seed database (ditambahkan di M1)
```

Impor memakai alias `@/` (= `src/`).

## Kredit

Komponen UI dibangun dari [shadcn/ui](https://ui.shadcn.com/) (lisensi MIT).
