import { Download, CheckCircle, Clock, DollarSign, ShoppingBag, TrendingUp, Printer, AlertCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { orders, services } from '@/data/mockData';
import { useAuth } from '@/features/auth/AuthContext';
import { StatusBadge } from '@/components/shared/StatusBadge';

const hourlyData = [
  { hour: '8am', orders: 4 }, { hour: '9am', orders: 7 }, { hour: '10am', orders: 9 },
  { hour: '11am', orders: 6 }, { hour: '12pm', orders: 11 }, { hour: '1pm', orders: 8 },
  { hour: '2pm', orders: 5 }, { hour: '3pm', orders: 7 }, { hour: '4pm', orders: 3 },
  { hour: '5pm', orders: 2 },
];

export default function DailySummary() {
  const { currentUser } = useAuth();

  const branchOrders = currentUser?.legacyBranchId
    ? orders.filter(o => o.branchId === currentUser.legacyBranchId)
    : orders;

  const completedOrders = branchOrders.filter(o => o.status === 'completed');
  const activeOrders = branchOrders.filter(o => !['completed'].includes(o.status));
  const overdueOrders = branchOrders.filter(o => o.status !== 'completed' && o.dueDate <= '2026-02-27');

  const totalRevenue = branchOrders.filter(o => o.paymentStatus === 'paid').reduce((s, o) => s + o.total, 0);
  const unpaidTotal = branchOrders.filter(o => o.paymentStatus === 'unpaid').reduce((s, o) => s + o.total, 0);

  // Service breakdown
  const serviceBreak = services.filter(s => s.isActive).map(svc => ({
    name: svc.name,
    count: branchOrders.filter(o => o.serviceId === svc.id).length,
    revenue: branchOrders.filter(o => o.serviceId === svc.id && o.paymentStatus === 'paid').reduce((s, o) => s + o.total, 0),
  })).filter(s => s.count > 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-slate-900">Daily Summary</h1>
          <p className="text-slate-500 text-sm mt-1">
            {currentUser?.branchName} · Friday, February 27, 2026
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 shadow-sm">
            <Printer className="h-4 w-4" /> Print Report
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm hover:bg-emerald-700 shadow-sm shadow-emerald-200">
            <Download className="h-4 w-4" /> Export CSV
          </button>
        </div>
      </div>

      {/* Alerts */}
      {overdueOrders.length > 0 && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 border border-red-200">
          <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700 font-medium">{overdueOrders.length} overdue order(s) need immediate attention before shift end</p>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { label: "Today's Orders", value: branchOrders.length, sub: '4 new this hour', icon: ShoppingBag, bg: 'bg-blue-100', color: 'text-blue-600', accent: 'bg-blue-500' },
          { label: 'Revenue Collected', value: `$${totalRevenue.toFixed(2)}`, sub: 'Cash + digital', icon: DollarSign, bg: 'bg-emerald-100', color: 'text-emerald-600', accent: 'bg-emerald-500' },
          { label: 'Completed', value: completedOrders.length, sub: 'Handed to customers', icon: CheckCircle, bg: 'bg-purple-100', color: 'text-purple-600', accent: 'bg-purple-500' },
          { label: 'Still Active', value: activeOrders.length, sub: `${overdueOrders.length} overdue`, icon: Clock, bg: 'bg-amber-100', color: 'text-amber-600', accent: 'bg-amber-500' },
        ].map(c => (
          <div key={c.label} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 relative overflow-hidden">
            <div className={`absolute top-0 left-0 w-1 h-full rounded-l-xl ${c.accent}`} />
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-slate-400">{c.label}</p>
              <div className={`h-9 w-9 rounded-lg ${c.bg} flex items-center justify-center`}>
                <c.icon className={`h-4.5 w-4.5 ${c.color}`} />
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-900">{c.value}</p>
            <p className="text-xs text-slate-400 mt-0.5">{c.sub}</p>
          </div>
        ))}
      </div>

      {/* Revenue Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Paid Revenue', value: `$${totalRevenue.toFixed(2)}`, pct: '78%', color: 'bg-emerald-500', textColor: 'text-emerald-700' },
          { label: 'Pending (Unpaid)', value: `$${unpaidTotal.toFixed(2)}`, pct: '18%', color: 'bg-red-500', textColor: 'text-red-600' },
          { label: 'Total Potential', value: `$${(totalRevenue + unpaidTotal).toFixed(2)}`, pct: '100%', color: 'bg-blue-500', textColor: 'text-blue-700' },
        ].map(r => (
          <div key={r.label} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-slate-400">{r.label}</p>
              <span className={`text-xs font-bold ${r.textColor}`}>{r.pct}</span>
            </div>
            <p className="text-2xl font-bold text-slate-900">{r.value}</p>
            <div className="mt-3 h-2 bg-slate-100 rounded-full overflow-hidden">
              <div className={`h-full rounded-full ${r.color}`} style={{ width: r.pct }} />
            </div>
          </div>
        ))}
      </div>

      {/* Hourly Chart + Service Breakdown */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Hourly Orders */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <div className="mb-5">
            <h3 className="text-slate-900">Hourly Order Volume</h3>
            <p className="text-slate-400 text-xs mt-0.5">Orders received by hour today</p>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={hourlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis dataKey="hour" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0F172A', border: 'none', borderRadius: 8, padding: '8px 12px' }}
                labelStyle={{ color: '#94A3B8', fontSize: 11 }}
                itemStyle={{ color: '#F8FAFC', fontSize: 12 }}
                formatter={(v: number) => [v, 'Orders']}
              />
              <Bar dataKey="orders" fill="#10B981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Service Breakdown */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <div className="mb-5">
            <h3 className="text-slate-900">Service Breakdown</h3>
            <p className="text-slate-400 text-xs mt-0.5">Orders and revenue by service type</p>
          </div>
          <div className="space-y-3">
            {serviceBreak.length > 0 ? serviceBreak.map(s => (
              <div key={s.name} className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium text-slate-700">{s.name}</p>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-slate-400">{s.count} orders</span>
                      <span className="text-sm font-semibold text-slate-900">${s.revenue.toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.min(100, (s.count / Math.max(...serviceBreak.map(x => x.count))) * 100)}%` }} />
                  </div>
                </div>
              </div>
            )) : (
              <div className="grid grid-cols-2 gap-2">
                {[
                  { name: 'Wash & Fold', count: 6, revenue: 45.50 },
                  { name: 'Express Wash', count: 3, revenue: 36.60 },
                  { name: 'Dry Cleaning', count: 2, revenue: 60.00 },
                  { name: 'Ironing', count: 4, revenue: 20.00 },
                ].map(s => (
                  <div key={s.name}>
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs font-medium text-slate-700 truncate">{s.name}</p>
                      <span className="text-xs text-slate-400">{s.count}</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(s.count / 6) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Today's Complete Order Log */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h3 className="text-slate-900">Today's Order Log</h3>
            <p className="text-slate-400 text-xs mt-0.5">All orders for {currentUser?.branchName} today</p>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="h-2 w-2 rounded-full bg-emerald-500" /> <span className="text-slate-500">Paid</span>
            <div className="h-2 w-2 rounded-full bg-red-400 ml-2" /> <span className="text-slate-500">Unpaid</span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                {['Order ID', 'Customer', 'Service', 'Employee', 'Amount', 'Payment', 'Status'].map(h => (
                  <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {branchOrders.map(o => (
                <tr key={o.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-3.5 text-xs font-mono font-semibold text-slate-700">{o.id}</td>
                  <td className="px-6 py-3.5">
                    <p className="text-sm font-medium text-slate-900">{o.customerName}</p>
                    <p className="text-xs text-slate-400">{o.phone}</p>
                  </td>
                  <td className="px-6 py-3.5 text-sm text-slate-600">{o.serviceName}</td>
                  <td className="px-6 py-3.5 text-sm text-slate-500">{o.employeeName}</td>
                  <td className="px-6 py-3.5 text-sm font-semibold text-slate-900">${o.total.toFixed(2)}</td>
                  <td className="px-6 py-3.5"><StatusBadge status={o.paymentStatus} size="sm" /></td>
                  <td className="px-6 py-3.5"><StatusBadge status={o.status} size="sm" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50 rounded-b-xl">
          <div className="flex items-center gap-6 text-sm">
            <span className="text-slate-500">Total Orders: <span className="font-bold text-slate-900">{branchOrders.length}</span></span>
            <span className="text-slate-500">Completed: <span className="font-bold text-green-700">{completedOrders.length}</span></span>
            <span className="text-slate-500">Active: <span className="font-bold text-amber-700">{activeOrders.length}</span></span>
          </div>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-emerald-500" />
            <span className="text-sm font-bold text-emerald-700">Total Collected: ${totalRevenue.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
