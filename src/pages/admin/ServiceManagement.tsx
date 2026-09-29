import { useState } from 'react';
import { Plus, Search, Edit, Tag, Clock, Banknote, ToggleLeft, ToggleRight, TrendingUp } from 'lucide-react';
import { services as initialServices } from '@/data/mockData';
import { formatRupiah, formatRupiahRingkas, formatAngka } from '@/lib/format';
import { Modal } from '@/components/shared/Modal';
import { FormField, inputClass, selectClass } from '@/components/shared/FormField';

type Service = typeof initialServices[0];

const categoryColors: Record<string, { bg: string; text: string; border: string }> = {
  Reguler:   { bg: 'bg-blue-100',   text: 'text-blue-700',   border: 'border-blue-200' },
  Premium:   { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-200' },
  Express:   { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-200' },
  Khusus:    { bg: 'bg-teal-100',   text: 'text-teal-700',   border: 'border-teal-200' },
};

const warnaLabel: Record<string, string> = {
  blue: 'Biru', purple: 'Ungu', orange: 'Oranye', green: 'Hijau',
  teal: 'Tosca', amber: 'Kuning', red: 'Merah', indigo: 'Indigo',
};

const serviceIconBg: Record<string, string> = {
  blue: 'bg-blue-500', purple: 'bg-purple-500', orange: 'bg-orange-500',
  green: 'bg-green-500', teal: 'bg-teal-500', amber: 'bg-amber-500',
  red: 'bg-red-500', indigo: 'bg-indigo-500',
};

export default function ServiceManagement() {
  const [services, setServices] = useState(initialServices);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editService, setEditService] = useState<Service | null>(null);
  const [form, setForm] = useState({
    name: '', category: 'Reguler', price: '', priceUnit: 'per kg',
    estimatedTime: '', color: 'blue', description: '', isActive: true,
  });

  const filtered = services.filter(s => {
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = !filterCat || s.category === filterCat;
    return matchSearch && matchCat;
  });

  const openAdd = () => {
    setEditService(null);
    setForm({ name: '', category: 'Reguler', price: '', priceUnit: 'per kg', estimatedTime: '', color: 'blue', description: '', isActive: true });
    setShowModal(true);
  };

  const openEdit = (svc: Service) => {
    setEditService(svc);
    setForm({ name: svc.name, category: svc.category, price: String(svc.price), priceUnit: svc.priceUnit, estimatedTime: svc.estimatedTime, color: svc.color, description: svc.description, isActive: svc.isActive });
    setShowModal(true);
  };

  const handleSave = () => {
    if (editService) {
      setServices(prev => prev.map(s => s.id === editService.id ? { ...s, ...form, price: parseFloat(form.price) || 0 } : s));
    } else {
      setServices(prev => [...prev, { id: `s${Date.now()}`, ...form, price: parseFloat(form.price) || 0, ordersThisMonth: 0 }]);
    }
    setShowModal(false);
  };

  const toggleActive = (id: string) => {
    setServices(prev => prev.map(s => s.id === id ? { ...s, isActive: !s.isActive } : s));
  };

  const categories = [...new Set(services.map(s => s.category))];
  const totalRevenue = services.filter(s => s.isActive).reduce((sum, s) => sum + s.price * s.ordersThisMonth, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-slate-900">Manajemen Layanan</h1>
          <p className="text-slate-500 text-sm mt-1">Atur layanan laundry, harga, dan lama pengerjaan</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700 transition-colors shadow-sm shadow-blue-200">
          <Plus className="h-4 w-4" /> Tambah Layanan
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Layanan', value: services.length, sub: `${services.filter(s => s.isActive).length} aktif` },
          { label: 'Kategori', value: categories.length, sub: 'Jenis layanan' },
          { label: 'Pesanan Bulanan', value: services.reduce((s, sv) => s + sv.ordersThisMonth, 0), sub: 'Semua layanan' },
          { label: 'Estimasi Pendapatan Bulanan', value: formatRupiahRingkas(totalRevenue), sub: 'Layanan aktif' },
        ].map(c => (
          <div key={c.label} className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
            <p className="text-xs text-slate-400">{c.label}</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{c.value}</p>
            <p className="text-xs text-slate-400 mt-0.5">{c.sub}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input placeholder="Cari layanan..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm" />
        </div>
        <div className="flex items-center gap-2">
          {['', ...categories].map(cat => (
            <button
              key={cat || 'all'}
              onClick={() => setFilterCat(cat)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                filterCat === cat ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {cat || 'Semua'}
            </button>
          ))}
        </div>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {filtered.map(svc => {
          const catStyle = categoryColors[svc.category] || { bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-200' };
          const iconBg = serviceIconBg[svc.color] || 'bg-slate-500';
          return (
            <div key={svc.id} className={`bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all ${!svc.isActive ? 'opacity-60' : ''}`}>
              <div className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-3">
                    <div className={`h-11 w-11 rounded-xl ${iconBg} flex items-center justify-center flex-shrink-0`}>
                      <Tag className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h4 className="text-slate-900 font-semibold">{svc.name}</h4>
                      <span className={`inline-block mt-1 text-xs font-medium px-2 py-0.5 rounded-full ${catStyle.bg} ${catStyle.text}`}>{svc.category}</span>
                    </div>
                  </div>
                  <button onClick={() => toggleActive(svc.id)} className="mt-1" title={svc.isActive ? 'Nonaktifkan layanan' : 'Aktifkan layanan'} aria-label={svc.isActive ? 'Nonaktifkan layanan' : 'Aktifkan layanan'}>
                    {svc.isActive
                      ? <ToggleRight className="h-6 w-6 text-emerald-500" />
                      : <ToggleLeft className="h-6 w-6 text-slate-300" />
                    }
                  </button>
                </div>

                <p className="text-xs text-slate-500 mb-4 leading-relaxed">{svc.description}</p>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-slate-50">
                    <Banknote className="h-4 w-4 text-blue-500" />
                    <div>
                      <p className="text-xs text-slate-400">Harga</p>
                      <p className="text-sm font-semibold text-slate-900">{formatRupiah(svc.price)} <span className="text-xs font-normal text-slate-400">{svc.priceUnit}</span></p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-slate-50">
                    <Clock className="h-4 w-4 text-amber-500" />
                    <div>
                      <p className="text-xs text-slate-400">Lama Pengerjaan</p>
                      <p className="text-sm font-semibold text-slate-900">{svc.estimatedTime}</p>
                    </div>
                  </div>
                </div>

                {svc.isActive && (
                  <div className="flex items-center gap-2 mt-3 p-3 rounded-lg bg-emerald-50 border border-emerald-100">
                    <TrendingUp className="h-4 w-4 text-emerald-600" />
                    <p className="text-xs text-emerald-700 font-medium">{formatAngka(svc.ordersThisMonth)} pesanan bulan ini</p>
                    <span className="ml-auto text-xs text-emerald-600 font-semibold">{formatRupiah(svc.price * svc.ordersThisMonth)}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-slate-100 bg-slate-50 rounded-b-xl">
                <button onClick={() => openEdit(svc)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-slate-600 hover:bg-white border border-slate-200 transition-colors">
                  <Edit className="h-3.5 w-3.5" /> Ubah Harga
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editService ? 'Ubah Layanan' : 'Tambah Layanan Baru'}
        size="md"
        footer={
          <div className="flex items-center justify-end gap-3">
            <button onClick={() => setShowModal(false)} className="px-4 py-2 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50">Batal</button>
            <button onClick={handleSave} className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700">{editService ? 'Simpan Perubahan' : 'Tambah Layanan'}</button>
          </div>
        }
      >
        <div className="space-y-4">
          <FormField label="Nama Layanan" required>
            <input className={inputClass} value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="mis. Cuci Setrika Premium" />
          </FormField>
          <FormField label="Deskripsi">
            <textarea className={inputClass} rows={2} value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Deskripsi singkat layanan" />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Kategori" required>
              <select className={selectClass} value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
                <option>Reguler</option>
                <option>Premium</option>
                <option>Express</option>
                <option>Khusus</option>
              </select>
            </FormField>
            <FormField label="Warna">
              <select className={selectClass} value={form.color} onChange={e => setForm({...form, color: e.target.value})}>
                {['blue', 'purple', 'orange', 'green', 'teal', 'amber', 'red', 'indigo'].map(c => <option key={c} value={c}>{warnaLabel[c]}</option>)}
              </select>
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Harga (Rp)" required>
              <input type="number" step="500" className={inputClass} value={form.price} onChange={e => setForm({...form, price: e.target.value})} placeholder="7000" />
            </FormField>
            <FormField label="Satuan Harga">
              <select className={selectClass} value={form.priceUnit} onChange={e => setForm({...form, priceUnit: e.target.value})}>
                <option value="per kg">per kg</option>
                <option value="per pcs">per pcs</option>
                <option value="per pasang">per pasang</option>
                <option value="per set">per set</option>
              </select>
            </FormField>
          </div>
          <FormField label="Estimasi Pengerjaan">
            <input className={inputClass} value={form.estimatedTime} onChange={e => setForm({...form, estimatedTime: e.target.value})} placeholder="mis. 24 jam" />
          </FormField>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 border border-slate-200">
            <button onClick={() => setForm({...form, isActive: !form.isActive})}>
              {form.isActive ? <ToggleRight className="h-6 w-6 text-emerald-500" /> : <ToggleLeft className="h-6 w-6 text-slate-300" />}
            </button>
            <div>
              <p className="text-sm font-medium text-slate-700">Layanan Aktif</p>
              <p className="text-xs text-slate-400">{form.isActive ? 'Tampil dan bisa dipilih staf' : 'Disembunyikan dari tampilan staf'}</p>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
