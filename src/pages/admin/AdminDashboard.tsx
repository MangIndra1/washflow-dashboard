import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { Banknote, ShoppingBag, Building2, TrendingUp, AlertCircle, Clock, ArrowRight } from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';

import { MetricCard } from '@/components/shared/MetricCard';
import { ErrorPanel } from '@/components/shared/QueryStatus';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { useBranches } from '@/features/branches/hooks';
import { lastDays, monthToDate } from '@/features/orders/period';
import { dayRange } from '@/features/orders/hooks';
import { useActiveCount, useAdminReport, useOverdueOrders, useRecentOrders } from '@/features/reports/hooks';
import { labelHari, pctChange } from '@/features/reports/util';
import { formatAngka, formatRupiah, formatRupiahRingkas, formatTanggalJam, formatTanggalLengkap } from '@/lib/format';

const PIE_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444', '#06B6D4'];

type Span = 7 | 30;

export default function AdminDashboard() {
  const [span, setSpan] = useState<Span>(7);
  const today = useMemo(() => dayRange(), []);
  const month = useMemo(() => monthToDate(), []);
  const chart = useMemo(() => lastDays(span), [span]);

  const rToday = useAdminReport(today.from, today.to, null);
  const rMonth = useAdminReport(month.from, month.to, null);
  const rChart = useAdminReport(chart.from, chart.to, null);
  const active = useActiveCount();
  const overdue = useOverdueOrders(3);
  const recent = useRecentOrders(6);
  const branches = useBranches();

  const failed = rToday.isError || rMonth.isError || rChart.isError;
  const branchList = branches.data ?? [];
  const activeBranches = branchList.filter((b) => b.status === 'active').length;
  const maintenance = branchList.filter((b) => b.status === 'maintenance');

  const daily = (rChart.data?.daily ?? []).map((d) => ({ ...d, label: labelHari(d.day) }));
  const services = (rChart.data?.services ?? []).filter((s) => s.value > 0);
  const branchBars = rChart.data?.branches ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-slate-900">Ringkasan Bisnis</h1>
          <p className="text-slate-500 text-sm mt-1">{formatTanggalLengkap()}. Semua cabang</p>
        </div>
        <Link to="/admin/reports" className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700 transition-colors shadow-sm shadow-blue-200">
          Laporan Keuangan <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {failed && <ErrorPanel message="Data ringkasan tidak dapat dimuat. Periksa koneksi lalu coba lagi." onRetry={() => { void rToday.refetch(); void rMonth.refetch(); void rChart.refetch(); }} />}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4" data-cards>
        <MetricCard
          title="Pendapatan Hari Ini"
          value={formatRupiah(rToday.data?.received.total ?? 0)}
          subtitle={`${rToday.data?.totals.orders ?? 0} pesanan masuk`}
          change={rToday.data ? pctChange(rToday.data.received.total, rToday.data.prev.received) : undefined}
          changeLabel="dibanding kemarin"
          icon={Banknote} iconBg="bg-blue-100" iconColor="text-blue-600" accent="bg-blue-500"
        />
        <MetricCard
          title="Pendapatan Bulan Ini"
          value={formatRupiah(rMonth.data?.received.total ?? 0)}
          subtitle={`${formatAngka(rMonth.data?.totals.orders ?? 0)} pesanan sejak tanggal 1`}
          change={rMonth.data ? pctChange(rMonth.data.received.total, rMonth.data.prev.received) : undefined}
          changeLabel="dibanding periode sebelumnya"
          icon={TrendingUp} iconBg="bg-emerald-100" iconColor="text-emerald-600" accent="bg-emerald-500"
        />
        <MetricCard
          title="Pesanan Aktif"
          value={formatAngka(active.data ?? 0)}
          subtitle={`Di semua cabang, ${overdue.data?.count ?? 0} terlambat`}
          icon={ShoppingBag} iconBg="bg-amber-100" iconColor="text-amber-600" accent="bg-amber-500"
        />
        <MetricCard
          title="Cabang Aktif"
          value={`${activeBranches} / ${branchList.length}`}
          subtitle={maintenance.length ? `${maintenance.length} sedang dalam perbaikan` : 'Semua beroperasi'}
          icon={Building2} iconBg="bg-purple-100" iconColor="text-purple-600" accent="bg-purple-500"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-slate-900">Tren Pendapatan</h3>
              <p className="text-slate-400 text-xs mt-0.5">Pembayaran yang diterima per hari</p>
            </div>
            <div className="flex rounded-lg border border-slate-200 overflow-hidden text-xs">
              {([7, 30] as Span[]).map((n) => (
                <button key={n} onClick={() => setSpan(n)} aria-pressed={span === n}
                  className={`px-3 py-1.5 font-medium transition-colors ${span === n ? 'bg-blue-600 text-white' : 'bg-white text-slate-500 hover:bg-slate-50'}`}>
                  {n} Hari
                </button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={daily} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} interval={span === 30 ? 3 : 0} />
              <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} tickFormatter={(v) => formatRupiahRingkas(v)} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0F172A', border: 'none', borderRadius: 8, padding: '8px 12px' }}
                labelStyle={{ color: '#94A3B8', fontSize: 11 }} itemStyle={{ color: '#F8FAFC', fontSize: 12 }}
                formatter={(v: number) => [formatRupiah(v), 'Diterima']}
              />
              <Area type="monotone" dataKey="received" stroke="#3B82F6" strokeWidth={2} fill="url(#revenueGradient)" dot={false} activeDot={{ r: 5, fill: '#3B82F6' }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <div className="mb-4">
            <h3 className="text-slate-900">Rincian Layanan</h3>
            <p className="text-slate-400 text-xs mt-0.5">Nilai layanan {span} hari terakhir</p>
          </div>
          {services.length === 0 ? <p className="text-sm text-slate-400 py-10 text-center">Belum ada pesanan pada periode ini.</p> : (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={services} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value" nameKey="name">
                    {services.map((s, i) => <Cell key={s.name} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#0F172A', border: 'none', borderRadius: 8, fontSize: 11 }} itemStyle={{ color: '#F8FAFC' }} formatter={(v: number) => formatRupiah(v)} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-3">
                {services.slice(0, 6).map((s, i) => (
                  <div key={s.name} className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                      <span className="text-xs text-slate-600 truncate">{s.name}</span>
                    </div>
                    <span className="text-xs font-medium text-slate-800 flex-shrink-0">{s.orders} pesanan</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <div className="mb-6">
            <h3 className="text-slate-900">Kinerja Cabang</h3>
            <p className="text-slate-400 text-xs mt-0.5">Pendapatan diterima {span} hari terakhir</p>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={branchBars} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis dataKey="code" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} tickFormatter={(v) => formatRupiahRingkas(v)} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0F172A', border: 'none', borderRadius: 8, padding: '8px 12px' }}
                labelStyle={{ color: '#94A3B8', fontSize: 11 }} itemStyle={{ color: '#F8FAFC', fontSize: 12 }}
                formatter={(v: number) => [formatRupiah(v), 'Diterima']}
              />
              <Bar dataKey="received" fill="#3B82F6" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-100" data-branches>
            {branchBars.map((b) => (
              <div key={b.id} className="text-center">
                <p className="text-xs text-slate-400">{b.name}</p>
                <p className="text-sm font-semibold text-slate-800 mt-0.5">{formatRupiahRingkas(b.received)}</p>
                <p className="text-xs text-slate-400">{b.orders} pesanan</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="h-4 w-4 text-red-500" />
            <h3 className="text-slate-900">Peringatan Aktif</h3>
          </div>
          <div className="space-y-3" data-alerts>
            {(overdue.data?.rows ?? []).map((o) => (
              <div key={o.id} className="flex items-start gap-3 p-3 rounded-lg bg-red-50 border border-red-100">
                <div className="h-7 w-7 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5"><Clock className="h-3.5 w-3.5 text-red-600" /></div>
                <div>
                  <p className="text-xs font-medium text-red-800">{o.code}: Terlambat</p>
                  <p className="text-xs text-red-600 mt-0.5">{o.customer?.name ?? '-'}, {o.branch?.name}</p>
                  <p className="text-xs text-red-400 mt-0.5">Batas: {formatTanggalJam(o.due_at)}</p>
                </div>
              </div>
            ))}
            {(overdue.data?.count ?? 0) > (overdue.data?.rows.length ?? 0) && (
              <p className="text-xs text-slate-500">dan {(overdue.data?.count ?? 0) - (overdue.data?.rows.length ?? 0)} pesanan terlambat lainnya</p>
            )}
            {maintenance.map((b) => (
              <div key={b.id} className="p-3 rounded-lg bg-amber-50 border border-amber-100">
                <div className="flex items-start gap-3">
                  <div className="h-7 w-7 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5"><Building2 className="h-3.5 w-3.5 text-amber-600" /></div>
                  <div>
                    <p className="text-xs font-medium text-amber-800">{b.name}</p>
                    <p className="text-xs text-amber-600 mt-0.5">Sedang dalam perbaikan, kapasitas berkurang</p>
                  </div>
                </div>
              </div>
            ))}
            {(overdue.data?.count ?? 0) === 0 && maintenance.length === 0 && <p className="text-sm text-slate-400">Tidak ada peringatan. Semua pesanan masih sesuai jadwal.</p>}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div>
            <h3 className="text-slate-900">Pesanan Terbaru</h3>
            <p className="text-slate-400 text-xs mt-0.5">Transaksi terbaru di semua cabang</p>
          </div>
          <Link to="/admin/reports" className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium">Lihat semua <ArrowRight className="h-4 w-4" /></Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full" data-recent>
            <thead>
              <tr className="border-b border-slate-100">
                {['Kode', 'Pelanggan', 'Layanan', 'Cabang', 'Jumlah', 'Pembayaran', 'Status'].map((h) => (
                  <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {(recent.data ?? []).length === 0 && <tr><td colSpan={7} className="px-6 py-8 text-center text-sm text-slate-400">Belum ada pesanan.</td></tr>}
              {(recent.data ?? []).map((o) => (
                <tr key={o.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-slate-900">{o.code}</td>
                  <td className="px-6 py-4"><p className="text-sm text-slate-800 font-medium">{o.customer?.name ?? '-'}</p><p className="text-xs text-slate-400">{o.customer?.phone}</p></td>
                  <td className="px-6 py-4 text-sm text-slate-600">{[...new Set(o.order_items.map((i) => i.service_name))].join(', ')}</td>
                  <td className="px-6 py-4"><span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-full">{o.branch?.name}</span></td>
                  <td className="px-6 py-4 text-sm font-medium text-slate-900">{formatRupiah(o.total)}</td>
                  <td className="px-6 py-4"><StatusBadge status={o.payment_status} size="sm" /></td>
                  <td className="px-6 py-4"><StatusBadge status={o.status} size="sm" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
