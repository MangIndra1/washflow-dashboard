import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { AlertTriangle, ArrowDownToLine, ArrowUpFromLine, Edit, History, Package, Plus, Search, SlidersHorizontal, Trash2 } from 'lucide-react';

import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { FormField, inputClass, selectClass } from '@/components/shared/FormField';
import { Modal } from '@/components/shared/Modal';
import { CardsSkeleton, EmptyState, ErrorPanel, TableSkeleton } from '@/components/shared/QueryStatus';
import { useBranches } from '@/features/branches/hooks';
import { KATEGORI, stockStatus, type MoveKind, type StockItem, type StockStatus } from '@/features/inventory/api';
import { useDeleteItem, useSaveItem, useStockItems } from '@/features/inventory/hooks';
import { fmtQty, StockHistoryModal, StockMoveModal } from '@/features/inventory/StockDialogs';
import { pesanError } from '@/lib/errors';
import { formatRupiah, formatRupiahRingkas, formatTanggal } from '@/lib/format';

const BADGE: Record<StockStatus, { cls: string; label: string }> = {
  critical: { cls: 'bg-red-100 text-red-700', label: 'Kritis' },
  low: { cls: 'bg-amber-100 text-amber-700', label: 'Menipis' },
  ok: { cls: 'bg-emerald-100 text-emerald-700', label: 'Aman' },
};

interface FormValues {
  branch_id: string; name: string; category: string; unit: string; initial_stock: string;
  min_stock: string; reorder_point: string; unit_cost: string; supplier: string; is_active: boolean;
}

function ItemFormModal({ item, onClose }: { item: StockItem | 'new' | null; onClose: () => void }) {
  const branches = useBranches();
  const save = useSaveItem();
  const editing = item && item !== 'new' ? item : null;
  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormValues>({
    values: editing
      ? { branch_id: editing.branch_id, name: editing.name, category: editing.category, unit: editing.unit, initial_stock: '0', min_stock: String(editing.min_stock), reorder_point: String(editing.reorder_point), unit_cost: String(editing.unit_cost), supplier: editing.supplier ?? '', is_active: editing.is_active }
      : { branch_id: '', name: '', category: 'Kimia', unit: '', initial_stock: '0', min_stock: '0', reorder_point: '0', unit_cost: '0', supplier: '', is_active: true },
  });
  const min = Number(watch('min_stock'));

  const onSubmit = handleSubmit(async (v) => {
    try {
      await save.mutateAsync({
        id: editing?.id, branch_id: v.branch_id, name: v.name, category: v.category, unit: v.unit,
        min_stock: Number(v.min_stock), reorder_point: Number(v.reorder_point), unit_cost: Number(v.unit_cost),
        supplier: v.supplier, is_active: v.is_active, initial_stock: Number(v.initial_stock),
      });
      toast.success(editing ? 'Barang diperbarui.' : 'Barang ditambahkan.');
      onClose();
    } catch (e) {
      toast.error(pesanError(e, 'Gagal menyimpan barang.'));
    }
  });
  const num = (label: string) => ({ required: `${label} wajib diisi`, validate: (x: string) => (Number.isFinite(Number(x)) && Number(x) >= 0) || `${label} tidak boleh negatif` });

  return (
    <Modal isOpen={!!item} onClose={onClose} title={editing ? 'Ubah Barang' : 'Tambah Barang'} subtitle={editing ? 'Jumlah stok diubah lewat Terima, Pakai, atau Koreksi.' : undefined}
      footer={<div className="flex gap-3 w-full">
        <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-700 hover:bg-slate-50">Batal</button>
        <button type="submit" form="item-form" disabled={save.isPending} className="flex-1 px-4 py-2.5 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700 disabled:opacity-60">{save.isPending ? 'Menyimpan...' : 'Simpan'}</button>
      </div>}>
      <form id="item-form" onSubmit={onSubmit} className="space-y-4" noValidate>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Nama barang" required>
            <input className={inputClass} maxLength={80} {...register('name', { required: 'Nama barang wajib diisi' })} />
            {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name.message}</p>}
          </FormField>
          <FormField label="Cabang" required>
            <select className={selectClass} disabled={!!editing} {...register('branch_id', { required: 'Pilih cabang' })}>
              <option value="">Pilih cabang</option>
              {(branches.data ?? []).map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
            {errors.branch_id && <p className="text-xs text-red-600 mt-1">{errors.branch_id.message}</p>}
          </FormField>
          <FormField label="Kategori"><select className={selectClass} {...register('category')}>{KATEGORI.map((k) => <option key={k}>{k}</option>)}</select></FormField>
          <FormField label="Satuan" required hint="kg, liter, pak, pcs">
            <input className={inputClass} maxLength={20} {...register('unit', { required: 'Satuan wajib diisi' })} />
            {errors.unit && <p className="text-xs text-red-600 mt-1">{errors.unit.message}</p>}
          </FormField>
          {!editing && (
            <FormField label="Stok awal"><input inputMode="decimal" className={inputClass} {...register('initial_stock', num('Stok awal'))} />{errors.initial_stock && <p className="text-xs text-red-600 mt-1">{errors.initial_stock.message}</p>}</FormField>
          )}
          <FormField label="Harga satuan (Rp)"><input inputMode="numeric" className={inputClass} {...register('unit_cost', num('Harga satuan'))} />{errors.unit_cost && <p className="text-xs text-red-600 mt-1">{errors.unit_cost.message}</p>}</FormField>
          <FormField label="Stok minimum" hint="Di bawah ini = Kritis"><input inputMode="decimal" className={inputClass} {...register('min_stock', num('Stok minimum'))} />{errors.min_stock && <p className="text-xs text-red-600 mt-1">{errors.min_stock.message}</p>}</FormField>
          <FormField label="Titik pesan ulang" hint="Di bawah ini = Menipis">
            <input inputMode="decimal" className={inputClass} {...register('reorder_point', { ...num('Titik pesan ulang'), validate: (x) => (Number(x) >= 0 && Number(x) >= min) || 'Harus sama dengan atau lebih besar dari stok minimum' })} />
            {errors.reorder_point && <p className="text-xs text-red-600 mt-1">{errors.reorder_point.message}</p>}
          </FormField>
        </div>
        <FormField label="Pemasok (opsional)"><input className={inputClass} {...register('supplier')} /></FormField>
        {editing && <label className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" {...register('is_active')} /> Barang aktif (nonaktif tidak bisa diterima/dipakai)</label>}
      </form>
    </Modal>
  );
}

export default function InventoryManagement() {
  const items = useStockItems();
  const branches = useBranches();
  const remove = useDeleteItem();

  const [search, setSearch] = useState('');
  const [branchId, setBranchId] = useState('');
  const [cat, setCat] = useState('');
  const [status, setStatus] = useState('');
  const [form, setForm] = useState<StockItem | 'new' | null>(null);
  const [move, setMove] = useState<{ item: StockItem; kind: MoveKind } | null>(null);
  const [history, setHistory] = useState<StockItem | null>(null);
  const [toDelete, setToDelete] = useState<StockItem | null>(null);

  const all = useMemo(() => items.data ?? [], [items.data]);
  const active = all.filter((i) => i.is_active);
  const critical = active.filter((i) => stockStatus(i) === 'critical').length;
  const low = active.filter((i) => stockStatus(i) === 'low').length;
  const value = active.filter((i) => !branchId || i.branch_id === branchId).reduce((s, i) => s + i.current_stock * i.unit_cost, 0);

  const rows = useMemo(() => all.filter((i) => {
    const q = search.trim().toLowerCase();
    if (q && !i.name.toLowerCase().includes(q) && !(i.supplier ?? '').toLowerCase().includes(q)) return false;
    if (branchId && i.branch_id !== branchId) return false;
    if (cat && i.category !== cat) return false;
    if (status === 'inactive') return !i.is_active;
    if (!i.is_active && status) return false;
    if (status && stockStatus(i) !== status) return false;
    return true;
  }), [all, search, branchId, cat, status]);

  const doDelete = async () => {
    if (!toDelete) return;
    try { await remove.mutateAsync(toDelete.id); toast.success(`${toDelete.name} dihapus.`); }
    catch (e) { toast.error(pesanError(e, 'Gagal menghapus barang.')); }
    finally { setToDelete(null); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-slate-900">Manajemen Inventaris</h1>
          <p className="text-slate-500 text-sm mt-1">Stok bahan dan perlengkapan per cabang. Setiap perubahan stok tercatat di riwayat.</p>
        </div>
        <button onClick={() => setForm('new')} data-new-item className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700 shadow-sm shadow-blue-200"><Plus className="h-4 w-4" /> Tambah Barang</button>
      </div>

      {items.isError && <ErrorPanel message={pesanError(items.error, 'Data inventaris tidak dapat dimuat.')} onRetry={() => void items.refetch()} />}

      {(critical > 0 || low > 0) && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-200" data-stock-alert>
          <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{critical > 0 && `${critical} barang stok kritis. `}{low > 0 && `${low} barang sudah mencapai titik pesan ulang.`}</p>
        </div>
      )}

      {items.isPending ? <CardsSkeleton count={4} className="grid grid-cols-2 sm:grid-cols-4 gap-4" /> : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4" data-kpis>
          {[
            { k: 'total', label: 'Barang Aktif', value: String(active.length), color: 'text-slate-900' },
            { k: 'critical', label: 'Stok Kritis', value: String(critical), color: 'text-red-600' },
            { k: 'low', label: 'Stok Menipis', value: String(low), color: 'text-amber-600' },
            { k: 'value', label: 'Nilai Persediaan', value: formatRupiahRingkas(value), color: 'text-slate-900' },
          ].map((s) => (
            <div key={s.k} className="bg-white rounded-xl border border-slate-200 shadow-sm p-4" data-kpi={s.k}>
              <p className="text-xs text-slate-400">{s.label}</p>
              <p className={`text-2xl font-bold mt-1 ${s.color}`} data-value>{s.value}</p>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input aria-label="Cari barang" placeholder="Cari barang atau pemasok..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm" />
        </div>
        <select aria-label="Filter cabang" className={`${selectClass} !w-auto`} value={branchId} onChange={(e) => setBranchId(e.target.value)}>
          <option value="">Semua Cabang</option>{(branches.data ?? []).map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
        <select aria-label="Filter kategori" className={`${selectClass} !w-auto`} value={cat} onChange={(e) => setCat(e.target.value)}>
          <option value="">Semua Kategori</option>{[...new Set([...KATEGORI, ...all.map((i) => i.category)])].map((k) => <option key={k}>{k}</option>)}
        </select>
        <select aria-label="Filter status" className={`${selectClass} !w-auto`} value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">Semua Stok</option><option value="critical">Kritis</option><option value="low">Menipis</option><option value="ok">Aman</option><option value="inactive">Nonaktif</option>
        </select>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {items.isPending ? <TableSkeleton /> : rows.length === 0 ? <EmptyState title="Tidak ada barang" hint={all.length === 0 ? 'Tambahkan barang pertama dengan tombol Tambah Barang.' : 'Ubah pencarian atau filter.'} /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm" data-items>
              <thead><tr className="border-b border-slate-100 bg-slate-50 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide">
                <th className="px-6 py-3">Barang</th><th className="px-3 py-3">Cabang</th><th className="px-3 py-3 text-right">Stok</th><th className="px-3 py-3 text-right">Min / Pesan Ulang</th>
                <th className="px-3 py-3 text-right">Harga</th><th className="px-3 py-3">Status</th><th className="px-6 py-3 text-right">Aksi</th>
              </tr></thead>
              <tbody className="divide-y divide-slate-50">
                {rows.map((i) => {
                  const s = stockStatus(i); const b = BADGE[s];
                  return (
                    <tr key={i.id} className={s === 'critical' && i.is_active ? 'bg-red-50/30' : ''} data-item-row={`${i.name}|${i.branch?.code ?? ''}`} data-status={i.is_active ? s : 'inactive'}>
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center"><Package className="h-4 w-4 text-slate-500" /></div>
                          <div><p className="font-medium text-slate-900">{i.name}</p><p className="text-xs text-slate-400">{i.category}{i.last_restocked ? `, terakhir diterima ${formatTanggal(i.last_restocked)}` : ''}</p></div>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-slate-600">{i.branch?.name ?? '-'}</td>
                      <td className="px-3 py-3 text-right text-slate-900 font-medium" data-stock>{fmtQty(i.current_stock)} <span className="text-xs text-slate-400 font-normal">{i.unit}</span></td>
                      <td className="px-3 py-3 text-right text-slate-500">{fmtQty(i.min_stock)} / {fmtQty(i.reorder_point)}</td>
                      <td className="px-3 py-3 text-right text-slate-600">{formatRupiah(i.unit_cost)}</td>
                      <td className="px-3 py-3">{i.is_active ? <span className={`text-xs px-2 py-1 rounded-full font-medium ${b.cls}`}>{b.label}</span> : <span className="text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-500">Nonaktif</span>}</td>
                      <td className="px-6 py-3">
                        <div className="flex justify-end gap-1">
                          <button onClick={() => setMove({ item: i, kind: 'in' })} disabled={!i.is_active} aria-label={`Terima ${i.name}`} title="Terima" data-act="in" className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 disabled:opacity-30"><ArrowDownToLine className="h-4 w-4" /></button>
                          <button onClick={() => setMove({ item: i, kind: 'out' })} disabled={!i.is_active} aria-label={`Pakai ${i.name}`} title="Pakai" data-act="out" className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-50 disabled:opacity-30"><ArrowUpFromLine className="h-4 w-4" /></button>
                          <button onClick={() => setMove({ item: i, kind: 'adjust' })} aria-label={`Koreksi ${i.name}`} title="Koreksi stok" data-act="adjust" className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50"><SlidersHorizontal className="h-4 w-4" /></button>
                          <button onClick={() => setHistory(i)} aria-label={`Riwayat ${i.name}`} title="Riwayat" data-act="history" className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100"><History className="h-4 w-4" /></button>
                          <button onClick={() => setForm(i)} aria-label={`Ubah ${i.name}`} title="Ubah" data-act="edit" className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100"><Edit className="h-4 w-4" /></button>
                          <button onClick={() => setToDelete(i)} aria-label={`Hapus ${i.name}`} title="Hapus" data-act="delete" className="p-1.5 rounded-lg text-red-500 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ItemFormModal item={form} onClose={() => setForm(null)} />
      <StockMoveModal item={move?.item ?? null} kind={move?.kind ?? 'in'} onClose={() => setMove(null)} />
      <StockHistoryModal item={history} onClose={() => setHistory(null)} />
      <ConfirmDialog open={!!toDelete} onOpenChange={(o) => { if (!o) setToDelete(null); }} title="Hapus barang?"
        description={toDelete ? `${toDelete.name} (${toDelete.branch?.name ?? ''}) dihapus. Barang yang sudah punya riwayat stok tidak bisa dihapus, nonaktifkan saja lewat Ubah.` : ''}
        loading={remove.isPending} onConfirm={() => void doDelete()} />
    </div>
  );
}
