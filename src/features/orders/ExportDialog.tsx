import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Download, Loader2 } from 'lucide-react';

import { inputClassEmerald } from '@/components/shared/FormField';
import { Modal } from '@/components/shared/Modal';
import { downloadCsv } from '@/lib/csv';
import { pesanError } from '@/lib/errors';
import { formatJam } from '@/lib/format';
import { buildLaporanXlsx, downloadBlob } from '@/lib/xlsx';
import { BAYAR_LABEL, STATUS_LABEL, fetchCreatedInRange, fetchExportPayments } from './api';
import { MAX_EXPORT_DAYS, PERIOD_LABEL, periodError, periodTag, resolvePeriod, ymd, type PeriodKey } from './period';

const KEYS = Object.keys(PERIOD_LABEL) as PeriodKey[];

export function ExportDialog({ branchName, branchCode, onClose }: { branchName: string; branchCode: string; onClose: () => void }) {
  const [key, setKey] = useState<PeriodKey>('today');
  const [from, setFrom] = useState(() => ymd(new Date()));
  const [to, setTo] = useState(() => ymd(new Date()));
  const [busy, setBusy] = useState<'xlsx' | 'csv' | null>(null);
  const period = useMemo(() => resolvePeriod(key, from, to), [key, from, to]);
  const error = periodError(key, period);

  const run = async (fmt: 'xlsx' | 'csv') => {
    if (!period || error) return;
    setBusy(fmt);
    try {
      const [orders, payments] = await Promise.all([fetchCreatedInRange(period.from, period.to), fetchExportPayments(period.from, period.to)]);
      const base = `laporan-${branchCode}-${periodTag(period)}`;
      if (fmt === 'xlsx') {
        downloadBlob(`${base}.xlsx`, await buildLaporanXlsx({ branchName, period, orders, payments }));
      } else {
        const rows: unknown[][] = [['Kode', 'Tanggal', 'Jam', 'Pelanggan', 'Telepon', 'Layanan', 'Kasir', 'Subtotal', 'Diskon', 'Keterangan Diskon', 'Total', 'Dibayar', 'Pembayaran', 'Status']];
        for (const o of orders) {
          rows.push([o.code, ymd(new Date(o.created_at)), formatJam(o.created_at), o.customer?.name ?? '', o.customer?.phone ?? '',
            o.order_items.map((i) => i.service_name).join(', '), o.cashier?.full_name ?? '', o.subtotal, o.discount, o.discount > 0 ? (o.discount_label ?? 'Diskon') : '', o.total, o.paid_amount, BAYAR_LABEL[o.payment_status], STATUS_LABEL[o.status]]);
        }
        downloadCsv(`${base}.csv`, rows);
      }
      toast.success(orders.length === 0 ? 'File dibuat, tetapi tidak ada pesanan pada periode ini.' : `Laporan ${orders.length} pesanan diunduh.`);
      onClose();
    } catch (e) {
      toast.error(pesanError(e, 'Gagal membuat laporan. Coba lagi.'));
    } finally {
      setBusy(null);
    }
  };

  return (
    <Modal
      isOpen onClose={onClose} title="Ekspor Laporan" subtitle={`${branchName}, pesanan yang dibuat pada periode terpilih`} size="md"
      footer={
        <div className="flex items-center justify-between gap-3">
          <button type="button" onClick={() => run('csv')} disabled={!!error || !!busy} className="text-xs text-slate-500 hover:underline disabled:opacity-50">Unduh CSV</button>
          <div className="flex items-center gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50">Batal</button>
            <button type="button" onClick={() => run('xlsx')} disabled={!!error || !!busy} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm hover:bg-emerald-700 disabled:opacity-60">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />} {busy ? 'Menyiapkan...' : 'Unduh Excel'}
            </button>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2" role="group" aria-label="Periode">
          {KEYS.map((k) => (
            <button key={k} type="button" aria-pressed={key === k} onClick={() => setKey(k)}
              className={`py-2 rounded-lg border text-xs transition-colors ${key === k ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
              {PERIOD_LABEL[k]}
            </button>
          ))}
        </div>
        {key === 'custom' && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="exp-from" className="text-sm text-slate-700 block mb-1.5" style={{ fontWeight: 500 }}>Dari tanggal</label>
              <input id="exp-from" type="date" className={inputClassEmerald} value={from} max={to || undefined} onChange={(e) => setFrom(e.target.value)} />
            </div>
            <div>
              <label htmlFor="exp-to" className="text-sm text-slate-700 block mb-1.5" style={{ fontWeight: 500 }}>Sampai tanggal</label>
              <input id="exp-to" type="date" className={inputClassEmerald} value={to} min={from || undefined} onChange={(e) => setTo(e.target.value)} />
            </div>
          </div>
        )}
        {error
          ? <p role="alert" className="text-xs text-red-600">{error}</p>
          : period && <p className="text-xs text-slate-500" data-period-info>{ymd(period.start)} sampai {ymd(period.endInclusive)} ({period.days} hari). Maksimal {MAX_EXPORT_DAYS} hari.</p>}
        <p className="text-xs text-slate-400">File Excel berisi tiga sheet: Ringkasan (total, rincian diskon, dan per hari), Pesanan (dengan subtotal, diskon, dan total), serta Pembayaran.</p>
      </div>
    </Modal>
  );
}
