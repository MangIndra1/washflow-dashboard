import { useMemo } from 'react';
import { Link } from 'react-router';
import { Download, CheckCircle, Clock, Wallet, ShoppingBag, Printer, AlertCircle, Loader2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useAuth } from '@/features/auth/AuthContext';
import { formatRupiah, formatTanggalLengkap, formatJam } from '@/lib/format';
import { downloadCsv } from '@/lib/csv';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { METODE_BAYAR, type PaymentMethod } from '@/features/orders/api';
import { dayRange, useActiveOrders, useDayOrders, useDayPayments } from '@/features/orders/hooks';
import { summarizeDay } from '@/features/orders/summary';

export default function DailySummary() {
  const { currentUser } = useAuth();
  const range = useMemo(() => dayRange(), []);
  const active = useActiveOrders();
  const dayOrders = useDayOrders(range);
  const payments = useDayPayments(range);

  const loading = active.isPending || dayOrders.isPending || payments.isPending;
  const failed = active.isError || dayOrders.isError || payments.isError;

  const stats = useMemo(
    () => summarizeDay(dayOrders.data ?? [], payments.data ?? [], active.data ?? [], range),
    [dayOrders.data, payments.data, active.data, range],
  );

  // Pesanan per jam (jam lokal perangkat), minimal 07.00 sampai 20.00
  const hourly = useMemo(() => {
    const counts = new Array(24).fill(0) as number[];
    for (const o of stats.created) counts[new Date(o.created_at).getHours()]++;
    const used = counts.map((c, h) => (c > 0 ? h : -1)).filter((h) => h >= 0);
    const lo = Math.min(7, ...used);
    const hi = Math.max(20, ...used);
    return Array.from({ length: hi - lo + 1 }, (_, i) => ({
      hour: `${String(lo + i).padStart(2, '0')}.00`, orders: counts[lo + i],
    }));
  }, [stats.created]);

  // Rincian layanan dari pesanan yang dibuat hari ini
  const serviceBreak = useMemo(() => {
    const map = new Map<string, { name: string; orders: Set<string>; value: number }>();
    for (const o of stats.created) {
      for (const it of o.order_items) {
        const e = map.get(it.service_name) ?? { name: it.service_name, orders: new Set<string>(), value: 0 };
        e.orders.add(o.id);
        e.value += it.line_total ?? 0;
        map.set(it.service_name, e);
      }
    }
    return [...map.values()].map((e) => ({ name: e.name, count: e.orders.size, value: e.value }))
      .sort((a, b) => b.value - a.value);
  }, [stats.created]);

  const methodTotal = stats.received || 1;
  const methods = (Object.keys(METODE_BAYAR) as PaymentMethod[]).map((m) => ({
    key: m, label: METODE_BAYAR[m], amount: stats.byMethod[m], pct: Math.round((stats.byMethod[m] / methodTotal) * 100),
  }));

  const log = stats.created;

  const exportCsv = () => {
    const rows: unknown[][] = [['Kode', 'Jam', 'Pelanggan', 'Telepon', 'Layanan', 'Kasir', 'Total', 'Dibayar', 'Pembayaran', 'Status']];
    for (const o of log) {
      rows.push([
        o.code, formatJam(o.created_at), o.customer?.name ?? '', o.customer?.phone ?? '',
        o.order_items.map((i) => i.service_name).join(', '), o.cashier?.full_name ?? '',
        o.total, o.paid_amount, o.payment_status, o.status,
      ]);
    }
    const stamp = new Date(range.from);
    const ymd = `${stamp.getFullYear()}-${String(stamp.getMonth() + 1).padStart(2, '0')}-${String(stamp.getDate()).padStart(2, '0')}`;
    downloadCsv(`ringkasan-${currentUser?.branchCode ?? 'cabang'}-${ymd}.csv`, rows);
  };

  const cards = [
    { label: 'Pesanan Hari Ini', value: String(stats.created.length), sub: 'Pesanan baru masuk', icon: ShoppingBag, bg: 'bg-blue-100', color: 'text-blue-600', accent: 'bg-blue-500' },
    { label: 'Pembayaran Diterima', value: formatRupiah(stats.received), sub: `${payments.data?.length ?? 0} transaksi`, icon: Wallet, bg: 'bg-emerald-100', color: 'text-emerald-600', accent: 'bg-emerald-500' },
    { label: 'Selesai Hari Ini', value: String(stats.completedToday.length), sub: 'Sudah diserahkan', icon: CheckCircle, bg: 'bg-purple-100', color: 'text-purple-600', accent: 'bg-purple-500' },
    { label: 'Masih Berjalan', value: String(stats.active.length), sub: `${stats.overdue.length} terlambat`, icon: Clock, bg: 'bg-amber-100', color: 'text-amber-600', accent: 'bg-amber-500' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-slate-900">Ringkasan Harian</h1>
          <p className="text-slate-500 text-sm mt-1">{currentUser?.branchName}, {formatTanggalLengkap()}</p>
        </div>
        <div className="flex items-center gap-3 print:hidden">
          <button onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 shadow-sm">
            <Printer className="h-4 w-4" /> Cetak Laporan
          </button>
          <button onClick={exportCsv} disabled={loading || failed} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm hover:bg-emerald-700 shadow-sm shadow-emerald-200 disabled:opacity-50">
            <Download className="h-4 w-4" /> Ekspor CSV
          </button>
        </div>
      </div>

      {failed && (
        <div role="alert" className="flex items-center gap-3 p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
          <AlertCircle className="h-5 w-5 flex-shrink-0" /> Data ringkasan tidak dapat dimuat. Periksa koneksi lalu muat ulang halaman.
        </div>
      )}

      {loading && !failed && (
        <div className="flex items-center gap-2 text-sm text-slate-500"><Loader2 className="h-4 w-4 animate-spin" /> Memuat ringkasan...</div>
      )}

      {!loading && !failed && (
        <>
          {stats.overdue.length > 0 && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 border border-red-200">
              <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-700 font-medium">{stats.overdue.length} pesanan terlambat perlu segera ditangani sebelum shift berakhir</p>
            </div>
          )}

          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            {cards.map((c) => (
              <div key={c.label} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 relative overflow-hidden">
                <div className={`absolute top-0 left-0 w-1 h-full rounded-l-xl ${c.accent}`} />
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm text-slate-400">{c.label}</p>
                  <div className={`h-9 w-9 rounded-lg ${c.bg} flex items-center justify-center`}><c.icon className={`h-4 w-4 ${c.color}`} /></div>
                </div>
                <p className="text-2xl font-bold text-slate-900">{c.value}</p>
                <p className="text-xs text-slate-400 mt-0.5">{c.sub}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            {methods.map((m) => (
              <div key={m.key} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5" data-method={m.key}>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-slate-400">{m.label}</p>
                  <span className="text-xs font-bold text-emerald-700">{stats.received ? `${m.pct}%` : '0%'}</span>
                </div>
                <p className="text-xl font-bold text-slate-900">{formatRupiah(m.amount)}</p>
                <div className="mt-3 h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-emerald-500" style={{ width: `${stats.received ? m.pct : 0}%` }} />
                </div>
              </div>
            ))}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5" data-piutang>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-slate-400">Piutang Berjalan</p>
              </div>
              <p className="text-xl font-bold text-red-600">{formatRupiah(stats.outstanding)}</p>
              <p className="text-xs text-slate-400 mt-3">Sisa tagihan pesanan yang belum selesai</p>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <div className="mb-5">
                <h3 className="text-slate-900">Jumlah Pesanan per Jam</h3>
                <p className="text-slate-400 text-xs mt-0.5">Pesanan masuk per jam hari ini</p>
              </div>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={hourly}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis dataKey="hour" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} interval={1} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0F172A', border: 'none', borderRadius: 8, padding: '8px 12px' }}
                    labelStyle={{ color: '#94A3B8', fontSize: 11 }}
                    itemStyle={{ color: '#F8FAFC', fontSize: 12 }}
                    formatter={(v: number) => [v, 'Pesanan']}
                  />
                  <Bar dataKey="orders" fill="#10B981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <div className="mb-5">
                <h3 className="text-slate-900">Rincian Layanan</h3>
                <p className="text-slate-400 text-xs mt-0.5">Pesanan dan nilai layanan hari ini (sebelum diskon)</p>
              </div>
              <div className="space-y-3">
                {serviceBreak.length === 0 && <p className="text-sm text-slate-400">Belum ada pesanan hari ini.</p>}
                {serviceBreak.map((s) => (
                  <div key={s.name}>
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium text-slate-700">{s.name}</p>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-slate-400">{s.count} pesanan</span>
                        <span className="text-sm font-semibold text-slate-900">{formatRupiah(s.value)}</span>
                      </div>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.min(100, (s.count / Math.max(...serviceBreak.map((x) => x.count))) * 100)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="px-6 py-4 border-b border-slate-100">
              <h3 className="text-slate-900">Log Pesanan Hari Ini</h3>
              <p className="text-slate-400 text-xs mt-0.5">Pesanan baru {currentUser?.branchName} hari ini</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full" data-log>
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    {['Kode', 'Jam', 'Pelanggan', 'Layanan', 'Kasir', 'Total', 'Pembayaran', 'Status'].map((h) => (
                      <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {log.length === 0 && (
                    <tr><td colSpan={8} className="px-6 py-8 text-center text-sm text-slate-400">Belum ada pesanan hari ini.</td></tr>
                  )}
                  {log.map((o) => (
                    <tr key={o.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-3.5 text-xs font-mono font-semibold">
                        <Link to={`/employee/orders/${o.id}`} className="text-emerald-700 hover:underline">{o.code}</Link>
                      </td>
                      <td className="px-6 py-3.5 text-sm text-slate-500">{formatJam(o.created_at)}</td>
                      <td className="px-6 py-3.5">
                        <p className="text-sm font-medium text-slate-900">{o.customer?.name ?? '-'}</p>
                        <p className="text-xs text-slate-400">{o.customer?.phone}</p>
                      </td>
                      <td className="px-6 py-3.5 text-sm text-slate-600">{o.order_items.map((i) => i.service_name).join(', ')}</td>
                      <td className="px-6 py-3.5 text-sm text-slate-500">{o.cashier?.full_name ?? '-'}</td>
                      <td className="px-6 py-3.5 text-sm font-semibold text-slate-900">{formatRupiah(o.total)}</td>
                      <td className="px-6 py-3.5"><StatusBadge status={o.payment_status} size="sm" /></td>
                      <td className="px-6 py-3.5"><StatusBadge status={o.status} size="sm" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 px-6 py-4 border-t border-slate-100 bg-slate-50 rounded-b-xl text-sm">
              <div className="flex items-center gap-6">
                <span className="text-slate-500">Pesanan baru: <span className="font-bold text-slate-900">{stats.created.length}</span></span>
                <span className="text-slate-500">Selesai: <span className="font-bold text-green-700">{stats.completedToday.length}</span></span>
                <span className="text-slate-500">Berjalan: <span className="font-bold text-amber-700">{stats.active.length}</span></span>
              </div>
              <span className="font-bold text-emerald-700">Total Diterima: {formatRupiah(stats.received)}</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
