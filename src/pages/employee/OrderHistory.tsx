import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';

import { EmptyState, ErrorPanel, TableSkeleton } from '@/components/shared/QueryStatus';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { HISTORY_PAGE_SIZE, STATUS_LABEL, STATUS_ORDER, type HistoryQuery } from '@/features/orders/api';
import { OrderDetailSheet } from '@/features/orders/OrderDetailSheet';
import { useOrderHistory } from '@/features/orders/hooks';
import { PERIOD_LABEL, resolvePeriod, type PeriodKey } from '@/features/orders/period';
import { pesanError } from '@/lib/errors';
import { formatRupiah, formatTanggalJam } from '@/lib/format';
import { useDebounced } from '@/lib/useDebounced';

type RangeKey = 'all' | PeriodKey;

const field = 'rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm';

/** Semua pesanan (termasuk yang sudah lama selesai) dengan pencarian, filter, dan halaman. */
export default function OrderHistory() {
  const [params] = useSearchParams();
  const [search, setSearch] = useState(params.get('q') ?? '');
  const [status, setStatus] = useState<HistoryQuery['status']>('completed');
  const [payment, setPayment] = useState<HistoryQuery['payment']>('all');
  const [range, setRange] = useState<RangeKey>('all');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [page, setPage] = useState(0);
  const [detailId, setDetailId] = useState<string | null>(null);

  const q = useDebounced(search, 350);
  const period = useMemo(() => (range === 'all' ? null : resolvePeriod(range, customFrom, customTo)), [range, customFrom, customTo]);
  const rangeInvalid = range === 'custom' && !period;

  const query: HistoryQuery = { q, status, payment, from: period?.from ?? '', to: period?.to ?? '', page };
  const history = useOrderHistory(query);
  const rows = history.data?.rows ?? [];
  const count = history.data?.count ?? 0;
  const pages = Math.max(1, Math.ceil(count / HISTORY_PAGE_SIZE));

  // Setiap perubahan filter kembali ke halaman pertama.
  const reset = <T,>(set: (v: T) => void) => (v: T) => { set(v); setPage(0); };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-slate-900">Riwayat Pesanan</h1>
        <p className="text-slate-500 text-sm mt-1">Semua pesanan cabang ini, termasuk yang sudah lama selesai. Klik baris untuk melihat detail.</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-56 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            placeholder="Cari kode, nama, atau nomor" aria-label="Cari riwayat pesanan" value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-slate-200 bg-white text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
          />
        </div>
        <select aria-label="Filter status" className={field} value={status} onChange={(e) => reset(setStatus)(e.target.value as HistoryQuery['status'])}>
          <option value="all">Semua Status</option>
          {STATUS_ORDER.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
        </select>
        <select aria-label="Filter pembayaran" className={field} value={payment} onChange={(e) => reset(setPayment)(e.target.value as HistoryQuery['payment'])}>
          <option value="all">Semua Pembayaran</option>
          <option value="paid">Lunas</option>
          <option value="unpaid">Belum Bayar</option>
          <option value="partial">Sebagian</option>
        </select>
        <select aria-label="Filter tanggal" className={field} value={range} onChange={(e) => reset(setRange)(e.target.value as RangeKey)}>
          <option value="all">Semua waktu</option>
          {(['today', 'yesterday', 'last7', 'thisMonth', 'lastMonth', 'custom'] as PeriodKey[]).map((k) => <option key={k} value={k}>{PERIOD_LABEL[k]}</option>)}
        </select>
        {range === 'custom' && (
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <input type="date" aria-label="Tanggal mulai" className={field} value={customFrom} onChange={(e) => reset(setCustomFrom)(e.target.value)} />
            <span>sampai</span>
            <input type="date" aria-label="Tanggal akhir" className={field} value={customTo} onChange={(e) => reset(setCustomTo)(e.target.value)} />
          </div>
        )}
      </div>
      {rangeInvalid && <p className="text-xs text-amber-700" data-range-hint>Isi tanggal mulai dan akhir dengan benar (akhir tidak boleh sebelum mulai). Filter tanggal belum dipakai.</p>}
      <p className="text-xs text-slate-400">Tanggal mengacu pada waktu pesanan dibuat.</p>

      {history.isError ? (
        <ErrorPanel message={pesanError(history.error, 'Gagal memuat riwayat pesanan.')} onRetry={() => void history.refetch()} />
      ) : history.isPending ? (
        <div className="rounded-xl border border-slate-200 bg-white"><TableSkeleton /></div>
      ) : rows.length === 0 ? (
        <EmptyState title="Tidak ada pesanan yang cocok" hint="Ubah kata kunci atau filter." />
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-x-auto" data-history-table>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3 font-semibold">Kode</th>
                <th className="px-4 py-3 font-semibold">Pelanggan</th>
                <th className="px-4 py-3 font-semibold">Dibuat</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Pembayaran</th>
                <th className="px-4 py-3 font-semibold text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {rows.map((o) => (
                <tr key={o.id} data-history-row={o.code} onClick={() => setDetailId(o.id)} className="cursor-pointer hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <button type="button" aria-label={`Detail ${o.code}`} onClick={(e) => { e.stopPropagation(); setDetailId(o.id); }} className="font-mono text-xs font-semibold text-slate-600 hover:text-emerald-700 hover:underline">{o.code}</button>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-900">{o.customer?.name ?? 'Pelanggan dihapus'}</p>
                    <p className="text-xs text-slate-400">{o.customer?.phone ?? '-'}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{formatTanggalJam(o.created_at)}</td>
                  <td className="px-4 py-3"><StatusBadge status={o.status} size="sm" /></td>
                  <td className="px-4 py-3"><StatusBadge status={o.payment_status} size="sm" /></td>
                  <td className="px-4 py-3 text-right font-medium text-slate-900 whitespace-nowrap">{formatRupiah(o.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!history.isError && count > 0 && (
        <div className="flex items-center justify-between text-sm text-slate-500" data-history-pager>
          <span>{page * HISTORY_PAGE_SIZE + 1} sampai {Math.min(count, (page + 1) * HISTORY_PAGE_SIZE)} dari {count} pesanan</span>
          <div className="flex items-center gap-2">
            <button type="button" aria-label="Halaman sebelumnya" disabled={page === 0} onClick={() => setPage((p) => Math.max(0, p - 1))}
              className="rounded-lg border border-slate-200 bg-white p-2 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"><ChevronLeft className="h-4 w-4" /></button>
            <span>Halaman {page + 1} dari {pages}</span>
            <button type="button" aria-label="Halaman berikutnya" disabled={page + 1 >= pages} onClick={() => setPage((p) => p + 1)}
              className="rounded-lg border border-slate-200 bg-white p-2 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"><ChevronRight className="h-4 w-4" /></button>
          </div>
        </div>
      )}

      {detailId && <OrderDetailSheet orderId={detailId} onClose={() => setDetailId(null)} />}
    </div>
  );
}
