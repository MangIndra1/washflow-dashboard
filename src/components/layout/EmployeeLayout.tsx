import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router';
import {
  LayoutDashboard, Plus, Kanban, Search, FileText, History,
  LogOut, Bell, ChevronDown, KeyRound, Waves, Menu, X,
  AlertCircle, CheckCircle, Wallet,
} from 'lucide-react';
import { useAuth } from '@/features/auth/AuthContext';
import { ChangePasswordDialog } from '@/features/auth/ChangePasswordDialog';
import { useActiveOrders } from '@/features/orders/hooks';
import { isOverdue } from '@/features/orders/api';
import { formatJam } from '@/lib/format';

const navItems = [
  { to: '/employee', label: 'Dasbor', icon: LayoutDashboard, exact: true },
  { to: '/employee/new-order', label: 'Pesanan Baru', icon: Plus },
  { to: '/employee/orders', label: 'Papan Pesanan', icon: Kanban },
  { to: '/employee/history', label: 'Riwayat Pesanan', icon: History },
  { to: '/employee/customers', label: 'Pelanggan', icon: Search },
  { to: '/employee/summary', label: 'Ringkasan Harian', icon: FileText },
];

interface Alert { id: string; icon: 'overdue' | 'ready' | 'unpaid'; message: string; to: string }

const alertIcon = {
  overdue: <AlertCircle className="h-4 w-4 text-red-500" />,
  ready: <CheckCircle className="h-4 w-4 text-emerald-500" />,
  unpaid: <Wallet className="h-4 w-4 text-amber-500" />,
};

export default function EmployeeLayout() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showNotif, setShowNotif] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const active = useActiveOrders();
  const alerts: Alert[] = (active.data ?? []).flatMap((o): Alert[] => {
    const who = o.customer?.name ?? 'pelanggan';
    const out: Alert[] = [];
    if (isOverdue(o)) out.push({ id: `${o.id}-late`, icon: 'overdue', message: `${o.code} (${who}) terlambat, batas ${o.due_at ? formatJam(o.due_at) : '-'}`, to: '/employee/orders' });
    if (o.status === 'ready') {
      if (o.payment_status !== 'paid') out.push({ id: `${o.id}-unpaid`, icon: 'unpaid', message: `${o.code} (${who}) siap diambil tetapi belum lunas`, to: `/employee/orders/${o.id}` });
      else out.push({ id: `${o.id}-ready`, icon: 'ready', message: `${o.code} (${who}) siap diambil`, to: '/employee/orders' });
    }
    return out;
  });
  const unreadCount = alerts.length;

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden print:block print:h-auto print:overflow-visible print:bg-white">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-60' : 'w-16'} transition-all duration-300 flex-shrink-0 bg-slate-900 flex flex-col h-full z-30 print:hidden`}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 h-16 border-b border-slate-800">
          <div className="h-8 w-8 rounded-lg bg-emerald-600 flex items-center justify-center flex-shrink-0">
            <Waves className="h-5 w-5 text-white" />
          </div>
          {sidebarOpen && (
            <div>
              <p className="text-white font-semibold text-sm leading-none">WashFlow</p>
              <p className="text-slate-400 text-xs mt-0.5">Portal Staf</p>
            </div>
          )}
        </div>

        {/* Branch badge */}
        {sidebarOpen && currentUser?.branchName && (
          <div className="mx-3 mt-3 px-3 py-2 rounded-lg bg-slate-800 border border-slate-700">
            <p className="text-slate-400 text-xs">Cabang Saat Ini</p>
            <p className="text-slate-100 text-sm font-medium mt-0.5">{currentUser.branchName}</p>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-0.5">
          {sidebarOpen && (
            <p className="px-2 mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
              Operasional
            </p>
          )}
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.exact}
              className={({ isActive }) =>
                `flex items-center gap-3 px-2 py-2.5 rounded-lg text-sm font-medium transition-colors group ${
                  isActive
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon className={`h-4.5 w-4.5 flex-shrink-0 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`} />
                  {sidebarOpen && <span>{item.label}</span>}
                  {item.to === '/employee/new-order' && sidebarOpen && (
                    <span className="ml-auto h-5 w-5 rounded-full bg-emerald-500 flex items-center justify-center">
                      <Plus className="h-3 w-3 text-white" />
                    </span>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Bottom: User */}
        <div className="border-t border-slate-800 p-3">
          {sidebarOpen ? (
            <div className="flex items-center gap-3 px-1">
              <div className="h-8 w-8 rounded-full bg-emerald-600 flex items-center justify-center flex-shrink-0">
                <span className="text-white text-xs font-semibold">
                  {currentUser?.avatar || 'EM'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-xs font-medium truncate">{currentUser?.name || 'Karyawan'}</p>
                <p className="text-slate-400 text-xs truncate">{currentUser?.branchName || 'Cabang'}</p>
              </div>
              <button onClick={handleLogout} aria-label="Keluar" title="Keluar" className="text-slate-400 hover:text-red-400 transition-colors">
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button onClick={handleLogout} aria-label="Keluar" title="Keluar" className="flex items-center justify-center w-full text-slate-400 hover:text-red-400 p-1">
              <LogOut className="h-4 w-4" />
            </button>
          )}
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden print:block print:overflow-visible">
        {/* Topbar */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 flex-shrink-0 relative z-50 print:hidden">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label={sidebarOpen ? 'Tutup menu samping' : 'Buka menu samping'}
              className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
            >
              {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Staf</span>
          </div>

          <div className="flex items-center gap-3">
            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => { setShowNotif(!showNotif); setShowProfile(false); }}
                aria-label="Notifikasi"
                className="relative p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 h-4 w-4 bg-red-500 rounded-full text-white text-xs flex items-center justify-center font-semibold leading-none">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {showNotif && (
                <div className="absolute right-0 top-12 w-80 bg-white rounded-xl border border-slate-200 shadow-xl z-50">
                  <div className="flex items-center justify-between p-4 border-b border-slate-100">
                    <p className="text-sm font-semibold text-slate-900">Notifikasi</p>
                    <span className="text-xs text-slate-400">{alerts.length} perlu perhatian</span>
                  </div>
                  <div className="divide-y divide-slate-50">
                    {alerts.length === 0 && <p className="p-4 text-xs text-slate-400">Tidak ada yang perlu ditangani.</p>}
                    {alerts.map(n => (
                      <button key={n.id} type="button" onClick={() => { setShowNotif(false); navigate(n.to); }} className="flex w-full items-start gap-3 p-3 text-left hover:bg-slate-50">
                        <div className="mt-0.5 flex-shrink-0">{alertIcon[n.icon]}</div>
                        <p className="flex-1 min-w-0 text-xs text-slate-700 font-medium leading-snug">{n.message}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Profile */}
            <div className="relative">
              <button
                onClick={() => { setShowProfile(!showProfile); setShowNotif(false); }}
                className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <div className="h-8 w-8 rounded-full bg-emerald-600 flex items-center justify-center">
                  <span className="text-white text-xs font-semibold">{currentUser?.avatar || 'EM'}</span>
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-xs font-semibold text-slate-800">{currentUser?.name || 'Staf'}</p>
                  <p className="text-xs text-slate-400">{currentUser?.branchName || 'Cabang'}</p>
                </div>
                <ChevronDown className="h-4 w-4 text-slate-400" />
              </button>

              {showProfile && (
                <div className="absolute right-0 top-12 w-48 bg-white rounded-xl border border-slate-200 shadow-xl z-50 py-1">
                  <div className="px-4 py-3 border-b border-slate-100">
                    <p className="text-xs font-semibold text-slate-800">{currentUser?.name}</p>
                    <p className="text-xs text-slate-400">{currentUser?.branchName}</p>
                  </div>
                  <div className="py-1">
                    <button
                      onClick={() => { setShowProfile(false); setShowPassword(true); }}
                      className="flex items-center gap-2 w-full px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
                    >
                      <KeyRound className="h-4 w-4" /> Ganti kata sandi
                    </button>
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-500 hover:bg-red-50"
                    >
                      <LogOut className="h-4 w-4" /> Keluar
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-slate-50 print:overflow-visible print:bg-white">
          <div className="p-6 print:p-0">
            <Outlet />
          </div>
        </main>
      </div>

      {showPassword && currentUser && (
        <ChangePasswordDialog email={currentUser.email} onClose={() => setShowPassword(false)} />
      )}

      {(showNotif || showProfile) && (
        <div className="fixed inset-0 z-40" onClick={() => { setShowNotif(false); setShowProfile(false); }} />
      )}
    </div>
  );
}