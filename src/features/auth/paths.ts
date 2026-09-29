import type { UserRole } from '@/features/auth/AuthContext';

/** Halaman utama tiap role. */
export function homeFor(role: UserRole): string {
  return role === 'admin' ? '/admin' : '/employee';
}
