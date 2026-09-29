import { useState } from 'react';
import { Download, Calendar, Banknote, TrendingUp, ShoppingBag, CreditCard, Filter } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, Legend,
} from 'recharts';
import { orders, branchPerformance } from '@/data/mockData';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { formatRupiah, formatRupiahRingkas, formatAngka, formatTanggal } from '@/lib/format';

const monthlyData = [
  { month: 'Sep', revenue: 56800000, expenses: 24000000, profit: 32800000, orders: 820 },
  { month: 'Okt', revenue: 62400000, expenses: 27000000, profit: 35400000, orders: 940 },
  { month: 'Nov', revenue: 69200000, expenses: 28400000, profit: 40800000, orders: 1050 },
  { month: 'Des', revenue: 77800000, expenses: 32000000, profit: 45800000, orders: 1180 },
  { month: 'Jan', revenue: 70400000, expenses: 29600000, profit: 40800000, orders: 1050 },
  { month: 'Feb', revenue: 83600000, expenses: 34400000, profit: 49200000, orders: 1240 },
];

type Period = '7d' | '30d' | '3m' | '6m';

export default function FinancialReports() {
  const [period, setPeriod] = useState<Period>('30d');
  const [filterBranch, setFilterBranch] = useState('');
  const [filterPayment, setFilterPayment] = useState('');

  const filteredOrders = orders.filter(o => {
    const matchBranch = !filterBranch || o.branch.toLowerCase() === filterBranch.toLowerCase();
    const matchPayment = !filterPayment || o.paymentStatus === filterPayment;
    return matchBranch && matchPayment;
  });

  const totalRevenue = filteredOrders.filter(o => o.paymentStatus === 'paid').reduce((s, o) => s + o.total, 0);
  const unpaidRevenue = filteredOrders.filter(o => o.paymentStatus === 'unpaid').reduce((s, o) => s + o.total, 0);
  const paidCount = filteredOrders.filter(o => o.paymentStatus === 'paid').length;
  const avgOrderValue = paidCount > 0 ? totalRevenue / paidCount : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-slate-900">Laporan Keuangan</h1>
          <p className="text-slate-500 text-sm mt-1">Analisis pendapatan, riwayat transaksi, dan pelacakan pembayaran</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 shadow-sm">
            <Calendar className="h-4 w-4" /> Rentang Kustom
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700 shadow-sm shadow-blue-200">
            <Download className="h-4 w-4" /> Ekspor CSV
          </button>
        </div>
      </div>

      {/* Period Selector */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-slate-500 font-medium">Periode:</span>
        {(['7d', '30d', '3m', '6m'] as Period[]).map(p => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${period === p ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
          >
            {p === '7d' ? '7 Hari' : p === '30d' ? '30 Hari' : p === '3m' ? '3 Bulan' : '6 Bulan'}
          </button>
        ))}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { title: 'Total Pendapatan (Lunas)', value: formatRupiah(totalRevenue), icon: Banknote, color: 'blue', change: '+18.7%' },
          { title: 'Belum Dibayar', value: formatRupiah(unpaidRevenue), icon: CreditCard, color: 'red', change: '-3.2%' },
          { title: 'Total Transaksi', value: formatAngka(filteredOrders.length), icon: ShoppingBag, color: 'emerald', change: '+12.1%' },
          { title: 'Rata-rata Nilai Pesanan', value: formatRupiah(avgOrderValue), icon: TrendingUp, color: 'purple', change: '+5.8%' },
        ].map(card => (
          <div key={card.title} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-slate-400">{card.title}</p>
              <div className={`h-9 w-9 rounded-lg bg-${card.color}-100 flex items-center justify-center`}>
                <card.icon className={`h-4.5 w-4.5 text-${card.color}-600`} />
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-900">{card.value}</p>
            <p className={`text-xs mt-1 font-medium ${card.change.startsWith('+') ? 'text-emerald-600' : 'text-red-500'}`}>{card.change} dibanding periode lalu</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Revenue vs Profit */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <div className="mb-6">
            <h3 className="text-slate-900">Tren Pendapatan dan Laba</h3>
            <p className="text-slate-400 text-xs mt-0.5">Perbandingan 6 bulan</p>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} tickFormatter={v => formatRupiahRingkas(v)} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0F172A', border: 'none', borderRadius: 8, padding: '8px 12px' }}
                labelStyle={{ color: '#94A3B8', fontSize: 11 }}
                itemStyle={{ fontSize: 12 }}
                formatter={(v: number, name: string) => [formatRupiah(v), name]}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="revenue" stroke="#3B82F6" strokeWidth={2} dot={false} name="Pendapatan" />
              <Line type="monotone" dataKey="profit" stroke="#10B981" strokeWidth={2} dot={false} name="Laba" />
              <Line type="monotone" dataKey="expenses" stroke="#EF4444" strokeWidth={2} dot={false} name="Pengeluaran" strokeDasharray="4 4" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Branch Revenue */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <div className="mb-6">
            <h3 className="text-slate-900">Pendapatan per Cabang</h3>
            <p className="text-slate-400 text-xs mt-0.5">Rincian pendapatan bulanan</p>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={branchPerformance} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} tickFormatter={v => formatRupiahRingkas(v)} />
              <YAxis type="category" dataKey="branch" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} width={70} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0F172A', border: 'none', borderRadius: 8, padding: '8px 12px' }}
                labelStyle={{ color: '#94A3B8', fontSize: 11 }}
                itemStyle={{ color: '#F8FAFC', fontSize: 12 }}
                formatter={(v: number) => [formatRupiah(v), 'Pendapatan']}
              />
              <Bar dataKey="revenue" fill="#3B82F6" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Transaction Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div>
            <h3 className="text-slate-900">Riwayat Transaksi</h3>
            <p className="text-slate-400 text-xs mt-0.5">{filteredOrders.length} transaksi</p>
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-slate-400" />
            <select className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500" value={filterBranch} onChange={e => setFilterBranch(e.target.value)}>
              <option value="">Semua Cabang</option>
              {branchPerformance.map(p => p.branch).map(b => <option key={b} value={b.toLowerCase()}>{b}</option>)}
            </select>
            <select className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500" value={filterPayment} onChange={e => setFilterPayment(e.target.value)}>
              <option value="">Semua Pembayaran</option>
              <option value="paid">Lunas</option>
              <option value="unpaid">Belum Dibayar</option>
              <option value="partial">Sebagian</option>
            </select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                {['Tanggal', 'ID Pesanan', 'Pelanggan', 'Layanan', 'Cabang', 'Jumlah', 'Pembayaran', 'Status'].map(h => (
                  <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredOrders.map(order => (
                <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-3.5 text-xs text-slate-500">{formatTanggal(order.createdAt)}</td>
                  <td className="px-6 py-3.5 text-xs font-medium text-slate-800">{order.id}</td>
                  <td className="px-6 py-3.5">
                    <p className="text-sm text-slate-800 font-medium">{order.customerName}</p>
                    <p className="text-xs text-slate-400">{order.phone}</p>
                  </td>
                  <td className="px-6 py-3.5 text-sm text-slate-600">{order.serviceName}</td>
                  <td className="px-6 py-3.5">
                    <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{order.branch}</span>
                  </td>
                  <td className="px-6 py-3.5 text-sm font-semibold text-slate-900">{formatRupiah(order.total)}</td>
                  <td className="px-6 py-3.5"><StatusBadge status={order.paymentStatus} size="sm" /></td>
                  <td className="px-6 py-3.5"><StatusBadge status={order.status} size="sm" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Footer totals */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50">
          <p className="text-sm text-slate-500">{filteredOrders.length} transaksi ditampilkan</p>
          <div className="flex items-center gap-6">
            <div className="text-right">
              <p className="text-xs text-slate-400">Total Diterima</p>
              <p className="text-sm font-bold text-emerald-700">{formatRupiah(totalRevenue)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-400">Belum Dibayar</p>
              <p className="text-sm font-bold text-red-500">{formatRupiah(unpaidRevenue)}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
