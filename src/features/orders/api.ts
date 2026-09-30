import { supabase } from '@/lib/supabase';
import type { Enums, Tables } from '@/types/database';

export type PaymentMethod = Enums<'payment_method'>;
export type OrderStatus = Enums<'order_status'>;

export const METODE_BAYAR: Record<PaymentMethod, string> = { cash: 'Tunai', qris: 'QRIS', transfer: 'Transfer' };

export type CartLine = {
  service_id: string;
  quantity: number;
};

export interface Quote {
  subtotal: number;
  discount: number;
  total: number;
  discount_label: string | null;
  promo_error: string | null;
  info: string | null;
  est_hours: number;
}

/** Harga dihitung di server (satu sumber kebenaran); UI hanya menampilkan hasilnya. */
export async function quoteOrder(customerId: string, lines: CartLine[], promoCode: string): Promise<Quote> {
  const { data, error } = await supabase.rpc('quote_order', {
    p_customer_id: customerId,
    p_items: lines,
    p_promo_code: promoCode || undefined,
  });
  if (error) throw error;
  return data as unknown as Quote;
}

export interface CreateOrderInput {
  customerId: string;
  lines: CartLine[];
  promoCode: string;
  notes: string;
  payAmount: number;
  payMethod: PaymentMethod;
  clientKey: string;
}

export async function createOrder(input: CreateOrderInput): Promise<string> {
  const { data, error } = await supabase.rpc('create_order', {
    p_customer_id: input.customerId,
    p_items: input.lines,
    p_promo_code: input.promoCode || undefined,
    p_notes: input.notes || undefined,
    p_pay_amount: input.payAmount,
    p_pay_method: input.payMethod,
    p_client_key: input.clientKey,
  });
  if (error) throw error;
  return data;
}

export async function recordPayment(orderId: string, amount: number, method: PaymentMethod): Promise<void> {
  const { error } = await supabase.rpc('record_payment', { p_order_id: orderId, p_amount: amount, p_method: method });
  if (error) throw error;
}

export interface OrderDetail extends Tables<'orders'> {
  customer: { name: string; phone: string } | null;
  branch: { name: string; code: string; address: string | null; phone: string | null } | null;
  cashier: { full_name: string } | null;
  order_items: Tables<'order_items'>[];
  payments: Tables<'payments'>[];
}

export async function fetchOrderDetail(id: string): Promise<OrderDetail | null> {
  const { data, error } = await supabase
    .from('orders')
    .select(`*,
      customer:customers(name, phone),
      branch:branches!orders_branch_id_fkey(name, code, address, phone),
      cashier:profiles!orders_cashier_id_fkey(full_name),
      order_items(*),
      payments(*)`)
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data as OrderDetail | null;
}

// ─── Papan pesanan, dasbor, ringkasan harian ─────────────────────────────────

export interface BoardOrder {
  id: string;
  code: string;
  status: OrderStatus;
  payment_status: Tables<'orders'>['payment_status'];
  total: number;
  paid_amount: number;
  due_at: string | null;
  created_at: string;
  completed_at: string | null;
  notes: string | null;
  customer: { name: string; phone: string } | null;
  order_items: { service_name: string; quantity: number; unit: string; line_total: number | null }[];
  cashier: { full_name: string } | null;
  branch: { name: string } | null;
}

const BOARD_SELECT = `id, code, status, payment_status, total, paid_amount, due_at, created_at, completed_at, notes,
  customer:customers(name, phone),
  cashier:profiles!orders_cashier_id_fkey(full_name),
  branch:branches!orders_branch_id_fkey(name),
  order_items(service_name, quantity, unit, line_total)`;

/** Semua pesanan yang belum selesai (RLS membatasi karyawan ke cabangnya). */
export async function fetchActiveOrders(): Promise<BoardOrder[]> {
  const { data, error } = await supabase
    .from('orders').select(BOARD_SELECT).neq('status', 'completed').order('due_at', { ascending: true }).order('code', { ascending: true }).limit(500);
  if (error) throw error;
  return data as unknown as BoardOrder[];
}

/** Pesanan yang selesai sejak pukul 00.00 hari ini (jam perangkat), untuk kolom Selesai di papan. Yang lebih lama ada di Riwayat Pesanan. */
export async function fetchCompletedToday(): Promise<BoardOrder[]> {
  const t = new Date();
  const since = new Date(t.getFullYear(), t.getMonth(), t.getDate()).toISOString();
  const { data, error } = await supabase
    .from('orders').select(BOARD_SELECT).eq('status', 'completed').gte('completed_at', since)
    .order('completed_at', { ascending: false }).order('code', { ascending: false }).limit(200);
  if (error) throw error;
  return data as unknown as BoardOrder[];
}

export const HISTORY_PAGE_SIZE = 25;

export interface HistoryQuery {
  q: string;
  status: OrderStatus | 'all';
  payment: Tables<'orders'>['payment_status'] | 'all';
  /** Batas created_at (ISO); from inklusif, to eksklusif. Kosong = tanpa batas. */
  from: string;
  to: string;
  page: number;
}

/** Hanya huruf, angka, spasi, tanda hubung dan plus: mencegah karakter khusus filter PostgREST (koma, kurung, titik, persen, bintang). */
export function sanitizeSearch(q: string): string {
  return q.replace(/[^\p{L}\p{N}\s+-]/gu, ' ').replace(/\s+/g, ' ').trim().slice(0, 60);
}

/** Riwayat semua pesanan dengan filter dan halaman (RLS membatasi karyawan ke cabangnya). */
export async function fetchOrderHistory(f: HistoryQuery): Promise<{ rows: BoardOrder[]; count: number }> {
  const q = sanitizeSearch(f.q);
  let customerIds: string[] = [];
  if (q) {
    const { data, error } = await supabase.from('customers').select('id').or(`name.ilike.*${q}*,phone.ilike.*${q}*`).limit(100);
    if (error) throw error;
    customerIds = (data ?? []).map((c) => c.id);
  }
  let query = supabase.from('orders').select(BOARD_SELECT, { count: 'exact' });
  if (q) query = query.or([`code.ilike.*${q}*`, ...(customerIds.length ? [`customer_id.in.(${customerIds.join(',')})`] : [])].join(','));
  if (f.status !== 'all') query = query.eq('status', f.status);
  if (f.payment !== 'all') query = query.eq('payment_status', f.payment);
  if (f.from) query = query.gte('created_at', f.from);
  if (f.to) query = query.lt('created_at', f.to);
  const start = f.page * HISTORY_PAGE_SIZE;
  const { data, error, count } = await query
    .order('created_at', { ascending: false }).order('code', { ascending: false })
    .range(start, start + HISTORY_PAGE_SIZE - 1);
  if (error) throw error;
  return { rows: data as unknown as BoardOrder[], count: count ?? 0 };
}

/** Pesanan yang dibuat atau diselesaikan dalam rentang [from, to). */
export async function fetchOrdersInRange(from: string, to: string): Promise<BoardOrder[]> {
  const { data, error } = await supabase
    .from('orders').select(BOARD_SELECT)
    .or(`and(created_at.gte.${from},created_at.lt.${to}),and(completed_at.gte.${from},completed_at.lt.${to})`)
    .order('created_at', { ascending: false }).limit(1000);
  if (error) throw error;
  return data as unknown as BoardOrder[];
}

export interface DayPayment {
  id: string;
  order_id: string;
  amount: number;
  method: PaymentMethod;
  paid_at: string;
}

export async function fetchPaymentsInRange(from: string, to: string): Promise<DayPayment[]> {
  const { data, error } = await supabase
    .from('payments').select('id, order_id, amount, method, paid_at').gte('paid_at', from).lt('paid_at', to)
    .order('paid_at', { ascending: false }).limit(2000);
  if (error) throw error;
  return data;
}

export async function updateOrderStatus(id: string, status: OrderStatus): Promise<void> {
  const { error } = await supabase.from('orders').update({ status }).eq('id', id);
  if (error) throw error;
}

// ─── Aturan status (cermin trigger database; server tetap yang berwenang) ────
export const STATUS_ORDER: OrderStatus[] = ['received', 'washing', 'drying', 'ironing', 'ready', 'completed'];

export function nextStatus(s: OrderStatus): OrderStatus | null {
  const i = STATUS_ORDER.indexOf(s);
  return i >= 0 && i < STATUS_ORDER.length - 1 ? STATUS_ORDER[i + 1] : null;
}

export function prevStatus(s: OrderStatus): OrderStatus | null {
  const i = STATUS_ORDER.indexOf(s);
  return i > 0 && s !== 'completed' ? STATUS_ORDER[i - 1] : null;
}

export type MoveCheck = { ok: true } | { ok: false; needsPayment?: boolean; message: string };

export function checkMove(o: Pick<BoardOrder, 'status' | 'payment_status'>, target: OrderStatus): MoveCheck {
  if (o.status === target) return { ok: false, message: '' };
  if (o.status === 'completed') return { ok: false, message: 'Pesanan yang sudah selesai tidak bisa diubah.' };
  if (target === 'completed') {
    if (o.status !== 'ready') return { ok: false, message: 'Pesanan harus berstatus Siap Diambil sebelum diselesaikan.' };
    if (o.payment_status !== 'paid') return { ok: false, needsPayment: true, message: 'Pesanan belum lunas. Catat pembayaran dulu.' };
  }
  return { ok: true };
}

export function isOverdue(o: Pick<BoardOrder, 'status' | 'due_at'>, now = Date.now()): boolean {
  return o.status !== 'completed' && !!o.due_at && new Date(o.due_at).getTime() < now;
}

// ─── Ekspor laporan (rentang bebas, dibaca per halaman supaya lolos batas 1000 baris) ──
export const STATUS_LABEL: Record<OrderStatus, string> = {
  received: 'Diterima', washing: 'Dicuci', drying: 'Dikeringkan', ironing: 'Disetrika', ready: 'Siap Diambil', completed: 'Selesai',
};
export const BAYAR_LABEL: Record<Tables<'orders'>['payment_status'], string> = { unpaid: 'Belum Bayar', partial: 'Sebagian', paid: 'Lunas' };

export interface ExportPayment extends DayPayment { order: { code: string } | null }

const PAGE = 1000;
const MAX_ROWS = 20000;

async function readAll<T>(page: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: unknown }>): Promise<T[]> {
  const out: T[] = [];
  for (let from = 0; from < MAX_ROWS; from += PAGE) {
    const { data, error } = await page(from, from + PAGE - 1);
    if (error) throw error;
    out.push(...(data ?? []));
    if (!data || data.length < PAGE) break;
  }
  return out;
}

/** Pesanan yang DIBUAT dalam [from, to), urut waktu. */
export function fetchCreatedInRange(from: string, to: string, branchId?: string): Promise<BoardOrder[]> {
  return readAll<BoardOrder>((a, b) => {
    let q = supabase.from('orders').select(BOARD_SELECT).gte('created_at', from).lt('created_at', to);
    if (branchId) q = q.eq('branch_id', branchId);
    return q.order('created_at', { ascending: true }).order('id').range(a, b) as unknown as PromiseLike<{ data: BoardOrder[] | null; error: unknown }>;
  });
}

export function fetchExportPayments(from: string, to: string, branchId?: string): Promise<ExportPayment[]> {
  return readAll<ExportPayment>((a, b) => {
    let q = supabase.from('payments').select('id, order_id, amount, method, paid_at, order:orders!inner(code, branch_id)')
      .gte('paid_at', from).lt('paid_at', to);
    if (branchId) q = q.eq('order.branch_id', branchId);
    return q.order('paid_at', { ascending: true }).order('id').range(a, b) as unknown as PromiseLike<{ data: ExportPayment[] | null; error: unknown }>;
  });
}

// ─── Riwayat status (untuk panel detail) ─────────────────────────────────────
export interface StatusLogEntry { id: string; to_status: OrderStatus; changed_at: string; by: string | null }

export async function fetchStatusLogs(orderId: string): Promise<StatusLogEntry[]> {
  const { data, error } = await supabase
    .from('order_status_logs').select('id, to_status, changed_by, changed_at').eq('order_id', orderId).order('changed_at', { ascending: true });
  if (error) throw error;
  const ids = [...new Set(data.map((l) => l.changed_by).filter((v): v is string => !!v))];
  const names = new Map<string, string>();
  if (ids.length > 0) {
    // RLS: karyawan hanya melihat rekan sekabupaten; nama yang tidak terbaca ditampilkan kosong
    const { data: profs } = await supabase.from('profiles').select('id, full_name').in('id', ids);
    for (const p of profs ?? []) names.set(p.id, p.full_name);
  }
  return data.map((l) => ({ id: l.id, to_status: l.to_status, changed_at: l.changed_at, by: l.changed_by ? names.get(l.changed_by) ?? null : null }));
}
