import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Plus, Search, Edit, Tag, Clock, Banknote, ToggleLeft, ToggleRight, TrendingUp, Trash2 } from 'lucide-react';

import { Modal } from '@/components/shared/Modal';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { CardsSkeleton, EmptyState, ErrorPanel } from '@/components/shared/QueryStatus';
import { FormField, inputClass, selectClass } from '@/components/shared/FormField';
import type { ServiceListItem, ServiceUnit } from '@/features/services/api';
import { useDeleteService, useSaveService, useServices, useToggleService } from '@/features/services/hooks';
import { CATEGORIES, UNIT_LABEL, formatDurasi } from '@/features/services/labels';
import { pesanError } from '@/lib/errors';
import { formatAngka, formatRupiah, formatRupiahRingkas } from '@/lib/format';

const categoryStyle: Record<string, { badge: string; icon: string }> = {
  Reguler: { badge: 'bg-blue-100 text-blue-700', icon: 'bg-blue-500' },
  Express: { badge: 'bg-orange-100 text-orange-700', icon: 'bg-orange-500' },
  Premium: { badge: 'bg-purple-100 text-purple-700', icon: 'bg-purple-500' },
  Khusus: { badge: 'bg-teal-100 text-teal-700', icon: 'bg-teal-500' },
};
const fallbackStyle = { badge: 'bg-slate-100 text-slate-600', icon: 'bg-slate-500' };

interface ServiceForm {
  name: string;
  description: string;
  category: string;
  unit: ServiceUnit;
  price: string;
  est_hours: string;
  is_active: boolean;
}

export default function ServiceManagement() {
  const { data: services, isLoading, isError, error, refetch } = useServices();
  const toggle = useToggleService();
  const remove = useDeleteService();

  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [modal, setModal] = useState<{ open: boolean; service: ServiceListItem | null }>({ open: false, service: null });
  const [toDelete, setToDelete] = useState<ServiceListItem | null>(null);

  const categories = useMemo(() => [...new Set((services ?? []).map((s) => s.category))], [services]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (services ?? []).filter((s) => (!filterCat || s.category === filterCat) && (!q || s.name.toLowerCase().includes(q)));
  }, [services, search, filterCat]);

  const totalOrders = (services ?? []).reduce((s, x) => s + x.orders30d, 0);
  const totalRevenue = (services ?? []).reduce((s, x) => s + x.revenue30d, 0);
  const activeCount = (services ?? []).filter((s) => s.is_active).length;

  const onToggle = async (svc: ServiceListItem) => {
    try {
      await toggle.mutateAsync({ id: svc.id, isActive: !svc.is_active });
      toast.success(svc.is_active ? `${svc.name} dinonaktifkan.` : `${svc.name} diaktifkan.`);
    } catch (e) {
      toast.error(pesanError(e, 'Gagal mengubah status layanan.'));
    }
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    try {
      await remove.mutateAsync(toDelete.id);
      toast.success(`${toDelete.name} dihapus.`);
    } catch (e) {
      toast.error(pesanError(e, 'Gagal menghapus layanan.'));
    } finally {
      setToDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-slate-900">Manajemen Layanan</h1>
          <p className="text-slate-500 text-sm mt-1">Atur layanan laundry, harga, dan lama pengerjaan</p>
        </div>
        <button onClick={() => setModal({ open: true, service: null })} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700 transition-colors shadow-sm shadow-blue-200">
          <Plus className="h-4 w-4" /> Tambah Layanan
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Layanan', value: formatAngka(services?.length ?? 0), sub: `${activeCount} aktif` },
          { label: 'Kategori', value: formatAngka(categories.length), sub: 'Jenis layanan' },
          { label: 'Pesanan 30 Hari', value: formatAngka(totalOrders), sub: 'Semua layanan' },
          { label: 'Omzet 30 Hari', value: formatRupiahRingkas(totalRevenue), sub: 'Dari item pesanan' },
        ].map((c) => (
          <div key={c.label} className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
            <p className="text-xs text-slate-400">{c.label}</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{isLoading ? '...' : c.value}</p>
            <p className="text-xs text-slate-400 mt-0.5">{c.sub}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 max-w-sm min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input placeholder="Cari layanan..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm" />
        </div>
        <div className="flex items-center gap-2">
          {['', ...categories].map((cat) => (
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

      {isLoading && <CardsSkeleton count={6} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5" />}
      {isError && <ErrorPanel message={pesanError(error, 'Data layanan tidak dapat dimuat.')} onRetry={() => refetch()} />}
      {!isLoading && !isError && filtered.length === 0 && (
        <EmptyState
          title={services?.length ? 'Tidak ada layanan yang cocok' : 'Belum ada layanan'}
          hint={services?.length ? 'Ubah kata kunci atau kategori.' : 'Klik "Tambah Layanan" untuk membuat layanan pertama.'}
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {filtered.map((svc) => {
          const style = categoryStyle[svc.category] ?? fallbackStyle;
          return (
            <div key={svc.id} className={`bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all ${!svc.is_active ? 'opacity-60' : ''}`}>
              <div className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-3">
                    <div className={`h-11 w-11 rounded-xl ${style.icon} flex items-center justify-center flex-shrink-0`}>
                      <Tag className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h4 className="text-slate-900 font-semibold">{svc.name}</h4>
                      <span className={`inline-block mt-1 text-xs font-medium px-2 py-0.5 rounded-full ${style.badge}`}>{svc.category}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => onToggle(svc)}
                    disabled={toggle.isPending}
                    className="mt-1"
                    title={svc.is_active ? 'Nonaktifkan layanan' : 'Aktifkan layanan'}
                    aria-label={svc.is_active ? 'Nonaktifkan layanan' : 'Aktifkan layanan'}
                  >
                    {svc.is_active ? <ToggleRight className="h-6 w-6 text-emerald-500" /> : <ToggleLeft className="h-6 w-6 text-slate-300" />}
                  </button>
                </div>

                <p className="text-xs text-slate-500 mb-4 leading-relaxed min-h-8">{svc.description || 'Belum ada deskripsi.'}</p>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-slate-50">
                    <Banknote className="h-4 w-4 text-blue-500" />
                    <div>
                      <p className="text-xs text-slate-400">Harga</p>
                      <p className="text-sm font-semibold text-slate-900">{formatRupiah(svc.price)} <span className="text-xs font-normal text-slate-400">{UNIT_LABEL[svc.unit]}</span></p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-slate-50">
                    <Clock className="h-4 w-4 text-amber-500" />
                    <div>
                      <p className="text-xs text-slate-400">Lama Pengerjaan</p>
                      <p className="text-sm font-semibold text-slate-900">{formatDurasi(svc.est_hours)}</p>
                    </div>
                  </div>
                </div>

                {svc.is_active && (
                  <div className="flex items-center gap-2 mt-3 p-3 rounded-lg bg-emerald-50 border border-emerald-100">
                    <TrendingUp className="h-4 w-4 text-emerald-600" />
                    <p className="text-xs text-emerald-700 font-medium">{formatAngka(svc.orders30d)} pesanan 30 hari</p>
                    <span className="ml-auto text-xs text-emerald-600 font-semibold">{formatRupiahRingkas(svc.revenue30d)}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-slate-100 bg-slate-50 rounded-b-xl">
                <button onClick={() => setModal({ open: true, service: svc })} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-slate-600 hover:bg-white border border-slate-200 transition-colors">
                  <Edit className="h-3.5 w-3.5" /> Ubah
                </button>
                <button onClick={() => setToDelete(svc)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-red-500 hover:bg-red-50 border border-red-100 transition-colors">
                  <Trash2 className="h-3.5 w-3.5" /> Hapus
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {modal.open && (
        <ServiceFormModal
          service={modal.service}
          nextSortOrder={(services?.reduce((m, s) => Math.max(m, s.sort_order), 0) ?? 0) + 1}
          onClose={() => setModal({ open: false, service: null })}
        />
      )}

      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(o) => { if (!o) setToDelete(null); }}
        title="Hapus layanan?"
        description={
          <>Layanan <strong>{toDelete?.name}</strong> akan dihapus. Riwayat pesanan lama tetap menyimpan nama dan harganya. Jika hanya ingin menyembunyikan dari kasir, nonaktifkan saja.</>
        }
        loading={remove.isPending}
        onConfirm={confirmDelete}
      />
    </div>
  );
}

function ServiceFormModal({ service, nextSortOrder, onClose }: { service: ServiceListItem | null; nextSortOrder: number; onClose: () => void }) {
  const save = useSaveService();
  const isEdit = !!service;

  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm<ServiceForm>({
    defaultValues: {
      name: service?.name ?? '',
      description: service?.description ?? '',
      category: service?.category ?? 'Reguler',
      unit: service?.unit ?? 'kg',
      price: service ? String(service.price) : '',
      est_hours: service ? String(service.est_hours) : '24',
      is_active: service?.is_active ?? true,
    },
  });
  const isActive = watch('is_active');

  // Kategori bawaan + kategori lama layanan ini (jika berbeda) supaya tidak hilang saat diubah.
  const categoryOptions = service && !(CATEGORIES as readonly string[]).includes(service.category)
    ? [...CATEGORIES, service.category]
    : [...CATEGORIES];

  const onSubmit = handleSubmit(async (v) => {
    try {
      await save.mutateAsync({
        id: service?.id,
        name: v.name.trim(),
        description: v.description.trim() || null,
        category: v.category,
        unit: v.unit,
        price: Math.round(Number(v.price)),
        est_hours: Math.round(Number(v.est_hours)),
        is_active: v.is_active,
        ...(isEdit ? {} : { sort_order: nextSortOrder }),
      });
      toast.success(isEdit ? 'Layanan diperbarui.' : 'Layanan ditambahkan.');
      onClose();
    } catch (e) {
      toast.error(pesanError(e, 'Gagal menyimpan layanan.'));
    }
  });

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={isEdit ? 'Ubah Layanan' : 'Tambah Layanan Baru'}
      size="md"
      footer={
        <div className="flex items-center justify-end gap-3">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50">Batal</button>
          <button type="submit" form="service-form" disabled={isSubmitting} className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700 disabled:opacity-60">
            {isSubmitting ? 'Menyimpan...' : isEdit ? 'Simpan Perubahan' : 'Tambah Layanan'}
          </button>
        </div>
      }
    >
      <form id="service-form" onSubmit={onSubmit} noValidate className="space-y-4">
        <FormField label="Nama Layanan" required>
          <input className={inputClass} placeholder="mis. Cuci Setrika Premium" aria-invalid={!!errors.name} {...register('name', { required: 'Nama layanan wajib diisi', maxLength: { value: 80, message: 'Maksimal 80 karakter' } })} />
          {errors.name && <p className="text-xs text-red-600">{errors.name.message}</p>}
        </FormField>
        <FormField label="Deskripsi">
          <textarea className={inputClass} rows={2} placeholder="Deskripsi singkat layanan" {...register('description')} />
        </FormField>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Kategori" required>
            <select className={selectClass} {...register('category')}>
              {categoryOptions.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </FormField>
          <FormField label="Satuan Harga" required>
            <select className={selectClass} {...register('unit')}>
              {(Object.keys(UNIT_LABEL) as ServiceUnit[]).map((u) => <option key={u} value={u}>{UNIT_LABEL[u]}</option>)}
            </select>
          </FormField>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Harga (Rp)" required>
            <input
              type="number" step="500" min="0" inputMode="numeric"
              className={inputClass} placeholder="7000" aria-invalid={!!errors.price}
              {...register('price', {
                required: 'Harga wajib diisi',
                validate: (v) => (Number.isFinite(Number(v)) && Number(v) >= 0) || 'Harga tidak valid',
              })}
            />
            {errors.price && <p className="text-xs text-red-600">{errors.price.message}</p>}
          </FormField>
          <FormField label="Lama Pengerjaan (jam)" required hint="24 jam = 1 hari">
            <input
              type="number" step="1" min="1" inputMode="numeric"
              className={inputClass} placeholder="24" aria-invalid={!!errors.est_hours}
              {...register('est_hours', {
                required: 'Lama pengerjaan wajib diisi',
                validate: (v) => (Number.isInteger(Number(v)) && Number(v) > 0) || 'Isi bilangan bulat lebih dari 0',
              })}
            />
            {errors.est_hours && <p className="text-xs text-red-600">{errors.est_hours.message}</p>}
          </FormField>
        </div>
        <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 border border-slate-200">
          <button type="button" aria-label="Ubah status aktif" onClick={() => setValue('is_active', !isActive)}>
            {isActive ? <ToggleRight className="h-6 w-6 text-emerald-500" /> : <ToggleLeft className="h-6 w-6 text-slate-300" />}
          </button>
          <div>
            <p className="text-sm font-medium text-slate-700">Layanan Aktif</p>
            <p className="text-xs text-slate-400">{isActive ? 'Tampil dan bisa dipilih kasir' : 'Disembunyikan dari kasir'}</p>
          </div>
        </div>
      </form>
    </Modal>
  );
}
