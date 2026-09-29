import { QueryClient } from '@tanstack/react-query';

/** Satu QueryClient untuk seluruh aplikasi. Cache dibersihkan saat pengguna berganti atau keluar. */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: false },
  },
});
