import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Search, Phone, Mail, MapPin, Star, ShoppingBag, Wallet, Clock, MessageSquare, X, UserPlus, Pencil, Plus } from 'lucide-react';

import { EmptyState, ErrorPanel, TableSkeleton } from '@/components/shared/QueryStatus';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { tierFor, type Customer } from '@/features/customers/api';
import { CustomerFormModal } from '@/features/customers/CustomerFormModal';
import { useCustomer, useCustomerOrders, useCustomerSearch, useCustomerStats, useTiers } from '@/features/customers/hooks';
import { formatAngka, formatRupiah, formatTanggal } from '@/lib/format';
import { pesanError } from '@/lib/errors';
import { useDebounced } from '@/lib/useDebounced';
import { linkWhatsApp } from '@/lib/whatsapp';

const tierColors: Record<string, { bg: string; text: string }> = {
  Bronze:   { bg: 'bg-amber-100',   text: 'text-amber-800' },
  Silver:   { bg: 'bg-slate-200',   text: 'text-slate-700' },
  Gold:     { bg: 'bg-yellow-100',  text: 'text-yellow-800' },
  Platinum: { bg: 'bg-blue-100',    text: 'text-blue-800' },
};
const fallbackTier = { bg: 'bg-slate-100', text: 'text-slate-700' };

const initials = (name: string) =>
  name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]!.toUpperCase()).join('') || '?';

export default function CustomerSearch() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const debounced = useDebounced(search.trim());
  const [filterTier, setFilterTier] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [modal, setModal] = useState<{ open: boolean; customer: Customer | null }>({ open: false, customer: null });

  const { data: tiers = [] } = useTiers();
  const tierRange = useMemo(() => {
    if (!filterTier) return { minPoints: null, maxPoints: null };
    const sorted = [...tiers].sort((a, b) => a.min_points - b.min_points);
    const i = sorted.findIndex((t) => t.name === filterTier);
    if (i < 0) return { minPoints: null, maxPoints: null };
    return { minPoints: sorted[i].min_points, maxPoints: sorted[i + 1]?.min_points ?? null };
  }, [filterTier, tiers]);

  const { data: customers, isLoading, isError, error, refetch, isFetching } = useCustomerSearch({ search: debounced, ...tierRange });
  const list = customers ?? [];
  const one = useCustomer(selectedId);
  // pelanggan baru mungkin tidak masuk hasil pencarian yang sedang tampil, jadi ambil langsung
  const selected = one.data ?? list.find((c) => c.id === selectedId) ?? null;

  const { data: stats } = useCustomerStats(selected?.id ?? null);
  const orders = useCustomerOrders(selected?.id ?? null);
  const { current: tier, next: nextTier } = tierFor(selected?.points ?? 0, tiers);
  const tierStyle = tier ? tierColors[tier.name] ?? fallbackTier : fallbackTier;

  const progress = (() => {
    if (!selected || !tier) return 0;
    if (!nextTier) return 100;
    const span = nextTier.min_points - tier.min_points;
    return Math.min(100, Math.max(0, ((selected.points - tier.min_points) / span) * 100));
  })();

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-slate-900">Cari Pelanggan</h1>
          <p className="text-slate-500 text-sm mt-1">Cari pelanggan, lihat riwayat, dan buat pesanan baru</p>
        </div>
        <button
          onClick={() => setModal({ open: true, customer: null })}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm hover:bg-emerald-700 transition-colors shadow-sm"
        >
          <UserPlus className="h-4 w-4" /> Pelanggan Baru
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-64 max-w-lg">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <input
            placeholder="Cari nama, nomor telepon, atau email..."
            aria-label="Cari pelanggan"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-10 py-3 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
            autoFocus
          />
          {search && (
            <button onClick={() => setSearch('')} aria-label="Hapus pencarian" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-1 flex-wrap">
          {['', ...tiers.map((t) => t.name)].map((t) => (
            <button
              key={t || 'all'}
              onClick={() => setFilterTier(t)}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${filterTier === t ? 'bg-emerald-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
            >
              {t || 'Semua'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Daftar pelanggan */}
        <div className="xl:col-span-1 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden self-start">
          <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
            <p className="text-xs text-slate-500 font-medium">
              {isLoading ? 'Memuat...' : `${list.length}${list.length === 50 ? '+' : ''} pelanggan ditemukan`}
              {isFetching && !isLoading && <span className="ml-2 text-slate-400">memperbarui</span>}
            </p>
          </div>
          {isLoading ? (
            <TableSkeleton rows={6} />
          ) : isError ? (
            <div className="p-4"><ErrorPanel message={pesanError(error, 'Gagal memuat pelanggan.')} onRetry={() => refetch()} /></div>
          ) : (
            <div className="divide-y divide-slate-50 overflow-y-auto max-h-[60vh]">
              {list.map((c) => {
                const t = tierFor(c.points, tiers).current;
                const style = t ? tierColors[t.name] ?? fallbackTier : fallbackTier;
                return (
                  <button
                    key={c.id}
                    onClick={() => setSelectedId(c.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 text-left transition-colors ${selectedId === c.id ? 'bg-emerald-50 border-l-2 border-emerald-500' : ''}`}
                  >
                    <div className="h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-semibold text-slate-600">{initials(c.name)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">{c.name}</p>
                      <p className="text-xs text-slate-400 truncate">{c.phone}</p>
                    </div>
                    {t && <div className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${style.bg} ${style.text}`}>{t.name}</div>}
                  </button>
                );
              })}
              {list.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400 gap-3">
                  <Search className="h-10 w-10 opacity-30" />
                  <p className="text-sm">Pelanggan tidak ditemukan</p>
                  {debounced && (
                    <button onClick={() => setModal({ open: true, customer: null })} className="flex items-center gap-1.5 text-xs text-emerald-700 hover:underline">
                      <Plus className="h-3.5 w-3.5" /> Tambah sebagai pelanggan baru
                    </button>
                  )}
                </div>
              )}
              {list.length === 50 && (
                <p className="px-4 py-3 text-xs text-slate-400">Menampilkan 50 pertama. Persempit pencarian untuk hasil lain.</p>
              )}
            </div>
          )}
        </div>

        {/* Profil */}
        <div className="xl:col-span-2">
          {!selected ? (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col items-center justify-center py-20 text-slate-400">
              <Search className="h-12 w-12 mb-4 opacity-20" />
              <p className="text-base font-medium">Pilih pelanggan untuk melihat profil</p>
              <p className="text-sm mt-1 opacity-60">Cari lalu klik pelanggan dari daftar</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
                <div className={`h-24 rounded-t-xl ${tierStyle.bg} relative`}>
                  <div className="absolute -bottom-8 left-6">
                    <div className="h-16 w-16 rounded-full bg-white border-4 border-white shadow-sm flex items-center justify-center">
                      <span className="text-xl font-bold text-slate-600">{initials(selected.name)}</span>
                    </div>
                  </div>
                </div>
                <div className="px-6 pt-12 pb-6">
                  <div className="flex items-start justify-between mb-4 gap-3">
                    <div>
                      <h3 className="text-slate-900 font-bold text-lg">{selected.name}</h3>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <Star className="h-4 w-4" style={{ color: tier?.color || '#B45309' }} />
                        {tier && <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${tierStyle.bg} ${tierStyle.text}`}>{tier.name}</span>}
                        {tier && Number(tier.discount_percent) > 0 && (
                          <span className="text-xs text-slate-400">Diskon {String(Number(tier.discount_percent)).replace('.', ',')}% aktif</span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setModal({ open: true, customer: selected })}
                        title="Ubah data" aria-label="Ubah data pelanggan"
                        className="p-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <a
                        href={linkWhatsApp(selected.phone)} target="_blank" rel="noreferrer"
                        title="Buka WhatsApp" aria-label="Buka WhatsApp"
                        className="p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-600 hover:bg-emerald-100 transition-colors"
                      >
                        <MessageSquare className="h-4 w-4" />
                      </a>
                      <button
                        onClick={() => navigate(`/employee/new-order?customer=${selected.id}`)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-600 text-white text-sm hover:bg-emerald-700 transition-colors"
                      >
                        <Plus className="h-4 w-4" /> Buat Pesanan
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
                    <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-slate-400" /><span className="text-sm text-slate-600">{selected.phone}</span></div>
                    <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-slate-400" /><span className="text-sm text-slate-600 truncate">{selected.email || 'Belum ada email'}</span></div>
                    <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-slate-400" /><span className="text-sm text-slate-600 truncate">{selected.address || 'Belum ada alamat'}</span></div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { icon: ShoppingBag, label: 'Pesanan', value: formatAngka(stats?.orders_count ?? 0), color: 'text-blue-600' },
                      { icon: Wallet, label: 'Total Belanja', value: formatRupiah(stats?.total_spent ?? 0), color: 'text-emerald-600' },
                      { icon: Star, label: 'Poin Loyalitas', value: formatAngka(selected.points), color: 'text-amber-500' },
                      { icon: Clock, label: 'Kunjungan Terakhir', value: stats?.last_visit ? formatTanggal(stats.last_visit) : 'Belum ada', color: 'text-slate-500' },
                    ].map((s) => (
                      <div key={s.label} className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                        <div className="flex items-center gap-1.5 mb-1">
                          <s.icon className={`h-3.5 w-3.5 ${s.color}`} />
                          <p className="text-xs text-slate-400">{s.label}</p>
                        </div>
                        <p className="text-sm font-bold text-slate-900">{s.value}</p>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-slate-400 mt-2">Pesanan dan belanja dihitung dari data cabang Anda.</p>

                  {tier && (
                    <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-medium text-slate-600">Progres Loyalitas</p>
                        <p className="text-xs text-slate-400">
                          {formatAngka(selected.points)} / {nextTier ? formatAngka(nextTier.min_points) : 'tanpa batas'} poin
                        </p>
                      </div>
                      <div className="h-2.5 bg-slate-200 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, backgroundColor: tier.color ?? '#10B981' }} />
                      </div>
                      <p className="text-xs text-slate-400 mt-1.5">
                        {nextTier ? `${formatAngka(nextTier.min_points - selected.points)} poin lagi ke ${nextTier.name}` : 'Sudah di tingkat tertinggi'}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                  <h4 className="text-slate-800 font-semibold">Riwayat Transaksi</h4>
                  <span className="text-xs text-slate-400">{orders.data ? `${orders.data.length} pesanan terakhir` : ''}</span>
                </div>
                {orders.isLoading ? (
                  <TableSkeleton rows={3} />
                ) : orders.isError ? (
                  <div className="p-4"><ErrorPanel message={pesanError(orders.error, 'Gagal memuat riwayat.')} onRetry={() => orders.refetch()} /></div>
                ) : (orders.data ?? []).length === 0 ? (
                  <div className="p-4"><EmptyState title="Belum ada pesanan di cabang ini" hint="Klik Buat Pesanan untuk memulai" /></div>
                ) : (
                  <div className="divide-y divide-slate-50">
                    {orders.data!.map((o) => (
                      <Link key={o.id} to={`/employee/orders/${o.id}`} className="flex items-center gap-4 px-6 py-3.5 hover:bg-slate-50 transition-colors">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <p className="text-xs font-semibold text-slate-400">{o.code}</p>
                            <p className="text-xs text-slate-400">{formatTanggal(o.created_at)}</p>
                          </div>
                          <p className="text-sm font-medium text-slate-900 truncate">
                            {o.order_items.map((i) => i.service_name).join(', ') || 'Tanpa item'}
                          </p>
                          {o.notes && <p className="text-xs text-amber-600 mt-0.5 truncate">Catatan: {o.notes}</p>}
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <p className="text-sm font-semibold text-slate-900">{formatRupiah(o.total)}</p>
                          <StatusBadge status={o.payment_status} size="sm" />
                          <StatusBadge status={o.status} size="sm" />
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {modal.open && (
        <CustomerFormModal
          customer={modal.customer}
          initial={!modal.customer && debounced ? (/^[+\d\s\-.()]+$/.test(debounced) ? { phone: debounced } : { name: debounced }) : undefined}
          onClose={() => setModal({ open: false, customer: null })}
          onSaved={(c) => { setSelectedId(c.id); setModal({ open: false, customer: null }); }}
        />
      )}
    </div>
  );
}
