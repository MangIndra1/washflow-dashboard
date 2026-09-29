import { Navigate, Outlet } from 'react-router';

import { PageLoader } from '@/components/shared/PageLoader';
import { useAuth, type UserRole } from '@/features/auth/AuthContext';
import { homeFor } from '@/features/auth/paths';

/**
 * Penjaga route: hanya user login dengan role yang sesuai yang boleh masuk.
 * Ini hanya kenyamanan UI — keamanan data sebenarnya ditegakkan oleh RLS di database.
 */
export function RequireRole({ role }: { role: UserRole }) {
  const { currentUser, loading } = useAuth();

  if (loading) return <PageLoader />;
  if (!currentUser) return <Navigate to="/" replace />;
  if (currentUser.role !== role) return <Navigate to={homeFor(currentUser.role)} replace />;
  return <Outlet />;
}
