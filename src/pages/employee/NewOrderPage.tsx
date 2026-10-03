import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { toast } from 'sonner';
import { CheckCircle, Minus, Plus, Search, Trash2, UserPlus, X, AlertCircle, Info } from 'lucide-react';

import { inputClassEmerald } from '@/components/shared/FormField';
import { ErrorPanel } from '@/components/shared/QueryStatus';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { useAuth } from '@/features/auth/AuthContext';
import { tierFor, type Customer } from '@/features/customers/api';
import { CustomerFormModal } from '@/features/customers/CustomerFormModal';
import { useCustomer, useCustomerSearch, useTiers } from '@/features/customers/hooks';
import { METODE_BAYAR, type CartLine, type PaymentMethod } from '@/features/orders/api';
import { useCreateOrder, useQuote } from '@/features/orders/hooks';
import { formatDurasi, UNIT_LABEL } from '@/features/services/labels';
import { useActiveServices } from '@/features/services/hooks';
import type { Service } from '@/features/services/api';
import { pesanError } from '@/lib/errors';
import { formatRupiah } from '@/lib/format';
import { useDebounced } from '@/lib/useDebounced';

type PayMode = 'paid' | 'dp' | 'later';

/** Jumlah diketik pengguna Indonesia dengan koma ("2,5"); ubah ke angka. NaN bila tidak valid. */
function parseQty(text: string): number {
  const n = Number(text.trim().replace(',', '.'));
  return Number.isFinite(n) ? n : NaN;
}

const wholeUnits = new Set(['pcs', 'pasang']);

function lineError(text: string, unit: string): string | null {
  const n = parseQty(text);
  if (text.trim() === '') return 'Isi jumlah';
  if (!(n > 0)) return 'Harus lebih dari 0';
  if (n > 9999) return 'Maksimal 9.999';
  if (wholeUnits.has(unit) && !Number.isInteger(n)) return 'Harus bilangan bulat';
  return null;
}

export default function NewOrderPage() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();

  // ---------- pelanggan
  const [customerId, setCustomerId] = useState<string | null>(params.get('customer'));
  const [custSearch, setCustSearch] = useState('');
  const debouncedSearch = useDebounced(custSearch.trim());
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [newCustomerOpen, setNewCustomerOpen] = useState(false);
  const { data: customer, isError: customerError } = useCustomer(customerId);
  const { data: tiers = [] } = useTiers();
  const { data: found } = useCustomerSearch({ search: debouncedSearch, limit: 6 }, dropdownOpen && debouncedSearch.length >= 2);

  // ---------- layanan & keranjang
  const services = useActiveServices();
  const [cart, setCart] = useState<{ service: Service; qty: string }[]>([]);

  const addService = (s: Service) =>
    setCart((c) => (c.some((l) => l.service.id === s.id) ? c : [...c, { service: s, qty: '' }]));
  const setQty = (id: string, qty: string) => setCart((c) => c.map((l) => (l.service.id === id ? { ...l, qty } : l)));
  const stepQty = (id: string, unit: string, dir: 1 | -1) =>
    setCart((c) => c.map((l) => {
      if (l.service.id !== id) return l;
      const step = wholeUnits.has(unit) ? 1 : 0.5;
      const cur = parseQty(l.qty);
      const next = Math.max(step, (Number.isFinite(cur) ? cur : 0) + dir * step);
      return { ...l, qty: String(next).replace('.', ',') };
    }));
  const removeLine = (id: string) => setCart((c) => c.filter((l) => l.service.id !== id));

  const validLines: CartLine[] = useMemo(
    () => cart.filter((l) => lineError(l.qty, l.service.unit) === null)
      .map((l) => ({ service_id: l.service.id, quantity: parseQty(l.qty) })),
    [cart],
  );
  const allLinesValid = cart.length > 0 && validLines.length === cart.length;
  const debouncedLines = useDebounced(validLines, 350);

  // ---------- promo, catatan, pembayaran
  const [promoInput, setPromoInput] = useState('');
  const [promo, setPromo] = useState('');
  const [notes, setNotes] = useState('');
  const [payMode, setPayMode] = useState<PayMode>('paid');
  const [dpText, setDpText] = useState('');
  const [method, setMethod] = useState<PaymentMethod>('cash');
  const [clientKey, setClientKey] = useState(() => crypto.randomUUID());

  const quote = useQuote(customerId, allLinesValid ? debouncedLines : [], promo);
  const q = quote.data;
  const quoteStale = allLinesValid && (quote.isFetching || debouncedLines.length !== validLines.length ||
    JSON.stringify(debouncedLines) !== JSON.stringify(validLines));

  const dp = Math.round(Number(dpText.replace(/\D/g, '')) || 0);
  const total = q?.total ?? 0;
  const payAmount = payMode === 'paid' ? total : payMode === 'dp' ? dp : 0;
  const dpError = payMode === 'dp' && (dp <= 0 ? 'Isi jumlah DP' : dp >= total ? 'DP harus lebih kecil dari total. Pilih Lunas.' : null);

  const create = useCreateOrder();

  const canSubmit = !!customer && allLinesValid && !!q && !quoteStale && !q.promo_error && !quote.isError && !dpError && !create.isPending;

  // kunci idempotensi baru bila isi pesanan berubah setelah gagal
  useEffect(() => { setClientKey(crypto.randomUUID()); }, [customerId, cart, promo, notes, payMode, dpText, method]);

  const submit = async () => {
    if (!canSubmit || !customer) return;
    try {
      const id = await create.mutateAsync({
        customerId: customer.id,
        lines: validLines,
        promoCode: promo,
        notes: notes.trim(),
        payAmount,
        payMethod: method,
        clientKey,
      });
      toast.success('Pesanan berhasil dibuat.');
      navigate(`/employee/orders/${id}`, { state: { baru: true } });
    } catch (e) {
      toast.error(pesanError(e, 'Gagal menyimpan pesanan.'));
    }
  };

  const applyPromo = () => setPromo(promoInput.trim().toUpperCase());
  const clearPromo = () => { setPromo(''); setPromoInput(''); };

  const selectCustomer = (c: Customer) => {
    setCustomerId(c.id);
    setCustSearch('');
    setDropdownOpen(false);
  };

  const tier = customer ? tierFor(customer.points, tiers).current : null;
  const showDropdown = dropdownOpen && debouncedSearch.length >= 2;

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-slate-900">Pesanan Baru</h1>
        <p className="text-slate-500 text-sm mt-1">Input pesanan untuk {currentUser?.branchName}. Nomor pesanan dibuat otomatis setelah disimpan.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2 space-y-5">
          {/* 1. Pelanggan */}
          <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h2 className="text-sm font-semibold text-slate-800 mb-3">1. Pelanggan</h2>
            {customer ? (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                <div className="h-10 w-10 rounded-full bg-emerald-600 text-white flex items-center justify-center text-sm font-semibold flex-shrink-0">
                  {customer.name.trim().split(/\s+/).slice(0, 2).map((p) => p[0]!.toUpperCase()).join('')}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">{customer.name}</p>
                  <p className="text-xs text-slate-500">{customer.phone}</p>
                </div>
                {tier && <StatusBadge status={tier.name} size="sm" />}
                <button onClick={() => setCustomerId(null)} aria-label="Ganti pelanggan" className="text-xs text-slate-500 hover:text-slate-800 underline">Ganti</button>
              </div>
            ) : (
              <div>
               <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  className={`${inputClassEmerald} pl-9`}
                  placeholder="Cari nama atau nomor WhatsApp"
                  aria-label="Cari pelanggan"
                  value={custSearch}
                  onChange={(e) => { setCustSearch(e.target.value); setDropdownOpen(true); }}
                  onFocus={() => setDropdownOpen(true)}
                />
                {showDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-10 overflow-hidden">
                    {(found ?? []).map((c) => {
                      const t = tierFor(c.points, tiers).current;
                      return (
                        <button key={c.id} onClick={() => selectCustomer(c)} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 text-left border-b border-slate-50">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-900 truncate">{c.name}</p>
                            <p className="text-xs text-slate-400">{c.phone}</p>
                          </div>
                          {t && <StatusBadge status={t.name} size="sm" />}
                        </button>
                      );
                    })}
                    {found && found.length === 0 && <p className="px-4 py-3 text-sm text-slate-400">Tidak ada pelanggan yang cocok.</p>}
                    <button onClick={() => { setNewCustomerOpen(true); setDropdownOpen(false); }} className="w-full flex items-center gap-2 px-4 py-3 text-sm text-emerald-700 hover:bg-emerald-50 text-left">
                      <UserPlus className="h-4 w-4" /> Tambah pelanggan baru
                    </button>
                  </div>
                )}
               </div>
                <p className="text-xs text-slate-400 mt-2">Ketik minimal 2 huruf atau angka. Pelanggan belum terdaftar? Pilih Tambah pelanggan baru.</p>
              </div>
            )}
            {customerError && <p className="text-xs text-red-600 mt-2">Pelanggan tidak ditemukan. Cari ulang.</p>}
          </section>

          {/* 2. Layanan */}
          <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h2 className="text-sm font-semibold text-slate-800 mb-3">2. Layanan</h2>
            {services.isLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2" role="status" aria-label="Memuat layanan">
                {Array.from({ length: 4 }, (_, i) => <div key={i} className="h-20 animate-pulse rounded-xl bg-slate-100" />)}
              </div>
            ) : services.isError ? (
              <ErrorPanel message={pesanError(services.error, 'Gagal memuat layanan.')} onRetry={() => services.refetch()} />
            ) : (services.data ?? []).length === 0 ? (
              <p className="text-sm text-slate-400">Belum ada layanan aktif. Minta admin menambahkan layanan.</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {services.data!.map((s) => {
                  const inCart = cart.some((l) => l.service.id === s.id);
                  return (
                    <button
                      key={s.id}
                      onClick={() => addService(s)}
                      disabled={inCart}
                      className={`p-3 rounded-xl border-2 text-left transition-all ${inCart ? 'border-emerald-500 bg-emerald-50 cursor-default' : 'border-slate-200 bg-white hover:border-slate-300'}`}
                    >
                      <p className="text-xs font-semibold text-slate-800 leading-snug">{s.name}</p>
                      <p className="text-xs text-slate-400 mt-1">{formatRupiah(s.price)} {UNIT_LABEL[s.unit]}</p>
                      <p className="text-xs text-slate-400">{formatDurasi(s.est_hours)}</p>
                    </button>
                  );
                })}
              </div>
            )}

            {cart.length > 0 && (
              <div className="mt-5 space-y-2">
                {cart.map((l) => {
                  const err = lineError(l.qty, l.service.unit);
                  const qty = parseQty(l.qty);
                  return (
                    <div key={l.service.id} className="flex flex-wrap sm:flex-nowrap items-start gap-x-3 gap-y-2 p-3 rounded-xl border border-slate-200 bg-slate-50">
                      <div className="order-1 flex-1 min-w-0 basis-[calc(100%-3rem)] sm:basis-0">
                        <p className="text-sm font-medium text-slate-900">{l.service.name}</p>
                        <p className="text-xs text-slate-400">{formatRupiah(l.service.price)} {UNIT_LABEL[l.service.unit]}</p>
                      </div>
                      <div className="order-3 sm:order-2">
                        <div className="flex items-center gap-1">
                          <button onClick={() => stepQty(l.service.id, l.service.unit, -1)} aria-label={`Kurangi ${l.service.name}`} className="h-9 w-9 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 flex items-center justify-center"><Minus className="h-4 w-4" /></button>
                          <input
                            inputMode="decimal"
                            aria-label={`Jumlah ${l.service.name}`}
                            className="w-20 rounded-lg border border-slate-200 bg-white px-2 py-2 text-center text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            placeholder={l.service.unit === 'kg' ? '0,0' : '0'}
                            value={l.qty}
                            onChange={(e) => setQty(l.service.id, e.target.value)}
                          />
                          <button onClick={() => stepQty(l.service.id, l.service.unit, 1)} aria-label={`Tambah ${l.service.name}`} className="h-9 w-9 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 flex items-center justify-center"><Plus className="h-4 w-4" /></button>
                          <span className="text-xs text-slate-400 w-10">{l.service.unit === 'm2' ? 'm2' : l.service.unit}</span>
                        </div>
                        {err && l.qty !== '' && <p className="text-xs text-red-600 mt-1">{err}</p>}
                      </div>
                      <p className="order-4 sm:order-3 ml-auto sm:ml-0 sm:w-24 text-right text-sm font-medium text-slate-900 pt-2">
                        {err ? '-' : formatRupiah(Math.round(qty * l.service.price))}
                      </p>
                      <button onClick={() => removeLine(l.service.id)} aria-label={`Hapus ${l.service.name}`} className="order-2 sm:order-4 p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* 3. Catatan */}
          <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h2 className="text-sm font-semibold text-slate-800 mb-3">3. Catatan Khusus</h2>
            <textarea
              rows={2}
              maxLength={500}
              className={`${inputClassEmerald} resize-none`}
              placeholder="Contoh: bahan halus, harap hati-hati, dibutuhkan sebelum jam 3 sore"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              aria-label="Catatan khusus"
            />
          </section>
        </div>

        {/* Ringkasan */}
        <aside className="lg:sticky lg:top-4 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <h2 className="text-sm font-semibold text-slate-800">Ringkasan</h2>

            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1.5" htmlFor="promo">Kode Promo (opsional)</label>
              <div className="flex gap-2">
                <input
                  id="promo"
                  className={`${inputClassEmerald} uppercase`}
                  placeholder="HEMAT10K"
                  value={promoInput}
                  onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                  onKeyDown={(e) => { if (e.key === 'Enter') applyPromo(); }}
                  disabled={!!promo}
                />
                {promo ? (
                  <button onClick={clearPromo} aria-label="Hapus promo" className="px-3 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50"><X className="h-4 w-4" /></button>
                ) : (
                  <button onClick={applyPromo} disabled={!promoInput.trim()} className="px-3 rounded-lg bg-slate-900 text-white text-sm hover:bg-slate-800 disabled:opacity-40">Pakai</button>
                )}
              </div>
              {q?.promo_error && <p className="flex items-start gap-1.5 text-xs text-red-600 mt-1.5"><AlertCircle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />{q.promo_error}</p>}
            </div>

            {!customer || !allLinesValid ? (
              <p className="text-sm text-slate-400">
                {!customer ? 'Pilih pelanggan dulu.' : cart.length === 0 ? 'Pilih layanan dan isi jumlahnya.' : 'Lengkapi jumlah setiap layanan.'}
              </p>
            ) : quote.isError && !q ? (
              <p className="text-sm text-red-600">{pesanError(quote.error, 'Gagal menghitung harga.')}</p>
            ) : !q ? (
              <p className="text-sm text-slate-400" role="status">Menghitung harga...</p>
            ) : (
              <div className={`space-y-2 transition-opacity ${quoteStale ? 'opacity-50' : ''}`}>
                <div className="flex justify-between text-sm"><span className="text-slate-600">Subtotal</span><span className="font-medium">{formatRupiah(q.subtotal)}</span></div>
                {q.discount > 0 && (
                  <div className="flex justify-between text-sm text-emerald-700">
                    <span className="flex items-center gap-1"><CheckCircle className="h-3.5 w-3.5" />{q.discount_label}</span>
                    <span>-{formatRupiah(q.discount)}</span>
                  </div>
                )}
                {q.info && <p className="flex items-start gap-1.5 text-xs text-slate-500"><Info className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />{q.info}</p>}
                <div className="flex justify-between pt-2 border-t border-slate-200">
                  <span className="font-bold text-slate-900">Total</span>
                  <span className="font-bold text-slate-900 text-lg" data-testid="total">{formatRupiah(q.total)}</span>
                </div>
                <p className="text-xs text-slate-400">Estimasi selesai sekitar {formatDurasi(q.est_hours)} dari sekarang.</p>
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-3">
            <h2 className="text-sm font-semibold text-slate-800">Pembayaran</h2>
            <div className="grid grid-cols-3 gap-2" role="group" aria-label="Status pembayaran">
              {([['paid', 'Lunas'], ['dp', 'DP'], ['later', 'Bayar nanti']] as const).map(([k, label]) => (
                <button
                  key={k}
                  onClick={() => setPayMode(k)}
                  aria-pressed={payMode === k}
                  className={`py-2 rounded-lg border-2 text-xs font-medium transition-all ${payMode === k ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-200 text-slate-500 hover:border-slate-300'}`}
                >
                  {label}
                </button>
              ))}
            </div>
            {payMode === 'dp' && (
              <div>
                <input
                  inputMode="numeric"
                  aria-label="Jumlah DP"
                  className={inputClassEmerald}
                  placeholder="Jumlah DP, mis. 20000"
                  value={dpText}
                  onChange={(e) => setDpText(e.target.value.replace(/[^\d]/g, ''))}
                />
                {dpText && <p className="text-xs text-slate-500 mt-1">{formatRupiah(dp)}</p>}
                {dpError && dpText && <p className="text-xs text-red-600 mt-1">{dpError}</p>}
              </div>
            )}
            {payMode !== 'later' && (
              <div className="grid grid-cols-3 gap-2" role="group" aria-label="Metode pembayaran">
                {(Object.keys(METODE_BAYAR) as PaymentMethod[]).map((m) => (
                  <button
                    key={m}
                    onClick={() => setMethod(m)}
                    aria-pressed={method === m}
                    className={`py-2 rounded-lg border text-xs transition-colors ${method === m ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                  >
                    {METODE_BAYAR[m]}
                  </button>
                ))}
              </div>
            )}
            {q && (
              <p className="text-xs text-slate-500">
                Dibayar sekarang: <span className="font-semibold text-slate-800">{formatRupiah(payAmount)}</span>
                {q.total - payAmount > 0 && `, sisa ${formatRupiah(q.total - payAmount)}`}
              </p>
            )}
          </div>

          <button
            onClick={submit}
            disabled={!canSubmit}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-emerald-600 text-white font-medium text-sm hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed transition-all shadow-lg shadow-emerald-200 disabled:shadow-none"
          >
            <Plus className="h-5 w-5" /> {create.isPending ? 'Menyimpan...' : 'Simpan Pesanan'}
          </button>
        </aside>
      </div>

      {newCustomerOpen && (
        <CustomerFormModal
          initial={/^[+\d\s\-.()]+$/.test(custSearch.trim()) ? { phone: custSearch.trim() } : { name: custSearch.trim() }}
          onClose={() => setNewCustomerOpen(false)}
          onSaved={(c) => { setNewCustomerOpen(false); selectCustomer(c); }}
        />
      )}
    </div>
  );
}
