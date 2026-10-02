import { useState } from 'react';
import { toast } from 'sonner';

import { FormField, inputClass } from '@/components/shared/FormField';
import { Modal } from '@/components/shared/Modal';
import { EmptyState, ErrorPanel, TableSkeleton } from '@/components/shared/QueryStatus';
import { pesanError } from '@/lib/errors';
import { formatTanggalJam } from '@/lib/format';
import type { MoveKind, StockItem } from './api';
import { useMovements, useRecordStock } from './hooks';

const KIND_LABEL: Record<string, string> = { opening: 'Stok awal', in: 'Terima', out: 'Pakai', adjust: 'Koreksi' };
export const fmtQty = (n: number) => new Intl.NumberFormat('id-ID', { maximumFractionDigits: 2 }).format(n);

const COPY: Record<MoveKind, { title: string; label: string; button: string; color: string }> = {
  in: { title: 'Terima Stok', label: 'Jumlah diterima', button: 'Catat Penerimaan', color: 'bg-emerald-600 hover:bg-emerald-700' },
  out: { title: 'Pakai Stok', label: 'Jumlah dipakai', button: 'Catat Pemakaian', color: 'bg-amber-600 hover:bg-amber-700' },
  adjust: { title: 'Koreksi Stok', label: 'Stok hasil hitung', button: 'Simpan Koreksi', color: 'bg-blue-600 hover:bg-blue-700' },
};

export function StockMoveModal({ item, kind, onClose }: { item: StockItem | null; kind: MoveKind; onClose: () => void }) {
  const record = useRecordStock();
  const [qty, setQty] = useState('');
  const [note, setNote] = useState('');
  const c = COPY[kind];
  const n = Number(qty.replace(',', '.'));
  const bad = qty.trim() === '' || !Number.isFinite(n) || (kind === 'adjust' ? n < 0 : n <= 0) || Math.round(n * 100) / 100 !== n;
  const noteBad = kind === 'adjust' && note.trim().length < 3;

  const submit = async () => {
    if (!item || bad || noteBad) return;
    try {
      const after = await record.mutateAsync({ itemId: item.id, kind, qty: n, note });
      toast.success(`${item.name}: stok sekarang ${fmtQty(after)} ${item.unit}.`);
      setQty(''); setNote(''); onClose();
    } catch (e) {
      toast.error(pesanError(e, 'Gagal mencatat stok.'));
    }
  };

  return (
    <Modal isOpen={!!item} onClose={() => { setQty(''); setNote(''); onClose(); }} size="sm" title={c.title} subtitle={item ? `${item.name}, stok tercatat ${fmtQty(item.current_stock)} ${item.unit}` : undefined}
      footer={<div className="flex gap-3 w-full">
        <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-700 hover:bg-slate-50">Batal</button>
        <button type="button" onClick={() => void submit()} disabled={record.isPending || bad || noteBad} data-stock-submit className={`flex-1 px-4 py-2.5 rounded-lg text-white text-sm disabled:opacity-50 ${c.color}`}>{record.isPending ? 'Menyimpan...' : c.button}</button>
      </div>}>
      <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); void submit(); }}>
        <FormField label={`${c.label}${item ? ` (${item.unit})` : ''}`} required>
          <input autoFocus inputMode="decimal" className={inputClass} value={qty} onChange={(e) => setQty(e.target.value)} data-stock-qty />
        </FormField>
        {kind === 'adjust' && qty !== '' && !bad && item && (
          <p className="text-xs text-slate-500" data-stock-delta>Selisih: {n - item.current_stock >= 0 ? '+' : ''}{fmtQty(n - item.current_stock)} {item.unit}</p>
        )}
        <FormField label={kind === 'adjust' ? 'Alasan koreksi' : 'Catatan (opsional)'} required={kind === 'adjust'} hint={kind === 'adjust' ? 'Mis. hasil stok opname' : kind === 'in' ? 'Mis. nama pemasok atau nomor nota' : 'Mis. untuk cuci reguler'}>
          <input className={inputClass} maxLength={200} value={note} onChange={(e) => setNote(e.target.value)} data-stock-note />
        </FormField>
      </form>
    </Modal>
  );
}

export function StockHistoryModal({ item, onClose }: { item: StockItem | null; onClose: () => void }) {
  const q = useMovements(item?.id ?? null);
  return (
    <Modal isOpen={!!item} onClose={onClose} size="lg" title={`Riwayat ${item?.name ?? ''}`} subtitle="100 pergerakan terakhir">
      {q.isPending ? <TableSkeleton rows={4} /> : q.isError ? <ErrorPanel message="Riwayat tidak dapat dimuat." onRetry={() => void q.refetch()} />
        : (q.data ?? []).length === 0 ? <EmptyState title="Belum ada pergerakan stok" /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm" data-movements>
              <thead><tr className="text-left text-xs text-slate-500">
                <th className="py-2 font-medium">Waktu</th><th className="py-2 font-medium">Jenis</th><th className="py-2 font-medium text-right">Jumlah</th>
                <th className="py-2 font-medium text-right">Saldo</th><th className="py-2 pl-3 font-medium">Oleh</th><th className="py-2 font-medium">Catatan</th>
              </tr></thead>
              <tbody>
                {q.data!.map((m) => (
                  <tr key={m.id} className="border-t border-slate-100" data-movement-row data-kind={m.kind}>
                    <td className="py-2 text-slate-600 whitespace-nowrap">{formatTanggalJam(m.created_at)}</td>
                    <td className="py-2 text-slate-900">{KIND_LABEL[m.kind] ?? m.kind}</td>
                    <td className={`py-2 text-right font-medium ${m.quantity > 0 ? 'text-emerald-600' : 'text-amber-600'}`}>{m.quantity > 0 ? "+" : ""}{fmtQty(m.quantity)}</td>
                    <td className="py-2 text-right text-slate-600">{fmtQty(m.balance_after)}</td>
                    <td className="py-2 pl-3 text-slate-500">{m.created_by_name ?? '-'}</td>
                    <td className="py-2 text-slate-500">{m.note ?? '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
    </Modal>
  );
}
