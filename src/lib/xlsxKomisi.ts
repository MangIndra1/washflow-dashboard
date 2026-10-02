import type { CommissionEmployee, CommissionEntry, CommissionPayout } from '@/features/commissions/api';

const GREEN = 'FF059669';
const RUPIAH = '"Rp" #,##0';

function localCell(iso: string): Date {
  const d = new Date(iso);
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), d.getHours(), d.getMinutes(), d.getSeconds()));
}

export interface KomisiInput {
  title: string;
  employees: CommissionEmployee[];
  entries: CommissionEntry[];
  payouts: CommissionPayout[];
}

export async function buildKomisiXlsx({ title, employees, entries, payouts }: KomisiInput): Promise<Blob> {
  const ExcelJS = (await import('exceljs')).default;
  const wb = new ExcelJS.Workbook();
  wb.creator = 'WashFlow';
  wb.created = new Date();

  const head = (row: import('exceljs').Row) => {
    row.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    row.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    row.eachCell((c) => { c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: GREEN } }; });
  };
  const widths = (ws: import('exceljs').Worksheet, w: number[]) => { ws.columns.forEach((c, i) => { c.width = w[i] ?? 14; }); };

  // Ringkasan per karyawan
  const s1 = wb.addWorksheet('Ringkasan');
  s1.addRow([title]).font = { bold: true, size: 13 };
  s1.addRow([]);
  head(s1.addRow(['Karyawan', 'Cabang', 'Tarif Saat Ini (%)', 'Jumlah Pesanan', 'Dasar Komisi', 'Total Komisi', 'Belum Dibayar', 'Sudah Dibayar']));
  const first = s1.rowCount + 1;
  for (const e of employees) s1.addRow([e.name, e.branch ?? '-', e.current_rate ?? '', e.orders, e.base, e.amount, e.unpaid, e.paid]);
  const last = s1.rowCount;
  if (employees.length > 0) {
    const t = s1.addRow(['Total', '', '', { formula: `SUM(D${first}:D${last})` }, { formula: `SUM(E${first}:E${last})` }, { formula: `SUM(F${first}:F${last})` }, { formula: `SUM(G${first}:G${last})` }, { formula: `SUM(H${first}:H${last})` }]);
    t.font = { bold: true };
  }
  for (const col of [5, 6, 7, 8]) s1.getColumn(col).numFmt = RUPIAH;
  widths(s1, [26, 20, 16, 16, 18, 18, 18, 18]);

  // Rincian
  const s2 = wb.addWorksheet('Rincian');
  head(s2.addRow(['Waktu', 'Kode Pesanan', 'Karyawan', 'Dasar (Total Setelah Diskon)', 'Tarif (%)', 'Komisi', 'Sumber', 'Status']));
  for (const e of entries) {
    s2.addRow([localCell(e.earned_at), e.order_code, e.employee_name, e.base_amount, Number(e.rate), e.amount, e.source === 'recalc' ? 'Hitung ulang' : 'Otomatis', e.payout_id ? 'Sudah dibayar' : 'Belum dibayar']);
  }
  s2.getColumn(1).numFmt = 'dd/mm/yyyy hh:mm';
  s2.getColumn(4).numFmt = RUPIAH; s2.getColumn(6).numFmt = RUPIAH;
  widths(s2, [18, 18, 24, 22, 10, 16, 14, 16]);

  // Pembayaran
  const s3 = wb.addWorksheet('Pembayaran');
  head(s3.addRow(['Dibayar Pada', 'Karyawan', 'Periode', 'Jumlah Pesanan', 'Total', 'Catatan', 'Status']));
  for (const p of payouts) {
    s3.addRow([localCell(p.paid_at), p.employee_name, `${p.period_from} s/d ${p.period_to}`, p.entry_count, p.total, p.note ?? '', p.voided_at ? 'Dibatalkan' : 'Dibayar']);
  }
  s3.getColumn(1).numFmt = 'dd/mm/yyyy hh:mm';
  s3.getColumn(5).numFmt = RUPIAH;
  widths(s3, [18, 24, 26, 16, 18, 30, 14]);

  const buf = await wb.xlsx.writeBuffer();
  return new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}
