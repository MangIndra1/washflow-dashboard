import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string;
  subtitle?: string;
  change?: number;
  changeLabel?: string;
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
  accent?: string;
}

export function MetricCard({
  title, value, subtitle, change, changeLabel,
  icon: Icon, iconBg, iconColor, accent,
}: MetricCardProps) {
  const isPositive = change !== undefined && change >= 0;

  return (
    <div className={`bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col gap-3 relative overflow-hidden`}>
      {accent && (
        <div className={`absolute top-0 left-0 w-1 h-full rounded-l-xl ${accent}`} />
      )}
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">{title}</p>
        <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${iconBg}`}>
          <Icon className={`h-5 w-5 ${iconColor}`} />
        </div>
      </div>
      <div>
        <p className="text-2xl text-slate-900" style={{ fontWeight: 700 }}>{value}</p>
        {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
      {change !== undefined && (
        <div className="flex items-center gap-1.5">
          <div className={`flex items-center gap-0.5 text-xs font-medium ${isPositive ? 'text-emerald-600' : 'text-red-500'}`}>
            {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {isPositive ? '+' : ''}{change}%
          </div>
          {changeLabel && <span className="text-xs text-slate-400">{changeLabel}</span>}
        </div>
      )}
    </div>
  );
}
