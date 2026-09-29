import { AlertCircle, Inbox } from 'lucide-react';

/** Kerangka kartu saat data pertama kali dimuat. */
export function CardsSkeleton({ count = 4, className = 'grid grid-cols-1 lg:grid-cols-2 gap-5' }: { count?: number; className?: string }) {
  return (
    <div className={className} role="status" aria-label="Memuat data">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="h-56 animate-pulse rounded-xl border border-slate-200 bg-white p-6">
          <div className="mb-4 h-10 w-10 rounded-xl bg-slate-100" />
          <div className="mb-2 h-4 w-1/2 rounded bg-slate-100" />
          <div className="h-3 w-3/4 rounded bg-slate-100" />
        </div>
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="divide-y divide-slate-50" role="status" aria-label="Memuat data">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex animate-pulse items-center gap-4 px-6 py-4">
          <div className="h-9 w-9 rounded-full bg-slate-100" />
          <div className="h-3 w-1/4 rounded bg-slate-100" />
          <div className="h-3 w-1/6 rounded bg-slate-100" />
          <div className="h-3 w-1/6 rounded bg-slate-100" />
        </div>
      ))}
    </div>
  );
}

export function ErrorPanel({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-center gap-3 rounded-xl border border-red-100 bg-red-50 p-8 text-center">
      <AlertCircle className="h-8 w-8 text-red-500" />
      <p className="text-sm text-red-700">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="rounded-lg border border-red-200 bg-white px-4 py-2 text-sm text-red-700 hover:bg-red-50">
          Coba lagi
        </button>
      )}
    </div>
  );
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-slate-200 bg-white p-10 text-center">
      <Inbox className="h-8 w-8 text-slate-300" />
      <p className="text-sm font-medium text-slate-600">{title}</p>
      {hint && <p className="text-xs text-slate-400">{hint}</p>}
    </div>
  );
}
