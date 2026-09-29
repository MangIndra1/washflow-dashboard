import { createClient } from '@supabase/supabase-js';

import type { Database } from '@/types/database';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

/** false bila .env.local belum diisi, App menampilkan layar konfigurasi, bukan crash. */
export const isSupabaseConfigured = Boolean(url && key);

/**
 * Klien tunggal Supabase untuk seluruh aplikasi.
 * Hanya memakai PUBLISHABLE key (aman di browser); akses data dibatasi oleh Row Level Security.
 * Jangan pernah memakai secret / service_role key di kode frontend.
 */
export const supabase = createClient<Database>(
  url ?? 'http://localhost:54321',
  key ?? 'missing-publishable-key',
);
