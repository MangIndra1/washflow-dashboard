import { useState } from 'react';
import { Link, useLocation, useParams } from 'react-router';
import { ArrowLeft, CheckCircle, Copy, MessageSquare, Plus, Printer, Wallet } from 'lucide-react';
import { toast } from 'sonner';

import { QrCode } from '@/components/shared/QrCode';
import { ErrorPanel } from '@/components/shared/QueryStatus';
import { PaymentInstructions } from '@/features/payment-info/PaymentInstructions';
import { usePaymentInfo } from '@/features/payment-info/hooks';
import { trackingUrl } from '@/features/tracking/api';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { METODE_BAYAR, type OrderDetail } from '@/features/orders/api';
import { PaymentModal } from '@/features/orders/PaymentModal';
import { useOrderDetail } from '@/features/orders/hooks';
import { pesanError } from '@/lib/errors';
import { formatAngka, formatRupiah, formatTanggalJam } from '@/lib/format';
import { linkWhatsApp } from '@/lib/whatsapp';

function pesanWhatsApp(o: OrderDetail): string {
  const sisa = o.total - o.paid_amount;
  const bayar = sisa <= 0 ? 'sudah lunas' : `sisa tagihan ${formatRupiah(sisa)}`;
  return [
    `Halo ${o.customer?.name ?? ''}, pesanan laundry Anda sudah kami terima.`,
    `Nomor pesanan: ${o.code}`,
    `Total: ${formatRupiah(o.total)} (${bayar})`,
    o.due_at ? `Estimasi selesai: ${formatTanggalJam(o.due_at)}` : '',
    `Pantau cucian Anda: ${trackingUrl(o.track_token)}`,
    `Terima kasih, ${o.branch?.name ?? 'WashFlow'}.`,
  ].filter(Boolean).join('\n');
}

export default function OrderReceipt() {
  const { id } = useParams();
  const location = useLocation();
  const baru = (location.state as { baru?: boolean } | null)?.baru === true;
  const { data: order, isLoading, isError, error, refetch } = useOrderDetail(id);
  const [payOpen, setPayOpen] = useState(false);
  const payInfo = usePaymentInfo();

  if (isLoading) {
    return <div className="max-w-lg mx-auto h-96 animate-pulse rounded-2xl bg-white border border-slate-200" role="status" aria-label="Memuat pesanan" />;
  }
  if (isError) return <div className="max-w-lg mx-auto"><ErrorPanel message={pesanError(error, 'Gagal memuat pesanan.')} onRetry={() => refetch()} /></div>;
  if (!order) {
    return (
      <div className="max-w-lg mx-auto text-center py-16">
        <p className="text-slate-600">Pesanan tidak ditemukan.</p>
        <Link to="/employee/orders" className="text-sm text-emerald-700 hover:underline">Kembali ke daftar pesanan</Link>
      </div>
    );
  }

  const sisa = order.total - order.paid_amount;
  const items = [...order.order_items].sort((a, b) => a.created_at.localeCompare(b.created_at));
  const payments = [...order.payments].sort((a, b) => a.paid_at.localeCompare(b.paid_at));

  return (
    <div className="max-w-lg mx-auto">
      <div className="mb-4 flex items-center justify-between print:hidden">
        <Link to="/employee/orders" className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800"><ArrowLeft className="h-4 w-4" /> Daftar pesanan</Link>
        <StatusBadge status={order.status} size="sm" />
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden print:border-0 print:shadow-none print:rounded-none">
        <div className="bg-slate-900 p-6 text-center print:bg-white print:text-black print:border-b print:border-dashed print:border-slate-400">
          {baru && (
            <div className="h-12 w-12 rounded-xl bg-emerald-500 flex items-center justify-center mx-auto mb-3 print:hidden">
              <CheckCircle className="h-7 w-7 text-white" />
            </div>
          )}
          <p className="text-white font-bold text-lg print:text-black">{baru ? 'Pesanan Berhasil Dibuat' : 'Struk Pesanan'}</p>
          <p className="text-slate-300 text-sm mt-1 print:text-black">{order.branch?.name}</p>
          {order.branch?.address && <p className="text-slate-400 text-xs print:text-black">{order.branch.address}</p>}
          {order.branch?.phone && <p className="text-slate-400 text-xs print:text-black">{order.branch.phone}</p>}
        </div>

        <div className="p-6">
          <div className="mb-5 p-4 rounded-xl bg-slate-50 border-2 border-dashed border-slate-300">
            <p className="text-xs text-slate-400 mb-1">Nomor Pesanan</p>
            <p className="text-2xl font-bold text-slate-900 font-mono" data-testid="order-code">{order.code}</p>
          </div>

          <div className="space-y-2 mb-5">
            {[
              { label: 'Pelanggan', value: order.customer?.name ?? '-' },
              { label: 'Telepon', value: order.customer?.phone ?? '-' },
              { label: 'Diterima', value: formatTanggalJam(order.created_at) },
              { label: 'Estimasi Selesai', value: order.due_at ? formatTanggalJam(order.due_at) : '-' },
              { label: 'Kasir', value: order.cashier?.full_name ?? '-' },
            ].map((row) => (
              <div key={row.label} className="flex items-center justify-between py-1.5 border-b border-slate-100 last:border-0">
                <span className="text-sm text-slate-500">{row.label}</span>
                <span className="text-sm font-medium text-slate-900 text-right">{row.value}</span>
              </div>
            ))}
          </div>

          <div className="mb-4">
            <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Rincian</p>
            <div className="space-y-2">
              {items.map((i) => (
                <div key={i.id} className="flex justify-between gap-3 text-sm">
                  <div className="min-w-0">
                    <p className="text-slate-800">{i.service_name}</p>
                    <p className="text-xs text-slate-400">{formatAngka(Number(i.quantity))} {i.unit} x {formatRupiah(i.unit_price)}</p>
                  </div>
                  <span className="font-medium text-slate-900 flex-shrink-0">{formatRupiah(i.line_total ?? 0)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 mb-5 print:bg-white print:border-slate-300">
            <div className="space-y-1.5">
              <div className="flex justify-between text-sm"><span className="text-slate-600">Subtotal</span><span className="font-medium">{formatRupiah(order.subtotal)}</span></div>
              {order.discount > 0 && (
                <div className="flex justify-between text-sm"><span className="text-emerald-700">{order.discount_label ?? 'Diskon'}</span><span className="text-emerald-700">-{formatRupiah(order.discount)}</span></div>
              )}
              <div className="flex justify-between pt-2 border-t border-emerald-200">
                <span className="font-bold text-slate-900">Total</span>
                <span className="font-bold text-emerald-700 text-lg print:text-black" data-testid="receipt-total">{formatRupiah(order.total)}</span>
              </div>
              {payments.map((p) => (
                <div key={p.id} className="flex justify-between text-xs text-slate-500">
                  <span>Dibayar {formatTanggalJam(p.paid_at)} ({METODE_BAYAR[p.method]})</span>
                  <span>{formatRupiah(p.amount)}</span>
                </div>
              ))}
              <div className="flex justify-between text-sm pt-1">
                <span className="text-slate-600">{sisa > 0 ? 'Sisa tagihan' : 'Status'}</span>
                {sisa > 0 ? <span className="font-bold text-red-600" data-testid="sisa">{formatRupiah(sisa)}</span> : <span className="font-bold text-emerald-700" data-testid="sisa">Lunas</span>}
              </div>
            </div>
          </div>

          {order.notes && (
            <div className="mb-5 p-3 rounded-lg bg-amber-50 border border-amber-200 print:bg-white">
              <p className="text-xs font-semibold text-amber-700 mb-1">Catatan Khusus</p>
              <p className="text-sm text-amber-800">{order.notes}</p>
            </div>
          )}

          <div className="mb-5 flex flex-col items-center gap-1 rounded-xl border border-slate-200 p-3" data-tracking>
            <p className="text-xs font-semibold text-slate-700">Pantau cucian Anda</p>
            <QrCode value={trackingUrl(order.track_token)} size={120} label="QR pelacakan pesanan" />
            <p className="text-[11px] text-slate-400 text-center">Pindai untuk melihat status pesanan tanpa perlu menelepon.</p>
            <button
              type="button" onClick={async () => { try { await navigator.clipboard.writeText(trackingUrl(order.track_token)); toast.success('Tautan pelacakan disalin.'); } catch { toast.error('Tidak dapat menyalin tautan.'); } }}
              className="print:hidden flex items-center gap-1.5 text-xs text-emerald-700 hover:underline"
            ><Copy className="h-3 w-3" /> Salin tautan</button>
          </div>

          {sisa > 0 && payInfo.data && (payInfo.data.qris_payload || payInfo.data.banks.length > 0) && (
            <div className="mb-5" data-receipt-payment><PaymentInstructions info={payInfo.data} qrSize={130} /></div>
          )}

          <p className="hidden print:block text-center text-xs text-slate-500 mb-2">Terima kasih. Harap bawa struk ini saat mengambil cucian.</p>

          <div className="flex flex-wrap gap-3 print:hidden">
            <button onClick={() => window.print()} className="flex-1 min-w-32 flex items-center justify-center gap-2 py-3 rounded-xl bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 transition-colors">
              <Printer className="h-4 w-4" /> Cetak Struk
            </button>
            {order.customer && (
              <a
                href={linkWhatsApp(order.customer.phone, pesanWhatsApp(order))} target="_blank" rel="noreferrer"
                className="flex-1 min-w-32 flex items-center justify-center gap-2 py-3 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 text-sm font-medium hover:bg-emerald-100 transition-colors"
              >
                <MessageSquare className="h-4 w-4" /> Kirim WhatsApp
              </a>
            )}
            {sisa > 0 && (
              <button onClick={() => setPayOpen(true)} className="flex-1 min-w-32 flex items-center justify-center gap-2 py-3 rounded-xl border border-amber-200 bg-amber-50 text-amber-800 text-sm font-medium hover:bg-amber-100 transition-colors">
                <Wallet className="h-4 w-4" /> Catat Pembayaran
              </button>
            )}
            <Link to="/employee/new-order" className="flex-1 min-w-32 flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition-colors">
              <Plus className="h-4 w-4" /> Pesanan Baru
            </Link>
          </div>
          <p className="text-xs text-slate-400 mt-3 print:hidden">Kirim WhatsApp membuka aplikasi WhatsApp dengan pesan siap kirim. Notifikasi otomatis menyusul di tahap berikutnya.</p>
        </div>
      </div>

      {payOpen && <PaymentModal orderId={order.id} code={order.code} sisa={sisa} onClose={() => setPayOpen(false)} />}
    </div>
  );
}
