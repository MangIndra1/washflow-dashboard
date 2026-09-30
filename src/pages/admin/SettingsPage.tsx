import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { ImageUp, Plus, Trash2, Wallet } from 'lucide-react';

import { QrCode } from '@/components/shared/QrCode';
import { ErrorPanel } from '@/components/shared/QueryStatus';
import { inputClass } from '@/components/shared/FormField';
import { useAuth } from '@/features/auth/AuthContext';
import type { BankAccount, PaymentInfo } from '@/features/payment-info/api';
import { usePaymentInfo, useSavePaymentInfo } from '@/features/payment-info/hooks';
import { pesanError } from '@/lib/errors';
import { validateQris } from '@/lib/qris';

const MAX_BANKS = 5;
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

/** Membaca teks QR dari gambar. jsQR dimuat hanya di halaman ini. */
async function decodeQr(file: File): Promise<string | null> {
  const { default: jsQR } = await import('jsqr');
  const bmp = await createImageBitmap(file);
  try {
    for (const maxSide of [1400, 900, 600]) {
      const scale = Math.min(1, maxSide / Math.max(bmp.width, bmp.height));
      const w = Math.max(1, Math.round(bmp.width * scale)); const h = Math.max(1, Math.round(bmp.height * scale));
      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return null;
      ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, w, h);
      ctx.drawImage(bmp, 0, 0, w, h);
      const res = jsQR(ctx.getImageData(0, 0, w, h).data, w, h, { inversionAttempts: 'attemptBoth' });
      if (res?.data) return res.data;
    }
    return null;
  } finally {
    bmp.close();
  }
}

function bankError(b: BankAccount): string | null {
  const filled = b.bank.trim() || b.number.trim() || b.holder.trim();
  if (!filled) return null;
  if (!b.bank.trim()) return 'Isi nama bank.';
  if (!/^[\d\s-]{5,30}$/.test(b.number.trim())) return 'Nomor rekening hanya angka (5 sampai 30 digit).';
  return null;
}

export default function SettingsPage() {
  const { currentUser } = useAuth();
  const { data, isPending, isError, refetch } = usePaymentInfo();
  const save = useSavePaymentInfo();
  const fileRef = useRef<HTMLInputElement>(null);

  const [draft, setDraft] = useState<PaymentInfo | null>(null);
  const [qrisError, setQrisError] = useState<string | null>(null);
  const [reading, setReading] = useState(false);
  const [pasted, setPasted] = useState('');

  useEffect(() => { if (data && !draft) setDraft(data); }, [data, draft]);

  if (isError) return <ErrorPanel message="Pengaturan tidak dapat dimuat. Periksa koneksi lalu coba lagi." onRetry={() => void refetch()} />;
  if (isPending || !draft) return <div className="h-64 animate-pulse rounded-xl bg-white border border-slate-200" role="status" aria-label="Memuat pengaturan" />;

  const set = (patch: Partial<PaymentInfo>) => setDraft({ ...draft, ...patch });
  const dirty = JSON.stringify(draft) !== JSON.stringify(data);
  const rowErrors = draft.banks.map(bankError);
  const invalid = rowErrors.some(Boolean);

  const applyQris = (raw: string) => {
    const r = validateQris(raw);
    if (!r.ok) { setQrisError(r.message); return; }
    setQrisError(null);
    set({ qris_payload: r.payload, qris_merchant: r.merchant });
    toast.success('QRIS terbaca. Periksa nama toko di bawahnya, lalu simpan.');
  };

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    setQrisError(null);
    if (!file.type.startsWith('image/')) { setQrisError('Pilih berkas gambar (PNG atau JPG).'); return; }
    if (file.size > MAX_IMAGE_BYTES) { setQrisError('Gambar terlalu besar (maksimal 8 MB).'); return; }
    setReading(true);
    try {
      const text = await decodeQr(file);
      if (!text) setQrisError('QR tidak terbaca. Gunakan gambar yang lebih jelas dan tidak terpotong.');
      else applyQris(text);
    } catch {
      setQrisError('Gambar tidak dapat dibuka.');
    } finally {
      setReading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const onSave = async () => {
    if (!currentUser || invalid) return;
    const clean: PaymentInfo = {
      ...draft,
      banks: draft.banks.filter((b) => b.bank.trim() || b.number.trim()),
      note: draft.note?.trim() ? draft.note.trim().slice(0, 300) : null,
    };
    try {
      await save.mutateAsync({ info: clean, userId: currentUser.id });
      setDraft(clean);
      toast.success('Info pembayaran disimpan.');
    } catch (e) {
      toast.error(pesanError(e, 'Gagal menyimpan pengaturan.'));
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-slate-900">Pengaturan</h1>
        <p className="text-slate-500 text-sm mt-1">Informasi yang tampil di struk, modal pembayaran, dan halaman pelacakan pelanggan.</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center"><Wallet className="h-5 w-5 text-blue-600" /></div>
          <div><h3 className="text-slate-900">Info Pembayaran</h3><p className="text-xs text-slate-400">Kasir tetap mengonfirmasi pembayaran secara manual.</p></div>
        </div>

        <section aria-labelledby="qris-h">
          <h4 id="qris-h" className="text-sm font-medium text-slate-800 mb-2">QRIS toko</h4>
          <div className="flex flex-wrap items-start gap-5">
            <div className="w-40 flex-shrink-0">
              {draft.qris_payload
                ? <div className="rounded-lg border border-slate-200 p-1"><QrCode value={draft.qris_payload} size={150} label="Pratinjau QRIS" /></div>
                : <div className="h-40 w-40 rounded-lg border-2 border-dashed border-slate-200 flex items-center justify-center text-xs text-slate-400 text-center p-3" data-no-qris>Belum ada QRIS</div>}
            </div>
            <div className="flex-1 min-w-56 space-y-3">
              {draft.qris_merchant && <p className="text-sm text-slate-700" data-qris-name>Nama toko pada QRIS: <span className="font-semibold">{draft.qris_merchant}</span></p>}
              <div className="flex flex-wrap gap-2">
                <input ref={fileRef} type="file" accept="image/*" className="sr-only" aria-label="Unggah gambar QRIS" onChange={(e) => void onFile(e.target.files?.[0])} />
                <button type="button" onClick={() => fileRef.current?.click()} disabled={reading} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700 disabled:opacity-60">
                  <ImageUp className="h-4 w-4" /> {reading ? 'Membaca...' : draft.qris_payload ? 'Ganti gambar QRIS' : 'Unggah gambar QRIS'}
                </button>
                {draft.qris_payload && (
                  <button type="button" onClick={() => set({ qris_payload: null, qris_merchant: null })} className="px-4 py-2 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50">Hapus QRIS</button>
                )}
              </div>
              {qrisError && <p role="alert" className="text-xs text-red-600" data-qris-error>{qrisError}</p>}
              <p className="text-xs text-slate-400">Unggah gambar QRIS statis dari bank atau penyedia pembayaran Anda. Aplikasi membaca kodenya dan membuat ulang QR yang tajam untuk dicetak.</p>
              <details className="text-xs text-slate-500">
                <summary className="cursor-pointer">Gambar tidak terbaca? Tempel teks QRIS</summary>
                <div className="mt-2 flex gap-2">
                  <input aria-label="Teks QRIS" className={inputClass} placeholder="00020101021126..." value={pasted} onChange={(e) => setPasted(e.target.value)} />
                  <button type="button" onClick={() => applyQris(pasted)} className="px-3 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 flex-shrink-0">Pakai</button>
                </div>
              </details>
            </div>
          </div>
        </section>

        <section aria-labelledby="bank-h">
          <div className="flex items-center justify-between mb-2">
            <h4 id="bank-h" className="text-sm font-medium text-slate-800">Rekening bank</h4>
            <button type="button" disabled={draft.banks.length >= MAX_BANKS} onClick={() => set({ banks: [...draft.banks, { bank: '', number: '', holder: '' }] })}
              className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 disabled:opacity-40"><Plus className="h-3.5 w-3.5" /> Tambah rekening</button>
          </div>
          {draft.banks.length === 0 && <p className="text-xs text-slate-400">Belum ada rekening. Tambahkan bila menerima transfer.</p>}
          <div className="space-y-3">
            {draft.banks.map((b, i) => (
              <div key={i} data-bank-row>
                <div className="grid grid-cols-1 sm:grid-cols-[1fr_1.4fr_1.4fr_auto] gap-2 items-center">
                  <input aria-label={`Nama bank ${i + 1}`} className={inputClass} placeholder="Bank (BCA)" value={b.bank} maxLength={40} onChange={(e) => set({ banks: draft.banks.map((x, k) => (k === i ? { ...x, bank: e.target.value } : x)) })} />
                  <input aria-label={`Nomor rekening ${i + 1}`} className={inputClass} inputMode="numeric" placeholder="Nomor rekening" value={b.number} maxLength={30} onChange={(e) => set({ banks: draft.banks.map((x, k) => (k === i ? { ...x, number: e.target.value } : x)) })} />
                  <input aria-label={`Atas nama ${i + 1}`} className={inputClass} placeholder="Atas nama" value={b.holder} maxLength={60} onChange={(e) => set({ banks: draft.banks.map((x, k) => (k === i ? { ...x, holder: e.target.value } : x)) })} />
                  <button type="button" aria-label={`Hapus rekening ${i + 1}`} onClick={() => set({ banks: draft.banks.filter((_, k) => k !== i) })} className="p-2 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                </div>
                {rowErrors[i] && <p className="text-xs text-red-600 mt-1">{rowErrors[i]}</p>}
              </div>
            ))}
          </div>
        </section>

        <section>
          <label htmlFor="pay-note" className="text-sm font-medium text-slate-800 block mb-2">Catatan pembayaran (opsional)</label>
          <textarea id="pay-note" rows={2} maxLength={300} className={inputClass} placeholder="Contoh: Mohon kirim bukti transfer ke kasir." value={draft.note ?? ''} onChange={(e) => set({ note: e.target.value })} />
        </section>

        <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
          {dirty && <span className="text-xs text-amber-600">Ada perubahan yang belum disimpan</span>}
          <button type="button" onClick={() => void onSave()} disabled={!dirty || invalid || save.isPending} className="px-5 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700 disabled:opacity-50">
            {save.isPending ? 'Menyimpan...' : 'Simpan'}
          </button>
        </div>
      </div>
    </div>
  );
}
