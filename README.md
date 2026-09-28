# WashFlow Dashboard

Sistem manajemen laundry multi-cabang — dashboard Admin dan Karyawan untuk order, cabang, layanan, inventaris, laporan keuangan, komisi, dan membership.

Bagian portofolio **Digital Product Mang In**.

## Status proyek

🚧 **UI/UX prototype** (hasil desain di Figma Make) sedang dikembangkan menjadi aplikasi nyata dengan database (Supabase) dan alur data yang fungsional. Lihat `CLAUDE.md` untuk konteks dan roadmap lengkap.

## Stack

- React 18 + TypeScript + Vite
- Tailwind CSS v4 + shadcn/ui (Radix UI)
- react-router, react-hook-form + zod, recharts
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
  app/
    components/   # layout (AdminLayout, EmployeeLayout) + komponen ui (shadcn)
    pages/         # halaman per role (admin/, employee/, LoginPage)
    context/       # AuthContext
    data/          # mockData.ts — data contoh, akan digantikan Supabase
    routes.ts      # definisi route
    App.tsx
  styles/
supabase/          # migrasi & skema database (ditambahkan di M1)
```

## Kredit

Komponen UI dibangun dari [shadcn/ui](https://ui.shadcn.com/) (lisensi MIT).
