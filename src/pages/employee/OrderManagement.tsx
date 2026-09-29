import { useState } from 'react';
import { Search, AlertCircle, Clock, ChevronRight, Phone, MessageSquare, StickyNote } from 'lucide-react';
import { orders as initialOrders, OrderStatus } from '@/data/mockData';
import { formatRupiah, formatTanggal } from '@/lib/format';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { useAuth } from '@/features/auth/AuthContext';

const COLUMNS: { status: OrderStatus; label: string; bg: string; border: string; dot: string }[] = [
  { status: 'received', label: 'Diterima',        bg: 'bg-slate-100',    border: 'border-slate-300',   dot: 'bg-slate-500' },
  { status: 'washing',  label: 'Dicuci',            bg: 'bg-blue-50',      border: 'border-blue-300',    dot: 'bg-blue-500' },
  { status: 'drying',   label: 'Dikeringkan',       bg: 'bg-cyan-50',      border: 'border-cyan-300',    dot: 'bg-cyan-500' },
  { status: 'ironing',  label: 'Disetrika',         bg: 'bg-orange-50',    border: 'border-orange-300',  dot: 'bg-orange-500' },
  { status: 'ready',    label: 'Siap Diambil',      bg: 'bg-emerald-50',   border: 'border-emerald-300', dot: 'bg-emerald-500' },
  { status: 'completed',label: 'Selesai',           bg: 'bg-green-50',     border: 'border-green-300',   dot: 'bg-green-600' },
];

const STATUS_FLOW: OrderStatus[] = ['received', 'washing', 'drying', 'ironing', 'ready', 'completed'];

export default function OrderManagement() {
  const { currentUser } = useAuth();
  const [orders, setOrders] = useState(initialOrders);
  const [search, setSearch] = useState('');
  const [filterPayment, setFilterPayment] = useState('');
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<OrderStatus | null>(null);

  const branchOrders = currentUser?.legacyBranchId
    ? orders.filter(o => o.branchId === currentUser.legacyBranchId)
    : orders;

  const filtered = branchOrders.filter(o => {
    const matchSearch = o.customerName.toLowerCase().includes(search.toLowerCase()) || o.id.toLowerCase().includes(search.toLowerCase());
    const matchPayment = !filterPayment || o.paymentStatus === filterPayment;
    return matchSearch && matchPayment;
  });

  const advanceStatus = (orderId: string) => {
    setOrders(prev => prev.map(o => {
      if (o.id !== orderId) return o;
      const idx = STATUS_FLOW.indexOf(o.status as OrderStatus);
      const next = STATUS_FLOW[Math.min(idx + 1, STATUS_FLOW.length - 1)];
      return { ...o, status: next };
    }));
  };

  const moveToStatus = (orderId: string, newStatus: OrderStatus) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
  };

  const isOverdue = (o: typeof orders[0]) => o.status !== 'completed' && o.dueDate < '2026-02-27';

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, col: OrderStatus) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverCol(col);
  };

  const handleDrop = (e: React.DragEvent, col: OrderStatus) => {
    e.preventDefault();
    if (draggedId) moveToStatus(draggedId, col);
    setDraggedId(null);
    setDragOverCol(null);
  };

  const handleDragEnd = () => {
    setDraggedId(null);
    setDragOverCol(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-slate-900">Papan Pesanan</h1>
          <p className="text-slate-500 text-sm mt-1">
            {currentUser?.branchName}. Seret kartu untuk mengubah status.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400 bg-white border border-slate-200 rounded-lg px-3 py-2">
          <span>{filtered.length} pesanan ditampilkan</span>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            placeholder="Cari pesanan atau pelanggan"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-slate-200 bg-white text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
          />
        </div>
        <select
          className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
          value={filterPayment}
          onChange={e => setFilterPayment(e.target.value)}
        >
          <option value="">Semua Pembayaran</option>
          <option value="paid">Lunas</option>
          <option value="unpaid">Belum Bayar</option>
          <option value="partial">Sebagian</option>
        </select>
      </div>

      {/* Kanban Board */}
      <div className="flex gap-4 overflow-x-auto pb-4" style={{ minHeight: '70vh' }}>
        {COLUMNS.map(col => {
          const colOrders = filtered.filter(o => o.status === col.status);
          const isDragOver = dragOverCol === col.status;
          return (
            <div
              key={col.status}
              className={`flex-shrink-0 w-72 flex flex-col rounded-xl border-2 transition-all ${isDragOver ? 'border-emerald-400 bg-emerald-50/50' : `${col.border} ${col.bg}`}`}
              onDragOver={e => handleDragOver(e, col.status)}
              onDrop={e => handleDrop(e, col.status)}
              onDragLeave={() => setDragOverCol(null)}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between p-3 border-b border-white/60">
                <div className="flex items-center gap-2">
                  <div className={`h-2.5 w-2.5 rounded-full ${col.dot}`} />
                  <span className="text-sm font-semibold text-slate-700">{col.label}</span>
                </div>
                <span className="h-6 min-w-6 rounded-full bg-white/80 flex items-center justify-center text-xs font-bold text-slate-700 px-1.5">
                  {colOrders.length}
                </span>
              </div>

              {/* Cards */}
              <div className="flex-1 p-3 space-y-3 overflow-y-auto">
                {colOrders.length === 0 && (
                  <div className="flex items-center justify-center h-20 rounded-xl border-2 border-dashed border-slate-200">
                    <p className="text-xs text-slate-300 font-medium">Letakkan di sini</p>
                  </div>
                )}
                {colOrders.map(order => {
                  const overdue = isOverdue(order);
                  return (
                    <div
                      key={order.id}
                      draggable
                      onDragStart={e => handleDragStart(e, order.id)}
                      onDragEnd={handleDragEnd}
                      className={`bg-white rounded-xl border shadow-sm cursor-grab active:cursor-grabbing hover:shadow-md transition-all select-none ${overdue ? 'border-red-300 ring-1 ring-red-200' : 'border-slate-200'} ${draggedId === order.id ? 'opacity-40' : 'opacity-100'}`}
                    >
                      <div className="p-3">
                        {/* Card Header */}
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-semibold text-slate-400 font-mono">{order.id}</span>
                          <StatusBadge status={order.paymentStatus} size="sm" />
                        </div>

                        {/* Customer */}
                        <p className="text-sm font-semibold text-slate-900 mb-0.5">{order.customerName}</p>
                        <div className="flex items-center gap-1.5 mb-2">
                          <Phone className="h-3 w-3 text-slate-400" />
                          <span className="text-xs text-slate-400">{order.phone}</span>
                        </div>

                        {/* Service */}
                        <div className="flex items-center gap-1.5 mb-2">
                          <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">{order.serviceName}</span>
                          {(order.weight || order.quantity) && (
                            <span className="text-xs text-slate-400">
                              {order.weight ? `${order.weight} kg` : `${order.quantity} pcs`}
                            </span>
                          )}
                        </div>

                        {/* Due Date */}
                        <div className={`flex items-center gap-1.5 mb-2 ${overdue ? 'text-red-500' : 'text-slate-400'}`}>
                          {overdue ? <AlertCircle className="h-3.5 w-3.5" /> : <Clock className="h-3 w-3" />}
                          <span className="text-xs font-medium">Estimasi: {formatTanggal(order.dueDate)}</span>
                          {overdue && <span className="text-xs font-bold">(TERLAMBAT)</span>}
                        </div>

                        {/* Notes */}
                        {order.notes && (
                          <div className="flex items-start gap-1.5 mb-2 p-2 rounded-lg bg-amber-50 border border-amber-100">
                            <StickyNote className="h-3 w-3 text-amber-500 mt-0.5 flex-shrink-0" />
                            <p className="text-xs text-amber-700 leading-relaxed">{order.notes}</p>
                          </div>
                        )}

                        {/* Total */}
                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100">
                          <span className="text-xs text-slate-400">{formatRupiah(order.total)}</span>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => { navigator.clipboard.writeText(order.phone).catch(() => {}); }}
                              className="p-1 rounded hover:bg-slate-100 text-slate-400 transition-colors"
                              title="Salin nomor telepon" aria-label="Salin nomor telepon"
                            >
                              <MessageSquare className="h-3 w-3" />
                            </button>
                            {col.status !== 'completed' && (
                              <button
                                onClick={() => advanceStatus(order.id)}
                                className="flex items-center gap-0.5 text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg px-2 py-1 hover:bg-emerald-100 transition-colors"
                              >
                                Lanjut <ChevronRight className="h-3 w-3" />
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
    </div>
  );
}
