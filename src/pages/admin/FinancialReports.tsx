import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Download, Banknote, TrendingUp, ShoppingBag, CreditCard, Filter, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, Legend,
} from 'recharts';

import { ErrorPanel } from '@/components/shared/QueryStatus';
import { inputClass, selectClass } from '@/components/shared/FormField';
import { DiscountTag } from '@/components/shared/DiscountTag';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { useBranches } from '@/features/branches/hooks';
import { fetchCreatedInRange, fetchExportPayments } from '@/features/orders/api';
import { lastDays, monthToDate, periodTag, resolvePeriod, ymd, type Period } from '@/features/orders/period';
import { useAdminReport, useOrderPage } from '@/features/reports/hooks';
import { labelHari, pctChange } from '@/features/reports/util';
import { pesanError } from '@/lib/errors';
import { formatAngka, formatRupiah, formatRupiahRingkas, formatTanggalJam } from '@/lib/format';
import { buildLaporanXlsx, downloadBlob } from '@/lib/xlsx';

type Key = '7d' | '30d' | '90d' | '180d' | 'month' | 'custom';
const LABEL: Record<Key, string> = { '7d': '7 Hari', '30d': '30 Hari', '90d': '3 Bulan', '180d': '6 Bulan', month: 'Bulan Ini', custom: 'Kustom' };
const MAX_DAYS = 366;
const PAGE_SIZE = 20;

function periodFor(key: Key, from: string, to: string): Period | null {
  switch (key) {
    case '7d': return lastDays(7);
    case '30d': return lastDays(30);
    case '90d': return lastDays(90);
    case '180d': return lastDays(180);
    case 'month': return monthToDate();
    case 'custom': return resolvePeriod('custom', from, to);
  }
}

function Delta({ cur, prev, invert = false }: { cur: number; prev: number; invert?: boolean }) {
  const c = pctChange(cur, prev);
  if (c === undefined) return <p className="text-xs mt-1 text-slate-400">Belum ada pembanding periode sebelumnya</p>;
  const good = invert ? c <= 0 : c >= 0;
  return <p className={`text-xs mt-1 font-medium ${good ? 'text-emerald-600' : 'text-red-500'}`}>{c >= 0 ? '+' : ''}{c}% dibanding periode sebelumnya</p>;
}

export default function FinancialReports() {
  const [key, setKey] = useState<Key>('30d');
  const [from, setFrom] = useState(() => ymd(new Date()));
  const [to, setTo] = useState(() => ymd(new Date()));
  const [branchId, setBranchId] = useState('');
  const [payment, setPayment] = useState('');
  const [page, setPage] = useState(0);
  const [exporting, setExporting] = useState(false);

  const period = useMemo(() => periodFor(key, from, to), [key, from, to]);
  const rangeError = !period ? 'Isi tanggal mulai dan akhir dengan benar (akhir tidak boleh sebelum mulai).'
    : period.days > MAX_DAYS ? `Rentang terlalu panjang (maksimal ${MAX_DAYS} hari).` : null;
  const valid = !!period && !rangeError;
  // parameter dipertahankan walau rentang sementara tidak valid, supaya hook tidak berganti bentuk
  const q = period ?? lastDays(30);
  const branch = branchId || null;

  const report = useAdminReport(q.from, q.to, branch);
  const orders = useOrderPage({ from: q.from, to: q.to, branchId: branch, payment, page, pageSize: PAGE_SIZE });
  const branches = useBranches();

  const r = report.data;
  const daily = (r?.daily ?? []).map((d) => ({ ...d, label: labelHari(d.day) }));
  const avg = r && r.totals.orders > 0 ? Math.round(r.totals.value / r.totals.orders) : 0;
  const pages = Math.max(1, Math.ceil((orders.data?.total ?? 0) / PAGE_SIZE));

  const change = <T,>(setter: (v: T) => void) => (v: T) => { setter(v); setPage(0); };

  const doExport = async () => {
    if (!valid || !period) return;
    setExporting(true);
    try {
      const [o, p] = await Promise.all([fetchCreatedInRange(period.from, period.to, branch ?? undefined), fetchExportPayments(period.from, period.to, branch ?? undefined)]);
      const b = (branches.data ?? []).find((x) => x.id === branchId);
      const blob = await buildLaporanXlsx({ branchName: b?.name ?? 'Semua Cabang', period, orders: o, payments: p, showBranch: !b });
      downloadBlob(`laporan-${b?.code ?? 'semua-cabang'}-${periodTag(period)}.xlsx`, blob);
      toast.success(o.length === 0 ? 'File dibuat, tetapi tidak ada pesanan pada periode ini.' : `Laporan ${o.length} pesanan diunduh.`);
    } catch (e) {
      toast.error(pesanError(e, 'Gagal membuat laporan. Coba lagi.'));
    } finally {
      setExporting(false);
    }
  };

  const kpis = [
    { title: 'Pendapatan Diterima', value: formatRupiah(r?.received.total ?? 0), icon: Banknote, color: 'bg-blue-100 text-blue-600', delta: r && <Delta cur={r.received.total} prev={r.prev.received} /> },
    { title: 'Belum Terbayar', value: formatRupiah(r?.totals.outstanding ?? 0), icon: CreditCard, color: 'bg-red-100 text-red-600', delta: <p className="text-xs mt-1 text-slate-400">Sisa tagihan pesanan periode ini</p> },
    { title: 'Total Pesanan', value: formatAngka(r?.totals.orders ?? 0), icon: ShoppingBag, color: 'bg-emerald-100 text-emerald-600', delta: r && <Delta cur={r.totals.orders} prev={r.prev.orders} /> },
    { title: 'Rata-rata Nilai Pesanan', value: formatRupiah(avg), icon: TrendingUp, color: 'bg-purple-100 text-purple-600', delta: <p className="text-xs mt-1 text-slate-400">Nilai pesanan dibagi jumlah pesanan</p> },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-slate-900">Laporan Keuangan</h1>
          <p className="text-slate-500 text-sm mt-1">Pendapatan, riwayat pesanan, dan piutang. Pendapatan dihitung dari pembayaran yang diterima.</p>
        </div>
        <button onClick={doExport} disabled={!valid || exporting} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700 shadow-sm shadow-blue-200 disabled:opacity-60">
          {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />} {exporting ? 'Menyiapkan...' : 'Ekspor Excel'}
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-slate-500 font-medium">Periode:</span>
        {(Object.keys(LABEL) as Key[]).map((k) => (
          <button key={k} onClick={() => change(setKey)(k)} aria-pressed={key === k}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${key === k ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
            {LABEL[k]}
          </button>
        ))}
        <select aria-label="Filter cabang" className={`${selectClass} !w-auto ml-auto`} value={branchId} onChange={(e) => change(setBranchId)(e.target.value)}>
          <option value="">Semua Cabang</option>
          {(branches.data ?? []).map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
      </div>

      {key === 'custom' && (
        <div className="flex flex-wrap items-end gap-3">
          <div><label htmlFor="rp-from" className="text-xs text-slate-500 block mb-1">Dari tanggal</label><input id="rp-from" type="date" className={inputClass} value={from} max={to || undefined} onChange={(e) => change(setFrom)(e.target.value)} /></div>
          <div><label htmlFor="rp-to" className="text-xs text-slate-500 block mb-1">Sampai tanggal</label><input id="rp-to" type="date" className={inputClass} value={to} min={from || undefined} onChange={(e) => change(setTo)(e.target.value)} /></div>
        </div>
      )}
      {rangeError && <p role="alert" className="text-xs text-red-600">{rangeError}</p>}
      {valid && period && <p className="text-xs text-slate-400" data-range>{ymd(period.start)} sampai {ymd(period.endInclusive)} ({period.days} hari)</p>}

      {report.isError && <ErrorPanel message="Data laporan tidak dapat dimuat. Periksa koneksi lalu coba lagi." onRetry={() => void report.refetch()} />}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4" data-kpis>
        {kpis.map((c) => (
          <div key={c.title} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-slate-400">{c.title}</p>
              <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${c.color}`}><c.icon className="h-4 w-4" /></div>
            </div>
            <p className="text-2xl font-bold text-slate-900">{c.value}</p>
            {c.delta}
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6" data-discounts>
        <div className="flex flex-wrap items-start justify-between gap-2 mb-4">
          <div><h3 className="text-slate-900">Diskon dan Kupon</h3><p className="text-slate-400 text-xs mt-0.5">Harga normal dikurangi diskon sama dengan nilai pesanan. Berlaku untuk pesanan yang dibuat pada periode ini.</p></div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-lg bg-slate-50 p-4"><p className="text-xs text-slate-400">Penjualan kotor (harga normal)</p><p className="text-xl font-bold text-slate-900" data-gross>{formatRupiah(r?.totals.gross ?? 0)}</p></div>
          <div className="rounded-lg bg-violet-50 p-4"><p className="text-xs text-violet-500">Diskon diberikan</p><p className="text-xl font-bold text-violet-700" data-discount-total>-{formatRupiah(r?.totals.discount ?? 0)}</p>
            <p className="text-xs text-violet-500 mt-1" data-discount-share>{formatAngka(r?.totals.discounted_orders ?? 0)} dari {formatAngka(r?.totals.orders ?? 0)} pesanan berdiskon{r && r.totals.gross > 0 ? `, ${(r.totals.discount / r.totals.gross * 100).toFixed(1).replace('.', ',')}% dari penjualan kotor` : ''}</p></div>
          <div className="rounded-lg bg-emerald-50 p-4"><p className="text-xs text-emerald-600">Nilai pesanan (setelah diskon)</p><p className="text-xl font-bold text-emerald-700" data-net>{formatRupiah(r?.totals.value ?? 0)}</p></div>
        </div>
        {(r?.discounts ?? []).length === 0 ? (
          <p className="mt-4 text-sm text-slate-400" data-discount-empty>Tidak ada pesanan berdiskon pada periode dan filter ini.</p>
        ) : (
          <table className="mt-4 w-full text-sm" data-discount-table>
            <thead><tr className="text-left text-xs uppercase tracking-wide text-slate-400 border-b border-slate-100"><th className="py-2 font-semibold">Sumber diskon</th><th className="py-2 font-semibold">Jenis</th><th className="py-2 font-semibold text-right">Pesanan</th><th className="py-2 font-semibold text-right">Jumlah diskon</th></tr></thead>
            <tbody className="divide-y divide-slate-50">
              {(r?.discounts ?? []).map((d) => (
                <tr key={d.label} data-discount-row={d.label}>
                  <td className="py-2.5 font-medium text-slate-800">{d.label}</td>
                  <td className="py-2.5"><span className={`text-xs px-2 py-0.5 rounded-full ${d.kind === 'promo' ? 'bg-violet-100 text-violet-700' : 'bg-blue-100 text-blue-700'}`}>{d.kind === 'promo' ? 'Kupon promo' : 'Member'}</span></td>
                  <td className="py-2.5 text-right text-slate-600">{formatAngka(d.orders)}</td>
                  <td className="py-2.5 text-right font-semibold text-slate-900">-{formatRupiah(d.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4" data-methods>
        {([['cash', 'Tunai'], ['qris', 'QRIS'], ['transfer', 'Transfer']] as const).map(([m, label]) => {
          const amount = r?.received[m] ?? 0; const pct = r && r.received.total > 0 ? Math.round((amount / r.received.total) * 100) : 0;
          return (
            <div key={m} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5" data-method={m}>
              <div className="flex items-center justify-between mb-1"><p className="text-sm text-slate-400">{label}</p><span className="text-xs font-bold text-blue-700">{pct}%</span></div>
              <p className="text-xl font-bold text-slate-900">{formatRupiah(amount)}</p>
              <div className="mt-3 h-2 bg-slate-100 rounded-full overflow-hidden"><div className="h-full rounded-full bg-blue-500" style={{ width: `${pct}%` }} /></div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <div className="mb-6"><h3 className="text-slate-900">Tren Harian</h3><p className="text-slate-400 text-xs mt-0.5">Pembayaran diterima dan nilai pesanan baru per hari</p></div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={daily}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} minTickGap={24} />
              <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} tickFormatter={(v) => formatRupiahRingkas(v)} />
              <Tooltip contentStyle={{ backgroundColor: '#0F172A', border: 'none', borderRadius: 8, padding: '8px 12px' }} labelStyle={{ color: '#94A3B8', fontSize: 11 }} itemStyle={{ fontSize: 12 }} formatter={(v: number, name: string) => [formatRupiah(v), name]} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="received" stroke="#3B82F6" strokeWidth={2} dot={false} name="Diterima" />
              <Line type="monotone" dataKey="value" stroke="#10B981" strokeWidth={2} dot={false} name="Nilai pesanan" strokeDasharray="4 4" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <div className="mb-6"><h3 className="text-slate-900">Pendapatan per Cabang</h3><p className="text-slate-400 text-xs mt-0.5">Pembayaran diterima pada periode terpilih</p></div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={r?.branches ?? []} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} tickFormatter={(v) => formatRupiahRingkas(v)} />
              <YAxis type="category" dataKey="code" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} width={50} />
              <Tooltip contentStyle={{ backgroundColor: '#0F172A', border: 'none', borderRadius: 8, padding: '8px 12px' }} labelStyle={{ color: '#94A3B8', fontSize: 11 }} itemStyle={{ color: '#F8FAFC', fontSize: 12 }} formatter={(v: number) => [formatRupiah(v), 'Diterima']} />
              <Bar dataKey="received" fill="#3B82F6" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 p-6 border-b border-slate-100">
          <div><h3 className="text-slate-900">Riwayat Pesanan</h3><p className="text-slate-400 text-xs mt-0.5" data-total>{formatAngka(orders.data?.total ?? 0)} pesanan dibuat pada periode ini</p></div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-slate-400" />
            <select aria-label="Filter pembayaran" className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500" value={payment} onChange={(e) => change(setPayment)(e.target.value)}>
              <option value="">Semua Pembayaran</option>
              <option value="paid">Lunas</option>
              <option value="unpaid">Belum Dibayar</option>
              <option value="partial">Sebagian</option>
            </select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full" data-orders>
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                {['Tanggal', 'Kode', 'Pelanggan', 'Layanan', 'Cabang', 'Jumlah', 'Pembayaran', 'Status'].map((h) => (
                  <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {(orders.data?.rows ?? []).length === 0 && !orders.isPending && <tr><td colSpan={8} className="px-6 py-8 text-center text-sm text-slate-400">Tidak ada pesanan pada periode dan filter ini.</td></tr>}
              {(orders.data?.rows ?? []).map((o) => (
                <tr key={o.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-3.5 text-xs text-slate-500">{formatTanggalJam(o.created_at)}</td>
                  <td className="px-6 py-3.5 text-xs font-medium text-slate-800">{o.code}</td>
                  <td className="px-6 py-3.5"><p className="text-sm text-slate-800 font-medium">{o.customer?.name ?? '-'}</p><p className="text-xs text-slate-400">{o.customer?.phone}</p></td>
                  <td className="px-6 py-3.5 text-sm text-slate-600">{[...new Set(o.order_items.map((i) => i.service_name))].join(', ')}</td>
                  <td className="px-6 py-3.5"><span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{o.branch?.name}</span></td>
                  <td className="px-6 py-3.5 text-sm font-semibold text-slate-900">
                    {formatRupiah(o.total)}
                    {o.discount > 0 && <div className="mt-1"><DiscountTag discount={o.discount} label={o.discount_label} showLabel /></div>}
                  </td>
                  <td className="px-6 py-3.5"><StatusBadge status={o.payment_status} size="sm" /></td>
                  <td className="px-6 py-3.5"><StatusBadge status={o.status} size="sm" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50 rounded-b-xl">
          <p className="text-sm text-slate-500">Halaman {page + 1} dari {pages}</p>
          <div className="flex items-center gap-2">
            <button aria-label="Halaman sebelumnya" disabled={page === 0} onClick={() => setPage((p) => p - 1)} className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 disabled:opacity-40"><ChevronLeft className="h-4 w-4" /></button>
            <button aria-label="Halaman berikutnya" disabled={page + 1 >= pages} onClick={() => setPage((p) => p + 1)} className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 disabled:opacity-40"><ChevronRight className="h-4 w-4" /></button>
          </div>
        </div>
      </div>
    </div>
  );
}
