import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { AlertTriangle, ArrowDownToLine, ArrowLeftRight, ArrowUpFromLine, Edit, History, Package, Plus, Search, SlidersHorizontal, Trash2 } from 'lucide-react';

import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { FormField, inputClass, selectClass } from '@/components/shared/FormField';
import { Modal } from '@/components/shared/Modal';
import { CardsSkeleton, EmptyState, ErrorPanel, TableSkeleton } from '@/components/shared/QueryStatus';
import { useBranches } from '@/features/branches/hooks';
import { KATEGORI, stockStatus, type CatalogItem, type MoveKind, type StockItem, type StockStatus } from '@/features/inventory/api';
import { useCatalog, useDeleteCatalog, useSaveBranchItem, useSaveCatalog, useStockItems } from '@/features/inventory/hooks';
import { fmtQty, StockHistoryModal, StockMoveModal, TransferModal } from '@/features/inventory/StockDialogs';
import { pesanError } from '@/lib/errors';
import { formatRupiah, formatRupiahRingkas, formatTanggal } from '@/lib/format';

const BADGE: Record<StockStatus, { cls: string; label: string }> = {
  critical: { cls: 'bg-red-100 text-red-700', label: 'Kritis' },
  low: { cls: 'bg-amber-100 text-amber-700', label: 'Menipis' },
  ok: { cls: 'bg-emerald-100 text-emerald-700', label: 'Aman' },
};

interface BranchFormValues { min_stock: string; reorder_point: string; is_active: boolean }

/** Pengaturan satu cabang: batas stok dan aktif. Nama, satuan, dan harga berasal dari Katalog. */
function BranchItemModal({ item, onClose }: { item: StockItem | null; onClose: () => void }) {
  const save = useSaveBranchItem();
  const { register, handleSubmit, watch, formState: { errors } } = useForm<BranchFormValues>({
    values: item ? { min_stock: String(item.min_stock), reorder_point: String(item.reorder_point), is_active: item.is_active } : { min_stock: '0', reorder_point: '0', is_active: true },
  });
  const min = Number(watch('min_stock'));
  const onSubmit = handleSubmit(async (v) => {
    if (!item) return;
    try {
      await save.mutateAsync({ id: item.id, min_stock: Number(v.min_stock), reorder_point: Number(v.reorder_point), is_active: v.is_active });
      toast.success('Pengaturan cabang disimpan.');
      onClose();
    } catch (e) { toast.error(pesanError(e, 'Gagal menyimpan.')); }
  });
  const num = (label: string) => ({ required: `${label} wajib diisi`, validate: (x: string) => (Number.isFinite(Number(x)) && Number(x) >= 0) || `${label} tidak boleh negatif` });
  return (
    <Modal isOpen={!!item} onClose={onClose} size="sm" title={item ? `${item.name}, ${item.branch?.name ?? ''}` : 'Pengaturan cabang'} subtitle="Batas stok khusus cabang ini. Nama, satuan, dan harga diubah di tab Katalog."
      footer={<div className="flex gap-3 w-full">
        <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-700 hover:bg-slate-50">Batal</button>
        <button type="submit" form="branch-item-form" disabled={save.isPending} className="flex-1 px-4 py-2.5 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700 disabled:opacity-60">{save.isPending ? 'Menyimpan...' : 'Simpan'}</button>
      </div>}>
      <form id="branch-item-form" onSubmit={onSubmit} className="space-y-4" noValidate>
        <FormField label={`Stok minimum${item ? ` (${item.unit})` : ''}`} hint="Di bawah ini = Kritis"><input inputMode="decimal" className={inputClass} {...register('min_stock', num('Stok minimum'))} />{errors.min_stock && <p className="text-xs text-red-600 mt-1">{errors.min_stock.message}</p>}</FormField>
        <FormField label={`Titik pesan ulang${item ? ` (${item.unit})` : ''}`} hint="Di bawah ini = Menipis">
          <input inputMode="decimal" className={inputClass} {...register('reorder_point', { ...num('Titik pesan ulang'), validate: (x) => (Number(x) >= 0 && Number(x) >= min) || 'Harus sama dengan atau lebih besar dari stok minimum' })} />
          {errors.reorder_point && <p className="text-xs text-red-600 mt-1">{errors.reorder_point.message}</p>}
        </FormField>
        <label className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" {...register('is_active')} /> Aktif di cabang ini (nonaktif tidak bisa diterima/dipakai)</label>
      </form>
    </Modal>
  );
}

interface CatalogFormValues { name: string; category: string; unit: string; unit_cost: string; supplier: string; default_min_stock: string; default_reorder_point: string; is_active: boolean }

function CatalogFormModal({ item, onClose }: { item: CatalogItem | 'new' | null; onClose: () => void }) {
  const save = useSaveCatalog();
  const editing = item && item !== 'new' ? item : null;
  const { register, handleSubmit, watch, formState: { errors } } = useForm<CatalogFormValues>({
    values: editing
      ? { name: editing.name, category: editing.category, unit: editing.unit, unit_cost: String(editing.unit_cost), supplier: editing.supplier ?? '', default_min_stock: String(editing.default_min_stock), default_reorder_point: String(editing.default_reorder_point), is_active: editing.is_active }
      : { name: '', category: 'Kimia', unit: '', unit_cost: '0', supplier: '', default_min_stock: '0', default_reorder_point: '0', is_active: true },
  });
  const min = Number(watch('default_min_stock'));
  const onSubmit = handleSubmit(async (v) => {
    try {
      await save.mutateAsync({
        id: editing?.id, name: v.name, category: v.category, unit: v.unit, unit_cost: Number(v.unit_cost), supplier: v.supplier,
        default_min_stock: Number(v.default_min_stock), default_reorder_point: Number(v.default_reorder_point), is_active: v.is_active,
      });
      toast.success(editing ? 'Katalog diperbarui dan disalin ke semua cabang.' : 'Barang ditambahkan ke semua cabang dengan stok 0.');
      onClose();
    } catch (e) { toast.error(pesanError(e, 'Gagal menyimpan barang.')); }
  });
  const num = (label: string) => ({ required: `${label} wajib diisi`, validate: (x: string) => (Number.isFinite(Number(x)) && Number(x) >= 0) || `${label} tidak boleh negatif` });
  return (
    <Modal isOpen={!!item} onClose={onClose} title={editing ? 'Ubah Barang Katalog' : 'Tambah Barang ke Katalog'}
      subtitle={editing ? 'Perubahan nama, satuan, harga, dan pemasok berlaku di semua cabang.' : 'Barang otomatis muncul di semua cabang dengan stok 0. Isi stok lewat Terima atau Koreksi.'}
      footer={<div className="flex gap-3 w-full">
        <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-700 hover:bg-slate-50">Batal</button>
        <button type="submit" form="catalog-form" disabled={save.isPending} className="flex-1 px-4 py-2.5 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700 disabled:opacity-60">{save.isPending ? 'Menyimpan...' : 'Simpan'}</button>
      </div>}>
      <form id="catalog-form" onSubmit={onSubmit} className="space-y-4" noValidate>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="Nama barang" required>
            <input className={inputClass} maxLength={80} {...register('name', { required: 'Nama barang wajib diisi' })} />
            {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name.message}</p>}
          </FormField>
          <FormField label="Kategori"><select className={selectClass} {...register('category')}>{KATEGORI.map((k) => <option key={k}>{k}</option>)}</select></FormField>
          <FormField label="Satuan" required hint="kg, liter, pak, pcs">
            <input className={inputClass} maxLength={20} {...register('unit', { required: 'Satuan wajib diisi' })} />
            {errors.unit && <p className="text-xs text-red-600 mt-1">{errors.unit.message}</p>}
          </FormField>
          <FormField label="Harga satuan (Rp)"><input inputMode="numeric" className={inputClass} {...register('unit_cost', num('Harga satuan'))} />{errors.unit_cost && <p className="text-xs text-red-600 mt-1">{errors.unit_cost.message}</p>}</FormField>
          <FormField label="Stok minimum awal" hint="Bisa diubah per cabang. Di bawah ini = Kritis"><input inputMode="decimal" className={inputClass} {...register('default_min_stock', num('Stok minimum'))} />{errors.default_min_stock && <p className="text-xs text-red-600 mt-1">{errors.default_min_stock.message}</p>}</FormField>
          <FormField label="Titik pesan ulang awal" hint="Di bawah ini = Menipis">
            <input inputMode="decimal" className={inputClass} {...register('default_reorder_point', { ...num('Titik pesan ulang'), validate: (x) => (Number(x) >= 0 && Number(x) >= min) || 'Harus sama dengan atau lebih besar dari stok minimum' })} />
            {errors.default_reorder_point && <p className="text-xs text-red-600 mt-1">{errors.default_reorder_point.message}</p>}
          </FormField>
        </div>
        <FormField label="Pemasok (opsional)"><input className={inputClass} {...register('supplier')} /></FormField>
        {editing && <label className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" {...register('is_active')} /> Barang aktif (nonaktif berlaku di semua cabang)</label>}
      </form>
    </Modal>
  );
}

export default function InventoryManagement() {
  const items = useStockItems();
  const branches = useBranches();
  const catalog = useCatalog();
  const remove = useDeleteCatalog();
  const [tab, setTab] = useState<'stock' | 'catalog'>('stock');

  const [search, setSearch] = useState('');
  const [branchId, setBranchId] = useState('');
  const [cat, setCat] = useState('');
  const [status, setStatus] = useState('');
  const [catForm, setCatForm] = useState<CatalogItem | 'new' | null>(null);
  const [branchForm, setBranchForm] = useState<StockItem | null>(null);
  const [move, setMove] = useState<{ item: StockItem; kind: MoveKind } | null>(null);
  const [history, setHistory] = useState<StockItem | null>(null);
  const [transfer, setTransfer] = useState<StockItem | null>(null);
  const [toDelete, setToDelete] = useState<CatalogItem | null>(null);

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
    try { await remove.mutateAsync(toDelete.id); toast.success(`${toDelete.name} dihapus dari katalog.`); }
    catch (e) { toast.error(pesanError(e, 'Gagal menghapus barang.')); }
    finally { setToDelete(null); }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-slate-900">Manajemen Inventaris</h1>
          <p className="text-slate-500 text-sm mt-1">Stok bahan dan perlengkapan per cabang. Setiap perubahan stok tercatat di riwayat.</p>
        </div>
        <button onClick={() => setCatForm('new')} data-new-item className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700 shadow-sm shadow-blue-200"><Plus className="h-4 w-4" /> Tambah ke Katalog</button>
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

      <div className="flex gap-2" role="tablist">
        {([['stock', 'Stok per Cabang'], ['catalog', 'Katalog Barang']] as const).map(([k, l]) => (
          <button key={k} role="tab" aria-selected={tab === k} data-tab={k} onClick={() => setTab(k)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === k ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>{l}</button>
        ))}
      </div>

      {tab === 'stock' && (
      <>
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
                          <button onClick={() => setTransfer(i)} disabled={!i.is_active} aria-label={`Kirim ${i.name}`} title="Kirim ke cabang lain" data-act="transfer" className="p-1.5 rounded-lg text-indigo-600 hover:bg-indigo-50 disabled:opacity-30"><ArrowLeftRight className="h-4 w-4" /></button>
                          <button onClick={() => setHistory(i)} aria-label={`Riwayat ${i.name}`} title="Riwayat" data-act="history" className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100"><History className="h-4 w-4" /></button>
                          <button onClick={() => setBranchForm(i)} aria-label={`Atur ${i.name}`} title="Atur batas stok cabang" data-act="edit" className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100"><Edit className="h-4 w-4" /></button>
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

      </>
      )}

      {tab === 'catalog' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden" data-catalog>
          {catalog.isPending ? <TableSkeleton /> : catalog.isError ? <div className="p-6"><ErrorPanel message={pesanError(catalog.error, 'Katalog tidak dapat dimuat.')} onRetry={() => void catalog.refetch()} /></div>
            : (catalog.data ?? []).length === 0 ? <EmptyState title="Katalog masih kosong" hint="Tambahkan barang pertama dengan tombol Tambah ke Katalog." /> : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-slate-100 bg-slate-50 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide">
                    <th className="px-6 py-3">Barang</th><th className="px-3 py-3">Satuan</th><th className="px-3 py-3 text-right">Harga</th><th className="px-3 py-3">Pemasok</th>
                    <th className="px-3 py-3 text-right">Min / Pesan Ulang Awal</th><th className="px-3 py-3 text-right">Total Stok</th><th className="px-3 py-3">Status</th><th className="px-6 py-3 text-right">Aksi</th>
                  </tr></thead>
                  <tbody className="divide-y divide-slate-50">
                    {catalog.data!.map((c) => {
                      const mine = all.filter((i) => i.catalog_id === c.id);
                      return (
                        <tr key={c.id} data-catalog-row={c.name}>
                          <td className="px-6 py-3"><p className="font-medium text-slate-900">{c.name}</p><p className="text-xs text-slate-400">{c.category}, di {mine.length} cabang</p></td>
                          <td className="px-3 py-3 text-slate-600">{c.unit}</td>
                          <td className="px-3 py-3 text-right text-slate-600">{formatRupiah(c.unit_cost)}</td>
                          <td className="px-3 py-3 text-slate-600">{c.supplier ?? '-'}</td>
                          <td className="px-3 py-3 text-right text-slate-500">{fmtQty(c.default_min_stock)} / {fmtQty(c.default_reorder_point)}</td>
                          <td className="px-3 py-3 text-right font-medium text-slate-900" data-catalog-total>{fmtQty(mine.reduce((t, i) => t + i.current_stock, 0))} <span className="text-xs text-slate-400 font-normal">{c.unit}</span></td>
                          <td className="px-3 py-3">{c.is_active ? <span className="text-xs px-2 py-1 rounded-full bg-emerald-100 text-emerald-700">Aktif</span> : <span className="text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-500">Nonaktif</span>}</td>
                          <td className="px-6 py-3"><div className="flex justify-end gap-1">
                            <button onClick={() => setCatForm(c)} aria-label={`Ubah ${c.name}`} data-cat-act="edit" className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100"><Edit className="h-4 w-4" /></button>
                            <button onClick={() => setToDelete(c)} aria-label={`Hapus ${c.name}`} data-cat-act="delete" className="p-1.5 rounded-lg text-red-500 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
                          </div></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
        </div>
      )}

      <CatalogFormModal item={catForm} onClose={() => setCatForm(null)} />
      <BranchItemModal item={branchForm} onClose={() => setBranchForm(null)} />
      <StockMoveModal item={move?.item ?? null} kind={move?.kind ?? 'in'} onClose={() => setMove(null)} />
      <StockHistoryModal item={history} onClose={() => setHistory(null)} />
      <TransferModal item={transfer} onClose={() => setTransfer(null)} />
      <ConfirmDialog open={!!toDelete} onOpenChange={(o) => { if (!o) setToDelete(null); }} title="Hapus barang dari katalog?"
        description={toDelete ? `${toDelete.name} dihapus dari semua cabang. Barang yang sudah punya riwayat stok di salah satu cabang tidak bisa dihapus, nonaktifkan saja lewat Ubah.` : ''}
        loading={remove.isPending} onConfirm={() => void doDelete()} />
    </div>
  );
}
