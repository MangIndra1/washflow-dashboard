import { useState } from 'react';
import { Check, Copy } from 'lucide-react';

import { QrCode } from '@/components/shared/QrCode';
import type { PaymentInfo } from './api';

function CopyButton({ text, label }: { text: string; label: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button" aria-label={label}
      onClick={async () => {
        try { await navigator.clipboard.writeText(text); setDone(true); setTimeout(() => setDone(false), 1500); } catch { /* clipboard tidak tersedia */ }
      }}
      className="p-1 rounded hover:bg-slate-100 text-slate-500 print:hidden"
    >
      {done ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  );
}

/** Cara membayar: QRIS toko dan/atau rekening. `show` membatasi bagian yang ditampilkan. */
export function PaymentInstructions({ info, show = 'all', qrSize = 150 }: { info: PaymentInfo; show?: 'all' | 'qris' | 'transfer'; qrSize?: number }) {
  const showQris = show !== 'transfer' && !!info.qris_payload;
  const showBank = show !== 'qris' && info.banks.length > 0;
  if (!showQris && !showBank) {
    return <p className="text-xs text-slate-400" data-empty-payment-info>Info pembayaran belum diisi. Admin dapat mengisinya di menu Pengaturan.</p>;
  }
  return (
    <div className="space-y-3" data-payment-instructions>
      {showQris && info.qris_payload && (
        <div className="flex flex-col items-center gap-1.5 rounded-xl border border-slate-200 bg-white p-3">
          <p className="text-xs font-semibold text-slate-700">Bayar dengan QRIS</p>
          <QrCode value={info.qris_payload} size={qrSize} label="QRIS pembayaran" />
          {info.qris_merchant && <p className="text-xs text-slate-500" data-qris-merchant>{info.qris_merchant}</p>}
          <p className="text-[11px] text-slate-400 text-center">Scan dengan aplikasi bank atau e-wallet, lalu isi nominal sesuai tagihan.</p>
        </div>
      )}
      {showBank && (
        <div className="rounded-xl border border-slate-200 bg-white p-3 space-y-2">
          <p className="text-xs font-semibold text-slate-700">Transfer bank</p>
          {info.banks.map((b, i) => (
            <div key={`${b.bank}-${b.number}-${i}`} className="flex items-center justify-between gap-2" data-bank>
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-900">{b.bank} <span className="font-mono">{b.number}</span></p>
                {b.holder && <p className="text-xs text-slate-500">a.n. {b.holder}</p>}
              </div>
              <CopyButton text={b.number} label={`Salin nomor rekening ${b.bank}`} />
            </div>
          ))}
        </div>
      )}
      {info.note && <p className="text-xs text-slate-500">{info.note}</p>}
    </div>
  );
}
