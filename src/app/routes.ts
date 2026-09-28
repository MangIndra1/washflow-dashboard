import { createBrowserRouter } from 'react-router';

import LoginPage from './pages/LoginPage';
import AdminLayout from './components/layout/AdminLayout';
import EmployeeLayout from './components/layout/EmployeeLayout';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import BranchManagement from './pages/admin/BranchManagement';
import EmployeeManagement from './pages/admin/EmployeeManagement';
import ServiceManagement from './pages/admin/ServiceManagement';
import FinancialReports from './pages/admin/FinancialReports';
import InventoryManagement from './pages/admin/InventoryManagement';
import CommissionTracking from './pages/admin/CommissionTracking';
import MembershipPage from './pages/admin/MembershipPage';
import PromotionsPage from './pages/admin/PromotionsPage';

// Employee Pages
import EmployeeDashboard from './pages/employee/EmployeeDashboard';
import NewOrderPage from './pages/employee/NewOrderPage';
import OrderManagement from './pages/employee/OrderManagement';
import CustomerSearch from './pages/employee/CustomerSearch';
import DailySummary from './pages/employee/DailySummary';

export const router = createBrowserRouter([
  { path: '/', Component: LoginPage },
  {
    path: '/admin',
    Component: AdminLayout,
    children: [
      { index: true, Component: AdminDashboard },
      { path: 'branches', Component: BranchManagement },
      { path: 'employees', Component: EmployeeManagement },
      { path: 'services', Component: ServiceManagement },
      { path: 'reports', Component: FinancialReports },
      { path: 'inventory', Component: InventoryManagement },
      { path: 'commissions', Component: CommissionTracking },
      { path: 'membership', Component: MembershipPage },
      { path: 'promotions', Component: PromotionsPage },
    ],
  },
  {
    path: '/employee',
    Component: EmployeeLayout,
    children: [
      { index: true, Component: EmployeeDashboard },
      { path: 'new-order', Component: NewOrderPage },
      { path: 'orders', Component: OrderManagement },
      { path: 'customers', Component: CustomerSearch },
      { path: 'summary', Component: DailySummary },
    ],
  },
]);
