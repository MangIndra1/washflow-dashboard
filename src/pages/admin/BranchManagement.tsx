import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Plus, Search, MapPin, Phone, Clock, Edit, Trash2, Building2, TrendingUp, Users } from 'lucide-react';

import { StatusBadge } from '@/components/shared/StatusBadge';
import { Modal } from '@/components/shared/Modal';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { CardsSkeleton, EmptyState, ErrorPanel } from '@/components/shared/QueryStatus';
import { FormField, inputClass, selectClass } from '@/components/shared/FormField';
import { useBranches, useDeleteBranch, useSaveBranch } from '@/features/branches/hooks';
import type { BranchListItem } from '@/features/branches/api';
import { useStaff } from '@/features/staff/hooks';
import { pesanError } from '@/lib/errors';
import { formatAngka, formatRupiahRingkas } from '@/lib/format';

type StatusFilter = 'all' | 'active' | 'maintenance' | 'closed';

interface BranchForm {
  code: string;
  name: string;
  address: string;
  phone: string;
  manager_id: string;
  open_time: string;
  close_time: string;
  status: 'active' | 'maintenance' | 'closed';
}

const jam = (t: string) => t.slice(0, 5); // "08:00:00" -> "08:00"

export default function BranchManagement() {
  const { data: branches, isLoading, isError, error, refetch } = useBranches();
  const deleteBranch = useDeleteBranch();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [modal, setModal] = useState<{ open: boolean; branch: BranchListItem | null }>({ open: false, branch: null });
  const [toDelete, setToDelete] = useState<BranchListItem | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (branches ?? []).filter((b) =>
      (statusFilter === 'all' || b.status === statusFilter) &&
      (!q || b.name.toLowerCase().includes(q) || b.code.toLowerCase().includes(q) || (b.address ?? '').toLowerCase().includes(q)),
    );
  }, [branches, search, statusFilter]);

  const totalRevenue = (branches ?? []).reduce((s, b) => s + b.revenue30d, 0);
  const totalToday = (branches ?? []).reduce((s, b) => s + b.ordersToday, 0);
  const activeCount = (branches ?? []).filter((b) => b.status === 'active').length;

  const confirmDelete = async () => {
    if (!toDelete) return;
    try {
      await deleteBranch.mutateAsync(toDelete.id);
      toast.success(`${toDelete.name} dihapus.`);
      setToDelete(null);
    } catch (e) {
      toast.error(pesanError(e, 'Gagal menghapus cabang.'));
      setToDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-slate-900">Manajemen Cabang</h1>
          <p className="text-slate-500 text-sm mt-1">Kelola dan pantau semua cabang laundry</p>
        </div>
        <button onClick={() => setModal({ open: true, branch: null })} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700 transition-colors shadow-sm shadow-blue-200">
          <Plus className="h-4 w-4" /> Tambah Cabang
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total Cabang', value: formatAngka(branches?.length ?? 0), sub: `${activeCount} aktif`, icon: Building2, bg: 'bg-blue-100', fg: 'text-blue-600' },
          { label: 'Omzet 30 Hari', value: formatRupiahRingkas(totalRevenue), sub: 'Semua cabang', icon: TrendingUp, bg: 'bg-emerald-100', fg: 'text-emerald-600' },
          { label: 'Pesanan Hari Ini', value: formatAngka(totalToday), sub: 'Semua cabang', icon: Users, bg: 'bg-purple-100', fg: 'text-purple-600' },
        ].map((c) => (
          <div key={c.label} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-slate-500">{c.label}</p>
              <div className={`h-9 w-9 rounded-lg ${c.bg} flex items-center justify-center`}>
                <c.icon className={`h-4 w-4 ${c.fg}`} />
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-900">{isLoading ? '...' : c.value}</p>
            <p className="text-xs text-slate-400 mt-0.5">{c.sub}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nama, kode, atau alamat..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-slate-200 bg-white text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
          />
        </div>
        <select
          aria-label="Filter status"
          className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
        >
          <option value="all">Semua Status</option>
          <option value="active">Aktif</option>
          <option value="maintenance">Perbaikan</option>
          <option value="closed">Tutup</option>
        </select>
      </div>

      {isLoading && <CardsSkeleton count={4} />}
      {isError && <ErrorPanel message={pesanError(error, 'Data cabang tidak dapat dimuat.')} onRetry={() => refetch()} />}
      {!isLoading && !isError && filtered.length === 0 && (
        <EmptyState
          title={branches?.length ? 'Tidak ada cabang yang cocok' : 'Belum ada cabang'}
          hint={branches?.length ? 'Ubah kata kunci atau filter status.' : 'Klik "Tambah Cabang" untuk membuat cabang pertama.'}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {filtered.map((branch) => (
          <div key={branch.id} className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-3">
                  <div className="h-12 w-12 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <Building2 className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="text-slate-900 font-semibold">
                      {branch.name} <span className="ml-1 rounded bg-slate-100 px-1.5 py-0.5 text-xs font-medium text-slate-500">{branch.code}</span>
                    </h4>
                    <div className="flex items-center gap-1.5 mt-1">
                      <MapPin className="h-3.5 w-3.5 text-slate-400" />
                      <p className="text-xs text-slate-500">{branch.address || 'Alamat belum diisi'}</p>
                    </div>
                  </div>
                </div>
                <StatusBadge status={branch.status} size="sm" />
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5 text-slate-400" />
                  <span className="text-xs text-slate-600">{branch.phone || 'Belum ada telepon'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5 text-slate-400" />
                  <span className="text-xs text-slate-600">{jam(branch.open_time)} sampai {jam(branch.close_time)}</span>
                </div>
                <div className="flex items-center gap-2 col-span-2">
                  <Users className="h-3.5 w-3.5 text-slate-400" />
                  <span className="text-xs text-slate-600">Manajer: {branch.manager?.full_name ?? 'Belum ditentukan'}</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 p-4 rounded-lg bg-slate-50 border border-slate-100">
                <div className="text-center">
                  <p className="text-lg font-bold text-slate-900">{formatAngka(branch.ordersToday)}</p>
                  <p className="text-xs text-slate-400">Pesanan Hari Ini</p>
                </div>
                <div className="text-center border-x border-slate-200">
                  <p className="text-lg font-bold text-slate-900">{formatRupiahRingkas(branch.revenue30d)}</p>
                  <p className="text-xs text-slate-400">Omzet 30 Hari</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-slate-900">{formatAngka(branch.customers)}</p>
                  <p className="text-xs text-slate-400">Pelanggan</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 px-6 py-3 border-t border-slate-100 bg-slate-50 rounded-b-xl">
              <button
                onClick={() => setModal({ open: true, branch })}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-slate-600 hover:bg-white border border-slate-200 transition-colors"
              >
                <Edit className="h-3.5 w-3.5" /> Ubah
              </button>
              <button
                onClick={() => setToDelete(branch)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-red-500 hover:bg-red-50 border border-red-100 transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" /> Hapus
              </button>
            </div>
          </div>
        ))}
      </div>

      {modal.open && <BranchFormModal branch={modal.branch} onClose={() => setModal({ open: false, branch: null })} />}

      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(o) => { if (!o) setToDelete(null); }}
        title="Hapus cabang?"
        description={
          <>Cabang <strong>{toDelete?.name}</strong> akan dihapus permanen. Cabang yang sudah punya riwayat pesanan tidak bisa dihapus; ubah statusnya menjadi Tutup.</>
        }
        loading={deleteBranch.isPending}
        onConfirm={confirmDelete}
      />
    </div>
  );
}

function BranchFormModal({ branch, onClose }: { branch: BranchListItem | null; onClose: () => void }) {
  const save = useSaveBranch();
  const { data: staff } = useStaff();
  const isEdit = !!branch;

  const { register, handleSubmit, getValues, formState: { errors, isSubmitting } } = useForm<BranchForm>({
    defaultValues: {
      code: branch?.code ?? '',
      name: branch?.name ?? '',
      address: branch?.address ?? '',
      phone: branch?.phone ?? '',
      manager_id: branch?.manager_id ?? '',
      open_time: branch ? jam(branch.open_time) : '08:00',
      close_time: branch ? jam(branch.close_time) : '20:00',
      status: branch?.status ?? 'active',
    },
  });

  const onSubmit = handleSubmit(async (v) => {
    try {
      await save.mutateAsync({
        id: branch?.id,
        code: v.code.trim().toUpperCase(),
        name: v.name.trim(),
        address: v.address.trim() || null,
        phone: v.phone.trim() || null,
        status: v.status,
        open_time: v.open_time,
        close_time: v.close_time,
        manager_id: v.manager_id || null,
      });
      toast.success(isEdit ? 'Cabang diperbarui.' : 'Cabang ditambahkan.');
      onClose();
    } catch (e) {
      toast.error(pesanError(e, 'Gagal menyimpan cabang.'));
    }
  });

  const managers = (staff ?? []).filter((s) => s.is_active);

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={isEdit ? 'Ubah Cabang' : 'Tambah Cabang Baru'}
      subtitle={isEdit ? `Mengubah ${branch.name}` : 'Isi data cabang di bawah'}
      size="md"
      footer={
        <div className="flex items-center justify-end gap-3">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 transition-colors">
            Batal
          </button>
          <button type="submit" form="branch-form" disabled={isSubmitting} className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700 transition-colors disabled:opacity-60">
            {isSubmitting ? 'Menyimpan...' : isEdit ? 'Simpan Perubahan' : 'Tambah Cabang'}
          </button>
        </div>
      }
    >
      <form id="branch-form" onSubmit={onSubmit} noValidate className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <FormField label="Kode" required hint={isEdit ? 'Tidak bisa diubah' : '2 sampai 6 huruf/angka'}>
            <input
              className={`${inputClass} uppercase`}
              placeholder="SNR"
              readOnly={isEdit}
              maxLength={6}
              aria-invalid={!!errors.code}
              {...register('code', {
                required: 'Kode wajib diisi',
                setValueAs: (v: string) => v.toUpperCase(),
                pattern: { value: /^[A-Z0-9]{2,6}$/, message: 'Gunakan 2 sampai 6 huruf atau angka' },
              })}
            />
            {errors.code && <p className="text-xs text-red-600">{errors.code.message}</p>}
          </FormField>
          <div className="col-span-2">
            <FormField label="Nama Cabang" required>
              <input className={inputClass} placeholder="mis. Cabang Sanur" aria-invalid={!!errors.name} {...register('name', { required: 'Nama cabang wajib diisi', maxLength: { value: 80, message: 'Maksimal 80 karakter' } })} />
              {errors.name && <p className="text-xs text-red-600">{errors.name.message}</p>}
            </FormField>
          </div>
        </div>

        <FormField label="Alamat" required>
          <input className={inputClass} placeholder="Alamat lengkap" aria-invalid={!!errors.address} {...register('address', { required: 'Alamat wajib diisi' })} />
          {errors.address && <p className="text-xs text-red-600">{errors.address.message}</p>}
        </FormField>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Telepon">
            <input className={inputClass} placeholder="0361 000 000" {...register('phone')} />
          </FormField>
          <FormField label="Manajer Cabang">
            <select className={selectClass} {...register('manager_id')}>
              <option value="">Belum ditentukan</option>
              {managers.map((m) => (
                <option key={m.id} value={m.id}>{m.full_name}{m.branch ? ` (${m.branch.code})` : ''}</option>
              ))}
            </select>
          </FormField>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Jam Buka">
            <input type="time" className={inputClass} {...register('open_time', { required: true })} />
          </FormField>
          <FormField label="Jam Tutup">
            <input
              type="time"
              className={inputClass}
              aria-invalid={!!errors.close_time}
              {...register('close_time', {
                required: 'Jam tutup wajib diisi',
                validate: (v) => v > getValues('open_time') || 'Jam tutup harus setelah jam buka',
              })}
            />
            {errors.close_time && <p className="text-xs text-red-600">{errors.close_time.message}</p>}
          </FormField>
        </div>

        <FormField label="Status">
          <select className={selectClass} {...register('status')}>
            <option value="active">Aktif</option>
            <option value="maintenance">Perbaikan</option>
            <option value="closed">Tutup</option>
          </select>
        </FormField>
      </form>
    </Modal>
  );
}
