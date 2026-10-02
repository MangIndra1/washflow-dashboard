import { createBrowserRouter } from 'react-router';

import { PageLoader } from '@/components/shared/PageLoader';
import { RequireRole } from '@/features/auth/RequireRole';
import LoginPage from '@/pages/LoginPage';
import TrackPage from '@/pages/TrackPage';

/**
 * Halaman dimuat malas (code splitting): browser hanya mengunduh kode halaman
 * yang sedang dibuka, bukan seluruh aplikasi sekaligus.
 */
type Loader = () => Promise<{ default: React.ComponentType }>;
const lazyRoute = (load: Loader) => async () => ({ Component: (await load()).default });

export const router = createBrowserRouter([
  {
    // Route induk tanpa path: menyediakan fallback saat halaman lazy pertama dimuat.
    HydrateFallback: PageLoader,
    children: [
      { path: '/', Component: LoginPage },
      { path: '/track/:token', Component: TrackPage },
      {
        element: <RequireRole role="admin" />,
        children: [
          {
            path: '/admin',
            lazy: lazyRoute(() => import('@/components/layout/AdminLayout')),
            children: [
              { index: true, lazy: lazyRoute(() => import('@/pages/admin/AdminDashboard')) },
              { path: 'branches', lazy: lazyRoute(() => import('@/pages/admin/BranchManagement')) },
              { path: 'employees', lazy: lazyRoute(() => import('@/pages/admin/EmployeeManagement')) },
              { path: 'services', lazy: lazyRoute(() => import('@/pages/admin/ServiceManagement')) },
              { path: 'reports', lazy: lazyRoute(() => import('@/pages/admin/FinancialReports')) },
              // Sementara: halaman ini belum tersambung ke database (M6). File aslinya masih ada untuk dipakai ulang.
              { path: 'inventory', lazy: lazyRoute(() => import('@/pages/admin/ComingSoon')) },
              { path: 'commissions', lazy: lazyRoute(() => import('@/pages/admin/CommissionTracking')) },
              { path: 'membership', lazy: lazyRoute(() => import('@/pages/admin/MembershipPage')) },
              { path: 'promotions', lazy: lazyRoute(() => import('@/pages/admin/PromotionsPage')) },
              { path: 'settings', lazy: lazyRoute(() => import('@/pages/admin/SettingsPage')) },
            ],
          },
        ],
      },
      {
        element: <RequireRole role="employee" />,
        children: [
          {
            path: '/employee',
            lazy: lazyRoute(() => import('@/components/layout/EmployeeLayout')),
            children: [
              { index: true, lazy: lazyRoute(() => import('@/pages/employee/EmployeeDashboard')) },
              { path: 'new-order', lazy: lazyRoute(() => import('@/pages/employee/NewOrderPage')) },
              { path: 'orders', lazy: lazyRoute(() => import('@/pages/employee/OrderManagement')) },
              { path: 'history', lazy: lazyRoute(() => import('@/pages/employee/OrderHistory')) },
              { path: 'orders/:id', lazy: lazyRoute(() => import('@/pages/employee/OrderReceipt')) },
              { path: 'customers', lazy: lazyRoute(() => import('@/pages/employee/CustomerSearch')) },
              { path: 'summary', lazy: lazyRoute(() => import('@/pages/employee/DailySummary')) },
            ],
          },
        ],
      },
    ],
  },
]);
