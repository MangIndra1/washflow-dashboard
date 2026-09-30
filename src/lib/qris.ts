/**
 * Pemeriksaan payload QRIS (standar EMV QR, dipakai QRIS Indonesia).
 * Hanya validasi bentuk dan checksum, tidak menghubungi siapa pun.
 */

/** CRC16-CCITT (poly 0x1021, awal 0xFFFF), hasil 4 karakter hex kapital. */
export function crc16(text: string): string {
  let crc = 0xffff;
  for (let i = 0; i < text.length; i++) {
    crc ^= text.charCodeAt(i) << 8;
    for (let b = 0; b < 8; b++) crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

export function parseTlv(payload: string): Map<string, string> | null {
  const out = new Map<string, string>();
  let i = 0;
  while (i < payload.length) {
    if (i + 4 > payload.length) return null;
    const tag = payload.slice(i, i + 2);
    const len = Number(payload.slice(i + 2, i + 4));
    if (!/^\d{2}$/.test(tag) || !Number.isInteger(len) || !/^\d{2}$/.test(payload.slice(i + 2, i + 4))) return null;
    if (i + 4 + len > payload.length) return null;
    out.set(tag, payload.slice(i + 4, i + 4 + len));
    i += 4 + len;
  }
  return out;
}

export type QrisCheck = { ok: true; payload: string; merchant: string | null } | { ok: false; message: string };

export function validateQris(raw: string): QrisCheck {
  const payload = raw.trim();
  if (!payload.startsWith('000201')) return { ok: false, message: 'Bukan kode QRIS. Pastikan gambar berisi QR pembayaran toko.' };
  if (payload.length < 30 || payload.length > 700) return { ok: false, message: 'Panjang kode QRIS tidak wajar.' };
  if (payload.slice(-8, -4) !== '6304' || crc16(payload.slice(0, -4)) !== payload.slice(-4)) {
    return { ok: false, message: 'Kode QRIS rusak (checksum tidak cocok). Coba unggah gambar yang lebih jelas.' };
  }
  const tlv = parseTlv(payload);
  if (!tlv) return { ok: false, message: 'Struktur kode QRIS tidak valid.' };
  if (tlv.get('58') !== 'ID') return { ok: false, message: 'Ini bukan QRIS Indonesia.' };
  if (tlv.get('01') === '12') {
    return { ok: false, message: 'QRIS ini sekali pakai (dinamis, berisi nominal). Gunakan QRIS statis milik toko.' };
  }
  return { ok: true, payload, merchant: tlv.get('59')?.trim() || null };
}
