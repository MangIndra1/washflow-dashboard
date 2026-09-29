import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router';
import type { ReactElement } from 'react';
import {
  LayoutDashboard, Building2, Users, Tag, BarChart3,
  Package, DollarSign, Star, Percent, Settings, LogOut,
  Bell, ChevronDown, Waves, Menu, X, AlertCircle, ShoppingBag, CheckCircle,
} from 'lucide-react';
import { useAuth } from '@/features/auth/AuthContext';
import { notifications } from '@/data/mockData';

interface NavItem {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  exact?: boolean;
}

const navSections: { label: string; items: NavItem[] }[] = [
  {
    label: 'Overview',
    items: [
      { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
    ],
  },
  {
    label: 'Management',
    items: [
      { to: '/admin/branches', label: 'Branches', icon: Building2 },
      { to: '/admin/employees', label: 'Employees', icon: Users },
      { to: '/admin/services', label: 'Services', icon: Tag },
    ],
  },
  {
    label: 'Finance',
    items: [
      { to: '/admin/reports', label: 'Financial Reports', icon: BarChart3 },
      { to: '/admin/commissions', label: 'Commissions', icon: DollarSign },
    ],
  },
  {
    label: 'Operations',
    items: [
      { to: '/admin/inventory', label: 'Inventory', icon: Package },
      { to: '/admin/membership', label: 'Membership', icon: Star },
      { to: '/admin/promotions', label: 'Promotions', icon: Percent },
    ],
  },
];

const notifIcon: Record<string, ReactElement> = {
  overdue: <AlertCircle className="h-4 w-4 text-red-500" />,
  low_stock: <Package className="h-4 w-4 text-amber-500" />,
  new_order: <ShoppingBag className="h-4 w-4 text-blue-500" />,
  completed: <CheckCircle className="h-4 w-4 text-emerald-500" />,
};

export default function AdminLayout() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showNotif, setShowNotif] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;

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
              <p className="text-white font-semibold text-sm leading-none">CleanWave</p>
              <p className="text-slate-400 text-xs mt-0.5">Admin Portal</p>
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
                <p className="text-slate-400 text-xs truncate">{currentUser?.email || 'admin@cleanwave.app'}</p>
              </div>
              <button onClick={handleLogout} className="text-slate-400 hover:text-red-400 transition-colors">
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button onClick={handleLogout} className="flex items-center justify-center w-full text-slate-400 hover:text-red-400 p-1">
              <LogOut className="h-4 w-4" />
            </button>
          )}
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 flex-shrink-0 z-20">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
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
                className="relative p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 h-4 w-4 bg-red-500 rounded-full text-white text-xs flex items-center justify-center font-semibold leading-none">
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotif && (
                <div className="absolute right-0 top-12 w-80 bg-white rounded-xl border border-slate-200 shadow-xl z-50">
                  <div className="flex items-center justify-between p-4 border-b border-slate-100">
                    <p className="text-sm font-semibold text-slate-900">Notifications</p>
                    <span className="text-xs text-blue-600 cursor-pointer font-medium">Mark all read</span>
                  </div>
                  <div className="divide-y divide-slate-50">
                    {notifications.map(n => (
                      <div key={n.id} className={`flex items-start gap-3 p-3 hover:bg-slate-50 cursor-pointer ${!n.read ? 'bg-blue-50/40' : ''}`}>
                        <div className="mt-0.5 flex-shrink-0">{notifIcon[n.type]}</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-slate-700 font-medium leading-snug">{n.message}</p>
                          <p className="text-xs text-slate-400 mt-0.5">{n.time}</p>
                        </div>
                        {!n.read && <div className="h-2 w-2 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />}
                      </div>
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
                <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center">
                  <span className="text-white text-xs font-semibold">{currentUser?.avatar || 'AD'}</span>
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-xs font-semibold text-slate-800">{currentUser?.name || 'Admin User'}</p>
                  <p className="text-xs text-slate-400">Business Owner</p>
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
                    <button className="flex items-center gap-2 w-full px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">
                      <Settings className="h-4 w-4" /> Settings
                    </button>
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-500 hover:bg-red-50"
                    >
                      <LogOut className="h-4 w-4" /> Sign out
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

      {/* Overlay to close dropdowns */}
      {(showNotif || showProfile) && (
        <div className="fixed inset-0 z-40" onClick={() => { setShowNotif(false); setShowProfile(false); }} />
      )}
    </div>
  );
}