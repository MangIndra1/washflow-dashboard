/** Ditampilkan bila variabel lingkungan Supabase belum diisi. */
export function ConfigError() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-lg rounded-2xl border border-amber-200 bg-white p-8 shadow-sm">
        <h1 className="text-lg font-semibold text-slate-900">Supabase belum dikonfigurasi</h1>
        <p className="mt-2 text-sm text-slate-600">
          Buat file <code className="rounded bg-slate-100 px-1.5 py-0.5">.env.local</code> di root proyek
          (salin dari <code className="rounded bg-slate-100 px-1.5 py-0.5">.env.example</code>) lalu isi:
        </p>
        <pre className="mt-4 overflow-x-auto rounded-lg bg-slate-900 p-4 text-xs text-slate-100">
{`VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...`}
        </pre>
        <p className="mt-4 text-sm text-slate-600">Setelah disimpan, restart <code className="rounded bg-slate-100 px-1.5 py-0.5">npm run dev</code>.</p>
      </div>
    </div>
  );
}
