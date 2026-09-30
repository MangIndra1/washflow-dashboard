import { useMemo } from 'react';
import { Link, useNavigate } from 'react-router';
import { ShoppingBag, CheckCircle, Clock, Banknote, AlertCircle, ArrowRight, Plus } from 'lucide-react';

import { EmptyState, ErrorPanel } from '@/components/shared/QueryStatus';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { useAuth } from '@/features/auth/AuthContext';
import { dayRange, useActiveOrders, useDayOrders, useDayPayments } from '@/features/orders/hooks';
import { summarizeDay } from '@/features/orders/summary';
import { pesanError } from '@/lib/errors';
import { formatJam, formatRupiah, formatTanggalLengkap } from '@/lib/format';

const statusSteps = [
  { status: 'received', label: 'Diterima', color: 'bg-slate-500' },
  { status: 'washing', label: 'Dicuci', color: 'bg-blue-500' },
  { status: 'drying', label: 'Dikeringkan', color: 'bg-cyan-500' },
  { status: 'ironing', label: 'Disetrika', color: 'bg-orange-500' },
  { status: 'ready', label: 'Siap', color: 'bg-emerald-500' },
] as const;

export default function EmployeeDashboard() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const range = useMemo(() => dayRange(), []);
  const active = useActiveOrders();
  const day = useDayOrders(range);
  const pays = useDayPayments(range);

  const error = active.error ?? day.error ?? pays.error;
  const loading = active.isLoading || day.isLoading || pays.isLoading;
  const stats = useMemo(
    () => summarizeDay(day.data ?? [], pays.data ?? [], active.data ?? [], range),
    [day.data, pays.data, active.data, range],
  );

  const cards = [
    { title: 'Pesanan Hari Ini', value: stats.created.length, sub: 'Diterima hari ini', icon: ShoppingBag, bg: 'bg-emerald-100', color: 'text-emerald-600' },
    { title: 'Pendapatan Hari Ini', value: formatRupiah(stats.received), sub: 'Pembayaran diterima', icon: Banknote, bg: 'bg-blue-100', color: 'text-blue-600' },
    { title: 'Pesanan Aktif', value: stats.active.length, sub: 'Sedang diproses', icon: Clock, bg: 'bg-amber-100', color: 'text-amber-600' },
    { title: 'Selesai Hari Ini', value: stats.completedToday.length, sub: 'Sudah diambil', icon: CheckCircle, bg: 'bg-purple-100', color: 'text-purple-600' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-slate-900">Dasbor</h1>
          <p className="text-slate-500 text-sm mt-1">{currentUser?.branchName || 'Cabang'}, {formatTanggalLengkap()}</p>
        </div>
        <button
          onClick={() => navigate('/employee/new-order')}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-600 text-white text-sm hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-200"
        >
          <Plus className="h-4 w-4" /> Pesanan Baru
        </button>
      </div>

      {error ? (
        <ErrorPanel message={pesanError(error, 'Gagal memuat data dasbor.')} onRetry={() => { void active.refetch(); void day.refetch(); void pays.refetch(); }} />
      ) : (
        <>
          {stats.overdue.length > 0 && (
            <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-200">
              <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-red-800">{stats.overdue.length} pesanan terlambat</p>
                <p className="text-sm text-red-600 mt-0.5">
                  {stats.overdue.slice(0, 5).map((o) => o.code).join(', ')}
                  {stats.overdue.length > 5 && ` dan ${stats.overdue.length - 5} lainnya`}. Perlu segera ditangani.
                </p>
              </div>
              <button onClick={() => navigate('/employee/orders')} className="ml-auto flex items-center gap-1 text-xs text-red-600 font-medium whitespace-nowrap hover:text-red-800">
                Lihat Pesanan <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            {cards.map((c) => (
              <div key={c.title} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm text-slate-400">{c.title}</p>
                  <div className={`h-9 w-9 rounded-lg ${c.bg} flex items-center justify-center`}>
                    <c.icon className={`h-4.5 w-4.5 ${c.color}`} />
                  </div>
                </div>
                {loading ? <div className="h-8 w-20 animate-pulse rounded bg-slate-100" role="status" aria-label="Memuat" /> : <p className="text-2xl font-bold text-slate-900">{c.value}</p>}
                <p className="text-xs text-slate-400 mt-0.5">{c.sub}</p>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-slate-900">Alur Pesanan</h3>
                <p className="text-slate-400 text-xs mt-0.5">Pesanan aktif menurut status</p>
              </div>
              <button onClick={() => navigate('/employee/orders')} className="flex items-center gap-1.5 text-sm text-emerald-600 font-medium hover:text-emerald-700">
                Lihat Papan <ArrowRight className="h-4 w-4" />
              </button>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
              {statusSteps.map((s) => (
                <div key={s.status} className="text-center">
                  <div className={`h-12 w-12 rounded-xl ${s.color} flex items-center justify-center mx-auto mb-2`}>
                    <span className="text-white font-bold text-lg">{stats.active.filter((o) => o.status === s.status).length}</span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <h3 className="text-slate-900 mb-4">Aksi Cepat</h3>
              <div className="space-y-3">
                {[
                  { label: 'Buat Pesanan Baru', icon: Plus, color: 'bg-emerald-600 hover:bg-emerald-700', to: '/employee/new-order' },
                  { label: 'Lihat Papan Pesanan', icon: ShoppingBag, color: 'bg-blue-600 hover:bg-blue-700', to: '/employee/orders' },
                  { label: 'Cari Pelanggan', icon: CheckCircle, color: 'bg-slate-700 hover:bg-slate-800', to: '/employee/customers' },
                  { label: 'Ringkasan Harian', icon: Banknote, color: 'bg-purple-600 hover:bg-purple-700', to: '/employee/summary' },
                ].map((a) => (
                  <button key={a.label} onClick={() => navigate(a.to)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-white text-sm font-medium ${a.color} transition-colors`}>
                    <a.icon className="h-4 w-4" /> {a.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="xl:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between p-6 border-b border-slate-100">
                <h3 className="text-slate-900">Pesanan Hari Ini</h3>
                <button onClick={() => navigate('/employee/orders')} className="text-sm text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1">
                  Lihat Semua <ArrowRight className="h-4 w-4" />
                </button>
              </div>
              {stats.created.length === 0 && !loading ? (
                <div className="p-6"><EmptyState title="Belum ada pesanan hari ini" hint="Pesanan yang dibuat hari ini akan muncul di sini" /></div>
              ) : (
                <div className="divide-y divide-slate-50">
                  {stats.created.slice(0, 8).map((o) => (
                    <Link key={o.id} to={`/employee/orders/${o.id}`} className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50 transition-colors">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="text-xs font-semibold text-slate-500">{o.code}</p>
                          <p className="text-xs text-slate-400">{formatJam(o.created_at)}</p>
                          {o.notes && <span className="text-xs text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">Ada catatan</span>}
                        </div>
                        <p className="text-sm font-medium text-slate-900">{o.customer?.name ?? 'Pelanggan dihapus'}</p>
                        <p className="text-xs text-slate-400 truncate">{o.order_items.map((i) => i.service_name).join(', ')}</p>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <p className="text-sm font-semibold text-slate-900">{formatRupiah(o.total)}</p>
                        <StatusBadge status={o.status} size="sm" />
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
