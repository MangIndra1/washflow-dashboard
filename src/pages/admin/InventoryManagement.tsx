import { useState } from 'react';
import { Plus, Search, AlertTriangle, Package, RefreshCw, Edit, ChevronUp, ChevronDown, Filter } from 'lucide-react';
import { inventory as initialInventory } from '@/data/mockData';
import { Modal } from '@/components/shared/Modal';
import { formatRupiah, formatRupiahRingkas, formatTanggal } from '@/lib/format';
import { FormField, inputClass, selectClass } from '@/components/shared/FormField';

type Item = typeof initialInventory[0];
type SortKey = 'name' | 'currentStock' | 'unitCost';

const stockStatus = (item: Item) => {
  if (item.currentStock <= item.minStock) return 'critical';
  if (item.currentStock <= item.reorderPoint) return 'low';
  return 'ok';
};

const stockBadge: Record<string, { bg: string; text: string; label: string }> = {
  critical: { bg: 'bg-red-100', text: 'text-red-700', label: 'Kritis' },
  low:      { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Stok Menipis' },
  ok:       { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Tersedia' },
};

const SEMUA = 'Semua';
const categories = [SEMUA, 'Kimia', 'Kemasan', 'Peralatan', 'Kantor'];

export default function InventoryManagement() {
  const [inventory, setInventory] = useState(initialInventory);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState(SEMUA);
  const [filterStatus, setFilterStatus] = useState('');
  const [sort, setSort] = useState<{ key: SortKey; dir: 'asc' | 'desc' }>({ key: 'name', dir: 'asc' });
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<Item | null>(null);
  const [showRestock, setShowRestock] = useState<Item | null>(null);
  const [restockQty, setRestockQty] = useState('');
  const [form, setForm] = useState({ name: '', category: 'Kimia', unit: 'kg', currentStock: '', minStock: '', reorderPoint: '', unitCost: '', supplier: '' });

  const handleSort = (key: SortKey) => setSort(prev => ({ key, dir: prev.key === key && prev.dir === 'asc' ? 'desc' : 'asc' }));

  const filtered = inventory
    .filter(item => {
      const matchSearch = item.name.toLowerCase().includes(search.toLowerCase()) || item.supplier.toLowerCase().includes(search.toLowerCase());
      const matchCat = filterCat === SEMUA || item.category === filterCat;
      const status = stockStatus(item);
      const matchStatus = !filterStatus || status === filterStatus;
      return matchSearch && matchCat && matchStatus;
    })
    .sort((a, b) => {
      const mul = sort.dir === 'asc' ? 1 : -1;
      if (sort.key === 'name') return a.name.localeCompare(b.name) * mul;
      return (a[sort.key] - b[sort.key]) * mul;
    });

  const openAdd = () => {
    setEditItem(null);
    setForm({ name: '', category: 'Kimia', unit: 'kg', currentStock: '', minStock: '', reorderPoint: '', unitCost: '', supplier: '' });
    setShowModal(true);
  };

  const openEdit = (item: Item) => {
    setEditItem(item);
    setForm({ name: item.name, category: item.category, unit: item.unit, currentStock: String(item.currentStock), minStock: String(item.minStock), reorderPoint: String(item.reorderPoint), unitCost: String(item.unitCost), supplier: item.supplier });
    setShowModal(true);
  };

  const handleSave = () => {
    const data = { ...form, currentStock: Number(form.currentStock), minStock: Number(form.minStock), reorderPoint: Number(form.reorderPoint), unitCost: Number(form.unitCost), lastRestocked: editItem?.lastRestocked || new Date().toISOString().split('T')[0] };
    if (editItem) {
      setInventory(prev => prev.map(i => i.id === editItem.id ? { ...i, ...data } : i));
    } else {
      setInventory(prev => [...prev, { id: `inv${Date.now()}`, ...data }]);
    }
    setShowModal(false);
  };

  const handleRestock = () => {
    if (showRestock && restockQty) {
      setInventory(prev => prev.map(i => i.id === showRestock.id ? { ...i, currentStock: i.currentStock + Number(restockQty), lastRestocked: new Date().toISOString().split('T')[0] } : i));
      setShowRestock(null);
      setRestockQty('');
    }
  };

  const criticalCount = inventory.filter(i => stockStatus(i) === 'critical').length;
  const lowCount = inventory.filter(i => stockStatus(i) === 'low').length;
  const totalValue = inventory.reduce((s, i) => s + i.currentStock * i.unitCost, 0);

  const SortBtn = ({ k }: { k: SortKey }) => (
    <span className="inline-flex flex-col ml-1">
      <ChevronUp className={`h-2.5 w-2.5 ${sort.key === k && sort.dir === 'asc' ? 'text-blue-600' : 'text-slate-300'}`} />
      <ChevronDown className={`h-2.5 w-2.5 ${sort.key === k && sort.dir === 'desc' ? 'text-blue-600' : 'text-slate-300'}`} />
    </span>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-slate-900">Manajemen Inventaris</h1>
          <p className="text-slate-500 text-sm mt-1">Pantau stok bahan kimia, kemasan, dan perlengkapan</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700 transition-colors shadow-sm shadow-blue-200">
          <Plus className="h-4 w-4" /> Tambah Barang
        </button>
      </div>

      {/* Alerts */}
      {(criticalCount > 0 || lowCount > 0) && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-200">
          <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-800">Peringatan Stok</p>
            <p className="text-sm text-red-600 mt-0.5">
              {criticalCount > 0 && `${criticalCount} barang stok kritis. `}
              {lowCount > 0 && `${lowCount} barang sudah mencapai titik pemesanan ulang.`}
            </p>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Barang', value: inventory.length, sub: `${categories.length - 1} kategori` },
          { label: 'Stok Kritis', value: criticalCount, sub: 'Perlu segera diisi ulang', color: 'text-red-600' },
          { label: 'Stok Menipis', value: lowCount, sub: 'Di bawah titik pemesanan ulang', color: 'text-amber-600' },
          { label: 'Nilai Inventaris', value: formatRupiahRingkas(totalValue), sub: 'Total nilai stok' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
            <p className="text-xs text-slate-400">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.color || 'text-slate-900'}`}>{s.value}</p>
            <p className="text-xs text-slate-400 mt-0.5">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input placeholder="Cari barang atau pemasok..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm" />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setFilterCat(cat)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filterCat === cat ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
            >
              {cat}
            </button>
          ))}
          <div className="flex items-center gap-1 ml-2">
            <Filter className="h-4 w-4 text-slate-400" />
            <select className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
              <option value="">Semua Stok</option>
              <option value="critical">Kritis</option>
              <option value="low">Menipis</option>
              <option value="ok">Aman</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide">
                  <button onClick={() => handleSort('name')} className="flex items-center hover:text-slate-600">Barang <SortBtn k="name" /></button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide">Kategori</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide">
                  <button onClick={() => handleSort('currentStock')} className="flex items-center hover:text-slate-600">Stok <SortBtn k="currentStock" /></button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide">Min / Pesan Ulang</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide">
                  <button onClick={() => handleSort('unitCost')} className="flex items-center hover:text-slate-600">Harga Satuan <SortBtn k="unitCost" /></button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide">Pemasok</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide">Status</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map(item => {
                const status = stockStatus(item);
                const badge = stockBadge[status];
                const pct = Math.min(100, (item.currentStock / (item.reorderPoint * 2)) * 100);
                return (
                  <tr key={item.id} className={`hover:bg-slate-50 transition-colors ${status === 'critical' ? 'bg-red-50/30' : ''}`}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                          <Package className="h-4 w-4 text-slate-500" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900">{item.name}</p>
                          <p className="text-xs text-slate-400">Terakhir diisi: {formatTanggal(item.lastRestocked)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-full font-medium">{item.category}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{item.currentStock} <span className="text-xs font-normal text-slate-400">{item.unit}</span></p>
                        <div className="mt-1.5 h-1.5 w-24 bg-slate-200 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full transition-all ${status === 'critical' ? 'bg-red-500' : status === 'low' ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500">
                      Min: {item.minStock} / Pesan ulang: {item.reorderPoint}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-800">{formatRupiah(item.unitCost)}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{item.supplier}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
                        {status === 'critical' && <AlertTriangle className="h-3 w-3" />}
                        {badge.label}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => openEdit(item)} title="Ubah" aria-label="Ubah" className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors">
                          <Edit className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => { setShowRestock(item); setRestockQty(''); }} title="Isi ulang stok" aria-label="Isi ulang stok" className="p-1.5 rounded-lg hover:bg-emerald-50 text-emerald-600 transition-colors">
                          <RefreshCw className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50">
          <p className="text-xs text-slate-400">{filtered.length} barang ditampilkan, total nilai: <span className="font-semibold text-slate-700">{formatRupiah(totalValue)}</span></p>
        </div>
      </div>

      {/* Add/Edit Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editItem ? 'Ubah Barang' : 'Tambah Barang Inventaris'} size="md"
        footer={
          <div className="flex justify-end gap-3">
            <button onClick={() => setShowModal(false)} className="px-4 py-2 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50">Batal</button>
            <button onClick={handleSave} className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700">{editItem ? 'Simpan' : 'Tambah Barang'}</button>
          </div>
        }
      >
        <div className="space-y-4">
          <FormField label="Nama Barang" required><input className={inputClass} value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Contoh: Deterjen Bubuk" /></FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Kategori"><select className={selectClass} value={form.category} onChange={e => setForm({...form, category: e.target.value})}>{categories.slice(1).map(c => <option key={c}>{c}</option>)}</select></FormField>
            <FormField label="Satuan"><select className={selectClass} value={form.unit} onChange={e => setForm({...form, unit: e.target.value})}><option value="kg">kg</option><option value="liter">liter</option><option value="pcs">pcs</option><option value="rol">rol</option><option value="botol">botol</option></select></FormField>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <FormField label="Stok Saat Ini"><input type="number" className={inputClass} value={form.currentStock} onChange={e => setForm({...form, currentStock: e.target.value})} /></FormField>
            <FormField label="Stok Minimum"><input type="number" className={inputClass} value={form.minStock} onChange={e => setForm({...form, minStock: e.target.value})} /></FormField>
            <FormField label="Titik Pesan Ulang"><input type="number" className={inputClass} value={form.reorderPoint} onChange={e => setForm({...form, reorderPoint: e.target.value})} /></FormField>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Harga Satuan (Rp)"><input type="number" step="100" min="0" className={inputClass} value={form.unitCost} onChange={e => setForm({...form, unitCost: e.target.value})} placeholder="18000" /></FormField>
            <FormField label="Supplier"><input className={inputClass} value={form.supplier} onChange={e => setForm({...form, supplier: e.target.value})} placeholder="Nama pemasok" /></FormField>
          </div>
        </div>
      </Modal>

      {/* Restock Modal */}
      <Modal isOpen={!!showRestock} onClose={() => setShowRestock(null)} title="Isi Ulang Stok" size="sm"
        footer={
          <div className="flex justify-end gap-3">
            <button onClick={() => setShowRestock(null)} className="px-4 py-2 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50">Batal</button>
            <button onClick={handleRestock} className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm hover:bg-emerald-700">Konfirmasi Isi Ulang</button>
          </div>
        }
      >
        {showRestock && (
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
              <p className="text-sm font-medium text-slate-800">{showRestock.name}</p>
              <p className="text-xs text-slate-500 mt-0.5">Stok saat ini: {showRestock.currentStock} {showRestock.unit}</p>
            </div>
            <FormField label="Jumlah Ditambahkan" required>
              <input type="number" className={inputClass} value={restockQty} onChange={e => setRestockQty(e.target.value)} placeholder={`Jumlah dalam ${showRestock.unit}`} autoFocus />
            </FormField>
          </div>
        )}
      </Modal>
    </div>
  );
}
