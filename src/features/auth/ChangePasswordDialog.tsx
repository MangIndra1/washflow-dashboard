import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { FormField, inputClass } from '@/components/shared/FormField';
import { Modal } from '@/components/shared/Modal';
import { supabase } from '@/lib/supabase';

interface Form {
  current: string;
  next: string;
  confirm: string;
}

/**
 * Ganti kata sandi sendiri. Kata sandi lama diverifikasi ulang dulu (signInWithPassword) supaya
 * sesi yang tertinggal di komputer bersama tidak bisa dipakai mengganti kata sandi.
 */
export function ChangePasswordDialog({ email, onClose }: { email: string; onClose: () => void }) {
  const { register, handleSubmit, getValues, setError, formState: { errors, isSubmitting } } = useForm<Form>({
    defaultValues: { current: '', next: '', confirm: '' },
  });

  const onSubmit = handleSubmit(async (v) => {
    const verify = await supabase.auth.signInWithPassword({ email, password: v.current });
    if (verify.error) {
      setError('current', { message: 'Kata sandi saat ini salah' });
      return;
    }
    const { error } = await supabase.auth.updateUser({ password: v.next });
    if (error) {
      const weak = /password/i.test(error.message);
      toast.error(weak ? 'Kata sandi baru ditolak. Gunakan kombinasi yang lebih kuat.' : 'Gagal mengganti kata sandi. Coba lagi.');
      return;
    }
    toast.success('Kata sandi berhasil diganti.');
    onClose();
  });

  return (
    <Modal
      isOpen
      onClose={onClose}
      title="Ganti Kata Sandi"
      subtitle={email}
      size="sm"
      footer={
        <div className="flex items-center justify-end gap-3">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50">Batal</button>
          <button type="submit" form="change-password-form" disabled={isSubmitting} className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700 disabled:opacity-60">
            {isSubmitting ? 'Menyimpan...' : 'Simpan'}
          </button>
        </div>
      }
    >
      <form id="change-password-form" onSubmit={onSubmit} noValidate className="space-y-4">
        <FormField label="Kata Sandi Saat Ini" required>
          <input type="password" autoComplete="current-password" className={inputClass} aria-invalid={!!errors.current}
            {...register('current', { required: 'Kata sandi saat ini wajib diisi' })} />
          {errors.current && <p className="text-xs text-red-600">{errors.current.message}</p>}
        </FormField>
        <FormField label="Kata Sandi Baru" required hint="Minimal 8 karakter">
          <input type="password" autoComplete="new-password" className={inputClass} aria-invalid={!!errors.next}
            {...register('next', {
              required: 'Kata sandi baru wajib diisi',
              minLength: { value: 8, message: 'Minimal 8 karakter' },
              maxLength: { value: 72, message: 'Maksimal 72 karakter' },
              validate: (val) => val !== getValues('current') || 'Kata sandi baru harus berbeda dari yang lama',
            })} />
          {errors.next && <p className="text-xs text-red-600">{errors.next.message}</p>}
        </FormField>
        <FormField label="Ulangi Kata Sandi Baru" required>
          <input type="password" autoComplete="new-password" className={inputClass} aria-invalid={!!errors.confirm}
            {...register('confirm', {
              required: 'Ulangi kata sandi baru',
              validate: (val) => val === getValues('next') || 'Kata sandi tidak sama',
            })} />
          {errors.confirm && <p className="text-xs text-red-600">{errors.confirm.message}</p>}
        </FormField>
      </form>
    </Modal>
  );
}
