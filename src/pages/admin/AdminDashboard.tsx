import { useState } from 'react';
import { revenueData, branchPerformance, serviceBreakdown, orders, branches, inventory } from '@/data/mockData';
import { formatRupiah, formatRupiahRingkas, formatAngka, formatTanggal } from '@/lib/format';
import { MetricCard } from '@/components/shared/MetricCard';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Banknote, ShoppingBag, Building2, TrendingUp, AlertCircle, Clock, ArrowRight } from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';

const PIE_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444'];

type Period = 'weekly' | 'monthly';

export default function AdminDashboard() {
  const [period, setPeriod] = useState<Period>('weekly');
  const chartData = period === 'weekly' ? revenueData.weekly : revenueData.monthly;
  const xKey = period === 'weekly' ? 'date' : 'month';

  const recentOrders = orders.slice(0, 6);
  const overdueOrders = orders.filter(o => o.status !== 'completed' && o.dueDate < '2026-02-28');
  const lowStockCount = inventory.filter(i => i.currentStock < i.minStock).length;
  const maintenanceBranches = branches.filter(b => b.status === 'maintenance');
  const todayRevenue = revenueData.weekly[revenueData.weekly.length - 1];
  const thisMonth = revenueData.monthly[revenueData.monthly.length - 1];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-slate-900">Ringkasan Bisnis</h1>
          <p className="text-slate-500 text-sm mt-1">Jumat, 27 Februari 2026. Semua cabang</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 transition-colors shadow-sm">
            <Clock className="h-4 w-4" /> 30 hari terakhir
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700 transition-colors shadow-sm shadow-blue-200">
            Ekspor Laporan
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <MetricCard
          title="Pendapatan Hari Ini"
          value={formatRupiah(todayRevenue.revenue)}
          subtitle={`${todayRevenue.orders} pesanan selesai`}
          change={12.3}
          changeLabel="dibanding kemarin"
          icon={Banknote}
          iconBg="bg-blue-100"
          iconColor="text-blue-600"
          accent="bg-blue-500"
        />
        <MetricCard
          title="Pendapatan Bulan Ini"
          value={formatRupiah(thisMonth.revenue)}
          subtitle={`${formatAngka(thisMonth.orders)} total pesanan`}
          change={18.7}
          changeLabel="dibanding bulan lalu"
          icon={TrendingUp}
          iconBg="bg-emerald-100"
          iconColor="text-emerald-600"
          accent="bg-emerald-500"
        />
        <MetricCard
          title="Pesanan Aktif"
          value="18"
          subtitle="Di semua cabang"
          change={-5.2}
          changeLabel="dibanding kemarin"
          icon={ShoppingBag}
          iconBg="bg-amber-100"
          iconColor="text-amber-600"
          accent="bg-amber-500"
        />
        <MetricCard
          title="Cabang Aktif"
          value={`${branches.filter(b => b.status === 'active').length} / ${branches.length}`}
          subtitle={`${branches.filter(b => b.status !== 'active').length} sedang dalam perbaikan`}
          icon={Building2}
          iconBg="bg-purple-100"
          iconColor="text-purple-600"
          accent="bg-purple-500"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Tren Pendapatan */}
        <div className="xl:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-slate-900">Tren Pendapatan</h3>
              <p className="text-slate-400 text-xs mt-0.5">Total pendapatan pada periode terpilih</p>
            </div>
            <div className="flex rounded-lg border border-slate-200 overflow-hidden text-xs">
              {(['weekly', 'monthly'] as Period[]).map(p => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-3 py-1.5 font-medium transition-colors ${
                    period === p ? 'bg-blue-600 text-white' : 'bg-white text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  {p === 'weekly' ? '7 Hari' : '6 Bulan'}
                </button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey={xKey} tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} tickFormatter={(v) => formatRupiahRingkas(v)} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0F172A', border: 'none', borderRadius: 8, padding: '8px 12px' }}
                labelStyle={{ color: '#94A3B8', fontSize: 11 }}
                itemStyle={{ color: '#F8FAFC', fontSize: 12 }}
                formatter={(v: number) => [formatRupiah(v), 'Pendapatan']}
              />
              <Area type="monotone" dataKey="revenue" stroke="#3B82F6" strokeWidth={2} fill="url(#revenueGradient)" dot={false} activeDot={{ r: 5, fill: '#3B82F6' }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Rincian Layanan */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <div className="mb-4">
            <h3 className="text-slate-900">Rincian Layanan</h3>
            <p className="text-slate-400 text-xs mt-0.5">Pesanan per jenis bulan ini</p>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={serviceBreakdown} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                {serviceBreakdown.map((entry, i) => (
                  <Cell key={entry.name} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: '#0F172A', border: 'none', borderRadius: 8, fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-3">
            {serviceBreakdown.map((s, i) => (
              <div key={s.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[i] }} />
                  <span className="text-xs text-slate-600">{s.name}</span>
                </div>
                <span className="text-xs font-medium text-slate-800">{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Kinerja Cabang + Alerts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Kinerja Cabang */}
        <div className="xl:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-slate-900">Kinerja Cabang</h3>
              <p className="text-slate-400 text-xs mt-0.5">Perbandingan pendapatan bulanan</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={branchPerformance} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis dataKey="branch" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} tickFormatter={(v) => formatRupiahRingkas(v)} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0F172A', border: 'none', borderRadius: 8, padding: '8px 12px' }}
                labelStyle={{ color: '#94A3B8', fontSize: 11 }}
                itemStyle={{ color: '#F8FAFC', fontSize: 12 }}
                formatter={(v: number) => [formatRupiah(v), 'Pendapatan']}
              />
              <Bar dataKey="revenue" fill="#3B82F6" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>

          <div className="grid grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-100">
            {branchPerformance.map(b => (
              <div key={b.branch} className="text-center">
                <p className="text-xs text-slate-400">{b.branch}</p>
                <p className="text-sm font-semibold text-slate-800 mt-0.5">{formatRupiahRingkas(b.revenue)}</p>
                <p className="text-xs text-slate-400">{b.orders} pesanan</p>
              </div>
            ))}
          </div>
        </div>

        {/* Alerts & Overdue */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="h-4 w-4 text-red-500" />
            <h3 className="text-slate-900">Peringatan Aktif</h3>
          </div>
          <div className="space-y-3">
            {overdueOrders.length > 0 && overdueOrders.slice(0, 3).map(o => (
              <div key={o.id} className="flex items-start gap-3 p-3 rounded-lg bg-red-50 border border-red-100">
                <div className="h-7 w-7 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Clock className="h-3.5 w-3.5 text-red-600" />
                </div>
                <div>
                  <p className="text-xs font-medium text-red-800">{o.id}: Terlambat</p>
                  <p className="text-xs text-red-600 mt-0.5">{o.customerName}, {o.serviceName}</p>
                  <p className="text-xs text-red-400 mt-0.5">Jatuh tempo: {formatTanggal(o.dueDate)}</p>
                </div>
              </div>
            ))}
            <div className="p-3 rounded-lg bg-amber-50 border border-amber-100">
              <div className="flex items-start gap-3">
                <div className="h-7 w-7 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <AlertCircle className="h-3.5 w-3.5 text-amber-600" />
                </div>
                <div>
                  <p className="text-xs font-medium text-amber-800">Stok Menipis</p>
                  <p className="text-xs text-amber-600 mt-0.5">{lowStockCount} barang inventaris di bawah stok minimum</p>
                </div>
              </div>
            </div>
            {maintenanceBranches.length > 0 && <div className="p-3 rounded-lg bg-amber-50 border border-amber-100">
              <div className="flex items-start gap-3">
                <div className="h-7 w-7 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Building2 className="h-3.5 w-3.5 text-amber-600" />
                </div>
                <div>
                  <p className="text-xs font-medium text-amber-800">{maintenanceBranches[0]?.name}</p>
                  <p className="text-xs text-amber-600 mt-0.5">Sedang dalam perbaikan, kapasitas berkurang</p>
                </div>
              </div>
            </div>}
          </div>
        </div>
      </div>

      {/* Pesanan Terbaru */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div>
            <h3 className="text-slate-900">Pesanan Terbaru</h3>
            <p className="text-slate-400 text-xs mt-0.5">Transaksi terbaru di semua cabang</p>
          </div>
          <button className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium">
            Lihat semua <ArrowRight className="h-4 w-4" />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                {['ID Pesanan', 'Pelanggan', 'Layanan', 'Cabang', 'Jumlah', 'Pembayaran', 'Status'].map(h => (
                  <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {recentOrders.map(order => (
                <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <span className="text-sm font-medium text-slate-900">{order.id}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-sm text-slate-800 font-medium">{order.customerName}</p>
                      <p className="text-xs text-slate-400">{order.phone}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">{order.serviceName}</td>
                  <td className="px-6 py-4">
                    <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-full">{order.branch}</span>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-slate-900">{formatRupiah(order.total)}</td>
                  <td className="px-6 py-4"><StatusBadge status={order.paymentStatus} size="sm" /></td>
                  <td className="px-6 py-4"><StatusBadge status={order.status} size="sm" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}