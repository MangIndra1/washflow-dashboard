import { FunctionsFetchError, FunctionsHttpError } from '@supabase/supabase-js';

import { supabase } from '@/lib/supabase';
import type { Enums, Tables } from '@/types/database';

export type AppRole = Enums<'app_role'>;

export interface StaffItem extends Tables<'profiles'> {
  branch: { name: string; code: string } | null;
  orders30d: number;
  commission30d: number;
}

export interface StaffUpdate {
  id: string;
  full_name: string;
  phone: string | null;
  role: AppRole;
  job_title: string;
  branch_id: string | null;
  commission_rate: number;
  is_active: boolean;
}

export interface CreateStaffInput {
  email: string;
  password: string;
  full_name: string;
  phone: string | null;
  role: AppRole;
  job_title: string;
  branch_id: string | null;
  commission_rate: number;
}

export async function fetchStaff(): Promise<StaffItem[]> {
  const [profiles, stats] = await Promise.all([
    supabase.from('profiles').select('*, branch:branches!profiles_branch_id_fkey(name, code)').order('full_name'),
    supabase.from('employee_stats').select('*'),
  ]);
  if (profiles.error) throw profiles.error;
  if (stats.error) throw stats.error;

  const byId = new Map(stats.data.map((s) => [s.profile_id, s]));
  return profiles.data.map((p) => ({
    ...p,
    orders30d: byId.get(p.id)?.orders_30d ?? 0,
    commission30d: byId.get(p.id)?.commission_30d ?? 0,
  }));
}

export async function updateStaff({ id, ...values }: StaffUpdate): Promise<void> {
  const { error } = await supabase.from('profiles').update(values).eq('id', id);
  if (error) throw error;
}

export async function setStaffActive(id: string, isActive: boolean): Promise<void> {
  const { error } = await supabase.from('profiles').update({ is_active: isActive }).eq('id', id);
  if (error) throw error;
}

/**
 * Membuat akun butuh hak admin Supabase Auth, jadi dijalankan di Edge Function `create-staff`
 * (secret key hanya ada di server, tidak pernah di browser).
 */
export async function createStaff(input: CreateStaffInput): Promise<void> {
  const { error } = await supabase.functions.invoke('create-staff', { body: input });
  if (!error) return;

  if (error instanceof FunctionsHttpError) {
    if (error.context.status === 404) {
      throw new Error('Fungsi create-staff belum di-deploy. Lihat README bagian "Menambah karyawan".');
    }
    try {
      const body = await error.context.json();
      if (body?.error) throw new Error(String(body.error));
    } catch (e) {
      if (e instanceof Error && e.message) throw e;
    }
    throw new Error('Gagal membuat akun karyawan.');
  }
  if (error instanceof FunctionsFetchError) {
    throw new Error('Server tidak dapat dihubungi. Periksa koneksi lalu coba lagi.');
  }
  throw new Error('Gagal membuat akun karyawan.');
}
