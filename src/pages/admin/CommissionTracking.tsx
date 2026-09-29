import { useState } from 'react';
import { DollarSign, TrendingUp, Users, Download, Filter, Star } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { employees, branches } from '@/data/mockData';

const monthlyCommission = [
  { month: 'Sep', total: 2340 },
  { month: 'Oct', total: 2780 },
  { month: 'Nov', total: 3120 },
  { month: 'Dec', total: 3450 },
  { month: 'Jan', total: 3100 },
  { month: 'Feb', total: 3835 },
];

export default function CommissionTracking() {
  const [filterBranch, setFilterBranch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [payoutMonth] = useState('February 2026');

  const filtered = employees.filter(e => {
    const matchBranch = !filterBranch || e.branchId === filterBranch;
    const matchStatus = !filterStatus || e.status === filterStatus;
    return matchBranch && matchStatus;
  });

  const totalCommission = filtered.reduce((s, e) => s + e.totalCommission, 0);
  const totalOrders = filtered.reduce((s, e) => s + e.ordersHandled, 0);
  const avgRate = filtered.length > 0 ? filtered.reduce((s, e) => s + e.commissionRate, 0) / filtered.length : 0;

  const topEarner = [...employees].sort((a, b) => b.totalCommission - a.totalCommission)[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-slate-900">Commission Tracking</h1>
          <p className="text-slate-500 text-sm mt-1">Employee commission calculation and payout management</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-500 bg-white border border-slate-200 px-3 py-2 rounded-lg">
            Period: <span className="font-medium text-slate-800">{payoutMonth}</span>
          </span>
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700 shadow-sm shadow-blue-200">
            <Download className="h-4 w-4" /> Export Payroll
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { label: 'Total Commission Owed', value: `$${totalCommission.toLocaleString()}`, sub: `${filtered.length} employees`, icon: DollarSign, color: 'blue' },
          { label: 'Total Orders Handled', value: totalOrders.toLocaleString(), sub: 'This month', icon: TrendingUp, color: 'emerald' },
          { label: 'Active Employees', value: employees.filter(e => e.status === 'active').length, sub: 'Eligible for commission', icon: Users, color: 'purple' },
          { label: 'Avg Commission Rate', value: `${avgRate.toFixed(1)}%`, sub: 'Across all employees', icon: Star, color: 'amber' },
        ].map(c => (
          <div key={c.label} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-slate-400">{c.label}</p>
              <div className={`h-9 w-9 rounded-lg bg-${c.color}-100 flex items-center justify-center`}>
                <c.icon className={`h-4.5 w-4.5 text-${c.color}-600`} />
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-900">{c.value}</p>
            <p className="text-xs text-slate-400 mt-0.5">{c.sub}</p>
          </div>
        ))}
      </div>

      {/* Top Earner + Chart */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Top Earner Spotlight */}
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-6 text-white">
          <div className="flex items-center gap-2 mb-4">
            <Star className="h-5 w-5 text-blue-200" />
            <p className="text-blue-200 text-sm font-medium">Top Earner This Month</p>
          </div>
          <div className="flex items-center gap-3 mb-4">
            <div className="h-14 w-14 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-lg">
              {topEarner.avatar}
            </div>
            <div>
              <p className="text-white font-bold text-lg">{topEarner.name}</p>
              <p className="text-blue-200 text-sm">{topEarner.role}</p>
              <p className="text-blue-300 text-xs">{topEarner.branchName} Branch</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/10 rounded-lg p-3">
              <p className="text-blue-200 text-xs">Commission</p>
              <p className="text-white font-bold text-xl mt-0.5">${topEarner.totalCommission}</p>
            </div>
            <div className="bg-white/10 rounded-lg p-3">
              <p className="text-blue-200 text-xs">Orders</p>
              <p className="text-white font-bold text-xl mt-0.5">{topEarner.ordersHandled}</p>
            </div>
          </div>
        </div>

        {/* Commission by Month Chart */}
        <div className="xl:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <div className="mb-4">
            <h3 className="text-slate-900">Commission Trend</h3>
            <p className="text-slate-400 text-xs mt-0.5">Total payroll commission over 6 months</p>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={monthlyCommission}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0F172A', border: 'none', borderRadius: 8, padding: '8px 12px' }}
                labelStyle={{ color: '#94A3B8', fontSize: 11 }}
                itemStyle={{ color: '#F8FAFC', fontSize: 12 }}
                formatter={(v: number) => [`$${v.toLocaleString()}`, 'Commission']}
              />
              <Bar dataKey="total" fill="#3B82F6" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Commission Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div>
            <h3 className="text-slate-900">Commission Detail — {payoutMonth}</h3>
            <p className="text-slate-400 text-xs mt-0.5">Individual breakdown per employee</p>
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-slate-400" />
            <select className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500" value={filterBranch} onChange={e => setFilterBranch(e.target.value)}>
              <option value="">All Branches</option>
              {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
            <select className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                {['Employee', 'Branch', 'Role', 'Orders Handled', 'Commission Rate', 'Commission Owed', 'Payout Status'].map(h => (
                  <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map(emp => (
                <tr key={emp.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-xs font-semibold">{emp.avatar}</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-900">{emp.name}</p>
                        <p className="text-xs text-slate-400">{emp.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-full font-medium">{emp.branchName}</span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">{emp.role}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-slate-900">{emp.ordersHandled}</td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-medium text-blue-700">{emp.commissionRate}%</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-bold text-emerald-700">${emp.totalCommission.toLocaleString()}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${emp.status === 'active' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'}`}>
                      {emp.status === 'active' ? 'Pending Payout' : 'Inactive'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50">
          <p className="text-sm text-slate-500">{filtered.length} employees</p>
          <div className="flex items-center gap-6">
            <div className="text-right">
              <p className="text-xs text-slate-400">Total Commission to Pay</p>
              <p className="text-base font-bold text-blue-700">${totalCommission.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
