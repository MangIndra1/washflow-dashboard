import { useMemo } from 'react';
import QRCode from 'qrcode';

/** QR sebagai SVG (tajam di layar dan saat dicetak). Dibuat di browser, tanpa layanan luar. */
export function QrCode({ value, size = 160, className, label }: { value: string; size?: number; className?: string; label?: string }) {
  const { d, n } = useMemo(() => {
    const qr = QRCode.create(value, { errorCorrectionLevel: 'M' });
    const margin = 3;
    const count = qr.modules.size;
    let path = '';
    for (let y = 0; y < count; y++) {
      for (let x = 0; x < count; x++) {
        if (qr.modules.data[y * count + x]) path += `M${x + margin} ${y + margin}h1v1h-1z`;
      }
    }
    return { d: path, n: count + margin * 2 };
  }, [value]);

  return (
    <svg
      role="img" aria-label={label ?? 'Kode QR'} viewBox={`0 0 ${n} ${n}`} width={size} height={size}
      shapeRendering="crispEdges" className={className} data-qr={value}
    >
      <rect width={n} height={n} fill="#fff" />
      <path d={d} fill="#000" />
    </svg>
  );
}
