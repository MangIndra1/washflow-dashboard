import { useState } from 'react';
import { Plus, Search, ChevronUp, ChevronDown, Edit, UserX, UserCheck, Mail, Phone, Filter } from 'lucide-react';
import { employees as initialEmployees, branches } from '@/data/mockData';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Modal } from '@/components/shared/Modal';
import { FormField, inputClass, selectClass } from '@/components/shared/FormField';

type Employee = typeof initialEmployees[0];
type SortKey = 'name' | 'ordersHandled' | 'totalCommission';
type SortDir = 'asc' | 'desc';

export default function EmployeeManagement() {
  const [employees, setEmployees] = useState(initialEmployees);
  const [search, setSearch] = useState('');
  const [filterBranch, setFilterBranch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [sort, setSort] = useState<{ key: SortKey; dir: SortDir }>({ key: 'name', dir: 'asc' });
  const [showModal, setShowModal] = useState(false);
  const [editEmployee, setEditEmployee] = useState<Employee | null>(null);
  const [page, setPage] = useState(1);
  const perPage = 8;

  const [form, setForm] = useState({ name: '', email: '', phone: '', role: 'Operator', branchId: 'b1', commissionRate: 3, status: 'active' });

  const handleSort = (key: SortKey) => {
    setSort(prev => ({ key, dir: prev.key === key && prev.dir === 'asc' ? 'desc' : 'asc' }));
  };

  const filtered = employees
    .filter(e => {
      const matchSearch = e.name.toLowerCase().includes(search.toLowerCase()) || e.email.toLowerCase().includes(search.toLowerCase());
      const matchBranch = !filterBranch || e.branchId === filterBranch;
      const matchStatus = !filterStatus || e.status === filterStatus;
      return matchSearch && matchBranch && matchStatus;
    })
    .sort((a, b) => {
      const mul = sort.dir === 'asc' ? 1 : -1;
      if (sort.key === 'name') return a.name.localeCompare(b.name) * mul;
      return (a[sort.key] - b[sort.key]) * mul;
    });

  const paginated = filtered.slice((page - 1) * perPage, page * perPage);
  const totalPages = Math.ceil(filtered.length / perPage);

  const openAdd = () => {
    setEditEmployee(null);
    setForm({ name: '', email: '', phone: '', role: 'Operator', branchId: 'b1', commissionRate: 3, status: 'active' });
    setShowModal(true);
  };

  const openEdit = (emp: Employee) => {
    setEditEmployee(emp);
    setForm({ name: emp.name, email: emp.email, phone: emp.phone, role: emp.role, branchId: emp.branchId, commissionRate: emp.commissionRate, status: emp.status });
    setShowModal(true);
  };

  const handleSave = () => {
    const branch = branches.find(b => b.id === form.branchId);
    if (editEmployee) {
      setEmployees(prev => prev.map(e => e.id === editEmployee.id ? { ...e, ...form, branchName: branch?.name || '' } : e));
    } else {
      const initials = form.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
      setEmployees(prev => [...prev, { id: `e${Date.now()}`, ...form, branchName: branch?.name || '', ordersHandled: 0, totalCommission: 0, joinDate: new Date().toISOString().split('T')[0], avatar: initials }]);
    }
    setShowModal(false);
  };

  const toggleStatus = (id: string) => {
    setEmployees(prev => prev.map(e => e.id === id ? { ...e, status: e.status === 'active' ? 'inactive' : 'active' } : e));
  };

  const SortIcon = ({ k }: { k: SortKey }) => (
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
          <h1 className="text-slate-900">Employee Management</h1>
          <p className="text-slate-500 text-sm mt-1">{employees.length} total employees across {branches.length} branches</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700 transition-colors shadow-sm shadow-blue-200">
          <Plus className="h-4 w-4" /> Add Employee
        </button>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total', value: employees.length, color: 'slate' },
          { label: 'Active', value: employees.filter(e => e.status === 'active').length, color: 'emerald' },
          { label: 'Managers', value: employees.filter(e => e.role.includes('Manager')).length, color: 'blue' },
          { label: 'Inactive', value: employees.filter(e => e.status === 'inactive').length, color: 'red' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex items-center gap-3">
            <div className={`h-2 w-2 rounded-full bg-${s.color}-500`} />
            <div>
              <p className="text-xl font-bold text-slate-900">{s.value}</p>
              <p className="text-xs text-slate-400">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            placeholder="Search by name or email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-slate-200 bg-white text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-400" />
          <select className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm" value={filterBranch} onChange={e => setFilterBranch(e.target.value)}>
            <option value="">All Branches</option>
            {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
          <select className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide">
                  <button onClick={() => handleSort('name')} className="flex items-center hover:text-slate-600">
                    Employee <SortIcon k="name" />
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide">Contact</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide">Branch</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide">Role</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide">
                  <button onClick={() => handleSort('ordersHandled')} className="flex items-center hover:text-slate-600">
                    Orders <SortIcon k="ordersHandled" />
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide">
                  <button onClick={() => handleSort('totalCommission')} className="flex items-center hover:text-slate-600">
                    Commission <SortIcon k="totalCommission" />
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide">Status</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {paginated.map(emp => (
                <tr key={emp.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-xs font-semibold">{emp.avatar}</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-900">{emp.name}</p>
                        <p className="text-xs text-slate-400">Since {emp.joinDate}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <Mail className="h-3 w-3" /> {emp.email}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <Phone className="h-3 w-3" /> {emp.phone}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-full font-medium">{emp.branchName}</span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">{emp.role}</td>
                  <td className="px-6 py-4 text-sm font-medium text-slate-900">{emp.ordersHandled}</td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-medium text-emerald-700">${emp.totalCommission.toLocaleString()}</span>
                    <span className="text-xs text-slate-400 ml-1">({emp.commissionRate}%)</span>
                  </td>
                  <td className="px-6 py-4"><StatusBadge status={emp.status} size="sm" /></td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => openEdit(emp)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors">
                        <Edit className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => toggleStatus(emp.id)} className={`p-1.5 rounded-lg transition-colors ${emp.status === 'active' ? 'hover:bg-red-50 text-red-400' : 'hover:bg-emerald-50 text-emerald-500'}`}>
                        {emp.status === 'active' ? <UserX className="h-3.5 w-3.5" /> : <UserCheck className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100">
          <p className="text-xs text-slate-400">Showing {Math.min((page - 1) * perPage + 1, filtered.length)}–{Math.min(page * perPage, filtered.length)} of {filtered.length} employees</p>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1.5 rounded-lg text-sm border border-slate-200 disabled:opacity-40 hover:bg-slate-50 transition-colors">Prev</button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <button key={p} onClick={() => setPage(p)} className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${p === page ? 'bg-blue-600 text-white' : 'hover:bg-slate-100 text-slate-600'}`}>{p}</button>
            ))}
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-1.5 rounded-lg text-sm border border-slate-200 disabled:opacity-40 hover:bg-slate-50 transition-colors">Next</button>
          </div>
        </div>
      </div>

      {/* Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editEmployee ? 'Edit Employee' : 'Add New Employee'}
        subtitle={editEmployee ? `Editing ${editEmployee.name}` : 'Fill in employee details below'}
        size="md"
        footer={
          <div className="flex items-center justify-end gap-3">
            <button onClick={() => setShowModal(false)} className="px-4 py-2 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50">Cancel</button>
            <button onClick={handleSave} className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700">
              {editEmployee ? 'Save Changes' : 'Add Employee'}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <FormField label="Full Name" required>
            <input className={inputClass} value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="e.g. John Smith" />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Email" required>
              <input type="email" className={inputClass} value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="email@cleanwave.app" />
            </FormField>
            <FormField label="Phone">
              <input className={inputClass} value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="+1 555-0000" />
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Role" required>
              <select className={selectClass} value={form.role} onChange={e => setForm({...form, role: e.target.value})}>
                <option>Operator</option>
                <option>Senior Operator</option>
                <option>Branch Manager</option>
              </select>
            </FormField>
            <FormField label="Assign Branch" required>
              <select className={selectClass} value={form.branchId} onChange={e => setForm({...form, branchId: e.target.value})}>
                {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Commission Rate (%)" hint="Percentage of order total">
              <input type="number" min="0" max="20" className={inputClass} value={form.commissionRate} onChange={e => setForm({...form, commissionRate: Number(e.target.value)})} />
            </FormField>
            <FormField label="Status">
              <select className={selectClass} value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </FormField>
          </div>
        </div>
      </Modal>
    </div>
  );
}
