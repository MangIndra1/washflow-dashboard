import type { ServiceUnit } from './api';

export const UNIT_LABEL: Record<ServiceUnit, string> = {
  kg: 'per kg',
  pcs: 'per pcs',
  pasang: 'per pasang',
  m2: 'per m2',
};

export const CATEGORIES = ['Reguler', 'Express', 'Premium', 'Khusus'] as const;

/** 6 -> "6 jam", 48 -> "2 hari", 36 -> "36 jam" */
export function formatDurasi(hours: number): string {
  if (hours >= 24 && hours % 24 === 0) return `${hours / 24} hari`;
  return `${hours} jam`;
}
