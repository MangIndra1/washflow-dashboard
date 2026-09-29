import type { ReactNode } from 'react';

interface FormFieldProps {
  label: string;
  required?: boolean;
  hint?: string;
  children: ReactNode;
}

export function FormField({ label, required, hint, children }: FormFieldProps) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm text-slate-700" style={{ fontWeight: 500 }}>
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

export const inputClass =
  'w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all';

export const selectClass =
  'w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all';

export const inputClassEmerald = inputClass.replace('ring-blue-500', 'ring-emerald-500');
export const selectClassEmerald = selectClass.replace('ring-blue-500', 'ring-emerald-500');
