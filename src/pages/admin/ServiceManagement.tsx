import { useState } from 'react';
import { Plus, Search, Edit, Tag, Clock, DollarSign, ToggleLeft, ToggleRight, TrendingUp } from 'lucide-react';
import { services as initialServices } from '@/data/mockData';
import { Modal } from '@/components/shared/Modal';
import { FormField, inputClass, selectClass } from '@/components/shared/FormField';

type Service = typeof initialServices[0];

const categoryColors: Record<string, { bg: string; text: string; border: string }> = {
  Regular:   { bg: 'bg-blue-100',   text: 'text-blue-700',   border: 'border-blue-200' },
  Premium:   { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-200' },
  Express:   { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-200' },
  Specialty: { bg: 'bg-teal-100',   text: 'text-teal-700',   border: 'border-teal-200' },
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
    name: '', category: 'Regular', price: '', priceUnit: 'per kg',
    estimatedTime: '', color: 'blue', description: '', isActive: true,
  });

  const filtered = services.filter(s => {
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = !filterCat || s.category === filterCat;
    return matchSearch && matchCat;
  });

  const openAdd = () => {
    setEditService(null);
    setForm({ name: '', category: 'Regular', price: '', priceUnit: 'per kg', estimatedTime: '', color: 'blue', description: '', isActive: true });
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
          <h1 className="text-slate-900">Service Management</h1>
          <p className="text-slate-500 text-sm mt-1">Configure laundry services, pricing, and turnaround times</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700 transition-colors shadow-sm shadow-blue-200">
          <Plus className="h-4 w-4" /> Add Service
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Services', value: services.length, sub: `${services.filter(s => s.isActive).length} active` },
          { label: 'Categories', value: categories.length, sub: 'Service types' },
          { label: 'Monthly Orders', value: services.reduce((s, sv) => s + sv.ordersThisMonth, 0), sub: 'All services' },
          { label: 'Est. Monthly Revenue', value: `$${(totalRevenue/1000).toFixed(1)}k`, sub: 'Active services' },
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
          <input placeholder="Search services..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm" />
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
              {cat || 'All'}
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
                  <button onClick={() => toggleActive(svc.id)} className="mt-1">
                    {svc.isActive
                      ? <ToggleRight className="h-6 w-6 text-emerald-500" />
                      : <ToggleLeft className="h-6 w-6 text-slate-300" />
                    }
                  </button>
                </div>

                <p className="text-xs text-slate-500 mb-4 leading-relaxed">{svc.description}</p>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-slate-50">
                    <DollarSign className="h-4 w-4 text-blue-500" />
                    <div>
                      <p className="text-xs text-slate-400">Price</p>
                      <p className="text-sm font-semibold text-slate-900">${svc.price.toFixed(2)} <span className="text-xs font-normal text-slate-400">{svc.priceUnit}</span></p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-slate-50">
                    <Clock className="h-4 w-4 text-amber-500" />
                    <div>
                      <p className="text-xs text-slate-400">Turnaround</p>
                      <p className="text-sm font-semibold text-slate-900">{svc.estimatedTime}</p>
                    </div>
                  </div>
                </div>

                {svc.isActive && (
                  <div className="flex items-center gap-2 mt-3 p-3 rounded-lg bg-emerald-50 border border-emerald-100">
                    <TrendingUp className="h-4 w-4 text-emerald-600" />
                    <p className="text-xs text-emerald-700 font-medium">{svc.ordersThisMonth} orders this month</p>
                    <span className="ml-auto text-xs text-emerald-600 font-semibold">${(svc.price * svc.ordersThisMonth).toLocaleString()}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-slate-100 bg-slate-50 rounded-b-xl">
                <button onClick={() => openEdit(svc)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-slate-600 hover:bg-white border border-slate-200 transition-colors">
                  <Edit className="h-3.5 w-3.5" /> Edit Pricing
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
        title={editService ? 'Edit Service' : 'Add New Service'}
        size="md"
        footer={
          <div className="flex items-center justify-end gap-3">
            <button onClick={() => setShowModal(false)} className="px-4 py-2 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50">Cancel</button>
            <button onClick={handleSave} className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700">{editService ? 'Save Changes' : 'Add Service'}</button>
          </div>
        }
      >
        <div className="space-y-4">
          <FormField label="Service Name" required>
            <input className={inputClass} value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="e.g. Premium Wash & Press" />
          </FormField>
          <FormField label="Description">
            <textarea className={inputClass} rows={2} value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Brief description of the service" />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Category" required>
              <select className={selectClass} value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
                <option>Regular</option>
                <option>Premium</option>
                <option>Express</option>
                <option>Specialty</option>
              </select>
            </FormField>
            <FormField label="Color Theme">
              <select className={selectClass} value={form.color} onChange={e => setForm({...form, color: e.target.value})}>
                {['blue', 'purple', 'orange', 'green', 'teal', 'amber', 'red', 'indigo'].map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
              </select>
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Price" required>
              <input type="number" step="0.01" className={inputClass} value={form.price} onChange={e => setForm({...form, price: e.target.value})} placeholder="0.00" />
            </FormField>
            <FormField label="Price Unit">
              <select className={selectClass} value={form.priceUnit} onChange={e => setForm({...form, priceUnit: e.target.value})}>
                <option value="per kg">per kg</option>
                <option value="per piece">per piece</option>
                <option value="per pair">per pair</option>
                <option value="per set">per set</option>
              </select>
            </FormField>
          </div>
          <FormField label="Estimated Turnaround">
            <input className={inputClass} value={form.estimatedTime} onChange={e => setForm({...form, estimatedTime: e.target.value})} placeholder="e.g. 24 hours" />
          </FormField>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 border border-slate-200">
            <button onClick={() => setForm({...form, isActive: !form.isActive})}>
              {form.isActive ? <ToggleRight className="h-6 w-6 text-emerald-500" /> : <ToggleLeft className="h-6 w-6 text-slate-300" />}
            </button>
            <div>
              <p className="text-sm font-medium text-slate-700">Service Active</p>
              <p className="text-xs text-slate-400">{form.isActive ? 'Visible and available to staff' : 'Hidden from staff interface'}</p>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
