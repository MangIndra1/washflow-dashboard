import type { BoardOrder, ExportPayment } from '@/features/orders/api';
import { BAYAR_LABEL, METODE_BAYAR, STATUS_LABEL } from '@/features/orders/api';
import type { Period } from '@/features/orders/period';
import { ymd } from '@/features/orders/period';

const GREEN = 'FF059669';
const RUPIAH = '"Rp" #,##0';

/** Excel menyimpan tanggal tanpa zona waktu; geser supaya jam lokal yang tampil. */
function localCell(iso: string): Date {
  const d = new Date(iso);
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), d.getHours(), d.getMinutes(), d.getSeconds()));
}
function dayCell(d: Date): Date { return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())); }

export interface LaporanInput {
  branchName: string;
  period: Period;
  orders: BoardOrder[];
  payments: ExportPayment[];
  /** Tampilkan kolom Cabang (laporan semua cabang). */
  showBranch?: boolean;
}

/** Membuat berkas .xlsx di browser. exceljs (besar) dimuat hanya saat dipanggil. */
export async function buildLaporanXlsx(input: LaporanInput): Promise<Blob> {
  const ExcelJS = (await import('exceljs')).default;
  const { branchName, period, orders, payments, showBranch } = input;
  const wb = new ExcelJS.Workbook();
  wb.creator = 'WashFlow';
  wb.created = new Date();

  const header = (row: import('exceljs').Row) => {
    row.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    row.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    row.height = 22;
    row.eachCell((c) => { c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: GREEN } }; c.border = { bottom: { style: 'thin', color: { argb: 'FF047857' } } }; });
  };
  const autoWidth = (ws: import('exceljs').Worksheet, min = 8, max = 42, fromRow = 1) => {
    ws.columns.forEach((col) => {
      let w = min;
      col.eachCell?.({ includeEmpty: false }, (c, r) => {
        if (r < fromRow) return;
        const v = c.value;
        const text = v == null ? '' : v instanceof Date ? '00/00/0000 00.00' : typeof v === 'object' ? String((v as { result?: unknown }).result ?? '') : String(v);
        w = Math.max(w, Math.min(max, text.length + 3));
      });
      col.width = w;
    });
  };

  const ws = wb.addWorksheet('Ringkasan', { views: [{ showGridLines: false }] }); // sheet pertama

  // ── Sheet Pesanan
  const wp = wb.addWorksheet('Pesanan', { views: [{ state: 'frozen', ySplit: 1 }] });
  wp.columns = [
    { header: 'Kode', key: 'code' }, ...(showBranch ? [{ header: 'Cabang', key: 'branch' }] : []), { header: 'Tanggal', key: 'date', style: { numFmt: 'dd/mm/yyyy' } },
    { header: 'Jam', key: 'time', style: { numFmt: 'hh.mm' } }, { header: 'Pelanggan', key: 'name' },
    { header: 'Telepon', key: 'phone', style: { numFmt: '@' } }, { header: 'Layanan', key: 'svc' }, { header: 'Kasir', key: 'cashier' },
    { header: 'Subtotal', key: 'subtotal', style: { numFmt: RUPIAH } }, { header: 'Diskon', key: 'discount', style: { numFmt: RUPIAH } },
    { header: 'Keterangan Diskon', key: 'dlabel' },
    { header: 'Total', key: 'total', style: { numFmt: RUPIAH } }, { header: 'Dibayar', key: 'paid', style: { numFmt: RUPIAH } },
    { header: 'Sisa', key: 'left', style: { numFmt: RUPIAH } }, { header: 'Pembayaran', key: 'pay' }, { header: 'Status', key: 'status' },
  ];
  for (const o of orders) {
    const at = localCell(o.created_at);
    wp.addRow({
      code: o.code, branch: o.branch?.name ?? '', date: dayCell(new Date(o.created_at)), time: new Date(Date.UTC(1899, 11, 30, at.getUTCHours(), at.getUTCMinutes())),
      name: o.customer?.name ?? '', phone: o.customer?.phone ?? '',
      svc: o.order_items.map((i) => `${i.service_name} (${i.quantity} ${i.unit})`).join(', '),
      cashier: o.cashier?.full_name ?? '', subtotal: o.subtotal, discount: o.discount, dlabel: o.discount > 0 ? (o.discount_label ?? 'Diskon') : '', total: o.total, paid: o.paid_amount, left: Math.max(0, o.total - o.paid_amount),
      pay: BAYAR_LABEL[o.payment_status], status: STATUS_LABEL[o.status],
    });
  }
  header(wp.getRow(1));
  const last = orders.length + 1;
  const colOf = (key: string) => wp.getColumn(key).letter;
  wp.getColumn('phone').eachCell((c, r) => { if (r > 1) c.numFmt = '@'; });
  for (let r = 2; r <= last; r++) {
    const pay = wp.getCell(`${colOf('pay')}${r}`); const st = orders[r - 2].payment_status;
    pay.font = { color: { argb: st === 'paid' ? 'FF047857' : st === 'partial' ? 'FFB45309' : 'FFB91C1C' }, bold: true };
    pay.alignment = { horizontal: 'center' }; wp.getCell(`${colOf('status')}${r}`).alignment = { horizontal: 'center' };
    if (r % 2 === 1) wp.getRow(r).eachCell((c) => { c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } }; });
  }
  autoWidth(wp);
  if (orders.length > 0) {
    wp.autoFilter = { from: 'A1', to: `${colOf('status')}${last}` };
    const tot = wp.addRow({ code: 'Total (mengikuti filter)' });
    for (const key of ['subtotal', 'discount', 'total', 'paid', 'left']) {
      const col = colOf(key); const c = tot.getCell(col);
      c.value = { formula: `SUBTOTAL(109,${col}2:${col}${last})`, result: 0 }; c.numFmt = RUPIAH;
    }
    tot.font = { bold: true };
    tot.eachCell((c) => { c.border = { top: { style: 'thin', color: { argb: 'FF94A3B8' } } }; });
    wp.getColumn('code').width = Math.max(wp.getColumn('code').width ?? 0, 24);
  }

  // ── Sheet Pembayaran
  const wy = wb.addWorksheet('Pembayaran', { views: [{ state: 'frozen', ySplit: 1 }] });
  wy.columns = [
    { header: 'Tanggal', key: 'date', style: { numFmt: 'dd/mm/yyyy' } }, { header: 'Jam', key: 'time', style: { numFmt: 'hh.mm' } },
    { header: 'Kode Pesanan', key: 'code' }, { header: 'Metode', key: 'method' }, { header: 'Jumlah', key: 'amount', style: { numFmt: RUPIAH } },
  ];
  for (const p of payments) {
    const at = localCell(p.paid_at);
    wy.addRow({ date: dayCell(new Date(p.paid_at)), time: new Date(Date.UTC(1899, 11, 30, at.getUTCHours(), at.getUTCMinutes())), code: p.order?.code ?? '', method: METODE_BAYAR[p.method], amount: p.amount });
  }
  header(wy.getRow(1)); autoWidth(wy);
  if (payments.length > 0) wy.autoFilter = { from: 'A1', to: `E${payments.length + 1}` };

  // ── Isi sheet Ringkasan
  const a = ymd(period.start); const b = ymd(period.endInclusive);
  ws.getCell('A1').value = `Laporan Penjualan ${branchName}`; ws.getCell('A1').font = { bold: true, size: 16, color: { argb: GREEN } };
  ws.getCell('A2').value = a === b ? `Tanggal ${a}` : `Periode ${a} sampai ${b}`; ws.getCell('A2').font = { color: { argb: 'FF475569' } };
  ws.getCell('A3').value = `Dibuat ${new Date().toLocaleString('id-ID')}`; ws.getCell('A3').font = { italic: true, color: { argb: 'FF94A3B8' }, size: 9 };

  const byMethod = { cash: 0, qris: 0, transfer: 0 };
  for (const p of payments) byMethod[p.method] += p.amount;
  const received = payments.reduce((s, p) => s + p.amount, 0);
  const gross = orders.reduce((s, o) => s + o.subtotal, 0);
  const diskon = orders.reduce((s, o) => s + o.discount, 0);
  const bySource = new Map<string, { n: number; v: number }>();
  for (const o of orders) {
    if (o.discount <= 0) continue;
    const k = o.discount_label ?? 'Diskon lain'; const e = bySource.get(k) ?? { n: 0, v: 0 };
    e.n++; e.v += o.discount; bySource.set(k, e);
  }
  const rows: [string, number, boolean][] = [
    ['Jumlah pesanan', orders.length, false],
    ['Penjualan kotor (harga normal)', gross, true],
    ['Diskon diberikan', diskon, true],
    ['Nilai pesanan (setelah diskon)', orders.reduce((s, o) => s + o.total, 0), true],
    ['Pembayaran diterima', received, true],
    ['   Tunai', byMethod.cash, true], ['   QRIS', byMethod.qris, true], ['   Transfer', byMethod.transfer, true],
    ['Belum terbayar (pesanan periode ini)', orders.reduce((s, o) => s + Math.max(0, o.total - o.paid_amount), 0), true],
  ];
  ws.getCell('A5').value = 'Indikator'; ws.getCell('B5').value = 'Nilai'; header(ws.getRow(5));
  rows.forEach(([label, val, money], i) => {
    const r = 6 + i; ws.getCell(`A${r}`).value = label; const c = ws.getCell(`B${r}`); c.value = val; c.numFmt = money ? RUPIAH : '#,##0';
    if (!label.startsWith(' ')) ws.getCell(`A${r}`).font = { bold: true };
  });

  // rincian diskon per sumber (promo atau member)
  let next = 6 + rows.length + 2;
  if (bySource.size > 0) {
    ws.getCell(`A${next}`).value = 'Rincian diskon'; ws.getCell(`B${next}`).value = 'Pesanan'; ws.getCell(`C${next}`).value = 'Jumlah diskon'; header(ws.getRow(next));
    [...bySource.entries()].sort((a, b) => b[1].v - a[1].v).forEach(([k, e], i) => {
      const rr = next + 1 + i; ws.getCell(`A${rr}`).value = k; ws.getCell(`B${rr}`).value = e.n; ws.getCell(`C${rr}`).value = e.v; ws.getCell(`C${rr}`).numFmt = RUPIAH;
    });
    next += bySource.size + 2;
  }

  // per hari
  const start = next;
  ws.getCell(`A${start}`).value = 'Tanggal'; ws.getCell(`B${start}`).value = 'Pesanan'; ws.getCell(`C${start}`).value = 'Nilai pesanan'; ws.getCell(`D${start}`).value = 'Pembayaran diterima';
  header(ws.getRow(start));
  const perDay = new Map<string, { n: number; v: number; p: number }>();
  const get = (k: string) => perDay.get(k) ?? perDay.set(k, { n: 0, v: 0, p: 0 }).get(k)!;
  for (const o of orders) { const e = get(ymd(new Date(o.created_at))); e.n++; e.v += o.total; }
  for (const p of payments) get(ymd(new Date(p.paid_at))).p += p.amount;
  let r = start + 1;
  for (let d = new Date(period.start); d <= period.endInclusive; d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1), r++) {
    const e = perDay.get(ymd(d)) ?? { n: 0, v: 0, p: 0 };
    ws.getCell(`A${r}`).value = dayCell(d); ws.getCell(`A${r}`).numFmt = 'ddd, dd/mm/yyyy'; ws.getCell(`A${r}`).alignment = { horizontal: 'left' };
    ws.getCell(`B${r}`).value = e.n; ws.getCell(`C${r}`).value = e.v; ws.getCell(`D${r}`).value = e.p;
    ws.getCell(`C${r}`).numFmt = RUPIAH; ws.getCell(`D${r}`).numFmt = RUPIAH;
  }
  ws.getColumn('A').width = 38; ws.getColumn('B').width = 20; ws.getColumn('C').width = 20; ws.getColumn('D').width = 24;
  ws.getCell('B5').alignment = { horizontal: 'right' };

  const buf = await wb.xlsx.writeBuffer();
  return new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

export function downloadBlob(filename: string, blob: Blob): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
