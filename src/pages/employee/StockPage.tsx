import { useMemo, useState } from 'react';
import { ArrowDownToLine, ArrowUpFromLine, History, Package, Search } from 'lucide-react';

import { selectClass } from '@/components/shared/FormField';
import { EmptyState, ErrorPanel, TableSkeleton } from '@/components/shared/QueryStatus';
import { stockStatus, type MoveKind, type StockItem, type StockStatus } from '@/features/inventory/api';
import { useStockItems } from '@/features/inventory/hooks';
import { fmtQty, StockHistoryModal, StockMoveModal } from '@/features/inventory/StockDialogs';
import { pesanError } from '@/lib/errors';
import { formatTanggal } from '@/lib/format';

const BADGE: Record<StockStatus, { cls: string; label: string }> = {
  critical: { cls: 'bg-red-100 text-red-700', label: 'Kritis' },
  low: { cls: 'bg-amber-100 text-amber-700', label: 'Menipis' },
  ok: { cls: 'bg-emerald-100 text-emerald-700', label: 'Aman' },
};

export default function StockPage() {
  const items = useStockItems();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [move, setMove] = useState<{ item: StockItem; kind: MoveKind } | null>(null);
  const [history, setHistory] = useState<StockItem | null>(null);

  const list = useMemo(() => (items.data ?? []).filter((i) => i.is_active), [items.data]);
  const rows = useMemo(() => list.filter((i) => {
    const q = search.trim().toLowerCase();
    if (q && !i.name.toLowerCase().includes(q)) return false;
    return !status || stockStatus(i) === status;
  }), [list, search, status]);
  const low = list.filter((i) => stockStatus(i) !== 'ok').length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-slate-900">Stok Cabang</h1>
        <p className="text-slate-500 text-sm mt-1">Catat barang yang diterima dan dipakai. Koreksi stok dilakukan admin.</p>
      </div>

      {items.isError && <ErrorPanel message={pesanError(items.error, 'Data stok tidak dapat dimuat.')} onRetry={() => void items.refetch()} />}
      {low > 0 && <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 text-sm text-amber-800" data-stock-alert>{low} barang menipis atau kritis. Beri tahu admin untuk pemesanan ulang.</div>}

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input aria-label="Cari barang" placeholder="Cari barang..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm" />
        </div>
        <select aria-label="Filter status" className={`${selectClass} !w-auto`} value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">Semua Stok</option><option value="critical">Kritis</option><option value="low">Menipis</option><option value="ok">Aman</option>
        </select>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {items.isPending ? <TableSkeleton /> : rows.length === 0 ? <EmptyState title="Tidak ada barang" hint={list.length === 0 ? 'Admin belum menambahkan barang untuk cabang ini.' : 'Ubah pencarian atau filter.'} /> : (
          <>
          <ul className="md:hidden divide-y divide-slate-100" data-stock-cards>
            {rows.map((i) => {
              const s = stockStatus(i);
              return (
                <li key={i.id} className="p-4" data-stock-card={i.name}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0"><p className="font-medium text-slate-900">{i.name}</p><p className="text-xs text-slate-400">{i.category}</p></div>
                    <div className="text-right shrink-0"><p className="font-semibold text-slate-900">{fmtQty(i.current_stock)} <span className="text-xs text-slate-400 font-normal">{i.unit}</span></p>
                      <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full font-medium ${BADGE[s].cls}`}>{BADGE[s].label}</span></div>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    <button onClick={() => setMove({ item: i, kind: 'in' })} data-m-act="in" className="flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-emerald-50 text-emerald-700 text-sm font-medium"><ArrowDownToLine className="h-4 w-4" /> Terima</button>
                    <button onClick={() => setMove({ item: i, kind: 'out' })} data-m-act="out" className="flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-amber-50 text-amber-700 text-sm font-medium"><ArrowUpFromLine className="h-4 w-4" /> Pakai</button>
                    <button onClick={() => setHistory(i)} data-m-act="history" className="flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-slate-100 text-slate-600 text-sm font-medium"><History className="h-4 w-4" /> Riwayat</button>
                  </div>
                </li>
              );
            })}
          </ul>
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm" data-items>
              <thead><tr className="border-b border-slate-100 bg-slate-50 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide">
                <th className="px-6 py-3">Barang</th><th className="px-3 py-3 text-right">Stok</th><th className="px-3 py-3">Status</th><th className="px-6 py-3 text-right">Aksi</th>
              </tr></thead>
              <tbody className="divide-y divide-slate-50">
                {rows.map((i) => {
                  const s = stockStatus(i);
                  return (
                    <tr key={i.id} data-item-row={i.name} data-status={s}>
                      <td className="px-6 py-3"><div className="flex items-center gap-3"><div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center"><Package className="h-4 w-4 text-slate-500" /></div>
                        <div><p className="font-medium text-slate-900">{i.name}</p><p className="text-xs text-slate-400">{i.category}{i.last_restocked ? `, terakhir diterima ${formatTanggal(i.last_restocked)}` : ''}</p></div></div></td>
                      <td className="px-3 py-3 text-right font-medium text-slate-900" data-stock>{fmtQty(i.current_stock)} <span className="text-xs text-slate-400 font-normal">{i.unit}</span></td>
                      <td className="px-3 py-3"><span className={`text-xs px-2 py-1 rounded-full font-medium ${BADGE[s].cls}`}>{BADGE[s].label}</span></td>
                      <td className="px-6 py-3"><div className="flex justify-end gap-2">
                        <button onClick={() => setMove({ item: i, kind: 'in' })} data-act="in" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 text-sm hover:bg-emerald-100"><ArrowDownToLine className="h-4 w-4" /> Terima</button>
                        <button onClick={() => setMove({ item: i, kind: 'out' })} data-act="out" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 text-amber-700 text-sm hover:bg-amber-100"><ArrowUpFromLine className="h-4 w-4" /> Pakai</button>
                        <button onClick={() => setHistory(i)} aria-label={`Riwayat ${i.name}`} data-act="history" className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100"><History className="h-4 w-4" /></button>
                      </div></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          </>
        )}
      </div>

      <StockMoveModal item={move?.item ?? null} kind={move?.kind ?? 'in'} onClose={() => setMove(null)} />
      <StockHistoryModal item={history} onClose={() => setHistory(null)} />
    </div>
  );
}
