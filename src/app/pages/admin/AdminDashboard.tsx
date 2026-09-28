import { useState } from 'react';
import { revenueData, branchPerformance, serviceBreakdown, orders, branches } from '../../data/mockData';
import { MetricCard } from '../../components/ui/MetricCard';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { DollarSign, ShoppingBag, Building2, TrendingUp, AlertCircle, Clock, ArrowRight } from 'lucide-react';
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

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-slate-900">Business Overview</h1>
          <p className="text-slate-500 text-sm mt-1">Friday, February 27, 2026 — All Branches</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 transition-colors shadow-sm">
            <Clock className="h-4 w-4" /> Last 30 days
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700 transition-colors shadow-sm shadow-blue-200">
            Export Report
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <MetricCard
          title="Today's Revenue"
          value="$1,750"
          subtitle="52 orders completed"
          change={12.3}
          changeLabel="vs yesterday"
          icon={DollarSign}
          iconBg="bg-blue-100"
          iconColor="text-blue-600"
          accent="bg-blue-500"
        />
        <MetricCard
          title="Monthly Revenue"
          value="$41,800"
          subtitle="1,240 total orders"
          change={18.7}
          changeLabel="vs last month"
          icon={TrendingUp}
          iconBg="bg-emerald-100"
          iconColor="text-emerald-600"
          accent="bg-emerald-500"
        />
        <MetricCard
          title="Active Orders"
          value="18"
          subtitle="Across all branches"
          change={-5.2}
          changeLabel="vs yesterday"
          icon={ShoppingBag}
          iconBg="bg-amber-100"
          iconColor="text-amber-600"
          accent="bg-amber-500"
        />
        <MetricCard
          title="Active Branches"
          value={`${branches.filter(b => b.status === 'active').length} / ${branches.length}`}
          subtitle={`${branches.filter(b => b.status !== 'active').length} under maintenance`}
          icon={Building2}
          iconBg="bg-purple-100"
          iconColor="text-purple-600"
          accent="bg-purple-500"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Revenue Trend */}
        <div className="xl:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-slate-900">Revenue Trend</h3>
              <p className="text-slate-400 text-xs mt-0.5">Total revenue over selected period</p>
            </div>
            <div className="flex rounded-lg border border-slate-200 overflow-hidden text-xs">
              {(['weekly', 'monthly'] as Period[]).map(p => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-3 py-1.5 font-medium capitalize transition-colors ${
                    period === p ? 'bg-blue-600 text-white' : 'bg-white text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  {p === 'weekly' ? '7 Days' : '6 Months'}
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
              <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0F172A', border: 'none', borderRadius: 8, padding: '8px 12px' }}
                labelStyle={{ color: '#94A3B8', fontSize: 11 }}
                itemStyle={{ color: '#F8FAFC', fontSize: 12 }}
                formatter={(v: number) => [`$${v.toLocaleString()}`, 'Revenue']}
              />
              <Area type="monotone" dataKey="revenue" stroke="#3B82F6" strokeWidth={2} fill="url(#revenueGradient)" dot={false} activeDot={{ r: 5, fill: '#3B82F6' }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Service Breakdown */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <div className="mb-4">
            <h3 className="text-slate-900">Service Breakdown</h3>
            <p className="text-slate-400 text-xs mt-0.5">Orders by type this month</p>
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

      {/* Branch Performance + Alerts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Branch Performance */}
        <div className="xl:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-slate-900">Branch Performance</h3>
              <p className="text-slate-400 text-xs mt-0.5">Monthly revenue comparison</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={branchPerformance} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis dataKey="branch" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0F172A', border: 'none', borderRadius: 8, padding: '8px 12px' }}
                labelStyle={{ color: '#94A3B8', fontSize: 11 }}
                itemStyle={{ color: '#F8FAFC', fontSize: 12 }}
                formatter={(v: number) => [`$${v.toLocaleString()}`, 'Revenue']}
              />
              <Bar dataKey="revenue" fill="#3B82F6" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>

          <div className="grid grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-100">
            {branchPerformance.map(b => (
              <div key={b.branch} className="text-center">
                <p className="text-xs text-slate-400">{b.branch}</p>
                <p className="text-sm font-semibold text-slate-800 mt-0.5">${(b.revenue/1000).toFixed(1)}k</p>
                <p className="text-xs text-slate-400">{b.orders} orders</p>
              </div>
            ))}
          </div>
        </div>

        {/* Alerts & Overdue */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="h-4 w-4 text-red-500" />
            <h3 className="text-slate-900">Active Alerts</h3>
          </div>
          <div className="space-y-3">
            {overdueOrders.length > 0 && overdueOrders.slice(0, 3).map(o => (
              <div key={o.id} className="flex items-start gap-3 p-3 rounded-lg bg-red-50 border border-red-100">
                <div className="h-7 w-7 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Clock className="h-3.5 w-3.5 text-red-600" />
                </div>
                <div>
                  <p className="text-xs font-medium text-red-800">{o.id} — Overdue</p>
                  <p className="text-xs text-red-600 mt-0.5">{o.customerName} · {o.serviceName}</p>
                  <p className="text-xs text-red-400 mt-0.5">Due: {o.dueDate}</p>
                </div>
              </div>
            ))}
            <div className="p-3 rounded-lg bg-amber-50 border border-amber-100">
              <div className="flex items-start gap-3">
                <div className="h-7 w-7 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <AlertCircle className="h-3.5 w-3.5 text-amber-600" />
                </div>
                <div>
                  <p className="text-xs font-medium text-amber-800">Low Stock Warning</p>
                  <p className="text-xs text-amber-600 mt-0.5">2 inventory items below minimum level</p>
                </div>
              </div>
            </div>
            <div className="p-3 rounded-lg bg-amber-50 border border-amber-100">
              <div className="flex items-start gap-3">
                <div className="h-7 w-7 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Building2 className="h-3.5 w-3.5 text-amber-600" />
                </div>
                <div>
                  <p className="text-xs font-medium text-amber-800">Airport Branch</p>
                  <p className="text-xs text-amber-600 mt-0.5">Under maintenance — reduced capacity</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div>
            <h3 className="text-slate-900">Recent Orders</h3>
            <p className="text-slate-400 text-xs mt-0.5">Latest transactions across all branches</p>
          </div>
          <button className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium">
            View all <ArrowRight className="h-4 w-4" />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                {['Order ID', 'Customer', 'Service', 'Branch', 'Amount', 'Payment', 'Status'].map(h => (
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
                  <td className="px-6 py-4 text-sm font-medium text-slate-900">${order.total.toFixed(2)}</td>
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