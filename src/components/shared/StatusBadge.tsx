import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type StatusType = string;

interface StatusConfig {
  bg: string;
  text: string;
  dot: string;
  label: string;
}

const statusConfig: Record<string, StatusConfig> = {
  // Order statuses
  received:    { bg: 'bg-slate-100',   text: 'text-slate-700',   dot: 'bg-slate-500',    label: 'Received' },
  washing:     { bg: 'bg-blue-100',    text: 'text-blue-700',    dot: 'bg-blue-500',     label: 'Washing' },
  drying:      { bg: 'bg-cyan-100',    text: 'text-cyan-700',    dot: 'bg-cyan-500',     label: 'Drying' },
  ironing:     { bg: 'bg-orange-100',  text: 'text-orange-700',  dot: 'bg-orange-500',   label: 'Ironing' },
  ready:       { bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-500',  label: 'Ready for Pickup' },
  completed:   { bg: 'bg-green-100',   text: 'text-green-700',   dot: 'bg-green-600',    label: 'Completed' },
  // Payment statuses
  paid:        { bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-500',  label: 'Paid' },
  unpaid:      { bg: 'bg-red-100',     text: 'text-red-700',     dot: 'bg-red-500',      label: 'Unpaid' },
  partial:     { bg: 'bg-amber-100',   text: 'text-amber-700',   dot: 'bg-amber-500',    label: 'Partial' },
  // Branch / Employee statuses
  active:      { bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-500',  label: 'Active' },
  inactive:    { bg: 'bg-slate-100',   text: 'text-slate-600',   dot: 'bg-slate-400',    label: 'Inactive' },
  maintenance: { bg: 'bg-amber-100',   text: 'text-amber-700',   dot: 'bg-amber-500',    label: 'Maintenance' },
  closed:      { bg: 'bg-red-100',     text: 'text-red-700',     dot: 'bg-red-500',      label: 'Closed' },
  // Promotion statuses
  scheduled:   { bg: 'bg-blue-100',    text: 'text-blue-700',    dot: 'bg-blue-500',     label: 'Scheduled' },
  expired:     { bg: 'bg-slate-100',   text: 'text-slate-500',   dot: 'bg-slate-400',    label: 'Expired' },
  // Membership tiers
  Bronze:      { bg: 'bg-amber-100',   text: 'text-amber-800',   dot: 'bg-amber-600',    label: 'Bronze' },
  Silver:      { bg: 'bg-slate-200',   text: 'text-slate-700',   dot: 'bg-slate-500',    label: 'Silver' },
  Gold:        { bg: 'bg-yellow-100',  text: 'text-yellow-800',  dot: 'bg-yellow-500',   label: 'Gold' },
  Platinum:    { bg: 'bg-blue-100',    text: 'text-blue-800',    dot: 'bg-blue-500',     label: 'Platinum' },
};

interface StatusBadgeProps {
  status: StatusType;
  size?: 'sm' | 'md';
}

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const config = statusConfig[status] ?? {
    bg: 'bg-slate-100', text: 'text-slate-600', dot: 'bg-slate-400', label: status,
  };
  const sizeClass = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  return (
    <Badge
      variant="outline"
      className={cn('gap-1.5 rounded-full border-transparent font-medium', sizeClass, config.bg, config.text)}
    >
      <span className={cn('h-1.5 w-1.5 flex-shrink-0 rounded-full', config.dot)} />
      {config.label}
    </Badge>
  );
}
