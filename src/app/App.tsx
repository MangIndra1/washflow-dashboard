import { QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from 'react-router';

import { router } from '@/app/router';
import { ConfigError } from '@/components/shared/ConfigError';
import { Toaster } from '@/components/ui/sonner';
import { AuthProvider } from '@/features/auth/AuthContext';
import { queryClient } from '@/lib/queryClient';
import { isSupabaseConfigured } from '@/lib/supabase';

export default function App() {
  if (!isSupabaseConfigured) return <ConfigError />;

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RouterProvider router={router} />
        <Toaster richColors position="top-right" />
      </AuthProvider>
    </QueryClientProvider>
  );
}
