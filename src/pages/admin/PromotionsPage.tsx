import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Plus, Percent, Tag, Calendar, Users, Copy, Edit, Trash2, ToggleLeft, ToggleRight, Wallet, Info } from 'lucide-react';

import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { FormField, inputClass, selectClass } from '@/components/shared/FormField';
import { Modal } from '@/components/shared/Modal';
import { CardsSkeleton, EmptyState, ErrorPanel } from '@/components/shared/QueryStatus';
import type { PromotionListItem } from '@/features/promotions/api';
import { useDeletePromotion, usePromotions, useSavePromotion, useTogglePromotion } from '@/features/promotions/hooks';
import { PROMO_STATUS_LABEL, addDaysLocal, promoStatus, todayLocal, type PromoStatus } from '@/features/promotions/status';
import { pesanError } from '@/lib/errors';
import { formatAngka, formatRupiah, formatRupiahRingkas, formatTanggal } from '@/lib/format';

const STATUS_STYLE: Record<PromoStatus, { badge: string; icon: string; iconText: string }> = {
  active: { badge: 'bg-emerald-100 text-emerald-700', icon: 'bg-emerald-100', iconText: 'text-emerald-600' },
  scheduled: { badge: 'bg-blue-100 text-blue-700', icon: 'bg-blue-100', iconText: 'text-blue-600' },
  expired: { badge: 'bg-slate-100 text-slate-500', icon: 'bg-slate-100', iconText: 'text-slate-400' },
  exhausted: { badge: 'bg-amber-100 text-amber-700', icon: 'bg-amber-100', iconText: 'text-amber-600' },
  inactive: { badge: 'bg-slate-100 text-slate-500', icon: 'bg-slate-100', iconText: 'text-slate-400' },
};

const TABS: Array<{ key: '' | PromoStatus; label: string }> = [
  { key: '', label: 'Semua Promo' },
  { key: 'active', label: 'Aktif' },
  { key: 'scheduled', label: 'Terjadwal' },
  { key: 'expired', label: 'Kedaluwarsa' },
  { key: 'exhausted', label: 'Kuota habis' },
  { key: 'inactive', label: 'Nonaktif' },
];

const deskripsiDiskon = (p: Pick<PromotionListItem, 'type' | 'value' | 'min_order'>) =>
  `${p.type === 'percent' ? `Diskon ${p.value}%` : `Diskon ${formatRupiah(p.value)}`}${p.min_order > 0 ? `, min. ${formatRupiah(p.min_order)}` : ''}`;

export default function PromotionsPage() {
  const { data: promos, isLoading, isError, error, refetch } = usePromotions();
  const toggle = useTogglePromotion();
  const remove = useDeletePromotion();

  const [filter, setFilter] = useState<'' | PromoStatus>('');
  const [modal, setModal] = useState<{ open: boolean; promo: PromotionListItem | null }>({ open: false, promo: null });
  const [toDelete, setToDelete] = useState<PromotionListItem | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const today = todayLocal();
  const withStatus = useMemo(() => (promos ?? []).map((p) => ({ ...p, status: promoStatus(p, p.usage, today) })), [promos, today]);
  const count = (s: '' | PromoStatus) => (s ? withStatus.filter((p) => p.status === s).length : withStatus.length);
  const filtered = withStatus.filter((p) => !filter || p.status === filter);
  const totalUsage = withStatus.reduce((s, p) => s + p.usage, 0);
  const totalDiscount = withStatus.reduce((s, p) => s + p.discountTotal, 0);

  const onToggle = async (p: PromotionListItem) => {
    try {
      await toggle.mutateAsync({ id: p.id, isActive: !p.is_active });
      toast.success(p.is_active ? `${p.code} dinonaktifkan.` : `${p.code} diaktifkan.`);
    } catch (e) {
      toast.error(pesanError(e, 'Gagal mengubah status promo.'));
    }
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    try {
      await remove.mutateAsync(toDelete.id);
      toast.success(`${toDelete.code} dihapus.`);
    } catch (e) {
      toast.error(pesanError(e, 'Gagal menghapus promo.'));
    } finally {
      setToDelete(null);
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard?.writeText(code).catch(() => { /* clipboard diblokir: abaikan */ });
    setCopied(code);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-slate-900">Promo dan Diskon</h1>
          <p className="text-slate-500 text-sm mt-1">Buat dan kelola kode diskon. Kasir memasukkan kodenya saat membuat pesanan.</p>
        </div>
        <button onClick={() => setModal({ open: true, promo: null })} data-new-promo className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700 transition-colors shadow-sm shadow-blue-200">
          <Plus className="h-4 w-4" /> Promo Baru
        </button>
      </div>

      <div className="flex items-start gap-2 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800" data-promo-rule>
        <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
        <p>Diskon promo tidak digabung dengan diskon member. Untuk setiap pesanan, sistem memakai salah satu yang nilainya lebih besar.</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4" data-promo-stats>
        {[
          { label: 'Promo Aktif', value: formatAngka(count('active')), icon: Percent, bg: 'bg-emerald-100', fg: 'text-emerald-600' },
          { label: 'Total Penggunaan', value: formatAngka(totalUsage), icon: Users, bg: 'bg-blue-100', fg: 'text-blue-600' },
          { label: 'Diskon Diberikan', value: formatRupiahRingkas(totalDiscount), icon: Wallet, bg: 'bg-purple-100', fg: 'text-purple-600' },
          { label: 'Terjadwal', value: formatAngka(count('scheduled')), icon: Calendar, bg: 'bg-amber-100', fg: 'text-amber-600' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-slate-400">{s.label}</p>
              <div className={`h-8 w-8 rounded-lg ${s.bg} flex items-center justify-center`}><s.icon className={`h-4 w-4 ${s.fg}`} /></div>
            </div>
            <p className="text-2xl font-bold text-slate-900">{isLoading ? '...' : s.value}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2" role="tablist" aria-label="Filter status promo">
        {TABS.map((t) => (
          <button
            key={t.key || 'all'} role="tab" aria-selected={filter === t.key} onClick={() => setFilter(t.key)} data-promo-tab={t.key || 'all'}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === t.key ? 'bg-blue-600 text-white shadow-sm shadow-blue-200' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
          >
            {t.label}<span className="ml-2 text-xs opacity-70">({count(t.key)})</span>
          </button>
        ))}
      </div>

      {isError ? (
        <ErrorPanel message={pesanError(error, 'Gagal memuat promo.')} onRetry={() => void refetch()} />
      ) : isLoading ? (
        <CardsSkeleton count={3} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5" />
      ) : withStatus.length === 0 ? (
        <EmptyState title="Belum ada promo" hint='Klik "Promo Baru" untuk membuat kode diskon pertama.' />
      ) : filtered.length === 0 ? (
        <EmptyState title="Tidak ada promo di status ini" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map((promo) => {
            const st = STATUS_STYLE[promo.status];
            const pct = promo.max_usage ? Math.min(100, (promo.usage / promo.max_usage) * 100) : 0;
            return (
              <div key={promo.id} data-promo-card={promo.code} data-promo-status={promo.status} className={`bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow ${promo.status === 'expired' || promo.status === 'inactive' ? 'opacity-70' : ''}`}>
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3 gap-2">
                    <div className="flex items-start gap-3">
                      <div className={`h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 ${st.icon}`}>
                        <Percent className={`h-5 w-5 ${st.iconText}`} />
                      </div>
                      <div>
                        <h4 className="text-slate-900 font-semibold text-sm leading-snug">{promo.name}</h4>
                        <p className="text-xs text-slate-400 mt-0.5">{deskripsiDiskon(promo)}</p>
                      </div>
                    </div>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap ${st.badge}`}>{PROMO_STATUS_LABEL[promo.status]}</span>
                  </div>

                  <div className="flex items-center gap-2 mb-4">
                    <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 border-dashed">
                      <Tag className="h-3.5 w-3.5 text-slate-400" />
                      <span className="text-sm font-mono font-bold text-slate-800 tracking-wider">{promo.code}</span>
                    </div>
                    <button onClick={() => copyCode(promo.code)} title="Salin kode" aria-label={`Salin kode ${promo.code}`}
                      className={`p-2 rounded-lg border transition-colors ${copied === promo.code ? 'border-emerald-300 bg-emerald-50 text-emerald-600' : 'border-slate-200 hover:bg-slate-100 text-slate-500'}`}>
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs text-slate-500">Pemakaian</span>
                      <span className="text-xs font-medium text-slate-700" data-promo-usage>
                        {formatAngka(promo.usage)}{promo.max_usage ? ` / ${formatAngka(promo.max_usage)}` : ' (tanpa batas)'}
                      </span>
                    </div>
                    {promo.max_usage ? (
                      <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all ${pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${pct}%` }} />
                      </div>
                    ) : null}
                    {promo.discountTotal > 0 && <p className="text-xs text-slate-400 mt-1.5">Total diskon diberikan {formatRupiah(promo.discountTotal)}</p>}
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>{formatTanggal(promo.valid_from)} sampai {formatTanggal(promo.valid_to)}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 bg-slate-50 rounded-b-xl">
                  <button onClick={() => void onToggle(promo)} disabled={toggle.isPending} aria-label={promo.is_active ? `Nonaktifkan ${promo.code}` : `Aktifkan ${promo.code}`} className="disabled:opacity-40">
                    {promo.is_active ? <ToggleRight className="h-5 w-5 text-emerald-500" /> : <ToggleLeft className="h-5 w-5 text-slate-300" />}
                  </button>
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => setModal({ open: true, promo })} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-slate-600 hover:bg-white border border-slate-200 transition-colors">
                      <Edit className="h-3.5 w-3.5" /> Ubah
                    </button>
                    {promo.usage === 0 ? (
                      <button onClick={() => setToDelete(promo)} title="Hapus" aria-label={`Hapus ${promo.code}`} className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 transition-colors">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    ) : (
                      <span className="text-xs text-slate-400 px-1" title="Promo yang sudah dipakai tidak bisa dihapus agar riwayat diskon tetap utuh. Nonaktifkan saja.">Sudah dipakai</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {modal.open && <PromoFormModal promo={modal.promo} onClose={() => setModal({ open: false, promo: null })} />}

      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(o) => { if (!o) setToDelete(null); }}
        title="Hapus promo?"
        description={<>Promo <strong>{toDelete?.code}</strong> belum pernah dipakai dan akan dihapus permanen. Jika hanya ingin menghentikannya, nonaktifkan saja.</>}
        loading={remove.isPending}
        onConfirm={confirmDelete}
      />
    </div>
  );
}

interface PromoForm {
  name: string;
  code: string;
  type: 'percent' | 'fixed';
  value: string;
  min_order: string;
  max_usage: string;
  valid_from: string;
  valid_to: string;
  is_active: boolean;
}

const CONTOH_SUBTOTAL = 50000;

function PromoFormModal({ promo, onClose }: { promo: PromotionListItem | null; onClose: () => void }) {
  const save = useSavePromotion();
  const isEdit = !!promo;

  const { register, handleSubmit, watch, setValue, getValues, formState: { errors, isSubmitting } } = useForm<PromoForm>({
    defaultValues: {
      name: promo?.name ?? '',
      code: promo?.code ?? '',
      type: promo?.type ?? 'percent',
      value: promo ? String(promo.value) : '',
      min_order: promo ? String(promo.min_order) : '0',
      max_usage: promo?.max_usage ? String(promo.max_usage) : '',
      valid_from: promo?.valid_from ?? todayLocal(),
      valid_to: promo?.valid_to ?? addDaysLocal(30),
      is_active: promo?.is_active ?? true,
    },
  });
  const type = watch('type');
  const isActive = watch('is_active');
  const value = Number(watch('value'));
  const usage = promo?.usage ?? 0;

  const contoh = Number.isFinite(value) && value > 0
    ? Math.min(CONTOH_SUBTOTAL, type === 'percent' ? Math.round((CONTOH_SUBTOTAL * Math.min(value, 100)) / 100) : Math.round(value))
    : null;

  const onSubmit = handleSubmit(async (v) => {
    try {
      await save.mutateAsync({
        id: promo?.id,
        name: v.name.trim(),
        code: v.code,
        type: v.type,
        value: Math.round(Number(v.value)),
        min_order: Math.round(Number(v.min_order || 0)),
        max_usage: v.max_usage.trim() === '' ? null : Math.round(Number(v.max_usage)),
        valid_from: v.valid_from,
        valid_to: v.valid_to,
        is_active: v.is_active,
      });
      toast.success(isEdit ? 'Promo diperbarui.' : 'Promo dibuat.');
      onClose();
    } catch (e) {
      toast.error(pesanError(e, 'Gagal menyimpan promo.'));
    }
  });

  return (
    <Modal
      isOpen onClose={onClose} title={isEdit ? 'Ubah Promo' : 'Promo Baru'} size="md"
      footer={
        <div className="flex justify-end gap-3">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50">Batal</button>
          <button type="submit" form="promo-form" disabled={isSubmitting} className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700 disabled:opacity-60">
            {isSubmitting ? 'Menyimpan...' : isEdit ? 'Simpan Perubahan' : 'Buat Promo'}
          </button>
        </div>
      }
    >
      <form id="promo-form" onSubmit={onSubmit} noValidate className="space-y-4">
        <FormField label="Nama Promo" required>
          <input className={inputClass} placeholder="mis. Promo Gajian" aria-invalid={!!errors.name}
            {...register('name', { required: 'Nama promo wajib diisi', maxLength: { value: 80, message: 'Maksimal 80 karakter' }, validate: (v) => v.trim().length > 0 || 'Nama promo wajib diisi' })} />
          {errors.name && <p className="text-xs text-red-600">{errors.name.message}</p>}
        </FormField>
        <FormField label="Kode Promo" required hint="Huruf besar dan angka, 3 sampai 20 karakter. Kasir mengetik kode ini saat membuat pesanan.">
          <input className={`${inputClass} font-mono uppercase`} placeholder="mis. GAJIAN20" aria-invalid={!!errors.code}
            {...register('code', {
              required: 'Kode promo wajib diisi',
              pattern: { value: /^[A-Z0-9]{3,20}$/, message: 'Kode 3 sampai 20 karakter, hanya huruf besar dan angka' },
              onChange: (e) => { e.target.value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''); },
            })} />
          {errors.code && <p className="text-xs text-red-600">{errors.code.message}</p>}
        </FormField>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Jenis Diskon" required>
            <select className={selectClass} {...register('type')}>
              <option value="percent">Persentase (%)</option>
              <option value="fixed">Nominal Tetap (Rp)</option>
            </select>
          </FormField>
          <FormField label={type === 'percent' ? 'Besar Diskon (%)' : 'Besar Diskon (Rp)'} required>
            <input type="number" inputMode="numeric" step="1" min="1" className={inputClass} placeholder={type === 'percent' ? '10' : '5000'} aria-invalid={!!errors.value}
              {...register('value', {
                required: 'Besar diskon wajib diisi',
                validate: (v) => {
                  const n = Number(v);
                  if (!Number.isInteger(n) || n <= 0) return 'Isi bilangan bulat lebih dari 0';
                  if (getValues('type') === 'percent' && n > 100) return 'Persentase maksimal 100';
                  return true;
                },
              })} />
            {errors.value && <p className="text-xs text-red-600">{errors.value.message}</p>}
          </FormField>
        </div>
        {contoh !== null && (
          <p className="text-xs text-slate-500 -mt-2" data-promo-example>Contoh: pesanan {formatRupiah(CONTOH_SUBTOTAL)} mendapat diskon {formatRupiah(contoh)}.</p>
        )}
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Minimal Pesanan (Rp)" hint="0 = tanpa minimum">
            <input type="number" inputMode="numeric" step="1000" min="0" className={inputClass} aria-invalid={!!errors.min_order}
              {...register('min_order', { validate: (v) => v === '' || (Number.isInteger(Number(v)) && Number(v) >= 0) || 'Isi bilangan bulat 0 atau lebih' })} />
            {errors.min_order && <p className="text-xs text-red-600">{errors.min_order.message}</p>}
          </FormField>
          <FormField label="Batas Pemakaian" hint={usage > 0 ? `Sudah dipakai ${usage} kali. Kosong = tanpa batas` : 'Kosong = tanpa batas'}>
            <input type="number" inputMode="numeric" step="1" min="1" className={inputClass} placeholder="mis. 100" aria-invalid={!!errors.max_usage}
              {...register('max_usage', {
                validate: (v) => {
                  if (v.trim() === '') return true;
                  const n = Number(v);
                  if (!Number.isInteger(n) || n < 1) return 'Isi bilangan bulat 1 atau lebih';
                  if (n < usage) return `Tidak boleh kurang dari pemakaian saat ini (${usage})`;
                  return true;
                },
              })} />
            {errors.max_usage && <p className="text-xs text-red-600">{errors.max_usage.message}</p>}
          </FormField>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Berlaku Mulai" required>
            <input type="date" className={inputClass} aria-invalid={!!errors.valid_from} {...register('valid_from', { required: 'Tanggal mulai wajib diisi' })} />
            {errors.valid_from && <p className="text-xs text-red-600">{errors.valid_from.message}</p>}
          </FormField>
          <FormField label="Berlaku Sampai" required>
            <input type="date" className={inputClass} aria-invalid={!!errors.valid_to}
              {...register('valid_to', {
                required: 'Tanggal akhir wajib diisi',
                validate: (v) => v >= getValues('valid_from') || 'Tanggal akhir tidak boleh sebelum tanggal mulai',
              })} />
            {errors.valid_to && <p className="text-xs text-red-600">{errors.valid_to.message}</p>}
          </FormField>
        </div>
        <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 border border-slate-200">
          <button type="button" aria-label="Ubah status aktif" onClick={() => setValue('is_active', !isActive)}>
            {isActive ? <ToggleRight className="h-6 w-6 text-emerald-500" /> : <ToggleLeft className="h-6 w-6 text-slate-300" />}
          </button>
          <div>
            <p className="text-sm font-medium text-slate-700">Promo Aktif</p>
            <p className="text-xs text-slate-400">{isActive ? 'Kode bisa dipakai kasir selama masih berlaku' : 'Kode ditolak saat dipakai'}</p>
          </div>
        </div>
      </form>
    </Modal>
  );
}
