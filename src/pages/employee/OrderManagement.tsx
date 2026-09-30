import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { toast } from 'sonner';
import { Search, AlertCircle, Clock, ChevronRight, ChevronLeft, Phone, MessageSquare, StickyNote } from 'lucide-react';

import { ErrorPanel } from '@/components/shared/QueryStatus';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { useAuth } from '@/features/auth/AuthContext';
import { checkMove, isOverdue, nextStatus, prevStatus, type BoardOrder, type OrderStatus } from '@/features/orders/api';
import { PaymentModal } from '@/features/orders/PaymentModal';
import { useActiveOrders, useRecentCompleted, useUpdateOrderStatus } from '@/features/orders/hooks';
import { pesanError } from '@/lib/errors';
import { formatRupiah, formatTanggalJam } from '@/lib/format';
import { linkWhatsApp } from '@/lib/whatsapp';

const COLUMNS: { status: OrderStatus; label: string; bg: string; border: string; dot: string }[] = [
  { status: 'received', label: 'Diterima',     bg: 'bg-slate-100',  border: 'border-slate-300',   dot: 'bg-slate-500' },
  { status: 'washing',  label: 'Dicuci',       bg: 'bg-blue-50',    border: 'border-blue-300',    dot: 'bg-blue-500' },
  { status: 'drying',   label: 'Dikeringkan',  bg: 'bg-cyan-50',    border: 'border-cyan-300',    dot: 'bg-cyan-500' },
  { status: 'ironing',  label: 'Disetrika',    bg: 'bg-orange-50',  border: 'border-orange-300',  dot: 'bg-orange-500' },
  { status: 'ready',    label: 'Siap Diambil', bg: 'bg-emerald-50', border: 'border-emerald-300', dot: 'bg-emerald-500' },
  { status: 'completed', label: 'Selesai',     bg: 'bg-green-50',   border: 'border-green-300',   dot: 'bg-green-600' },
];

function ringkasLayanan(o: BoardOrder): string {
  const names = o.order_items.map((i) => i.service_name);
  if (names.length === 0) return 'Tanpa item';
  return names.length > 2 ? `${names.slice(0, 2).join(', ')} +${names.length - 2}` : names.join(', ');
}

function pesanSiap(o: BoardOrder): string {
  const sisa = o.total - o.paid_amount;
  return [
    `Halo ${o.customer?.name ?? ''}, cucian Anda (${o.code}) sudah siap diambil.`,
    sisa > 0 ? `Sisa tagihan: ${formatRupiah(sisa)}.` : 'Pesanan sudah lunas.',
    'Terima kasih.',
  ].join('\n');
}

export default function OrderManagement() {
  const { currentUser } = useAuth();
  const active = useActiveOrders();
  const completed = useRecentCompleted();
  const update = useUpdateOrderStatus();

  const [search, setSearch] = useState('');
  const [filterPayment, setFilterPayment] = useState('');
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<OrderStatus | null>(null);
  // pesanan yang menunggu pelunasan sebelum dipindah ke Selesai
  const [payFor, setPayFor] = useState<BoardOrder | null>(null);

  const all = useMemo(() => [...(active.data ?? []), ...(completed.data ?? [])], [active.data, completed.data]);
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return all.filter((o) =>
      (!q || o.code.toLowerCase().includes(q) || (o.customer?.name ?? '').toLowerCase().includes(q) || (o.customer?.phone ?? '').includes(q)) &&
      (!filterPayment || o.payment_status === filterPayment));
  }, [all, search, filterPayment]);

  const isLoading = active.isLoading || completed.isLoading;
  const error = active.error ?? completed.error;

  const move = async (order: BoardOrder, target: OrderStatus) => {
    const check = checkMove(order, target);
    if (!check.ok) {
      if (check.needsPayment) setPayFor(order);
      else if (check.message) toast.error(check.message);
      return;
    }
    try {
      await update.mutateAsync({ id: order.id, status: target });
    } catch (e) {
      toast.error(pesanError(e, 'Gagal mengubah status pesanan.'));
    }
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
  };
  const handleDrop = (e: React.DragEvent, col: OrderStatus) => {
    e.preventDefault();
    const order = all.find((o) => o.id === draggedId);
    setDraggedId(null);
    setDragOverCol(null);
    if (order) void move(order, col);
  };

  const now = Date.now();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-slate-900">Papan Pesanan</h1>
          <p className="text-slate-500 text-sm mt-1">{currentUser?.branchName}. Seret kartu atau tekan Lanjut untuk mengubah status.</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400 bg-white border border-slate-200 rounded-lg px-3 py-2">
          <span>{isLoading ? 'Memuat...' : `${filtered.length} pesanan ditampilkan`}</span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-56 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            placeholder="Cari kode, nama, atau nomor"
            aria-label="Cari pesanan"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-slate-200 bg-white text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
          />
        </div>
        <select
          aria-label="Filter pembayaran"
          className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
          value={filterPayment}
          onChange={(e) => setFilterPayment(e.target.value)}
        >
          <option value="">Semua Pembayaran</option>
          <option value="paid">Lunas</option>
          <option value="unpaid">Belum Bayar</option>
          <option value="partial">Sebagian</option>
        </select>
      </div>

      {error ? (
        <ErrorPanel message={pesanError(error, 'Gagal memuat pesanan.')} onRetry={() => { void active.refetch(); void completed.refetch(); }} />
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4" style={{ minHeight: '70vh' }}>
          {COLUMNS.map((col) => {
            const colOrders = filtered.filter((o) => o.status === col.status);
            const isDragOver = dragOverCol === col.status;
            return (
              <div
                key={col.status}
                data-column={col.status}
                className={`flex-shrink-0 w-72 flex flex-col rounded-xl border-2 transition-all ${isDragOver ? 'border-emerald-400 bg-emerald-50/50' : `${col.border} ${col.bg}`}`}
                onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; setDragOverCol(col.status); }}
                onDrop={(e) => handleDrop(e, col.status)}
                onDragLeave={() => setDragOverCol(null)}
              >
                <div className="flex items-center justify-between p-3 border-b border-white/60">
                  <div className="flex items-center gap-2">
                    <div className={`h-2.5 w-2.5 rounded-full ${col.dot}`} />
                    <span className="text-sm font-semibold text-slate-700">{col.label}</span>
                    {col.status === 'completed' && <span className="text-xs text-slate-400">2 hari terakhir</span>}
                  </div>
                  <span className="h-6 min-w-6 rounded-full bg-white/80 flex items-center justify-center text-xs font-bold text-slate-700 px-1.5">{colOrders.length}</span>
                </div>

                <div className="flex-1 p-3 space-y-3 overflow-y-auto">
                  {isLoading && (
                    <div className="h-28 animate-pulse rounded-xl bg-white/70" role="status" aria-label="Memuat pesanan" />
                  )}
                  {!isLoading && colOrders.length === 0 && (
                    <div className="flex items-center justify-center h-20 rounded-xl border-2 border-dashed border-slate-200">
                      <p className="text-xs text-slate-300 font-medium">Belum ada pesanan</p>
                    </div>
                  )}
                  {colOrders.map((order) => {
                    const overdue = isOverdue(order, now);
                    const next = nextStatus(order.status);
                    const prev = prevStatus(order.status);
                    const locked = order.status === 'completed';
                    return (
                      <div
                        key={order.id}
                        data-order={order.code}
                        draggable={!locked}
                        onDragStart={(e) => handleDragStart(e, order.id)}
                        onDragEnd={() => { setDraggedId(null); setDragOverCol(null); }}
                        className={`bg-white rounded-xl border shadow-sm hover:shadow-md transition-all select-none ${locked ? '' : 'cursor-grab active:cursor-grabbing'} ${overdue ? 'border-red-300 ring-1 ring-red-200' : 'border-slate-200'} ${draggedId === order.id ? 'opacity-40' : ''}`}
                      >
                        <div className="p-3">
                          <div className="flex items-center justify-between mb-2">
                            <Link to={`/employee/orders/${order.id}`} className="text-xs font-semibold text-slate-500 font-mono hover:text-emerald-700 hover:underline">{order.code}</Link>
                            <StatusBadge status={order.payment_status} size="sm" />
                          </div>

                          <p className="text-sm font-semibold text-slate-900 mb-0.5">{order.customer?.name ?? 'Pelanggan dihapus'}</p>
                          <div className="flex items-center gap-1.5 mb-2">
                            <Phone className="h-3 w-3 text-slate-400" />
                            <span className="text-xs text-slate-400">{order.customer?.phone ?? '-'}</span>
                          </div>

                          <div className="mb-2">
                            <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">{ringkasLayanan(order)}</span>
                          </div>

                          {order.status !== 'completed' && order.due_at && (
                            <div className={`flex items-center gap-1.5 mb-2 ${overdue ? 'text-red-500' : 'text-slate-400'}`}>
                              {overdue ? <AlertCircle className="h-3.5 w-3.5" /> : <Clock className="h-3 w-3" />}
                              <span className="text-xs font-medium">Estimasi: {formatTanggalJam(order.due_at)}</span>
                              {overdue && <span className="text-xs font-bold">(TERLAMBAT)</span>}
                            </div>
                          )}
                          {order.status === 'completed' && order.completed_at && (
                            <p className="text-xs text-slate-400 mb-2">Selesai {formatTanggalJam(order.completed_at)}</p>
                          )}

                          {order.notes && (
                            <div className="flex items-start gap-1.5 mb-2 p-2 rounded-lg bg-amber-50 border border-amber-100">
                              <StickyNote className="h-3 w-3 text-amber-500 mt-0.5 flex-shrink-0" />
                              <p className="text-xs text-amber-700 leading-relaxed">{order.notes}</p>
                            </div>
                          )}

                          <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100">
                            <span className="text-xs text-slate-500 font-medium">{formatRupiah(order.total)}</span>
                            <div className="flex items-center gap-1">
                              {order.customer && (
                                <a
                                  href={linkWhatsApp(order.customer.phone, order.status === 'ready' ? pesanSiap(order) : undefined)}
                                  target="_blank" rel="noreferrer"
                                  className="p-1 rounded hover:bg-emerald-50 text-emerald-600 transition-colors"
                                  title={order.status === 'ready' ? 'Beri tahu pelanggan lewat WhatsApp' : 'Buka WhatsApp'}
                                  aria-label={`WhatsApp ${order.customer.name}`}
                                >
                                  <MessageSquare className="h-3.5 w-3.5" />
                                </a>
                              )}
                              {prev && (
                                <button
                                  onClick={() => void move(order, prev)}
                                  className="p-1 rounded hover:bg-slate-100 text-slate-400 transition-colors"
                                  title="Kembalikan ke tahap sebelumnya" aria-label={`Mundurkan ${order.code}`}
                                >
                                  <ChevronLeft className="h-3.5 w-3.5" />
                                </button>
                              )}
                              {next && (
                                <button
                                  onClick={() => void move(order, next)}
                                  aria-label={`${next === 'completed' ? 'Selesaikan' : 'Lanjutkan'} ${order.code}`}
                                  className="flex items-center gap-0.5 text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg px-2 py-1 hover:bg-emerald-100 transition-colors"
                                >
                                  {next === 'completed' ? 'Selesaikan' : 'Lanjut'} <ChevronRight className="h-3 w-3" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {payFor && (
        <PaymentModal
          orderId={payFor.id}
          code={payFor.code}
          sisa={payFor.total - payFor.paid_amount}
          onClose={() => setPayFor(null)}
          onPaid={(amount) => {
            // setelah lunas, langsung selesaikan pesanan
            const target = payFor;
            if (amount < target.total - target.paid_amount) return; // masih ada sisa, tetap di Siap Diambil
            void update.mutateAsync({ id: target.id, status: 'completed' })
              .then(() => toast.success(`${target.code} selesai.`))
              .catch((e) => toast.error(pesanError(e, 'Pembayaran tercatat, tetapi status belum berubah. Coba Selesaikan lagi.')));
          }}
        />
      )}
    </div>
  );
}
