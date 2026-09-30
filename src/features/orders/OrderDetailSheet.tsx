import { useState } from 'react';
import { Link } from 'react-router';
import { toast } from 'sonner';
import { Copy, ExternalLink, MessageSquare, StickyNote, Wallet } from 'lucide-react';

import { StatusBadge } from '@/components/shared/StatusBadge';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { trackingUrl } from '@/features/tracking/api';
import { formatAngka, formatRupiah, formatTanggalJam } from '@/lib/format';
import { linkWhatsApp } from '@/lib/whatsapp';
import { METODE_BAYAR, STATUS_LABEL } from './api';
import { useOrderDetail, useStatusLogs } from './hooks';
import { PaymentModal } from './PaymentModal';

/** Panel detail pesanan dari Papan Pesanan: rincian, pembayaran, riwayat status, dan aksi cepat. */
export function OrderDetailSheet({ orderId, onClose }: { orderId: string; onClose: () => void }) {
  const detail = useOrderDetail(orderId);
  const logs = useStatusLogs(orderId);
  const [payOpen, setPayOpen] = useState(false);
  const o = detail.data;
  const sisa = o ? Math.max(0, o.total - o.paid_amount) : 0;

  const copyLink = async () => {
    if (!o) return;
    try { await navigator.clipboard.writeText(trackingUrl(o.track_token)); toast.success('Tautan pelacakan disalin.'); }
    catch { toast.error('Tidak dapat menyalin. Salin manual dari halaman struk.'); }
  };

  return (
    <>
      <Sheet open onOpenChange={(v) => { if (!v) onClose(); }}>
        <SheetContent side="right" className="sm:max-w-md overflow-y-auto" aria-describedby="detail-desc" data-order-detail>
          <SheetHeader className="border-b border-slate-100">
            <SheetTitle className="font-mono">{o?.code ?? 'Memuat...'}</SheetTitle>
            <SheetDescription id="detail-desc">{o ? `${o.customer?.name ?? 'Pelanggan dihapus'}, diterima ${formatTanggalJam(o.created_at)}` : 'Detail pesanan'}</SheetDescription>
          </SheetHeader>

          {detail.isPending && <div className="mx-4 h-40 animate-pulse rounded-xl bg-slate-100" role="status" aria-label="Memuat detail" />}
          {detail.isError && <p role="alert" className="mx-4 text-sm text-red-600">Detail tidak dapat dimuat.</p>}
          {!detail.isPending && !o && !detail.isError && <p className="mx-4 text-sm text-slate-500">Pesanan tidak ditemukan.</p>}

          {o && (
            <div className="px-4 pb-6 space-y-5 text-sm">
              <div className="flex items-center gap-2">
                <StatusBadge status={o.status} size="sm" />
                <StatusBadge status={o.payment_status} size="sm" />
                {o.due_at && o.status !== 'completed' && <span className="text-xs text-slate-500 ml-auto">Estimasi {formatTanggalJam(o.due_at)}</span>}
              </div>

              {o.customer && <p className="text-slate-600">Telepon: <span className="font-medium text-slate-900">{o.customer.phone}</span></p>}

              <section>
                <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Rincian</p>
                <div className="space-y-2" data-detail-items>
                  {[...o.order_items].sort((a, b) => a.created_at.localeCompare(b.created_at)).map((i) => (
                    <div key={i.id} className="flex justify-between gap-3">
                      <div className="min-w-0"><p className="text-slate-800">{i.service_name}</p><p className="text-xs text-slate-400">{formatAngka(Number(i.quantity))} {i.unit} x {formatRupiah(i.unit_price)}</p></div>
                      <span className="font-medium text-slate-900 flex-shrink-0">{formatRupiah(i.line_total ?? 0)}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 pt-3 border-t border-slate-100 space-y-1">
                  {o.discount > 0 && <div className="flex justify-between text-emerald-700"><span>{o.discount_label ?? 'Diskon'}</span><span>-{formatRupiah(o.discount)}</span></div>}
                  <div className="flex justify-between font-semibold"><span>Total</span><span data-detail-total>{formatRupiah(o.total)}</span></div>
                  <div className="flex justify-between"><span className="text-slate-600">{sisa > 0 ? 'Sisa tagihan' : 'Pembayaran'}</span>
                    {sisa > 0 ? <span className="font-bold text-red-600" data-detail-sisa>{formatRupiah(sisa)}</span> : <span className="font-bold text-emerald-700" data-detail-sisa>Lunas</span>}</div>
                </div>
              </section>

              {o.notes && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-100">
                  <StickyNote className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" /><p className="text-xs text-amber-800">{o.notes}</p>
                </div>
              )}

              <section>
                <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Pembayaran</p>
                {o.payments.length === 0 && <p className="text-xs text-slate-400">Belum ada pembayaran.</p>}
                <div className="space-y-1" data-detail-payments>
                  {[...o.payments].sort((a, b) => a.paid_at.localeCompare(b.paid_at)).map((p) => (
                    <div key={p.id} className="flex justify-between text-xs text-slate-600"><span>{formatTanggalJam(p.paid_at)} ({METODE_BAYAR[p.method]})</span><span className="font-medium">{formatRupiah(p.amount)}</span></div>
                  ))}
                </div>
              </section>

              <section>
                <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Riwayat status</p>
                <ol className="space-y-2 border-l-2 border-slate-100 pl-3" data-detail-logs>
                  {(logs.data ?? []).map((l) => (
                    <li key={l.id} className="relative">
                      <span className="absolute -left-[17px] top-1.5 h-2 w-2 rounded-full bg-emerald-500" />
                      <p className="text-xs font-medium text-slate-800">{STATUS_LABEL[l.to_status]}</p>
                      <p className="text-xs text-slate-400">{formatTanggalJam(l.changed_at)}{l.by ? `, oleh ${l.by}` : ''}</p>
                    </li>
                  ))}
                </ol>
              </section>

              <div className="flex flex-wrap gap-2 pt-1">
                {sisa > 0 && (
                  <button onClick={() => setPayOpen(true)} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-amber-200 bg-amber-50 text-amber-800 text-xs font-medium hover:bg-amber-100"><Wallet className="h-4 w-4" /> Catat Pembayaran</button>
                )}
                {o.customer && (
                  <a href={linkWhatsApp(o.customer.phone)} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-3 py-2 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 text-xs font-medium hover:bg-emerald-100"><MessageSquare className="h-4 w-4" /> WhatsApp</a>
                )}
                <button onClick={() => void copyLink()} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 text-slate-600 text-xs font-medium hover:bg-slate-50"><Copy className="h-4 w-4" /> Salin tautan pelacakan</button>
                <Link to={`/employee/orders/${o.id}`} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 text-slate-600 text-xs font-medium hover:bg-slate-50"><ExternalLink className="h-4 w-4" /> Buka struk</Link>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
      {payOpen && o && <PaymentModal orderId={o.id} code={o.code} sisa={sisa} onClose={() => setPayOpen(false)} />}
    </>
  );
}
