import { Tag } from 'lucide-react';

import { formatRupiah } from '@/lib/format';

/** Penanda pesanan berdiskon (promo atau member), supaya selisih harga tidak membingungkan. */
export function DiscountTag({ discount, label, showLabel = false }: { discount: number; label?: string | null; showLabel?: boolean }) {
  if (!discount || discount <= 0) return null;
  const nama = label || 'Diskon';
  return (
    <span
      data-discount-tag title={`${nama}: potongan ${formatRupiah(discount)}`}
      className="inline-flex max-w-full items-center gap-1 rounded-full border border-violet-100 bg-violet-50 px-2 py-0.5 text-[11px] font-medium text-violet-700"
    >
      <Tag className="h-3 w-3 shrink-0" aria-hidden />
      <span className="truncate">{showLabel ? `${nama}, ` : ''}-{formatRupiah(discount)}</span>
    </span>
  );
}
