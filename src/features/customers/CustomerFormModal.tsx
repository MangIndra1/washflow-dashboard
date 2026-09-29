import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { FormField, inputClassEmerald } from '@/components/shared/FormField';
import { Modal } from '@/components/shared/Modal';
import { pesanError } from '@/lib/errors';
import type { Customer } from './api';
import { useSaveCustomer } from './hooks';

interface Values {
  name: string;
  phone: string;
  email: string;
  address: string;
}

interface Props {
  customer?: Customer | null;
  /** Isian awal untuk pelanggan baru (mis. dari kata kunci pencarian). */
  initial?: Partial<Values>;
  onClose: () => void;
  onSaved: (customer: Customer) => void;
}

export function CustomerFormModal({ customer, initial, onClose, onSaved }: Props) {
  const isEdit = !!customer;
  const save = useSaveCustomer();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Values>({
    defaultValues: {
      name: customer?.name ?? initial?.name ?? '',
      phone: customer?.phone ?? initial?.phone ?? '',
      email: customer?.email ?? '',
      address: customer?.address ?? '',
    },
  });

  const onSubmit = handleSubmit(async (v) => {
    try {
      const saved = await save.mutateAsync({
        id: customer?.id,
        name: v.name.trim(),
        phone: v.phone.trim(),
        email: v.email.trim() || null,
        address: v.address.trim() || null,
      });
      toast.success(isEdit ? 'Data pelanggan diperbarui.' : 'Pelanggan baru ditambahkan.');
      onSaved(saved);
    } catch (e) {
      toast.error(pesanError(e, 'Gagal menyimpan pelanggan.'));
    }
  });

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={isEdit ? 'Ubah Pelanggan' : 'Pelanggan Baru'}
      subtitle={isEdit ? customer.name : 'Nomor WhatsApp dipakai untuk notifikasi pesanan'}
      size="sm"
      footer={
        <div className="flex items-center justify-end gap-3">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50">Batal</button>
          <button type="submit" form="customer-form" disabled={isSubmitting} className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm hover:bg-emerald-700 disabled:opacity-60">
            {isSubmitting ? 'Menyimpan...' : isEdit ? 'Simpan' : 'Tambah Pelanggan'}
          </button>
        </div>
      }
    >
      <form id="customer-form" onSubmit={onSubmit} noValidate className="space-y-4">
        <FormField label="Nama" required>
          <input className={inputClassEmerald} autoFocus aria-invalid={!!errors.name}
            {...register('name', { required: 'Nama wajib diisi', minLength: { value: 2, message: 'Minimal 2 karakter' }, maxLength: { value: 100, message: 'Maksimal 100 karakter' } })} />
          {errors.name && <p className="text-xs text-red-600">{errors.name.message}</p>}
        </FormField>
        <FormField label="Nomor WhatsApp" required hint="Contoh: 0812 3456 7890 atau +62 812 3456 7890">
          <input className={inputClassEmerald} inputMode="tel" aria-invalid={!!errors.phone}
            {...register('phone', {
              required: 'Nomor WhatsApp wajib diisi',
              validate: (val) => {
                const d = val.replace(/[\s\-.()]/g, '');
                return /^\+?[0-9]{8,15}$/.test(d) || 'Gunakan 8 sampai 15 digit angka';
              },
            })} />
          {errors.phone && <p className="text-xs text-red-600">{errors.phone.message}</p>}
        </FormField>
        <FormField label="Email">
          <input type="email" className={inputClassEmerald} aria-invalid={!!errors.email}
            {...register('email', { pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Format email tidak valid' } })} />
          {errors.email && <p className="text-xs text-red-600">{errors.email.message}</p>}
        </FormField>
        <FormField label="Alamat">
          <textarea rows={2} className={`${inputClassEmerald} resize-none`}
            {...register('address', { maxLength: { value: 300, message: 'Maksimal 300 karakter' } })} />
        </FormField>
      </form>
    </Modal>
  );
}
