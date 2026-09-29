import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Navigate } from 'react-router';
import { Waves, Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react';

import { PageLoader } from '@/components/shared/PageLoader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/features/auth/AuthContext';
import { homeFor } from '@/features/auth/paths';

interface LoginForm {
  email: string;
  password: string;
}

export default function LoginPage() {
  const { currentUser, loading, notice, signIn } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({ defaultValues: { email: '', password: '' } });

  // Bila akun ditolak (nonaktif / belum ditugaskan), hentikan spinner dan tampilkan pesan.
  useEffect(() => { if (notice) setSubmitting(false); }, [notice]);

  if (loading) return <PageLoader />;
  if (currentUser) return <Navigate to={homeFor(currentUser.role)} replace />;

  const onSubmit = handleSubmit(async ({ email, password }) => {
    setFormError(null);
    setSubmitting(true);
    const { error } = await signIn(email, password);
    if (error) {
      setFormError(error);
      setSubmitting(false);
    }
    // Sukses: AuthContext memuat profil, lalu <Navigate> di atas mengarahkan sesuai role.
  });

  return (
    <div className="min-h-screen flex">
      {/* Left Panel */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 p-12 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-indigo-600/5 rounded-full blur-2xl" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-16">
            <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center">
              <Waves className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-white font-bold text-xl leading-none">WashFlow</p>
              <p className="text-blue-300 text-xs mt-0.5">Laundry Management System</p>
            </div>
          </div>

          <div className="max-w-sm">
            <h1 className="text-white mb-4" style={{ fontSize: '2.25rem', fontWeight: 800, lineHeight: 1.2 }}>
              Streamline your laundry operations
            </h1>
            <p className="text-slate-400 text-base leading-relaxed">
              The complete SaaS platform for modern laundry businesses — from single shops to multi-branch enterprises.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-2 gap-4">
            {[
              { value: 'Multi-branch', label: 'Every outlet in one view' },
              { value: 'Live orders', label: 'Kanban status board' },
              { value: 'Payments', label: 'Down payments & receipts' },
              { value: 'Reports', label: 'Revenue by branch' },
            ].map((stat) => (
              <div key={stat.label} className="bg-white/5 border border-white/10 rounded-xl p-4">
                <p className="text-white font-bold text-xl">{stat.value}</p>
                <p className="text-slate-400 text-sm mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="relative z-10 border-t border-white/10 pt-4 text-xs text-slate-500">© WashFlow · Laundry management system</p>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex flex-col items-center justify-center bg-white p-8 lg:p-16">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-10 lg:hidden">
            <div className="h-9 w-9 rounded-xl bg-blue-600 flex items-center justify-center">
              <Waves className="h-5 w-5 text-white" />
            </div>
            <p className="text-slate-900 font-bold text-lg">WashFlow</p>
          </div>

          <div className="mb-8">
            <h2 className="text-slate-900" style={{ fontSize: '1.75rem', fontWeight: 700 }}>Welcome back</h2>
            <p className="text-slate-500 mt-1.5">Sign in with your account to continue.</p>
          </div>

          {(formError || notice) && (
            <div role="alert" className="mb-5 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm text-red-700">
              <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <span>{formError ?? notice}</span>
            </div>
          )}

          <form onSubmit={onSubmit} noValidate className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="username"
                placeholder="you@company.com"
                aria-invalid={errors.email ? true : undefined}
                {...register('email', {
                  required: 'Email is required',
                  pattern: { value: /^\S+@\S+\.\S+$/, message: 'Enter a valid email address' },
                })}
              />
              {errors.email && <p className="text-xs text-red-600">{errors.email.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  className="pr-10"
                  aria-invalid={errors.password ? true : undefined}
                  {...register('password', { required: 'Password is required' })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-red-600">{errors.password.message}</p>}
            </div>

            <Button type="submit" disabled={submitting} className="w-full bg-blue-600 py-5 text-white hover:bg-blue-700">
              {submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Signing in…</> : 'Sign in'}
            </Button>
          </form>

          <p className="mt-8 text-center text-xs text-slate-400">
            Accounts are created by your administrator. Contact them if you need access.
          </p>
        </div>
      </div>
    </div>
  );
}
