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
