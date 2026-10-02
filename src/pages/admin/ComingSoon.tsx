import { Hammer } from 'lucide-react';
import { useLocation } from 'react-router';

const HALAMAN: Record<string, { judul: string; isi: string }> = {
  inventory: { judul: 'Inventaris', isi: 'Pencatatan stok bahan dan perlengkapan per cabang.' },
};

/** Pengganti halaman yang belum tersambung ke database (sebelumnya menampilkan data contoh palsu). */
export default function ComingSoon() {
  const key = useLocation().pathname.split('/').filter(Boolean).pop() ?? '';
  const h = HALAMAN[key] ?? { judul: 'Halaman ini', isi: '' };
  return (
    <div className="space-y-6" data-coming-soon>
      <h1 className="text-slate-900">{h.judul}</h1>
      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
        <Hammer className="mx-auto h-8 w-8 text-slate-400" />
        <p className="mt-3 font-semibold text-slate-800">Segera hadir</p>
        <p className="mt-1 text-sm text-slate-500">{h.isi} Fitur ini belum tersedia, jadi tidak ada data yang ditampilkan.</p>
      </div>
    </div>
  );
}
