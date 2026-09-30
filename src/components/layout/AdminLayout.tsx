import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router';
import {
  LayoutDashboard, Building2, Users, Tag, BarChart3,
  Package, Banknote, Star, Percent, LogOut,
  Bell, ChevronDown, KeyRound, Waves, Menu, X, AlertCircle, Wrench, Settings,
} from 'lucide-react';
import { useAuth } from '@/features/auth/AuthContext';
import { ChangePasswordDialog } from '@/features/auth/ChangePasswordDialog';
import { useBranches } from '@/features/branches/hooks';
import { useOverdueOrders } from '@/features/reports/hooks';
import { formatTanggalJam } from '@/lib/format';

interface NavItem {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  exact?: boolean;
}

const navSections: { label: string; items: NavItem[] }[] = [
  {
    label: 'Ringkasan',
    items: [
      { to: '/admin', label: 'Dasbor', icon: LayoutDashboard, exact: true },
    ],
  },
  {
    label: 'Manajemen',
    items: [
      { to: '/admin/branches', label: 'Cabang', icon: Building2 },
      { to: '/admin/employees', label: 'Karyawan', icon: Users },
      { to: '/admin/services', label: 'Layanan', icon: Tag },
    ],
  },
  {
    label: 'Keuangan',
    items: [
      { to: '/admin/reports', label: 'Laporan Keuangan', icon: BarChart3 },
      { to: '/admin/commissions', label: 'Komisi', icon: Banknote },
    ],
  },
  {
    label: 'Operasional',
    items: [
      { to: '/admin/inventory', label: 'Inventaris', icon: Package },
      { to: '/admin/membership', label: 'Keanggotaan', icon: Star },
      { to: '/admin/promotions', label: 'Promo', icon: Percent },
    ],
  },
  {
    label: 'Sistem',
    items: [
      { to: '/admin/settings', label: 'Pengaturan', icon: Settings },
    ],
  },
];

interface Alert { id: string; icon: 'overdue' | 'maintenance'; message: string; detail?: string; to: string }

const alertIcon = {
  overdue: <AlertCircle className="h-4 w-4 text-red-500" />,
  maintenance: <Wrench className="h-4 w-4 text-amber-500" />,
};

export default function AdminLayout() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showNotif, setShowNotif] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const overdue = useOverdueOrders(5);
  const branches = useBranches();
  const alerts: Alert[] = [
    ...(overdue.data?.rows ?? []).map((o): Alert => ({
      id: o.id, icon: 'overdue', message: `${o.code} (${o.customer?.name ?? 'pelanggan'}) terlambat di ${o.branch?.name ?? 'cabang'}`,
      detail: `Batas ${formatTanggalJam(o.due_at)}`, to: '/admin/reports',
    })),
    ...(branches.data ?? []).filter((b) => b.status === 'maintenance').map((b): Alert => ({
      id: `m-${b.id}`, icon: 'maintenance', message: `${b.name} sedang dalam perbaikan`, to: '/admin/branches',
    })),
  ];
  const extra = Math.max(0, (overdue.data?.count ?? 0) - (overdue.data?.rows.length ?? 0));
  const unreadCount = (overdue.data?.count ?? 0) + alerts.filter((a) => a.icon === 'maintenance').length;

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-60' : 'w-16'} transition-all duration-300 flex-shrink-0 bg-slate-900 flex flex-col h-full z-30`}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 h-16 border-b border-slate-800">
          <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
            <Waves className="h-5 w-5 text-white" />
          </div>
          {sidebarOpen && (
            <div>
              <p className="text-white font-semibold text-sm leading-none">WashFlow</p>
              <p className="text-slate-400 text-xs mt-0.5">Portal Admin</p>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-6">
          {navSections.map((section) => (
            <div key={section.label}>
              {sidebarOpen && (
                <p className="px-2 mb-1 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  {section.label}
                </p>
              )}
              <div className="space-y-0.5">
                {section.items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.exact}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-2 py-2 rounded-lg text-sm font-medium transition-colors group ${
                        isActive
                          ? 'bg-blue-600 text-white'
                          : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <item.icon className={`h-4.5 w-4.5 flex-shrink-0 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`} />
                        {sidebarOpen && <span>{item.label}</span>}
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Bottom: User */}
        <div className="border-t border-slate-800 p-3">
          {sidebarOpen ? (
            <div className="flex items-center gap-3 px-1">
              <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                <span className="text-white text-xs font-semibold">
                  {currentUser?.avatar || 'AD'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-xs font-medium truncate">{currentUser?.name || 'Admin'}</p>
                <p className="text-slate-400 text-xs truncate">{currentUser?.email || 'admin@washflow.example.com'}</p>
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
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 flex-shrink-0 relative z-50">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label={sidebarOpen ? 'Tutup menu samping' : 'Buka menu samping'}
              className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
            >
              {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <div>
              <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">Admin</span>
            </div>
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
                    <span className="text-xs text-slate-400">{unreadCount} perlu perhatian</span>
                  </div>
                  <div className="divide-y divide-slate-50">
                    {alerts.length === 0 && <p className="p-4 text-xs text-slate-400">Tidak ada yang perlu ditangani.</p>}
                    {alerts.map(n => (
                      <button key={n.id} type="button" onClick={() => { setShowNotif(false); navigate(n.to); }} className="flex w-full items-start gap-3 p-3 text-left hover:bg-slate-50">
                        <div className="mt-0.5 flex-shrink-0">{alertIcon[n.icon]}</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-slate-700 font-medium leading-snug">{n.message}</p>
                          {n.detail && <p className="text-xs text-slate-400 mt-0.5">{n.detail}</p>}
                        </div>
                      </button>
                    ))}
                    {extra > 0 && <p className="p-3 text-xs text-slate-500">dan {extra} pesanan terlambat lainnya</p>}
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
                <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center">
                  <span className="text-white text-xs font-semibold">{currentUser?.avatar || 'AD'}</span>
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-xs font-semibold text-slate-800">{currentUser?.name || 'Admin User'}</p>
                  <p className="text-xs text-slate-400">Pemilik Usaha</p>
                </div>
                <ChevronDown className="h-4 w-4 text-slate-400" />
              </button>

              {showProfile && (
                <div className="absolute right-0 top-12 w-48 bg-white rounded-xl border border-slate-200 shadow-xl z-50 py-1">
                  <div className="px-4 py-3 border-b border-slate-100">
                    <p className="text-xs font-semibold text-slate-800">{currentUser?.name}</p>
                    <p className="text-xs text-slate-400">{currentUser?.email}</p>
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
        <main className="flex-1 overflow-y-auto bg-slate-50">
          <div className="p-6">
            <Outlet />
          </div>
        </main>
      </div>

      {showPassword && currentUser && (
        <ChangePasswordDialog email={currentUser.email} onClose={() => setShowPassword(false)} />
      )}

      {/* Overlay to close dropdowns */}
      {(showNotif || showProfile) && (
        <div className="fixed inset-0 z-40" onClick={() => { setShowNotif(false); setShowProfile(false); }} />
      )}
    </div>
  );
}