import type { BoardOrder, DayPayment, PaymentMethod } from './api';
import { isOverdue } from './api';

export function inRange(iso: string | null, from: string, to: string): boolean {
  return !!iso && iso >= from && iso < to;
}

export interface DayStats {
  created: BoardOrder[];
  completedToday: BoardOrder[];
  received: number;
  byMethod: Record<PaymentMethod, number>;
  active: BoardOrder[];
  overdue: BoardOrder[];
  outstanding: number;
}

/** Ringkasan satu hari. `active` = semua pesanan yang belum selesai (bukan hanya yang dibuat hari ini). */
export function summarizeDay(
  dayOrders: BoardOrder[], payments: DayPayment[], active: BoardOrder[], range: { from: string; to: string },
): DayStats {
  const byMethod: Record<PaymentMethod, number> = { cash: 0, qris: 0, transfer: 0 };
  for (const p of payments) byMethod[p.method] += p.amount;
  return {
    created: dayOrders.filter((o) => inRange(o.created_at, range.from, range.to)),
    completedToday: dayOrders.filter((o) => inRange(o.completed_at, range.from, range.to)),
    received: payments.reduce((s, p) => s + p.amount, 0),
    byMethod,
    active,
    overdue: active.filter((o) => isOverdue(o)),
    outstanding: active.reduce((s, o) => s + Math.max(0, o.total - o.paid_amount), 0),
  };
}
