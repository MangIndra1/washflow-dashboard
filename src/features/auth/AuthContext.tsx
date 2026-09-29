import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';

import { supabase } from '@/lib/supabase';

export type UserRole = 'admin' | 'employee';

export interface CurrentUser {
  id: string;
  role: UserRole;
  name: string;
  email: string;
  avatar: string;
  branchId: string | null;
  branchName: string | null;
  branchCode: string | null;
  /**
   * SEMENTARA (M1→M3): id cabang gaya data contoh ('b1'…'b4') untuk halaman karyawan yang
   * masih membaca mockData. Dihapus saat halaman-halaman itu pindah ke Supabase.
   */
  legacyBranchId: string | undefined;
}

type AccessIssue = 'no-profile' | 'inactive' | 'unassigned' | 'load-error';

const NOTICES: Record<AccessIssue, string> = {
  'no-profile': 'Your account has no profile yet. Please contact your administrator.',
  inactive: 'Your account has been deactivated. Please contact your administrator.',
  unassigned: 'Your account has not been assigned to a branch yet. Please contact your administrator.',
  'load-error': 'Could not load your account. Check your connection and try again.',
};

// TODO(M3): hapus bersama mockData
const LEGACY_BRANCH_IDS: Record<string, string> = { DPS: 'b1', KTA: 'b2', JBR: 'b3', UBD: 'b4' };

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? '') + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase() || '?';
}

interface AuthContextType {
  /** null = belum login (atau akun belum boleh mengakses aplikasi). */
  currentUser: CurrentUser | null;
  /** true hanya sampai status sesi awal diketahui. */
  loading: boolean;
  /** Pesan untuk halaman login, mis. akun nonaktif. */
  notice: string | null;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<string | null>(null);

  const userRef = useRef<CurrentUser | null>(null);
  const loadSeq = useRef(0);

  const applyUser = useCallback((user: CurrentUser | null) => {
    userRef.current = user;
    setCurrentUser(user);
  }, []);

  const loadUser = useCallback(async (session: Session | null) => {
    const seq = ++loadSeq.current;

    if (!session) {
      applyUser(null);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, role, is_active, branch_id, branches!profiles_branch_id_fkey(name, code)')
      .eq('id', session.user.id)
      .maybeSingle();

    if (seq !== loadSeq.current) return; // ada pemuatan yang lebih baru; abaikan hasil usang

    let issue: AccessIssue | null = null;
    if (error) issue = 'load-error';
    else if (!data) issue = 'no-profile';
    else if (!data.is_active) issue = 'inactive';
    else if (data.role === 'employee' && !data.branch_id) issue = 'unassigned';

    if (issue || !data) {
      // Gangguan jaringan sesaat saat sudah login: pertahankan sesi, jangan paksa keluar.
      if (issue === 'load-error' && userRef.current) return;
      setNotice(NOTICES[issue ?? 'no-profile']);
      applyUser(null);
      setLoading(false);
      await supabase.auth.signOut();
      return;
    }

    applyUser({
      id: data.id,
      role: data.role,
      name: data.full_name,
      email: session.user.email ?? '',
      avatar: initials(data.full_name),
      branchId: data.branch_id,
      branchName: data.branches?.name ?? null,
      branchCode: data.branches?.code ?? null,
      legacyBranchId: data.branches?.code ? LEGACY_BRANCH_IDS[data.branches.code] : undefined,
    });
    setNotice(null);
    setLoading(false);
  }, [applyUser]);

  useEffect(() => {
    // onAuthStateChange langsung mengirim INITIAL_SESSION saat subscribe, jadi getSession() tidak diperlukan.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'TOKEN_REFRESHED') return;
      // Sesi yang sama dipulihkan (mis. tab kembali fokus): tidak perlu memuat ulang profil.
      if (event === 'SIGNED_IN' && session && session.user.id === userRef.current?.id) return;
      // Jangan memanggil API Supabase langsung di dalam callback ini (berisiko deadlock) — tunda satu tick.
      setTimeout(() => { void loadUser(session); }, 0);
    });
    return () => subscription.unsubscribe();
  }, [loadUser]);

  const signIn = useCallback<AuthContextType['signIn']>(async (email, password) => {
    setNotice(null);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) {
      const invalid = error.status === 400 || /invalid login credentials/i.test(error.message);
      // Pesan sama untuk email tak terdaftar & sandi salah (tidak membocorkan email mana yang terdaftar).
      return { error: invalid ? 'Incorrect email or password.' : 'Unable to sign in right now. Please try again.' };
    }
    return { error: null };
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    applyUser(null);
  }, [applyUser]);

  const value = useMemo(
    () => ({ currentUser, loading, notice, signIn, logout }),
    [currentUser, loading, notice, signIn, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth harus dipakai di dalam <AuthProvider>');
  return ctx;
}
