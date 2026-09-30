import { useEffect } from 'react';
import { useParams } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { Check, MapPin, Phone } from 'lucide-react';

import { Logo } from '@/components/shared/Logo';
import { PaymentInstructions } from '@/features/payment-info/PaymentInstructions';
import { STATUS_LABEL, STATUS_ORDER } from '@/features/orders/api';
import { fetchTracking } from '@/features/tracking/api';
import { formatAngka, formatRupiah, formatTanggalJam } from '@/lib/format';

const PESAN_STATUS: Record<string, string> = {
  received: 'Cucian Anda sudah kami terima.',
  washing: 'Cucian Anda sedang dicuci.',
  drying: 'Cucian Anda sedang dikeringkan.',
  ironing: 'Cucian Anda sedang disetrika.',
  ready: 'Cucian Anda sudah siap diambil.',
  completed: 'Pesanan selesai. Terima kasih.',
};

/** Halaman publik untuk pelanggan (tanpa login). Data hanya lewat fungsi database track_order. */
export default function TrackPage() {
  const { token = '' } = useParams();
  const { data, isPending, isError, refetch } = useQuery({
    queryKey: ['track', token], queryFn: () => fetchTracking(token), refetchInterval: 30_000, retry: 1,
  });

  useEffect(() => {
    if (document.querySelector('meta[name="robots"][content*="noindex"]')) return;
    const meta = document.createElement('meta');
    meta.name = 'robots'; meta.content = 'noindex, nofollow';
    document.head.appendChild(meta);
    return () => { meta.remove(); };
  }, []);

  const shell = (children: React.ReactNode) => (
    <div className="min-h-screen bg-slate-50 py-6 px-4">
      <div className="mx-auto w-full max-w-md">
        <div className="flex items-center justify-center gap-2 mb-4 text-slate-700">
          <Logo size={32} />
          <span className="font-semibold">WashFlow</span>
        </div>
        {children}
      </div>
    </div>
  );

  if (isPending) return shell(<div className="h-96 animate-pulse rounded-2xl bg-white border border-slate-200" role="status" aria-label="Memuat pesanan" />);
  if (isError) {
    return shell(
      <div role="alert" className="rounded-2xl bg-white border border-red-100 p-6 text-center">
        <p className="text-sm text-red-700 mb-3">Data tidak dapat dimuat. Periksa koneksi Anda.</p>
        <button onClick={() => void refetch()} className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">Coba lagi</button>
      </div>,
    );
  }
  if (!data) {
    return shell(
      <div className="rounded-2xl bg-white border border-slate-200 p-6 text-center" data-not-found>
        <p className="font-semibold text-slate-900 mb-1">Pesanan tidak ditemukan</p>
        <p className="text-sm text-slate-500">Tautan ini tidak valid. Pindai ulang QR pada struk Anda atau hubungi laundry.</p>
      </div>,
    );
  }

  const idx = STATUS_ORDER.indexOf(data.status);
  const at = new Map(data.timeline.map((t) => [t.status, t.at]));
  const sisa = Math.max(0, data.total - data.paid_amount);

  return shell(
    <div className="space-y-4">
      <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-slate-900 p-5 text-center">
          <p className="text-slate-400 text-xs">{data.branch?.name}</p>
          <p className="text-white font-mono font-bold text-xl mt-1" data-track-code>{data.code}</p>
          <p className="text-emerald-300 text-sm mt-2" data-track-message>
            {data.customer_first_name ? `Halo ${data.customer_first_name}. ` : ''}{PESAN_STATUS[data.status]}
          </p>
        </div>
        <div className="p-5">
          <ol className="space-y-3" data-track-steps>
            {STATUS_ORDER.map((s, i) => {
              const done = i < idx || (data.status === 'completed' && i <= idx);
              const current = i === idx && data.status !== 'completed';
              return (
                <li key={s} className="flex items-start gap-3" data-step={s} data-state={done ? 'done' : current ? 'current' : 'todo'}>
                  <div className={`mt-0.5 h-6 w-6 rounded-full flex items-center justify-center flex-shrink-0 ${done ? 'bg-emerald-600' : current ? 'bg-emerald-100 ring-2 ring-emerald-500' : 'bg-slate-100'}`}>
                    {done ? <Check className="h-3.5 w-3.5 text-white" /> : current ? <div className="h-2 w-2 rounded-full bg-emerald-600" /> : null}
                  </div>
                  <div className="min-w-0">
                    <p className={`text-sm ${done || current ? 'font-semibold text-slate-900' : 'text-slate-400'}`}>{STATUS_LABEL[s]}</p>
                    {at.get(s) && (done || current) && <p className="text-xs text-slate-400">{formatTanggalJam(at.get(s)!)}</p>}
                  </div>
                </li>
              );
            })}
          </ol>
          {data.status !== 'completed' && data.due_at && (
            <p className="mt-4 pt-4 border-t border-slate-100 text-sm text-slate-600">Estimasi selesai: <span className="font-semibold text-slate-900">{formatTanggalJam(data.due_at)}</span></p>
          )}
        </div>
      </div>

      <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-5">
        <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Rincian</p>
        <div className="space-y-2">
          {data.items.map((i, k) => (
            <div key={k} className="flex justify-between gap-3 text-sm">
              <div className="min-w-0">
                <p className="text-slate-800">{i.service_name}</p>
                <p className="text-xs text-slate-400">{formatAngka(Number(i.quantity))} {i.unit}</p>
              </div>
              <span className="font-medium text-slate-900 flex-shrink-0">{formatRupiah(i.line_total)}</span>
            </div>
          ))}
        </div>
        <div className="mt-3 pt-3 border-t border-slate-100 space-y-1.5 text-sm">
          {data.discount > 0 && <div className="flex justify-between text-emerald-700"><span>{data.discount_label ?? 'Diskon'}</span><span>-{formatRupiah(data.discount)}</span></div>}
          <div className="flex justify-between"><span className="font-semibold text-slate-900">Total</span><span className="font-bold text-slate-900" data-track-total>{formatRupiah(data.total)}</span></div>
          <div className="flex justify-between">
            <span className="text-slate-600">{sisa > 0 ? 'Sisa tagihan' : 'Pembayaran'}</span>
            {sisa > 0 ? <span className="font-bold text-red-600" data-track-sisa>{formatRupiah(sisa)}</span> : <span className="font-bold text-emerald-700" data-track-sisa>Lunas</span>}
          </div>
        </div>
      </div>

      {sisa > 0 && data.payment_info && (
        <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-5" data-track-payment>
          <p className="text-xs font-semibold text-slate-500 uppercase mb-3">Cara membayar</p>
          <PaymentInstructions info={data.payment_info} />
          <p className="text-xs text-slate-400 mt-3">Setelah membayar, tunjukkan bukti pembayaran kepada kasir saat mengambil cucian.</p>
        </div>
      )}

      {(data.branch?.address || data.branch?.phone) && (
        <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-5 space-y-2 text-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase">Hubungi kami</p>
          {data.branch.address && <p className="flex items-start gap-2 text-slate-600"><MapPin className="h-4 w-4 mt-0.5 text-slate-400 flex-shrink-0" />{data.branch.address}</p>}
          {data.branch.phone && <a href={`tel:${data.branch.phone.replace(/[^\d+]/g, '')}`} className="flex items-center gap-2 text-emerald-700 hover:underline"><Phone className="h-4 w-4" />{data.branch.phone}</a>}
        </div>
      )}
      <p className="text-center text-xs text-slate-400">Halaman ini diperbarui otomatis.</p>
    </div>,
  );
}
