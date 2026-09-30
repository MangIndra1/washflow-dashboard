import { useId } from 'react';

/**
 * Logo WashFlow: mesin cuci (lubang pintu) berisi air bergelombang.
 * Kotak gelap dengan cincin tipis supaya tetap terlihat di atas latar gelap (sidebar, halaman login).
 * Di ukuran kecil, lampu dan gelembung dibuang supaya siluetnya tetap jelas.
 */
export function Logo({ size = 32, className = '' }: { size?: number; className?: string }) {
  const id = useId().replace(/:/g, '');
  const detail = size > 24;
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} role="img" aria-label="Logo WashFlow" className={`flex-shrink-0 rounded-[24%] ring-1 ring-white/15 ${className}`}>
      <defs>
        <clipPath id={`wf-${id}`}><circle cx="32" cy={detail ? 34 : 32} r={detail ? 15 : 17} /></clipPath>
      </defs>
      <rect width="64" height="64" rx="15" fill="#0F172A" />
      {detail && (
        <>
          <circle cx="18" cy="14" r="2.4" fill="#34D399" />
          <circle cx="26" cy="14" r="2.4" fill="#475569" />
          <rect x="38" y="11.6" width="10" height="4.8" rx="2.4" fill="#475569" />
        </>
      )}
      <circle cx="32" cy={detail ? 34 : 32} r={detail ? 17 : 19} fill="none" stroke="#fff" strokeWidth={detail ? 4 : 4.5} />
      <g clipPath={`url(#wf-${id})`}>
        <path d={detail ? 'M10 34q5.5-5 11 0t11 0t11 0t11 0V56H10Z' : 'M10 32q5.5-5 11 0t11 0t11 0t11 0V56H10Z'} fill="#10B981" />
      </g>
      {detail && (
        <>
          <circle cx="29" cy="40" r="1.6" fill="#fff" opacity=".85" />
          <circle cx="36" cy="44" r="1.2" fill="#fff" opacity=".85" />
        </>
      )}
    </svg>
  );
}
