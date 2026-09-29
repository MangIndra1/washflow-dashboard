import { RouterProvider } from 'react-router';

import { router } from '@/app/router';
import { ConfigError } from '@/components/shared/ConfigError';
import { AuthProvider } from '@/features/auth/AuthContext';
import { isSupabaseConfigured } from '@/lib/supabase';

export default function App() {
  if (!isSupabaseConfigured) return <ConfigError />;

  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}
