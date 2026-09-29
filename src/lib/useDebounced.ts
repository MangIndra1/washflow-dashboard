import { useEffect, useState } from 'react';

/** Menunda perubahan nilai (mis. teks pencarian) supaya tidak memanggil server di setiap ketukan. */
export function useDebounced<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}
