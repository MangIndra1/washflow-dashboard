import { useState } from 'react';
import { Plus, Percent, Tag, Calendar, Users, Copy, Edit, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import { promotions as initialPromos } from '@/data/mockData';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Modal } from '@/components/shared/Modal';
import { formatRupiah, formatTanggal, formatAngka } from '@/lib/format';
import { FormField, inputClass, selectClass } from '@/components/shared/FormField';

const statusLabel: Record<string, string> = { active: 'Aktif', scheduled: 'Terjadwal', expired: 'Kedaluwarsa' };

type Promo = typeof initialPromos[0];

export default function PromotionsPage() {
  const [promos, setPromos] = useState(initialPromos);
  const [showModal, setShowModal] = useState(false);
  const [editPromo, setEditPromo] = useState<Promo | null>(null);
  const [filterStatus, setFilterStatus] = useState('');
  const [copied, setCopied] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', type: 'percentage', value: '', minOrder: '0', code: '', validFrom: '', validTo: '', maxUsage: '' });

  const filtered = promos.filter(p => !filterStatus || p.status === filterStatus);

  const openAdd = () => {
    setEditPromo(null);
    setForm({ name: '', type: 'percentage', value: '', minOrder: '0', code: '', validFrom: '', validTo: '', maxUsage: '' });
    setShowModal(true);
  };

  const openEdit = (p: Promo) => {
    setEditPromo(p);
    setForm({ name: p.name, type: p.type, value: String(p.value), minOrder: String(p.minOrder), code: p.code, validFrom: p.validFrom, validTo: p.validTo, maxUsage: String(p.maxUsage) });
    setShowModal(true);
  };

  const handleSave = () => {
    if (editPromo) {
      setPromos(prev => prev.map(p => p.id === editPromo.id ? { ...p, ...form, value: Number(form.value), minOrder: Number(form.minOrder), maxUsage: Number(form.maxUsage) } : p));
    } else {
      setPromos(prev => [...prev, { id: `p${Date.now()}`, ...form, value: Number(form.value), minOrder: Number(form.minOrder), maxUsage: Number(form.maxUsage), usageCount: 0, status: 'active' }]);
    }
    setShowModal(false);
  };

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code).catch(() => {});
    setCopied(code);
    setTimeout(() => setCopied(null), 2000);
  };

  const toggleStatus = (id: string) => {
    setPromos(prev => prev.map(p => p.id === id && p.status !== 'expired' ? { ...p, status: p.status === 'active' ? 'scheduled' : 'active' } : p));
  };

  const stats = {
    active: promos.filter(p => p.status === 'active').length,
    totalUsage: promos.reduce((s, p) => s + p.usageCount, 0),
    scheduled: promos.filter(p => p.status === 'scheduled').length,
    expired: promos.filter(p => p.status === 'expired').length,
  };

  const usagePct = (p: Promo) => Math.min(100, (p.usageCount / p.maxUsage) * 100);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-slate-900">Promo dan Diskon</h1>
          <p className="text-slate-500 text-sm mt-1">Buat dan kelola kode diskon serta kampanye promo</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700 transition-colors shadow-sm shadow-blue-200">
          <Plus className="h-4 w-4" /> Promo Baru
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Promo Aktif', value: stats.active, icon: Percent, color: 'emerald' },
          { label: 'Total Penggunaan', value: stats.totalUsage, icon: Users, color: 'blue' },
          { label: 'Terjadwal', value: stats.scheduled, icon: Calendar, color: 'amber' },
          { label: 'Kedaluwarsa', value: stats.expired, icon: Tag, color: 'slate' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-slate-400">{s.label}</p>
              <div className={`h-8 w-8 rounded-lg bg-${s.color}-100 flex items-center justify-center`}>
                <s.icon className={`h-4 w-4 text-${s.color}-600`} />
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-900">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2">
        {['', 'active', 'scheduled', 'expired'].map(status => (
          <button
            key={status || 'all'}
            onClick={() => setFilterStatus(status)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filterStatus === status ? 'bg-blue-600 text-white shadow-sm shadow-blue-200' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
          >
            {status ? statusLabel[status] : 'Semua Promo'}
            <span className="ml-2 text-xs opacity-70">({status ? promos.filter(p => p.status === status).length : promos.length})</span>
          </button>
        ))}
      </div>

      {/* Promotions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {filtered.map(promo => (
          <div key={promo.id} className={`bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow ${promo.status === 'expired' ? 'opacity-60' : ''}`}>
            <div className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start gap-3">
                  <div className={`h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 ${promo.status === 'active' ? 'bg-emerald-100' : promo.status === 'scheduled' ? 'bg-blue-100' : 'bg-slate-100'}`}>
                    <Percent className={`h-5 w-5 ${promo.status === 'active' ? 'text-emerald-600' : promo.status === 'scheduled' ? 'text-blue-600' : 'text-slate-400'}`} />
                  </div>
                  <div>
                    <h4 className="text-slate-900 font-semibold text-sm leading-snug">{promo.name}</h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {promo.type === 'percentage' ? `Diskon ${promo.value}%` : `Diskon ${formatRupiah(promo.value)}`}
                      {promo.minOrder > 0 && `, min. ${formatRupiah(promo.minOrder)}`}
                    </p>
                  </div>
                </div>
                <StatusBadge status={promo.status} size="sm" />
              </div>

              {/* Promo Code */}
              <div className="flex items-center gap-2 mb-4">
                <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 border-dashed">
                  <Tag className="h-3.5 w-3.5 text-slate-400" />
                  <span className="text-sm font-mono font-bold text-slate-800 tracking-wider">{promo.code}</span>
                </div>
                <button
                  onClick={() => handleCopy(promo.code)}
                  title="Salin kode"
                  aria-label="Salin kode"
                  className={`p-2 rounded-lg border transition-colors ${copied === promo.code ? 'border-emerald-300 bg-emerald-50 text-emerald-600' : 'border-slate-200 hover:bg-slate-100 text-slate-500'}`}
                >
                  <Copy className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Usage Bar */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-slate-500">Pemakaian</span>
                  <span className="text-xs font-medium text-slate-700">{formatAngka(promo.usageCount)} / {formatAngka(promo.maxUsage)}</span>
                </div>
                <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${usagePct(promo) >= 90 ? 'bg-red-500' : usagePct(promo) >= 70 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                    style={{ width: `${usagePct(promo)}%` }}
                  />
                </div>
              </div>

              {/* Dates */}
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Calendar className="h-3.5 w-3.5" />
                <span>{formatTanggal(promo.validFrom)} sampai {formatTanggal(promo.validTo)}</span>
              </div>
            </div>

            <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 bg-slate-50 rounded-b-xl">
              <button onClick={() => toggleStatus(promo.id)} disabled={promo.status === 'expired'} className="disabled:opacity-40">
                {promo.status === 'active'
                  ? <ToggleRight className="h-5 w-5 text-emerald-500" />
                  : <ToggleLeft className="h-5 w-5 text-slate-300" />
                }
              </button>
              <div className="flex items-center gap-1.5">
                <button onClick={() => openEdit(promo)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-slate-600 hover:bg-white border border-slate-200 transition-colors">
                  <Edit className="h-3.5 w-3.5" /> Ubah
                </button>
                <button onClick={() => setPromos(p => p.filter(x => x.id !== promo.id))} title="Hapus" aria-label="Hapus" className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 transition-colors">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editPromo ? 'Ubah Promo' : 'Promo Baru'} size="md"
        footer={
          <div className="flex justify-end gap-3">
            <button onClick={() => setShowModal(false)} className="px-4 py-2 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50">Batal</button>
            <button onClick={handleSave} className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700">{editPromo ? 'Simpan Perubahan' : 'Buat Promo'}</button>
          </div>
        }
      >
        <div className="space-y-4">
          <FormField label="Nama Promo" required>
            <input className={inputClass} value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="mis. Promo Gajian" />
          </FormField>
          <FormField label="Kode Promo" required>
            <input className={`${inputClass} uppercase`} value={form.code} onChange={e => setForm({...form, code: e.target.value.toUpperCase()})} placeholder="mis. GAJIAN20" />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Jenis Diskon" required>
              <select className={selectClass} value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
                <option value="percentage">Persentase (%)</option>
                <option value="fixed">Nominal Tetap (Rp)</option>
              </select>
            </FormField>
            <FormField label="Nilai Diskon" required>
              <input type="number" step={form.type === 'percentage' ? 1 : 1000} className={inputClass} value={form.value} onChange={e => setForm({...form, value: e.target.value})} placeholder={form.type === 'percentage' ? 'Persen diskon' : 'Nominal (Rp), mis. 10000'} />
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Minimal Pesanan (Rp)">
              <input type="number" step="1000" className={inputClass} value={form.minOrder} onChange={e => setForm({...form, minOrder: e.target.value})} placeholder="0 = tanpa minimum" />
            </FormField>
            <FormField label="Batas Pemakaian">
              <input type="number" className={inputClass} value={form.maxUsage} onChange={e => setForm({...form, maxUsage: e.target.value})} placeholder="Batas total penggunaan" />
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Berlaku Mulai" required>
              <input type="date" className={inputClass} value={form.validFrom} onChange={e => setForm({...form, validFrom: e.target.value})} />
            </FormField>
            <FormField label="Berlaku Sampai" required>
              <input type="date" className={inputClass} value={form.validTo} onChange={e => setForm({...form, validTo: e.target.value})} />
            </FormField>
          </div>
        </div>
      </Modal>
    </div>
  );
}
