import { useState } from 'react';
import { Plus, Search, MapPin, Phone, Clock, Star, Edit, Trash2, Building2, TrendingUp, Users } from 'lucide-react';
import { branches as initialBranches } from '@/data/mockData';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Modal } from '@/components/shared/Modal';
import { FormField, inputClass, selectClass } from '@/components/shared/FormField';

type Branch = typeof initialBranches[0];

export default function BranchManagement() {
  const [branches, setBranches] = useState(initialBranches);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editBranch, setEditBranch] = useState<Branch | null>(null);
  const [form, setForm] = useState({ name: '', address: '', phone: '', manager: '', openTime: '08:00', closeTime: '20:00', status: 'active' });

  const filtered = branches.filter(b =>
    b.name.toLowerCase().includes(search.toLowerCase()) ||
    b.address.toLowerCase().includes(search.toLowerCase())
  );

  const openAdd = () => {
    setEditBranch(null);
    setForm({ name: '', address: '', phone: '', manager: '', openTime: '08:00', closeTime: '20:00', status: 'active' });
    setShowModal(true);
  };

  const openEdit = (branch: Branch) => {
    setEditBranch(branch);
    setForm({ name: branch.name, address: branch.address, phone: branch.phone, manager: branch.manager, openTime: branch.openTime, closeTime: branch.closeTime, status: branch.status });
    setShowModal(true);
  };

  const handleSave = () => {
    if (editBranch) {
      setBranches(prev => prev.map(b => b.id === editBranch.id ? { ...b, ...form } : b));
    } else {
      const newBranch = { ...form, id: `b${Date.now()}`, managerId: 'e1', dailyOrders: 0, weeklyRevenue: 0, monthlyRevenue: 0, rating: 0, totalCustomers: 0 };
      setBranches(prev => [...prev, newBranch]);
    }
    setShowModal(false);
  };

  const totalRevenue = branches.reduce((s, b) => s + b.monthlyRevenue, 0);
  const totalOrders = branches.reduce((s, b) => s + b.dailyOrders, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-slate-900">Branch Management</h1>
          <p className="text-slate-500 text-sm mt-1">Manage and monitor all laundry branches</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700 transition-colors shadow-sm shadow-blue-200">
          <Plus className="h-4 w-4" /> Add Branch
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total Branches', value: branches.length, sub: `${branches.filter(b => b.status === 'active').length} active`, icon: Building2, color: 'blue' },
          { label: 'Combined Revenue', value: `$${(totalRevenue/1000).toFixed(1)}k`, sub: 'This month', icon: TrendingUp, color: 'emerald' },
          { label: 'Daily Orders', value: totalOrders, sub: 'All branches today', icon: Users, color: 'purple' },
        ].map(c => (
          <div key={c.label} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-slate-500">{c.label}</p>
              <div className={`h-9 w-9 rounded-lg bg-${c.color}-100 flex items-center justify-center`}>
                <c.icon className={`h-4.5 w-4.5 text-${c.color}-600`} />
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-900">{c.value}</p>
            <p className="text-xs text-slate-400 mt-0.5">{c.sub}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search branches..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-slate-200 bg-white text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
          />
        </div>
        <select className={`${selectClass} w-auto bg-white shadow-sm`}>
          <option>All Status</option>
          <option>Active</option>
          <option>Maintenance</option>
          <option>Closed</option>
        </select>
      </div>

      {/* Branch Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {filtered.map(branch => (
          <div key={branch.id} className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-3">
                  <div className="h-12 w-12 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <Building2 className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="text-slate-900 font-semibold">{branch.name}</h4>
                    <div className="flex items-center gap-1.5 mt-1">
                      <MapPin className="h-3.5 w-3.5 text-slate-400" />
                      <p className="text-xs text-slate-500">{branch.address}</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={branch.status} size="sm" />
                </div>
              </div>

              {/* Info Row */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5 text-slate-400" />
                  <span className="text-xs text-slate-600">{branch.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5 text-slate-400" />
                  <span className="text-xs text-slate-600">{branch.openTime} – {branch.closeTime}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-3.5 w-3.5 text-slate-400" />
                  <span className="text-xs text-slate-600">Manager: {branch.manager}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Star className="h-3.5 w-3.5 text-amber-400" />
                  <span className="text-xs text-slate-600">{branch.rating}/5.0</span>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3 p-4 rounded-lg bg-slate-50 border border-slate-100">
                <div className="text-center">
                  <p className="text-lg font-bold text-slate-900">{branch.dailyOrders}</p>
                  <p className="text-xs text-slate-400">Today's Orders</p>
                </div>
                <div className="text-center border-x border-slate-200">
                  <p className="text-lg font-bold text-slate-900">${(branch.monthlyRevenue/1000).toFixed(1)}k</p>
                  <p className="text-xs text-slate-400">Monthly Revenue</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-slate-900">{branch.totalCustomers}</p>
                  <p className="text-xs text-slate-400">Customers</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 px-6 py-3 border-t border-slate-100 bg-slate-50 rounded-b-xl">
              <button
                onClick={() => openEdit(branch)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-slate-600 hover:bg-white border border-slate-200 transition-colors"
              >
                <Edit className="h-3.5 w-3.5" /> Edit
              </button>
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-red-500 hover:bg-red-50 border border-red-100 transition-colors">
                <Trash2 className="h-3.5 w-3.5" /> Remove
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editBranch ? 'Edit Branch' : 'Add New Branch'}
        subtitle={editBranch ? `Editing ${editBranch.name}` : 'Fill in branch details below'}
        size="md"
        footer={
          <div className="flex items-center justify-end gap-3">
            <button onClick={() => setShowModal(false)} className="px-4 py-2 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 transition-colors">
              Cancel
            </button>
            <button onClick={handleSave} className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700 transition-colors">
              {editBranch ? 'Save Changes' : 'Add Branch'}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <FormField label="Branch Name" required>
            <input className={inputClass} value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="e.g. Northside Branch" />
          </FormField>
          <FormField label="Address" required>
            <input className={inputClass} value={form.address} onChange={e => setForm({...form, address: e.target.value})} placeholder="Full address" />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Phone">
              <input className={inputClass} value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="+1 555-0000" />
            </FormField>
            <FormField label="Branch Manager">
              <input className={inputClass} value={form.manager} onChange={e => setForm({...form, manager: e.target.value})} placeholder="Manager name" />
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Opening Time">
              <input type="time" className={inputClass} value={form.openTime} onChange={e => setForm({...form, openTime: e.target.value})} />
            </FormField>
            <FormField label="Closing Time">
              <input type="time" className={inputClass} value={form.closeTime} onChange={e => setForm({...form, closeTime: e.target.value})} />
            </FormField>
          </div>
          <FormField label="Status">
            <select className={selectClass} value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
              <option value="active">Active</option>
              <option value="maintenance">Maintenance</option>
              <option value="closed">Closed</option>
            </select>
          </FormField>
        </div>
      </Modal>
    </div>
  );
}
