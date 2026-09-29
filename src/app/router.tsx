import { createBrowserRouter } from 'react-router';

import { PageLoader } from '@/components/shared/PageLoader';
import { RequireRole } from '@/features/auth/RequireRole';
import LoginPage from '@/pages/LoginPage';

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
              { path: 'inventory', lazy: lazyRoute(() => import('@/pages/admin/InventoryManagement')) },
              { path: 'commissions', lazy: lazyRoute(() => import('@/pages/admin/CommissionTracking')) },
              { path: 'membership', lazy: lazyRoute(() => import('@/pages/admin/MembershipPage')) },
              { path: 'promotions', lazy: lazyRoute(() => import('@/pages/admin/PromotionsPage')) },
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
              { path: 'customers', lazy: lazyRoute(() => import('@/pages/employee/CustomerSearch')) },
              { path: 'summary', lazy: lazyRoute(() => import('@/pages/employee/DailySummary')) },
            ],
          },
        ],
      },
    ],
  },
]);
