import { supabase } from '@/lib/supabase';

export type NotificationStatus = 'pending' | 'sending' | 'sent' | 'failed' | 'skipped';

export const NOTIFICATION_LABEL: Record<NotificationStatus, string> = {
  pending: 'Menunggu dikirim', sending: 'Sedang dikirim', sent: 'Terkirim', failed: 'Gagal dikirim', skipped: 'Dilewati',
};

export async function fetchWaNotifyEnabled(): Promise<boolean> {
  const { data, error } = await supabase.from('automation_settings').select('wa_notify_enabled').maybeSingle();
  if (error) throw error;
  return data?.wa_notify_enabled ?? false;
}

export async function saveWaNotifyEnabled(enabled: boolean, userId: string): Promise<void> {
  const { error } = await supabase.from('automation_settings')
    .update({ wa_notify_enabled: enabled, updated_at: new Date().toISOString(), updated_by: userId }).eq('id', true);
  if (error) throw error;
}

export interface NotificationSummary { sent: number; pending: number; failed: number }

/** Ringkasan 24 jam terakhir (dihitung di browser dari maksimal 1000 baris; cukup untuk satu laundry). */
export async function fetchNotificationSummary(): Promise<NotificationSummary> {
  const since = new Date(Date.now() - 86_400_000).toISOString();
  const { data, error } = await supabase.from('notifications').select('status').gte('created_at', since).limit(1000);
  if (error) throw error;
  const out: NotificationSummary = { sent: 0, pending: 0, failed: 0 };
  for (const r of data ?? []) {
    if (r.status === 'sent') out.sent += 1;
    else if (r.status === 'pending' || r.status === 'sending') out.pending += 1;
    else if (r.status === 'failed') out.failed += 1;
  }
  return out;
}

export interface OrderNotification { status: NotificationStatus; attempts: number; sent_at: string | null; error: string | null }

export async function fetchOrderNotification(orderId: string): Promise<OrderNotification | null> {
  const { data, error } = await supabase.from('notifications').select('status, attempts, sent_at, error')
    .eq('order_id', orderId).eq('kind', 'ready').maybeSingle();
  if (error) throw error;
  return data as OrderNotification | null;
}
