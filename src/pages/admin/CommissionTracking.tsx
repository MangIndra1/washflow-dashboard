import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Banknote, CheckCircle2, Download, Info, Loader2, RefreshCw, Users, Wallet, Undo2 } from 'lucide-react';

import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { FormField, inputClass, selectClass } from '@/components/shared/FormField';
import { Modal } from '@/components/shared/Modal';
import { CardsSkeleton, EmptyState, ErrorPanel, TableSkeleton } from '@/components/shared/QueryStatus';
import { fetchCommissionEntries, type CommissionEmployee, type CommissionPayout } from '@/features/commissions/api';
import {
  useCommissionEntries, useCommissionReport, usePayCommissions, usePayouts, useRecalcCommissions, useVoidPayout,
} from '@/features/commissions/hooks';
import { useBranches } from '@/features/branches/hooks';
import { lastDays, monthToDate, periodTag, resolvePeriod, ymd, type Period } from '@/features/orders/period';
import { pesanError } from '@/lib/errors';
import { formatAngka, formatRupiah, formatTanggal, formatTanggalJam } from '@/lib/format';
import { buildKomisiXlsx } from '@/lib/xlsxKomisi';
import { downloadBlob } from '@/lib/xlsx';

type Key = 'month' | 'last' | '7d' | '30d' | 'custom';
const LABEL: Record<Key, string> = { month: 'Bulan Ini', last: 'Bulan Lalu', '7d': '7 Hari', '30d': '30 Hari', custom: 'Kustom' };
const MAX_DAYS = 366;

function periodFor(key: Key, from: string, to: string): Period | null {
  switch (key) {
    case 'month': return monthToDate();
    case 'last': return resolvePeriod('lastMonth');
    case '7d': return lastDays(7);
    case '30d': return lastDays(30);
    case 'custom': return resolvePeriod('custom', from, to);
  }
}

export default function CommissionTracking() {
  const [key, setKey] = useState<Key>('month');
  const [from, setFrom] = useState(() => ymd(new Date()));
  const [to, setTo] = useState(() => ymd(new Date()));
  const [branchId, setBranchId] = useState('');
  const [exporting, setExporting] = useState(false);

  const period = useMemo(() => periodFor(key, from, to), [key, from, to]);
  const rangeError = !period ? 'Isi tanggal mulai dan akhir dengan benar (akhir tidak boleh sebelum mulai).'
    : period.days > MAX_DAYS ? `Rentang terlalu panjang (maksimal ${MAX_DAYS} hari).` : null;
  const valid = !!period && !rangeError;
  const q = period ?? lastDays(30);
  const branch = branchId || null;

  const branches = useBranches();
  const report = useCommissionReport(q.from, q.to, branch);
  const payouts = usePayouts();
  const pay = usePayCommissions();
  const voidPayout = useVoidPayout();
  const recalc = useRecalcCommissions();

  const [paying, setPaying] = useState<CommissionEmployee | null>(null);
  const [payNote, setPayNote] = useState('');
  const [detail, setDetail] = useState<CommissionEmployee | null>(null);
  const [toVoid, setToVoid] = useState<CommissionPayout | null>(null);
  const [recalcOpen, setRecalcOpen] = useState(false);
  const [since, setSince] = useState('');

  const detailQ = useCommissionEntries(q.from, q.to, detail?.id ?? null, branch, !!detail && !!detail.id);

  const r = report.data;
  const t = r?.totals;

  const doPay = async () => {
    if (!paying?.id || !period) return;
    try {
      const res = await pay.mutateAsync({ employeeId: paying.id, from: period.from, to: period.to, note: payNote });
      toast.success(`Komisi ${paying.name} ${formatRupiah(res.total)} (${formatAngka(res.entries)} pesanan) ditandai sudah dibayar.`);
      setPaying(null); setPayNote('');
    } catch (e) {
      toast.error(pesanError(e, 'Gagal menandai pembayaran.'));
    }
  };

  const doVoid = async () => {
    if (!toVoid) return;
    try {
      const n = await voidPayout.mutateAsync(toVoid.id);
      toast.success(`Pembayaran dibatalkan. ${formatAngka(n)} pesanan kembali berstatus belum dibayar.`);
    } catch (e) {
      toast.error(pesanError(e, 'Gagal membatalkan pembayaran.'));
    } finally {
      setToVoid(null);
    }
  };

  const doRecalc = async () => {
    try {
      const sinceIso = since ? new Date(`${since}T00:00:00`).toISOString() : null;
      const res = await recalc.mutateAsync(sinceIso);
      toast.success(res.orders === 0 ? 'Tidak ada pesanan lama yang perlu dihitung.' : `${formatAngka(res.orders)} pesanan lama dihitung, total komisi ${formatRupiah(res.amount)}.`);
      setRecalcOpen(false);
    } catch (e) {
      toast.error(pesanError(e, 'Gagal menghitung ulang komisi.'));
    }
  };

  const doExport = async () => {
    if (!valid || !period || !r) return;
    setExporting(true);
    try {
      const entries = await fetchCommissionEntries(period.from, period.to, null, branch, 5000);
      const b = branches.data?.find((x) => x.id === branchId);
      const blob = await buildKomisiXlsx({
        title: `Laporan Komisi ${ymd(period.start)} s/d ${ymd(period.endInclusive)} (${b?.name ?? 'Semua Cabang'})`,
        employees: r.employees, entries, payouts: payouts.data ?? [],
      });
      downloadBlob(`komisi-${b?.code ?? 'semua-cabang'}-${periodTag(period)}.xlsx`, blob);
      toast.success('Laporan komisi diunduh.');
    } catch (e) {
      toast.error(pesanError(e, 'Gagal membuat file Excel.'));
    } finally {
      setExporting(false);
    }
  };

  const kpis = [
    { title: 'Total Komisi', value: formatRupiah(t?.amount ?? 0), icon: Banknote, color: 'bg-emerald-100 text-emerald-600', k: 'total' },
    { title: 'Belum Dibayar', value: formatRupiah(t?.unpaid ?? 0), icon: Wallet, color: 'bg-amber-100 text-amber-600', k: 'unpaid' },
    { title: 'Sudah Dibayar', value: formatRupiah(t?.paid ?? 0), icon: CheckCircle2, color: 'bg-blue-100 text-blue-600', k: 'paid' },
    { title: 'Pesanan Berkomisi', value: formatAngka(t?.orders ?? 0), icon: Users, color: 'bg-purple-100 text-purple-600', k: 'orders' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-slate-900">Komisi Karyawan</h1>
          <p className="text-slate-500 text-sm mt-1">Insentif dari pesanan yang selesai dan lunas, terpisah dari gaji.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setRecalcOpen(true)} data-recalc className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-slate-200 text-slate-700 text-sm hover:bg-slate-50">
            <RefreshCw className="h-4 w-4" /> Hitung dari Pesanan Lama
          </button>
          <button onClick={() => void doExport()} disabled={!valid || exporting || !r} data-export className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700 shadow-sm shadow-blue-200 disabled:opacity-60">
            {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />} {exporting ? 'Menyiapkan...' : 'Ekspor Excel'}
          </button>
        </div>
      </div>

      <div className="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-900" data-rules>
        <Info className="h-4 w-4 mt-0.5 shrink-0" />
        <p>Komisi dicatat otomatis saat pesanan berstatus <b>Selesai</b> (sudah lunas) untuk <b>kasir yang membuat pesanan</b>. Dasarnya adalah <b>total setelah diskon</b>, dikali tarif karyawan pada saat itu. Mengubah tarif tidak mengubah komisi yang sudah tercatat.</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-slate-500 font-medium">Periode:</span>
        {(Object.keys(LABEL) as Key[]).map((k) => (
          <button key={k} onClick={() => setKey(k)} aria-pressed={key === k}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${key === k ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
            {LABEL[k]}
          </button>
        ))}
        <select aria-label="Filter cabang" className={`${selectClass} !w-auto ml-auto`} value={branchId} onChange={(e) => setBranchId(e.target.value)}>
          <option value="">Semua Cabang</option>
          {(branches.data ?? []).map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
      </div>
      {key === 'custom' && (
        <div className="flex flex-wrap items-end gap-3">
          <div><label htmlFor="km-from" className="text-xs text-slate-500 block mb-1">Dari tanggal</label><input id="km-from" type="date" className={inputClass} value={from} max={to || undefined} onChange={(e) => setFrom(e.target.value)} /></div>
          <div><label htmlFor="km-to" className="text-xs text-slate-500 block mb-1">Sampai tanggal</label><input id="km-to" type="date" className={inputClass} value={to} min={from || undefined} onChange={(e) => setTo(e.target.value)} /></div>
        </div>
      )}
      {rangeError && <p role="alert" className="text-xs text-red-600">{rangeError}</p>}
      {valid && period && <p className="text-xs text-slate-400" data-range>{ymd(period.start)} sampai {ymd(period.endInclusive)} ({period.days} hari). Dihitung dari waktu pesanan selesai.</p>}

      {report.isError && <ErrorPanel message={pesanError(report.error, 'Data komisi tidak dapat dimuat.')} onRetry={() => void report.refetch()} />}

      {report.isPending ? <CardsSkeleton count={4} className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4" /> : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4" data-kpis>
          {kpis.map((c) => (
            <div key={c.title} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5" data-kpi={c.k}>
              <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${c.color}`}><c.icon className="h-5 w-5" /></div>
              <p className="text-slate-500 text-sm mt-3">{c.title}</p>
              <p className="text-2xl text-slate-900 mt-1" data-value>{c.value}</p>
            </div>
          ))}
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100"><h3 className="text-slate-900">Per Karyawan</h3></div>
        {report.isPending ? <TableSkeleton /> : (r?.employees.length ?? 0) === 0 ? (
          <EmptyState title="Belum ada komisi pada periode ini" hint="Komisi muncul saat pesanan berstatus Selesai. Untuk pesanan lama, gunakan tombol Hitung dari Pesanan Lama." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm" data-employees>
              <thead><tr className="text-left text-xs text-slate-500 bg-slate-50">
                <th className="px-6 py-3 font-medium">Karyawan</th><th className="px-3 py-3 font-medium">Tarif Saat Ini</th>
                <th className="px-3 py-3 font-medium text-right">Pesanan</th><th className="px-3 py-3 font-medium text-right">Dasar</th>
                <th className="px-3 py-3 font-medium text-right">Komisi</th><th className="px-3 py-3 font-medium text-right">Belum Dibayar</th>
                <th className="px-3 py-3 font-medium text-right">Dibayar</th><th className="px-6 py-3" />
              </tr></thead>
              <tbody>
                {r!.employees.map((e) => (
                  <tr key={e.id ?? e.name} className="border-t border-slate-100" data-emp-row={e.name}>
                    <td className="px-6 py-3"><p className="text-slate-900">{e.name}{e.active === false && <span className="ml-2 text-xs text-slate-400">(nonaktif)</span>}</p><p className="text-xs text-slate-400">{e.branch ?? '-'}</p></td>
                    <td className="px-3 py-3 text-slate-600">{e.current_rate == null ? '-' : `${String(e.current_rate).replace('.', ',')}%`}</td>
                    <td className="px-3 py-3 text-right text-slate-600" data-orders>{formatAngka(e.orders)}</td>
                    <td className="px-3 py-3 text-right text-slate-600" data-base>{formatRupiah(e.base)}</td>
                    <td className="px-3 py-3 text-right text-slate-900 font-medium" data-amount>{formatRupiah(e.amount)}</td>
                    <td className="px-3 py-3 text-right text-amber-600" data-unpaid>{formatRupiah(e.unpaid)}</td>
                    <td className="px-3 py-3 text-right text-blue-600" data-paid>{formatRupiah(e.paid)}</td>
                    <td className="px-6 py-3 text-right whitespace-nowrap">
                      <button onClick={() => setDetail(e)} disabled={!e.id} data-detail className="text-sm text-slate-600 hover:text-slate-900 px-2 py-1">Rincian</button>
                      <button onClick={() => { setPaying(e); setPayNote(''); }} disabled={!e.id || e.unpaid <= 0 || !valid} data-pay
                        className="text-sm px-3 py-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed ml-1">Tandai Dibayar</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100"><h3 className="text-slate-900">Riwayat Pembayaran</h3><p className="text-slate-400 text-xs mt-0.5">50 pembayaran terakhir. Pembayaran yang dibatalkan mengembalikan pesanannya ke belum dibayar.</p></div>
        {payouts.isError ? <div className="p-6"><ErrorPanel message="Riwayat pembayaran tidak dapat dimuat." onRetry={() => void payouts.refetch()} /></div>
          : payouts.isPending ? <TableSkeleton rows={3} />
          : (payouts.data ?? []).length === 0 ? <EmptyState title="Belum ada pembayaran komisi" />
          : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm" data-payouts>
                <thead><tr className="text-left text-xs text-slate-500 bg-slate-50">
                  <th className="px-6 py-3 font-medium">Dibayar</th><th className="px-3 py-3 font-medium">Karyawan</th><th className="px-3 py-3 font-medium">Periode</th>
                  <th className="px-3 py-3 font-medium text-right">Pesanan</th><th className="px-3 py-3 font-medium text-right">Total</th><th className="px-3 py-3 font-medium">Catatan</th><th className="px-6 py-3" />
                </tr></thead>
                <tbody>
                  {payouts.data!.map((p) => (
                    <tr key={p.id} className="border-t border-slate-100" data-payout-row data-voided={p.voided_at ? '1' : '0'}>
                      <td className="px-6 py-3 text-slate-600 whitespace-nowrap">{formatTanggalJam(p.paid_at)}</td>
                      <td className="px-3 py-3 text-slate-900">{p.employee_name}</td>
                      <td className="px-3 py-3 text-slate-600 whitespace-nowrap">{formatTanggal(p.period_from)} - {formatTanggal(p.period_to)}</td>
                      <td className="px-3 py-3 text-right text-slate-600">{formatAngka(p.entry_count)}</td>
                      <td className={`px-3 py-3 text-right ${p.voided_at ? 'text-slate-400 line-through' : 'text-slate-900 font-medium'}`}>{formatRupiah(p.total)}</td>
                      <td className="px-3 py-3 text-slate-500">{p.note ?? '-'}</td>
                      <td className="px-6 py-3 text-right whitespace-nowrap">
                        {p.voided_at ? <span className="text-xs text-slate-400">Dibatalkan</span> : (
                          <button onClick={() => setToVoid(p)} data-void className="flex items-center gap-1 ml-auto text-sm text-red-600 hover:text-red-700"><Undo2 className="h-3.5 w-3.5" /> Batalkan</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
      </div>

      <Modal isOpen={!!paying} onClose={() => setPaying(null)} title="Tandai Komisi Dibayar" subtitle={paying ? `${paying.name}, ${period ? `${ymd(period.start)} s/d ${ymd(period.endInclusive)}` : ''}` : undefined}
        footer={<div className="flex gap-3 w-full">
          <button type="button" onClick={() => setPaying(null)} className="flex-1 px-4 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-700 hover:bg-slate-50">Batal</button>
          <button type="button" onClick={() => void doPay()} disabled={pay.isPending} data-confirm-pay className="flex-1 px-4 py-2.5 rounded-lg bg-emerald-600 text-white text-sm hover:bg-emerald-700 disabled:opacity-60">{pay.isPending ? 'Menyimpan...' : 'Tandai Dibayar'}</button>
        </div>}>
        {paying && (
          <div className="space-y-4">
            <div className="rounded-lg bg-emerald-50 border border-emerald-100 p-4">
              <p className="text-xs text-emerald-700">Jumlah yang dibayarkan</p>
              <p className="text-2xl text-emerald-800 mt-1" data-pay-total>{formatRupiah(paying.unpaid)}</p>
            </div>
            <p className="text-xs text-slate-500">Ini hanya mencatat bahwa komisi sudah Anda bayar (tunai atau transfer di luar aplikasi). Uang tidak dipindahkan oleh WashFlow.</p>
            <FormField label="Catatan (opsional)" hint="Mis. transfer BCA, 30 Sep">
              <input className={inputClass} maxLength={200} value={payNote} onChange={(e) => setPayNote(e.target.value)} data-pay-note />
            </FormField>
          </div>
        )}
      </Modal>

      <Modal isOpen={!!detail} onClose={() => setDetail(null)} size="lg" title={`Rincian Komisi ${detail?.name ?? ''}`} subtitle="Satu baris per pesanan">
        {detailQ.isPending ? <TableSkeleton rows={4} /> : detailQ.isError ? <ErrorPanel message="Rincian tidak dapat dimuat." onRetry={() => void detailQ.refetch()} />
          : (detailQ.data ?? []).length === 0 ? <EmptyState title="Tidak ada komisi" /> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm" data-entries>
                <thead><tr className="text-left text-xs text-slate-500">
                  <th className="py-2 font-medium">Selesai</th><th className="py-2 font-medium">Pesanan</th><th className="py-2 font-medium text-right">Dasar</th><th className="py-2 font-medium text-right">Tarif</th><th className="py-2 font-medium text-right">Komisi</th><th className="py-2 pl-3 font-medium">Status</th>
                </tr></thead>
                <tbody>
                  {detailQ.data!.map((e) => (
                    <tr key={e.id} className="border-t border-slate-100" data-entry-row>
                      <td className="py-2 text-slate-600 whitespace-nowrap">{formatTanggalJam(e.earned_at)}</td>
                      <td className="py-2 text-slate-900">{e.order_code}{e.source === 'recalc' && <span className="ml-1 text-xs text-slate-400">(hitung ulang)</span>}</td>
                      <td className="py-2 text-right text-slate-600">{formatRupiah(e.base_amount)}</td>
                      <td className="py-2 text-right text-slate-600">{String(Number(e.rate)).replace('.', ',')}%</td>
                      <td className="py-2 text-right text-slate-900 font-medium">{formatRupiah(e.amount)}</td>
                      <td className="py-2 pl-3 text-xs">{e.payout_id ? <span className="text-blue-600">Dibayar</span> : <span className="text-amber-600">Belum</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {detailQ.data!.length >= 1000 && <p className="text-xs text-slate-400 mt-3">Menampilkan 1.000 baris terbaru. Persempit periode untuk melihat sisanya.</p>}
            </div>
          )}
      </Modal>

      <Modal isOpen={recalcOpen} onClose={() => setRecalcOpen(false)} title="Hitung dari Pesanan Lama"
        footer={<div className="flex gap-3 w-full">
          <button type="button" onClick={() => setRecalcOpen(false)} className="flex-1 px-4 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-700 hover:bg-slate-50">Batal</button>
          <button type="button" onClick={() => void doRecalc()} disabled={recalc.isPending} data-confirm-recalc className="flex-1 px-4 py-2.5 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700 disabled:opacity-60">{recalc.isPending ? 'Menghitung...' : 'Hitung Sekarang'}</button>
        </div>}>
        <div className="space-y-4">
          <p className="text-sm text-slate-600">Membuat komisi untuk pesanan yang sudah Selesai sebelum fitur ini ada. Yang dipakai adalah <b>tarif karyawan saat ini</b> dan total setelah diskon. Pesanan yang sudah punya komisi tidak berubah, jadi aman dijalankan berulang.</p>
          <FormField label="Hanya pesanan selesai sejak tanggal (opsional)" hint="Kosongkan untuk semua pesanan lama.">
            <input type="date" className={inputClass} value={since} onChange={(e) => setSince(e.target.value)} data-recalc-since />
          </FormField>
        </div>
      </Modal>

      <ConfirmDialog open={!!toVoid} onOpenChange={(o) => { if (!o) setToVoid(null); }} title="Batalkan pembayaran komisi?"
        description={toVoid ? `Pembayaran ${formatRupiah(toVoid.total)} untuk ${toVoid.employee_name} dibatalkan dan ${formatAngka(toVoid.entry_count)} pesanan kembali berstatus belum dibayar.` : ''}
        confirmLabel="Batalkan Pembayaran" loading={voidPayout.isPending} onConfirm={() => void doVoid()} />
    </div>
  );
}
