import { useState } from 'react';
import { Download, Calendar, DollarSign, TrendingUp, ShoppingBag, CreditCard, Filter } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, Legend,
} from 'recharts';
import { orders, branchPerformance } from '../../data/mockData';
import { StatusBadge } from '../../components/ui/StatusBadge';

const monthlyData = [
  { month: 'Sep', revenue: 28400, expenses: 12000, profit: 16400, orders: 820 },
  { month: 'Oct', revenue: 31200, expenses: 13500, profit: 17700, orders: 940 },
  { month: 'Nov', revenue: 34600, expenses: 14200, profit: 20400, orders: 1050 },
  { month: 'Dec', revenue: 38900, expenses: 16000, profit: 22900, orders: 1180 },
  { month: 'Jan', revenue: 35200, expenses: 14800, profit: 20400, orders: 1050 },
  { month: 'Feb', revenue: 41800, expenses: 17200, profit: 24600, orders: 1240 },
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
  const avgOrderValue = filteredOrders.length > 0 ? totalRevenue / filteredOrders.filter(o => o.paymentStatus === 'paid').length : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-slate-900">Financial Reports</h1>
          <p className="text-slate-500 text-sm mt-1">Revenue analytics, transaction history, and payment tracking</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 shadow-sm">
            <Calendar className="h-4 w-4" /> Custom Range
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700 shadow-sm shadow-blue-200">
            <Download className="h-4 w-4" /> Export CSV
          </button>
        </div>
      </div>

      {/* Period Selector */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-slate-500 font-medium">Period:</span>
        {(['7d', '30d', '3m', '6m'] as Period[]).map(p => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${period === p ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
          >
            {p === '7d' ? '7 Days' : p === '30d' ? '30 Days' : p === '3m' ? '3 Months' : '6 Months'}
          </button>
        ))}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { title: 'Total Revenue (Paid)', value: `$${totalRevenue.toFixed(2)}`, icon: DollarSign, color: 'blue', change: '+18.7%' },
          { title: 'Outstanding (Unpaid)', value: `$${unpaidRevenue.toFixed(2)}`, icon: CreditCard, color: 'red', change: '-3.2%' },
          { title: 'Total Transactions', value: filteredOrders.length, icon: ShoppingBag, color: 'emerald', change: '+12.1%' },
          { title: 'Avg Order Value', value: `$${avgOrderValue.toFixed(2)}`, icon: TrendingUp, color: 'purple', change: '+5.8%' },
        ].map(card => (
          <div key={card.title} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-slate-400">{card.title}</p>
              <div className={`h-9 w-9 rounded-lg bg-${card.color}-100 flex items-center justify-center`}>
                <card.icon className={`h-4.5 w-4.5 text-${card.color}-600`} />
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-900">{card.value}</p>
            <p className={`text-xs mt-1 font-medium ${card.change.startsWith('+') ? 'text-emerald-600' : 'text-red-500'}`}>{card.change} vs last period</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Revenue vs Profit */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <div className="mb-6">
            <h3 className="text-slate-900">Revenue & Profit Trend</h3>
            <p className="text-slate-400 text-xs mt-0.5">6-month comparison</p>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0F172A', border: 'none', borderRadius: 8, padding: '8px 12px' }}
                labelStyle={{ color: '#94A3B8', fontSize: 11 }}
                itemStyle={{ fontSize: 12 }}
                formatter={(v: number) => [`$${v.toLocaleString()}`, '']}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="revenue" stroke="#3B82F6" strokeWidth={2} dot={false} name="Revenue" />
              <Line type="monotone" dataKey="profit" stroke="#10B981" strokeWidth={2} dot={false} name="Profit" />
              <Line type="monotone" dataKey="expenses" stroke="#EF4444" strokeWidth={2} dot={false} name="Expenses" strokeDasharray="4 4" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Branch Revenue */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <div className="mb-6">
            <h3 className="text-slate-900">Revenue by Branch</h3>
            <p className="text-slate-400 text-xs mt-0.5">Monthly revenue breakdown</p>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={branchPerformance} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
              <YAxis type="category" dataKey="branch" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} width={70} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0F172A', border: 'none', borderRadius: 8, padding: '8px 12px' }}
                labelStyle={{ color: '#94A3B8', fontSize: 11 }}
                itemStyle={{ color: '#F8FAFC', fontSize: 12 }}
                formatter={(v: number) => [`$${v.toLocaleString()}`, 'Revenue']}
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
            <h3 className="text-slate-900">Transaction History</h3>
            <p className="text-slate-400 text-xs mt-0.5">{filteredOrders.length} transactions</p>
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-slate-400" />
            <select className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500" value={filterBranch} onChange={e => setFilterBranch(e.target.value)}>
              <option value="">All Branches</option>
              {['Downtown', 'Mall', 'Suburb', 'Airport'].map(b => <option key={b} value={b.toLowerCase()}>{b}</option>)}
            </select>
            <select className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500" value={filterPayment} onChange={e => setFilterPayment(e.target.value)}>
              <option value="">All Payment</option>
              <option value="paid">Paid</option>
              <option value="unpaid">Unpaid</option>
              <option value="partial">Partial</option>
            </select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                {['Date', 'Order ID', 'Customer', 'Service', 'Branch', 'Amount', 'Payment', 'Status'].map(h => (
                  <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredOrders.map(order => (
                <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-3.5 text-xs text-slate-500">{order.createdAt}</td>
                  <td className="px-6 py-3.5 text-xs font-medium text-slate-800">{order.id}</td>
                  <td className="px-6 py-3.5">
                    <p className="text-sm text-slate-800 font-medium">{order.customerName}</p>
                    <p className="text-xs text-slate-400">{order.phone}</p>
                  </td>
                  <td className="px-6 py-3.5 text-sm text-slate-600">{order.serviceName}</td>
                  <td className="px-6 py-3.5">
                    <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{order.branch}</span>
                  </td>
                  <td className="px-6 py-3.5 text-sm font-semibold text-slate-900">${order.total.toFixed(2)}</td>
                  <td className="px-6 py-3.5"><StatusBadge status={order.paymentStatus} size="sm" /></td>
                  <td className="px-6 py-3.5"><StatusBadge status={order.status} size="sm" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Footer totals */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50">
          <p className="text-sm text-slate-500">{filteredOrders.length} transactions shown</p>
          <div className="flex items-center gap-6">
            <div className="text-right">
              <p className="text-xs text-slate-400">Total Collected</p>
              <p className="text-sm font-bold text-emerald-700">${totalRevenue.toFixed(2)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-400">Outstanding</p>
              <p className="text-sm font-bold text-red-500">${unpaidRevenue.toFixed(2)}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
