/**
 * Nomor disimpan dalam format lokal (0812...). WhatsApp butuh kode negara tanpa plus:
 * "0812345" -> "62812345". Nomor yang sudah berawalan 62 dibiarkan.
 */
export function nomorWhatsApp(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('62')) return digits;
  if (digits.startsWith('0')) return `62${digits.slice(1)}`;
  return digits;
}

export function linkWhatsApp(phone: string, pesan?: string): string {
  const base = `https://wa.me/${nomorWhatsApp(phone)}`;
  return pesan ? `${base}?text=${encodeURIComponent(pesan)}` : base;
}
