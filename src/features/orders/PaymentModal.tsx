import { useState } from 'react';
import { toast } from 'sonner';

import { inputClassEmerald } from '@/components/shared/FormField';
import { Modal } from '@/components/shared/Modal';
import { PaymentInstructions } from '@/features/payment-info/PaymentInstructions';
import { usePaymentInfo } from '@/features/payment-info/hooks';
import { pesanError } from '@/lib/errors';
import { formatRupiah } from '@/lib/format';
import { METODE_BAYAR, type PaymentMethod } from './api';
import { useRecordPayment } from './hooks';

export function PaymentModal({ orderId, code, sisa, onClose, onPaid }: { orderId: string; code: string; sisa: number; onClose: () => void; onPaid?: (amount: number) => void }) {
  const record = useRecordPayment();
  const info = usePaymentInfo();
  const [text, setText] = useState(String(sisa));
  const [method, setMethod] = useState<PaymentMethod>('cash');
  const amount = Math.round(Number(text.replace(/\D/g, '')) || 0);
  const error = amount <= 0 ? 'Isi jumlah pembayaran' : amount > sisa ? `Melebihi sisa tagihan (${formatRupiah(sisa)})` : null;

  const submit = async () => {
    if (error) return;
    try {
      await record.mutateAsync({ orderId, amount, method });
      toast.success(amount === sisa ? 'Pembayaran tercatat. Pesanan lunas.' : 'Pembayaran tercatat.');
      onPaid?.(amount);
      onClose();
    } catch (e) {
      toast.error(pesanError(e, 'Gagal mencatat pembayaran.'));
    }
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      title="Catat Pembayaran"
      subtitle={`${code}, sisa ${formatRupiah(sisa)}`}
      size="sm"
      footer={
        <div className="flex items-center justify-end gap-3">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50">Batal</button>
          <button type="button" onClick={submit} disabled={!!error || record.isPending} className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm hover:bg-emerald-700 disabled:opacity-60">
            {record.isPending ? 'Menyimpan...' : 'Simpan Pembayaran'}
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        <div>
          <label htmlFor="pay-amount" className="text-sm text-slate-700 block mb-1.5" style={{ fontWeight: 500 }}>Jumlah</label>
          <input id="pay-amount" inputMode="numeric" className={inputClassEmerald} value={text} onChange={(e) => setText(e.target.value.replace(/[^\d]/g, ''))} />
          <div className="flex items-center justify-between mt-1">
            <p className="text-xs text-slate-500">{amount > 0 ? formatRupiah(amount) : ''}</p>
            <button type="button" onClick={() => setText(String(sisa))} className="text-xs text-emerald-700 hover:underline">Bayar semua sisa</button>
          </div>
          {error && text !== '' && <p className="text-xs text-red-600 mt-1">{error}</p>}
        </div>
        <div className="grid grid-cols-3 gap-2" role="group" aria-label="Metode pembayaran">
          {(Object.keys(METODE_BAYAR) as PaymentMethod[]).map((m) => (
            <button key={m} type="button" onClick={() => setMethod(m)} aria-pressed={method === m}
              className={`py-2 rounded-lg border text-xs transition-colors ${method === m ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
              {METODE_BAYAR[m]}
            </button>
          ))}
        </div>
        {method !== 'cash' && info.data && (
          <PaymentInstructions info={info.data} show={method === 'qris' ? 'qris' : 'transfer'} qrSize={170} />
        )}
      </div>
    </Modal>
  );
}
