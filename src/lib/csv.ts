/**
 * Ekspor CSV di browser. Sel yang diawali = + - @ diberi tanda kutip tunggal di depan supaya
 * Excel tidak menjalankannya sebagai rumus (CSV injection dari nama pelanggan/catatan).
 * BOM ditambahkan agar Excel membaca UTF-8 dengan benar; pemisah titik koma cocok dengan Excel Indonesia.
 */
function escapeCell(value: unknown): string {
  let s = value == null ? '' : String(value);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCsv(rows: unknown[][]): string {
  return rows.map((r) => r.map(escapeCell).join(';')).join('\r\n');
}

export function downloadCsv(filename: string, rows: unknown[][]): void {
  const blob = new Blob(['﻿' + toCsv(rows)], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
