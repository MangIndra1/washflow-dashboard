import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Plus, Search, ChevronUp, ChevronDown, Edit, UserX, UserCheck, Mail, Phone, Filter, Shuffle, KeyRound, Copy } from 'lucide-react';

import { StatusBadge } from '@/components/shared/StatusBadge';
import { Modal } from '@/components/shared/Modal';
import { EmptyState, ErrorPanel, TableSkeleton } from '@/components/shared/QueryStatus';
import { FormField, inputClass, selectClass } from '@/components/shared/FormField';
import { useAuth } from '@/features/auth/AuthContext';
import { useBranches } from '@/features/branches/hooks';
import type { AppRole, StaffItem } from '@/features/staff/api';
import { useCreateStaff, useResetStaffPassword, useStaff, useToggleStaff, useUpdateStaff } from '@/features/staff/hooks';
import { pesanError } from '@/lib/errors';
import { formatAngka, formatRupiah, formatTanggal } from '@/lib/format';

type SortKey = 'name' | 'orders' | 'commission';
type SortDir = 'asc' | 'desc';

const JOB_TITLES = ['Operator', 'Operator Senior', 'Manajer Cabang', 'Pemilik Usaha'];
const PER_PAGE = 8;

const initials = (name: string) =>
  name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]!.toUpperCase()).join('') || '?';

function randomPassword(length = 12): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  const bytes = crypto.getRandomValues(new Uint32Array(length));
  return Array.from(bytes, (b) => chars[b % chars.length]).join('');
}

interface StaffForm {
  full_name: string;
  email: string;
  password: string;
  phone: string;
  role: AppRole;
  job_title: string;
  branch_id: string;
  commission_rate: string;
  is_active: boolean;
}

export default function EmployeeManagement() {
  const { currentUser } = useAuth();
  const { data: staff, isLoading, isError, error, refetch } = useStaff();
  const { data: branches } = useBranches();
  const toggle = useToggleStaff();

  const [search, setSearch] = useState('');
  const [filterBranch, setFilterBranch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [sort, setSort] = useState<{ key: SortKey; dir: SortDir }>({ key: 'name', dir: 'asc' });
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState<{ open: boolean; employee: StaffItem | null }>({ open: false, employee: null });
  const [resetTarget, setResetTarget] = useState<StaffItem | null>(null);

  useEffect(() => { setPage(1); }, [search, filterBranch, filterStatus]);

  const handleSort = (key: SortKey) =>
    setSort((prev) => ({ key, dir: prev.key === key && prev.dir === 'asc' ? 'desc' : 'asc' }));

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const mul = sort.dir === 'asc' ? 1 : -1;
    return (staff ?? [])
      .filter((e) =>
        (!q || e.full_name.toLowerCase().includes(q) || (e.email ?? '').toLowerCase().includes(q)) &&
        (!filterBranch || e.branch_id === filterBranch) &&
        (!filterStatus || (filterStatus === 'active') === e.is_active))
      .sort((a, b) => {
        if (sort.key === 'name') return a.full_name.localeCompare(b.full_name, 'id') * mul;
        if (sort.key === 'orders') return (a.orders30d - b.orders30d) * mul;
        return (a.commission30d - b.commission30d) * mul;
      });
  }, [staff, search, filterBranch, filterStatus, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);

  const all = staff ?? [];
  const stats = [
    { label: 'Total', value: all.length, dot: 'bg-slate-500' },
    { label: 'Aktif', value: all.filter((e) => e.is_active).length, dot: 'bg-emerald-500' },
    { label: 'Admin', value: all.filter((e) => e.role === 'admin').length, dot: 'bg-blue-500' },
    { label: 'Nonaktif', value: all.filter((e) => !e.is_active).length, dot: 'bg-red-500' },
  ];

  const onToggle = async (emp: StaffItem) => {
    try {
      await toggle.mutateAsync({ id: emp.id, isActive: !emp.is_active });
      toast.success(emp.is_active ? `${emp.full_name} dinonaktifkan.` : `${emp.full_name} diaktifkan.`);
    } catch (e) {
      toast.error(pesanError(e, 'Gagal mengubah status karyawan.'));
    }
  };

  const SortIcon = ({ k }: { k: SortKey }) => (
    <span className="inline-flex flex-col ml-1">
      <ChevronUp className={`h-2.5 w-2.5 ${sort.key === k && sort.dir === 'asc' ? 'text-blue-600' : 'text-slate-300'}`} />
      <ChevronDown className={`h-2.5 w-2.5 ${sort.key === k && sort.dir === 'desc' ? 'text-blue-600' : 'text-slate-300'}`} />
    </span>
  );

  const th = 'px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide whitespace-nowrap';
  const thBtn = 'flex items-center text-xs font-semibold uppercase tracking-wide hover:text-slate-600';
  const sub = (label: string) => <span className="flex flex-col text-left leading-tight">{label}<span className="text-[10px] font-normal normal-case tracking-normal text-slate-400">30 hari</span></span>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-slate-900">Manajemen Karyawan</h1>
          <p className="text-slate-500 text-sm mt-1">
            {isLoading ? 'Memuat data...' : `${all.length} akun di ${branches?.length ?? 0} cabang`}
          </p>
        </div>
        <button onClick={() => setModal({ open: true, employee: null })} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700 transition-colors shadow-sm shadow-blue-200">
          <Plus className="h-4 w-4" /> Tambah Karyawan
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex items-center gap-3">
            <div className={`h-2 w-2 rounded-full ${s.dot}`} />
            <div>
              <p className="text-xl font-bold text-slate-900">{isLoading ? '...' : formatAngka(s.value)}</p>
              <p className="text-xs text-slate-400">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            placeholder="Cari nama atau email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-slate-200 bg-white text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-400" />
          <select aria-label="Filter cabang" className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm" value={filterBranch} onChange={(e) => setFilterBranch(e.target.value)}>
            <option value="">Semua Cabang</option>
            {(branches ?? []).map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
          <select aria-label="Filter status" className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="">Semua Status</option>
            <option value="active">Aktif</option>
            <option value="inactive">Nonaktif</option>
          </select>
        </div>
      </div>

      {isError && <ErrorPanel message={pesanError(error, 'Data karyawan tidak dapat dimuat.')} onRetry={() => refetch()} />}

      {!isError && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {isLoading ? <TableSkeleton /> : filtered.length === 0 ? (
            <div className="p-6"><EmptyState title="Tidak ada karyawan yang cocok" hint="Ubah kata kunci atau filter." /></div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50">
                      <th className={th}><button onClick={() => handleSort('name')} className={thBtn}>Karyawan <SortIcon k="name" /></button></th>
                      <th className={th}>Kontak</th>
                      <th className={th}>Cabang</th>
                      <th className={th}>Jabatan</th>
                      <th className={th}><button onClick={() => handleSort('orders')} className={thBtn}>{sub('Pesanan')} <SortIcon k="orders" /></button></th>
                      <th className={th}><button onClick={() => handleSort('commission')} className={thBtn}>{sub('Komisi')} <SortIcon k="commission" /></button></th>
                      <th className={th}>Status</th>
                      <th className={th}>Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {paginated.map((emp) => {
                      const isSelf = emp.id === currentUser?.id;
                      return (
                        <tr key={emp.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="h-9 w-9 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                                <span className="text-white text-xs font-semibold">{initials(emp.full_name)}</span>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-slate-900">
                                  {emp.full_name}
                                  {isSelf && <span className="ml-1.5 rounded bg-blue-50 px-1.5 py-0.5 text-xs font-medium text-blue-600">Anda</span>}
                                </p>
                                <p className="text-xs text-slate-400">Sejak {formatTanggal(emp.created_at)}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-1.5 text-xs text-slate-500"><Mail className="h-3 w-3" /> {emp.email ?? '-'}</div>
                              <div className="flex items-center gap-1.5 text-xs text-slate-500"><Phone className="h-3 w-3" /> {emp.phone || '-'}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="whitespace-nowrap text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-full font-medium">
                              {emp.role === 'admin' ? 'Semua cabang' : emp.branch?.name ?? 'Belum ditempatkan'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-600">
                            {emp.job_title}
                            {emp.role === 'admin' && <span className="ml-1.5 rounded bg-blue-50 px-1.5 py-0.5 text-xs font-medium text-blue-600">Admin</span>}
                          </td>
                          <td className="px-6 py-4 text-sm font-medium text-slate-900">{formatAngka(emp.orders30d)}</td>
                          <td className="px-6 py-4">
                            <span className="whitespace-nowrap text-sm font-medium text-emerald-700">{formatRupiah(emp.commission30d)}</span>
                            <span className="text-xs text-slate-400 ml-1">({String(emp.commission_rate).replace('.', ',')}%)</span>
                          </td>
                          <td className="px-6 py-4"><StatusBadge status={emp.is_active ? 'active' : 'inactive'} size="sm" /></td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-1.5">
                              <button onClick={() => setModal({ open: true, employee: emp })} title="Ubah" aria-label={`Ubah ${emp.full_name}`} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors">
                                <Edit className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => setResetTarget(emp)}
                                disabled={isSelf}
                                title={isSelf ? 'Gunakan menu Ganti kata sandi di pojok kanan atas' : 'Atur ulang kata sandi'}
                                aria-label={`Atur ulang kata sandi ${emp.full_name}`}
                                className="p-1.5 rounded-lg hover:bg-amber-50 text-amber-500 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                              >
                                <KeyRound className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => onToggle(emp)}
                                disabled={isSelf || toggle.isPending}
                                title={isSelf ? 'Tidak bisa menonaktifkan akun sendiri' : emp.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                                aria-label={emp.is_active ? `Nonaktifkan ${emp.full_name}` : `Aktifkan ${emp.full_name}`}
                                className={`p-1.5 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${emp.is_active ? 'hover:bg-red-50 text-red-400' : 'hover:bg-emerald-50 text-emerald-500'}`}
                              >
                                {emp.is_active ? <UserX className="h-3.5 w-3.5" /> : <UserCheck className="h-3.5 w-3.5" />}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100">
                <p className="text-xs text-slate-400">
                  Menampilkan {(currentPage - 1) * PER_PAGE + 1} sampai {Math.min(currentPage * PER_PAGE, filtered.length)} dari {filtered.length} karyawan
                </p>
                <div className="flex items-center gap-1">
                  <button onClick={() => setPage(Math.max(1, currentPage - 1))} disabled={currentPage === 1} className="px-3 py-1.5 rounded-lg text-sm border border-slate-200 disabled:opacity-40 hover:bg-slate-50 transition-colors">Sebelumnya</button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <button key={p} onClick={() => setPage(p)} className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${p === currentPage ? 'bg-blue-600 text-white' : 'hover:bg-slate-100 text-slate-600'}`}>{p}</button>
                  ))}
                  <button onClick={() => setPage(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages} className="px-3 py-1.5 rounded-lg text-sm border border-slate-200 disabled:opacity-40 hover:bg-slate-50 transition-colors">Berikutnya</button>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {modal.open && (
        <StaffFormModal
          employee={modal.employee}
          isSelf={modal.employee?.id === currentUser?.id}
          onClose={() => setModal({ open: false, employee: null })}
        />
      )}

      {resetTarget && <ResetPasswordModal employee={resetTarget} onClose={() => setResetTarget(null)} />}
    </div>
  );
}

function ResetPasswordModal({ employee, onClose }: { employee: StaffItem; onClose: () => void }) {
  const reset = useResetStaffPassword();
  const [password, setPassword] = useState(() => randomPassword());
  const valid = password.length >= 8 && password.length <= 72;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(password);
      toast.success('Kata sandi disalin.');
    } catch {
      toast.error('Tidak dapat menyalin. Salin manual dari kolom.');
    }
  };

  const submit = async () => {
    if (!valid) return;
    try {
      await reset.mutateAsync({ id: employee.id, password });
      toast.success(`Kata sandi ${employee.full_name} diatur ulang. Berikan kata sandi baru kepada yang bersangkutan.`);
      onClose();
    } catch (e) {
      toast.error(pesanError(e, 'Gagal mengatur ulang kata sandi.'));
    }
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      title="Atur Ulang Kata Sandi"
      subtitle={`${employee.full_name} (${employee.email ?? 'tanpa email'})`}
      size="sm"
      footer={
        <div className="flex items-center justify-end gap-3">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50">Batal</button>
          <button type="button" onClick={submit} disabled={!valid || reset.isPending} className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700 disabled:opacity-60">
            {reset.isPending ? 'Menyimpan...' : 'Atur Ulang'}
          </button>
        </div>
      }
    >
      <div className="space-y-3">
        <FormField label="Kata Sandi Baru" required hint="Minimal 8 karakter. Catat dan berikan langsung ke karyawan; kata sandi tidak ditampilkan lagi setelah ini.">
          <div className="flex gap-2">
            <input className={inputClass} value={password} onChange={(e) => setPassword(e.target.value)} aria-invalid={!valid} />
            <button type="button" onClick={() => setPassword(randomPassword())} aria-label="Acak kata sandi" className="flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-slate-200 px-3 text-sm text-slate-600 hover:bg-slate-50">
              <Shuffle className="h-3.5 w-3.5" /> Acak
            </button>
            <button type="button" onClick={copy} aria-label="Salin kata sandi" className="flex items-center rounded-lg border border-slate-200 px-3 text-slate-600 hover:bg-slate-50">
              <Copy className="h-3.5 w-3.5" />
            </button>
          </div>
          {!valid && <p className="text-xs text-red-600">Kata sandi harus 8 sampai 72 karakter</p>}
        </FormField>
      </div>
    </Modal>
  );
}

function StaffFormModal({ employee, isSelf, onClose }: { employee: StaffItem | null; isSelf: boolean; onClose: () => void }) {
  const isEdit = !!employee;
  const { data: branches } = useBranches();
  const create = useCreateStaff();
  const update = useUpdateStaff();

  const { register, handleSubmit, watch, setValue, getValues, formState: { errors, isSubmitting } } = useForm<StaffForm>({
    defaultValues: {
      full_name: employee?.full_name ?? '',
      email: employee?.email ?? '',
      password: '',
      phone: employee?.phone ?? '',
      role: employee?.role ?? 'employee',
      job_title: employee?.job_title ?? 'Operator',
      branch_id: employee?.branch_id ?? '',
      commission_rate: employee ? String(employee.commission_rate) : '3',
      is_active: employee?.is_active ?? true,
    },
  });

  const role = watch('role');
  const isActive = watch('is_active');
  const isAdmin = role === 'admin';
  const jobOptions = employee && !JOB_TITLES.includes(employee.job_title) ? [...JOB_TITLES, employee.job_title] : JOB_TITLES;

  const onSubmit = handleSubmit(async (v) => {
    // Field yang di-disable (akun sendiri) tidak ikut terkirim oleh react-hook-form, jadi pakai nilai lama.
    const roleValue: AppRole = isSelf && employee ? employee.role : v.role;
    const common = {
      full_name: v.full_name.trim(),
      phone: v.phone.trim() || null,
      role: roleValue,
      job_title: v.job_title,
      branch_id: roleValue === 'admin' ? null : v.branch_id || null,
      commission_rate: roleValue === 'admin' ? 0 : Number(v.commission_rate),
    };
    try {
      if (employee) {
        await update.mutateAsync({ id: employee.id, ...common, is_active: isSelf ? employee.is_active : v.is_active });
        toast.success('Data karyawan diperbarui.');
      } else {
        await create.mutateAsync({ ...common, email: v.email.trim().toLowerCase(), password: v.password });
        toast.success('Akun karyawan dibuat. Berikan email dan kata sandinya kepada yang bersangkutan.');
      }
      onClose();
    } catch (e) {
      toast.error(pesanError(e, 'Gagal menyimpan data karyawan.'));
    }
  });

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={isEdit ? 'Ubah Karyawan' : 'Tambah Karyawan Baru'}
      subtitle={isEdit ? `Mengubah ${employee.full_name}` : 'Akun langsung aktif dan bisa dipakai masuk'}
      size="md"
      footer={
        <div className="flex items-center justify-end gap-3">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50">Batal</button>
          <button type="submit" form="staff-form" disabled={isSubmitting} className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700 disabled:opacity-60">
            {isSubmitting ? 'Menyimpan...' : isEdit ? 'Simpan Perubahan' : 'Tambah Karyawan'}
          </button>
        </div>
      }
    >
      <form id="staff-form" onSubmit={onSubmit} noValidate className="space-y-4">
        <FormField label="Nama Lengkap" required>
          <input className={inputClass} placeholder="mis. Ni Luh Ayu Prabandari" aria-invalid={!!errors.full_name} {...register('full_name', { required: 'Nama lengkap wajib diisi', minLength: { value: 2, message: 'Minimal 2 karakter' }, maxLength: { value: 100, message: 'Maksimal 100 karakter' } })} />
          {errors.full_name && <p className="text-xs text-red-600">{errors.full_name.message}</p>}
        </FormField>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Email" required hint={isEdit ? 'Email tidak bisa diubah' : undefined}>
            <input
              type="email" className={inputClass} placeholder="nama@usahaanda.com" readOnly={isEdit} aria-invalid={!!errors.email}
              {...register('email', isEdit ? {} : { required: 'Email wajib diisi', pattern: { value: /^\S+@\S+\.\S+$/, message: 'Masukkan alamat email yang valid' } })}
            />
            {errors.email && <p className="text-xs text-red-600">{errors.email.message}</p>}
          </FormField>
          <FormField label="Telepon">
            <input className={inputClass} placeholder="0812-3456-7890" {...register('phone')} />
          </FormField>
        </div>

        {!isEdit && (
          <FormField label="Kata Sandi Awal" required hint="Minimal 8 karakter. Berikan ke karyawan, lalu sarankan menggantinya.">
            <div className="flex gap-2">
              <input
                type="text" autoComplete="off" className={inputClass} placeholder="Minimal 8 karakter" aria-invalid={!!errors.password}
                {...register('password', { required: 'Kata sandi wajib diisi', minLength: { value: 8, message: 'Minimal 8 karakter' }, maxLength: { value: 72, message: 'Maksimal 72 karakter' } })}
              />
              <button type="button" onClick={() => setValue('password', randomPassword(), { shouldValidate: true })} className="flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-slate-200 px-3 text-sm text-slate-600 hover:bg-slate-50">
                <Shuffle className="h-3.5 w-3.5" /> Acak
              </button>
            </div>
            {errors.password && <p className="text-xs text-red-600">{errors.password.message}</p>}
          </FormField>
        )}

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Peran" required hint={isSelf ? 'Tidak bisa mengubah peran akun sendiri' : isAdmin ? 'Admin melihat semua cabang' : 'Karyawan hanya melihat cabangnya'}>
            <select className={selectClass} disabled={isSelf} {...register('role')}>
              <option value="employee">Karyawan</option>
              <option value="admin">Admin</option>
            </select>
          </FormField>
          <FormField label="Jabatan" required>
            <select className={selectClass} {...register('job_title')}>
              {jobOptions.map((j) => <option key={j} value={j}>{j}</option>)}
            </select>
          </FormField>
        </div>

        {!isAdmin && (
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Penempatan Cabang" required>
              <select className={selectClass} aria-invalid={!!errors.branch_id} {...register('branch_id', { validate: (v) => getValues('role') === 'admin' || !!v || 'Pilih cabang' })}>
                <option value="">Pilih cabang</option>
                {(branches ?? []).map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
              {errors.branch_id && <p className="text-xs text-red-600">{errors.branch_id.message}</p>}
            </FormField>
            <FormField label="Komisi (%)" hint="Persen dari total pesanan">
              <input
                type="number" step="0.5" min="0" max="100" className={inputClass} aria-invalid={!!errors.commission_rate}
                {...register('commission_rate', { validate: (v) => (Number(v) >= 0 && Number(v) <= 100) || 'Isi antara 0 dan 100' })}
              />
              {errors.commission_rate && <p className="text-xs text-red-600">{errors.commission_rate.message}</p>}
            </FormField>
          </div>
        )}

        {isEdit && (
          <FormField label="Status" hint={isSelf ? 'Tidak bisa menonaktifkan akun sendiri' : isActive ? undefined : 'Karyawan nonaktif tidak bisa masuk'}>
            <select className={selectClass} disabled={isSelf} {...register('is_active', { setValueAs: (v) => v === true || v === 'true' })}>
              <option value="true">Aktif</option>
              <option value="false">Nonaktif</option>
            </select>
          </FormField>
        )}
      </form>
    </Modal>
  );
}
