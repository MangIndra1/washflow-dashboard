import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Crown, Edit, Gift, Info, Plus, RefreshCw, Search, Star, Trash2, Users, Coins } from 'lucide-react';

import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { FormField, inputClass } from '@/components/shared/FormField';
import { Modal } from '@/components/shared/Modal';
import { CardsSkeleton, EmptyState, ErrorPanel, TableSkeleton } from '@/components/shared/QueryStatus';
import { tierFor } from '@/features/customers/api';
import { useTiers } from '@/features/customers/hooks';
import type { Member, Tier } from '@/features/membership/api';
import {
  useAdjustPoints, useDeleteTier, useLoyaltySettings, useMembers, usePointsLog, useRecalcPoints,
  useSaveLoyaltySettings, useSaveTier, useTierCounts,
} from '@/features/membership/hooks';
import { useDebounced } from '@/lib/useDebounced';
import { pesanError } from '@/lib/errors';
import { formatAngka, formatRupiah, formatTanggalJam } from '@/lib/format';

const PAGE = 50;
const persen = (n: number) => String(n).replace('.', ',');

/** Warna tier dari kolom color (#RRGGBB) dengan latar tipis, supaya tier buatan admin tetap serasi. */
function tierStyle(color: string | null) {
  const c = color && /^#[0-9A-Fa-f]{6}$/.test(color) ? color : '#64748B';
  return { color: c, tint: `${c}14`, chip: `${c}26` };
}

export default function MembershipPage() {
  const tiersQ = useTiers();
  const settingsQ = useLoyaltySettings();
  const counts = useTierCounts();
  const removeTier = useDeleteTier();
  const recalc = useRecalcPoints();

  const tiers = useMemo(() => [...(tiersQ.data ?? [])].sort((a, b) => a.min_points - b.min_points), [tiersQ.data]);
  const rate = settingsQ.data?.rupiah_per_point ?? 10000;
  const totalMembers = [...(counts.data?.values() ?? [])].reduce((s, n) => s + n, 0);

  const [tierModal, setTierModal] = useState<{ open: boolean; tier: Tier | null }>({ open: false, tier: null });
  const [toDelete, setToDelete] = useState<Tier | null>(null);
  const [confirmRecalc, setConfirmRecalc] = useState(false);
  const [adjusting, setAdjusting] = useState<Member | null>(null);

  const [search, setSearch] = useState('');
  const debounced = useDebounced(search, 300);
  const [filterTier, setFilterTier] = useState('');
  const [limit, setLimit] = useState(PAGE);
  const range = useMemo(() => {
    if (!filterTier) return { minPoints: null, maxPoints: null };
    const i = tiers.findIndex((t) => t.id === filterTier);
    if (i < 0) return { minPoints: null, maxPoints: null };
    return { minPoints: tiers[i].min_points, maxPoints: tiers[i + 1]?.min_points ?? null };
  }, [filterTier, tiers]);
  const members = useMembers({ search: debounced, ...range, limit });

  const doRecalc = async () => {
    try {
      const r = await recalc.mutateAsync();
      toast.success(r.orders === 0 ? 'Tidak ada pesanan lama yang perlu dihitung.' : `${formatAngka(r.orders)} pesanan lama diproses, ${formatAngka(r.points)} poin ditambahkan.`);
    } catch (e) {
      toast.error(pesanError(e, 'Gagal menghitung ulang poin.'));
    } finally {
      setConfirmRecalc(false);
    }
  };

  const doDeleteTier = async () => {
    if (!toDelete) return;
    try {
      await removeTier.mutateAsync(toDelete.id);
      toast.success(`Tingkat ${toDelete.name} dihapus.`);
      if (filterTier === toDelete.id) setFilterTier('');
    } catch (e) {
      toast.error(pesanError(e, 'Gagal menghapus tingkat.'));
    } finally {
      setToDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-slate-900">Keanggotaan dan Poin</h1>
          <p className="text-slate-500 text-sm mt-1">Atur cara pelanggan mengumpulkan poin dan diskon otomatis untuk setiap tingkat.</p>
        </div>
        <button onClick={() => setTierModal({ open: true, tier: null })} data-new-tier className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700 transition-colors shadow-sm shadow-blue-200">
          <Plus className="h-4 w-4" /> Tingkat Baru
        </button>
      </div>

      <div className="flex items-start gap-2 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800" data-member-rule>
        <Info className="h-4 w-4 mt-0.5 shrink-0" />
        <p>Setiap tingkat memberi <strong>diskon persen otomatis</strong> di kasir, tanpa kode. Diskon member dan kode promo tidak digabung, yang lebih besar yang dipakai. Keterangan keuntungan lain di kartu tingkat hanya informasi untuk pelanggan dan tidak dijalankan otomatis.</p>
      </div>

      <LoyaltyRulesCard
        loading={settingsQ.isLoading} error={settingsQ.isError ? pesanError(settingsQ.error, 'Gagal memuat aturan poin.') : null} onRetry={() => void settingsQ.refetch()}
        enabled={settingsQ.data?.enabled ?? true} rate={rate} onRecalc={() => setConfirmRecalc(true)}
      />

      {tiersQ.isError ? (
        <ErrorPanel message={pesanError(tiersQ.error, 'Gagal memuat tingkat member.')} onRetry={() => void tiersQ.refetch()} />
      ) : tiersQ.isLoading ? (
        <CardsSkeleton count={4} className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4" />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4" data-tiers>
          {tiers.map((tier) => {
            const st = tierStyle(tier.color);
            const base = tier.min_points === 0;
            const n = counts.data?.get(tier.id) ?? 0;
            return (
              <div key={tier.id} data-tier-card={tier.name} className="rounded-xl border-2 p-5 flex flex-col" style={{ borderColor: st.color, backgroundColor: st.tint }}>
                <div className="flex items-start justify-between mb-2 gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <Star className="h-5 w-5 shrink-0" style={{ color: st.color }} />
                    <h4 className="font-bold text-slate-900 truncate">{tier.name}</h4>
                  </div>
                  <span className="text-xl font-bold text-slate-900" data-tier-count title="Jumlah member di tingkat ini">{counts.isLoading ? '...' : formatAngka(n)}</span>
                </div>
                <p className="text-xs text-slate-600">{base ? 'Semua pelanggan baru mulai di sini (0 poin)' : `Mulai ${formatAngka(tier.min_points)} poin`}</p>
                {!base && <p className="text-xs text-slate-400" data-tier-spend>Setara belanja sekitar {formatRupiah(tier.min_points * rate)}</p>}
                <div className="mt-3 inline-flex self-start items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: st.chip, color: st.color }} data-tier-discount>
                  <Gift className="h-3 w-3" /> {tier.discount_percent > 0 ? `Diskon ${persen(tier.discount_percent)}%` : 'Tanpa diskon'}
                </div>
                <div className="space-y-1.5 mt-3 flex-1">
                  {tier.benefits.map((b) => (
                    <div key={b} className="flex items-start gap-1.5">
                      <div className="h-1.5 w-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: st.color }} />
                      <p className="text-xs text-slate-600 leading-relaxed">{b}</p>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-end gap-1.5 mt-4 pt-3 border-t border-black/5">
                  <button onClick={() => setTierModal({ open: true, tier })} aria-label={`Ubah ${tier.name}`} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-slate-600 bg-white/70 hover:bg-white border border-slate-200 transition-colors">
                    <Edit className="h-3.5 w-3.5" /> Ubah
                  </button>
                  {base ? (
                    <span className="text-xs text-slate-400 px-1" title="Tingkat dasar selalu ada supaya setiap pelanggan punya tingkat.">Tingkat dasar</span>
                  ) : (
                    <button onClick={() => setToDelete(tier)} aria-label={`Hapus ${tier.name}`} title="Hapus" className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 transition-colors"><Trash2 className="h-3.5 w-3.5" /></button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 p-6 border-b border-slate-100">
          <div>
            <h3 className="text-slate-900">Daftar Member</h3>
            <p className="text-slate-400 text-xs mt-0.5" data-member-total>{formatAngka(totalMembers)} pelanggan terdaftar, poin terbanyak di atas</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input aria-label="Cari member" placeholder="Cari nama atau nomor..." value={search} onChange={(e) => { setSearch(e.target.value); setLimit(PAGE); }} className="pl-9 pr-4 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-56" />
            </div>
            <div className="flex flex-wrap items-center gap-1" role="group" aria-label="Filter tingkat">
              {[{ id: '', name: 'Semua' }, ...tiers].map((t) => (
                <button key={t.id || 'all'} aria-pressed={filterTier === t.id} data-member-filter={t.name} onClick={() => { setFilterTier(t.id); setLimit(PAGE); }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filterTier === t.id ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                  {t.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {members.isError ? (
          <div className="p-6"><ErrorPanel message={pesanError(members.error, 'Gagal memuat daftar member.')} onRetry={() => void members.refetch()} /></div>
        ) : members.isLoading ? (
          <TableSkeleton rows={5} />
        ) : (members.data?.rows.length ?? 0) === 0 ? (
          <div className="p-6"><EmptyState title={debounced || filterTier ? 'Tidak ada member yang cocok' : 'Belum ada pelanggan'} hint={debounced || filterTier ? undefined : 'Pelanggan ditambahkan oleh kasir saat membuat pesanan.'} /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full" data-members>
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  {['Member', 'Tingkat', 'Poin', 'Menuju tingkat berikutnya', ''].map((h, i) => (
                    <th key={i} className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {members.data!.rows.map((m) => {
                  const { current, next } = tierFor(m.points, tiers);
                  const st = tierStyle(current?.color ?? null);
                  const span = next && current ? next.min_points - current.min_points : 0;
                  const pct = next && span > 0 ? Math.min(100, Math.max(0, ((m.points - (current?.min_points ?? 0)) / span) * 100)) : 100;
                  return (
                    <tr key={m.id} data-member-row={m.name} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-3.5"><p className="text-sm font-medium text-slate-900">{m.name}</p><p className="text-xs text-slate-400">{m.phone}</p></td>
                      <td className="px-6 py-3.5">
                        <span data-member-tier className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ backgroundColor: st.chip, color: st.color }}>{current?.name ?? '-'}</span>
                      </td>
                      <td className="px-6 py-3.5 text-sm font-bold text-slate-900" data-member-points>{formatAngka(m.points)}</td>
                      <td className="px-6 py-3.5 min-w-[200px]">
                        {next ? (
                          <>
                            <div className="h-1.5 w-40 bg-slate-200 rounded-full overflow-hidden"><div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: st.color }} /></div>
                            <p className="text-xs text-slate-400 mt-1">Kurang {formatAngka(next.min_points - m.points)} poin ke {next.name}</p>
                          </>
                        ) : <p className="text-xs text-slate-400"><Crown className="inline h-3 w-3 mr-1" />Tingkat tertinggi</p>}
                      </td>
                      <td className="px-6 py-3.5 text-right">
                        <button onClick={() => setAdjusting(m)} aria-label={`Atur poin ${m.name}`} className="flex items-center gap-1.5 ml-auto px-3 py-1.5 rounded-lg text-xs text-slate-600 border border-slate-200 hover:bg-slate-50"><Coins className="h-3.5 w-3.5" /> Atur poin</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <div className="flex items-center justify-between px-6 py-3 border-t border-slate-100 bg-slate-50 rounded-b-xl">
          <p className="text-xs text-slate-400" data-member-shown><Users className="inline h-3 w-3 mr-1" />{formatAngka(members.data?.rows.length ?? 0)} dari {formatAngka(members.data?.total ?? 0)} member ditampilkan</p>
          {members.data && members.data.total > members.data.rows.length && (
            <button onClick={() => setLimit((l) => l + PAGE)} data-member-more className="text-xs text-blue-600 hover:underline">Tampilkan lebih banyak</button>
          )}
        </div>
      </div>

      {tierModal.open && <TierFormModal tier={tierModal.tier} tiers={tiers} rate={rate} onClose={() => setTierModal({ open: false, tier: null })} />}
      {adjusting && <AdjustPointsModal member={adjusting} tiers={tiers} onClose={() => setAdjusting(null)} />}

      <ConfirmDialog
        open={!!toDelete} onOpenChange={(o) => { if (!o) setToDelete(null); }} title="Hapus tingkat?"
        description={<>Tingkat <strong>{toDelete?.name}</strong> akan dihapus. {toDelete && (counts.data?.get(toDelete.id) ?? 0) > 0 ? <>{formatAngka(counts.data?.get(toDelete.id) ?? 0)} member di tingkat ini otomatis turun ke tingkat di bawahnya. </> : null}Poin pelanggan tidak berubah.</>}
        loading={removeTier.isPending} onConfirm={doDeleteTier}
      />
      <ConfirmDialog
        open={confirmRecalc} onOpenChange={setConfirmRecalc} title="Hitung ulang poin dari pesanan lama?" confirmLabel="Hitung ulang"
        description="Semua pesanan berstatus Selesai yang belum pernah memberi poin akan diberi poin sesuai aturan saat ini. Pesanan yang sudah pernah dihitung tidak dihitung dua kali, jadi aman diulang."
        loading={recalc.isPending} onConfirm={doRecalc}
      />
    </div>
  );
}

function LoyaltyRulesCard({ loading, error, onRetry, enabled, rate, onRecalc }: {
  loading: boolean; error: string | null; onRetry: () => void; enabled: boolean; rate: number; onRecalc: () => void;
}) {
  const save = useSaveLoyaltySettings();
  const [draft, setDraft] = useState<{ enabled: boolean; rate: string } | null>(null);
  const cur = draft ?? { enabled, rate: String(rate) };
  const n = Number(cur.rate);
  const valid = Number.isInteger(n) && n >= 1000 && n <= 10_000_000;
  const dirty = draft !== null && (draft.enabled !== enabled || Number(draft.rate) !== rate);
  const contoh = valid ? Math.floor(100000 / n) : null;

  const onSave = async () => {
    if (!draft || !valid) return;
    try {
      await save.mutateAsync({ enabled: draft.enabled, rupiah_per_point: n });
      toast.success('Aturan poin disimpan.');
      setDraft(null);
    } catch (e) {
      toast.error(pesanError(e, 'Gagal menyimpan aturan poin.'));
    }
  };

  if (error) return <ErrorPanel message={error} onRetry={onRetry} />;
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6" data-loyalty-card>
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div>
          <h3 className="text-slate-900">Aturan Poin</h3>
          <p className="text-slate-400 text-xs mt-0.5">Poin masuk otomatis saat pesanan berstatus Selesai (sudah lunas), dihitung dari total setelah diskon dan dibulatkan ke bawah.</p>
        </div>
        <button onClick={onRecalc} disabled={!enabled} data-recalc title={enabled ? '' : 'Aktifkan program poin dulu'} className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-600 hover:bg-slate-50 disabled:opacity-50">
          <RefreshCw className="h-3.5 w-3.5" /> Hitung ulang dari pesanan lama
        </button>
      </div>
      {loading ? <div className="h-16 rounded-lg bg-slate-100 animate-pulse" /> : (
        <div className="flex flex-wrap items-end gap-6">
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <input type="checkbox" role="switch" aria-label="Program poin aktif" data-loyalty-toggle checked={cur.enabled} onChange={(e) => setDraft({ ...cur, enabled: e.target.checked })} className="h-4 w-4 accent-blue-600" />
            <span className="text-sm text-slate-700">Program poin aktif</span>
          </label>
          <div>
            <label htmlFor="rupiah-per-point" className="text-sm text-slate-700 block mb-1.5" style={{ fontWeight: 500 }}>Setiap belanja (Rp) mendapat 1 poin</label>
            <input id="rupiah-per-point" type="number" inputMode="numeric" step="1000" min="1000" className={`${inputClass} w-48`} aria-invalid={!valid} value={cur.rate} onChange={(e) => setDraft({ ...cur, rate: e.target.value })} />
          </div>
          <div className="text-sm text-slate-600 pb-2" data-rate-preview>
            {valid && contoh !== null ? <>Contoh: pesanan {formatRupiah(100000)} mendapat <strong>{formatAngka(contoh)} poin</strong>.</> : <span className="text-red-600">Isi bilangan bulat antara 1.000 dan 10.000.000.</span>}
          </div>
          <div className="pb-1 flex items-center gap-2">
            <button onClick={() => void onSave()} disabled={!dirty || !valid || save.isPending} data-loyalty-save className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700 disabled:opacity-50">{save.isPending ? 'Menyimpan...' : 'Simpan Aturan'}</button>
            {dirty && <button onClick={() => setDraft(null)} className="px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50">Batal</button>}
          </div>
        </div>
      )}
    </div>
  );
}

interface TierForm { name: string; min_points: string; discount_percent: string; color: string; benefits: string }

function TierFormModal({ tier, tiers, rate, onClose }: { tier: Tier | null; tiers: Tier[]; rate: number; onClose: () => void }) {
  const save = useSaveTier();
  const isEdit = !!tier;
  const base = tier?.min_points === 0;
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<TierForm>({
    defaultValues: {
      name: tier?.name ?? '', min_points: tier ? String(tier.min_points) : '', discount_percent: tier ? String(tier.discount_percent) : '',
      color: tier?.color && /^#[0-9A-Fa-f]{6}$/.test(tier.color) ? tier.color : '#64748B', benefits: (tier?.benefits ?? []).join('\n'),
    },
  });
  const minPts = Number(watch('min_points'));
  const disc = Number(watch('discount_percent'));
  const color = watch('color');
  const lower = [...tiers].filter((t) => t.id !== tier?.id && t.min_points < (Number.isFinite(minPts) ? minPts : 0)).sort((a, b) => b.min_points - a.min_points)[0];
  const lebihKecil = !!lower && Number.isFinite(disc) && disc < lower.discount_percent;

  const onSubmit = handleSubmit(async (v) => {
    const benefits = v.benefits.split('\n').map((s) => s.trim()).filter(Boolean);
    try {
      await save.mutateAsync({
        id: tier?.id, name: v.name.trim(), min_points: Math.round(Number(v.min_points)),
        discount_percent: Math.round(Number(v.discount_percent) * 100) / 100, color: v.color, benefits,
      });
      toast.success(isEdit ? 'Tingkat diperbarui.' : 'Tingkat dibuat.');
      onClose();
    } catch (e) {
      toast.error(pesanError(e, 'Gagal menyimpan tingkat.'));
    }
  });

  return (
    <Modal
      isOpen onClose={onClose} title={isEdit ? `Ubah Tingkat ${tier?.name}` : 'Tingkat Baru'} size="md"
      footer={
        <div className="flex justify-end gap-3">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50">Batal</button>
          <button type="submit" form="tier-form" disabled={isSubmitting} className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700 disabled:opacity-60">{isSubmitting ? 'Menyimpan...' : isEdit ? 'Simpan Perubahan' : 'Buat Tingkat'}</button>
        </div>
      }
    >
      <form id="tier-form" onSubmit={onSubmit} noValidate className="space-y-4">
        <FormField label="Nama Tingkat" required>
          <input className={inputClass} placeholder="mis. Gold" aria-invalid={!!errors.name}
            {...register('name', { required: 'Nama tingkat wajib diisi', maxLength: { value: 30, message: 'Maksimal 30 karakter' }, validate: (v) => v.trim().length > 0 || 'Nama tingkat wajib diisi' })} />
          {errors.name && <p className="text-xs text-red-600">{errors.name.message}</p>}
        </FormField>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Poin Minimal" required hint={base ? 'Tingkat dasar selalu 0 poin' : undefined}>
            <input type="number" inputMode="numeric" step="1" min="0" disabled={base} className={inputClass} aria-invalid={!!errors.min_points}
              {...register('min_points', {
                required: 'Poin minimal wajib diisi',
                validate: (v) => {
                  const n = Number(v);
                  if (!Number.isInteger(n) || n < 0) return 'Isi bilangan bulat 0 atau lebih';
                  if (!base && n === 0) return 'Hanya tingkat dasar yang boleh 0 poin';
                  if (tiers.some((t) => t.id !== tier?.id && t.min_points === n)) return 'Sudah ada tingkat lain dengan poin minimal ini';
                  return true;
                },
              })} />
            {errors.min_points && <p className="text-xs text-red-600">{errors.min_points.message}</p>}
          </FormField>
          <FormField label="Diskon (%)" required>
            <input type="number" inputMode="decimal" step="0.5" min="0" max="90" className={inputClass} aria-invalid={!!errors.discount_percent}
              {...register('discount_percent', {
                required: 'Besar diskon wajib diisi',
                validate: (v) => { const n = Number(v); return (Number.isFinite(n) && n >= 0 && n <= 90) || 'Isi angka 0 sampai 90'; },
              })} />
            {errors.discount_percent && <p className="text-xs text-red-600">{errors.discount_percent.message}</p>}
          </FormField>
        </div>
        {Number.isFinite(minPts) && minPts > 0 && <p className="text-xs text-slate-500 -mt-2" data-tier-form-spend>Pelanggan masuk tingkat ini setelah belanja sekitar {formatRupiah(minPts * rate)} (dengan aturan Rp {formatAngka(rate)} per poin).</p>}
        {lebihKecil && <p className="text-xs text-amber-700 -mt-2" data-tier-warning>Diskon ini lebih kecil dari tingkat di bawahnya ({lower?.name}, {persen(lower?.discount_percent ?? 0)}%). Pastikan memang disengaja.</p>}
        <FormField label="Warna">
          <div className="flex items-center gap-3">
            <input type="color" aria-label="Pilih warna" className="h-9 w-14 rounded border border-slate-200 bg-white p-1" {...register('color', { pattern: { value: /^#[0-9A-Fa-f]{6}$/, message: 'Warna tidak valid' } })} />
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: `${color}26`, color }}><Star className="h-3 w-3" /> {watch('name') || 'Contoh'}</span>
          </div>
        </FormField>
        <FormField label="Keterangan Keuntungan" hint="Satu baris satu keterangan, maksimal 12. Hanya informasi, tidak dijalankan otomatis (kecuali diskon persen di atas).">
          <textarea rows={4} className={inputClass} placeholder={'mis. Diskon 10% untuk setiap pesanan\nPrioritas pengerjaan'}
            {...register('benefits', { validate: (v) => { const l = v.split('\n').map((s) => s.trim()).filter(Boolean); return l.length <= 12 ? (l.every((s) => s.length <= 80) || 'Setiap baris maksimal 80 karakter') : 'Maksimal 12 baris'; } })} />
          {errors.benefits && <p className="text-xs text-red-600">{errors.benefits.message}</p>}
        </FormField>
      </form>
    </Modal>
  );
}

interface AdjustForm { mode: 'add' | 'sub'; amount: string; note: string }

function AdjustPointsModal({ member, tiers, onClose }: { member: Member; tiers: Tier[]; onClose: () => void }) {
  const adjust = useAdjustPoints();
  const log = usePointsLog(member.id);
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<AdjustForm>({ defaultValues: { mode: 'add', amount: '', note: '' } });
  const mode = watch('mode');
  const amount = Number(watch('amount'));
  const delta = Number.isInteger(amount) && amount > 0 ? (mode === 'add' ? amount : -amount) : 0;
  const hasil = member.points + delta;
  const tierBaru = tierFor(Math.max(0, hasil), tiers).current;
  const tierLama = tierFor(member.points, tiers).current;

  const onSubmit = handleSubmit(async (v) => {
    const n = Math.round(Number(v.amount));
    try {
      const saldo = await adjust.mutateAsync({ customerId: member.id, delta: v.mode === 'add' ? n : -n, note: v.note.trim() });
      toast.success(`Poin ${member.name} sekarang ${formatAngka(saldo)}.`);
      onClose();
    } catch (e) {
      toast.error(pesanError(e, 'Gagal mengubah poin.'));
    }
  });

  return (
    <Modal
      isOpen onClose={onClose} title={`Atur Poin ${member.name}`} subtitle={`Poin saat ini ${formatAngka(member.points)}${tierLama ? `, tingkat ${tierLama.name}` : ''}`} size="md"
      footer={
        <div className="flex justify-end gap-3">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50">Batal</button>
          <button type="submit" form="adjust-form" disabled={isSubmitting} className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700 disabled:opacity-60">{isSubmitting ? 'Menyimpan...' : 'Simpan Penyesuaian'}</button>
        </div>
      }
    >
      <form id="adjust-form" onSubmit={onSubmit} noValidate className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Tindakan">
            <select className={inputClass} {...register('mode')}>
              <option value="add">Tambah poin</option>
              <option value="sub">Kurangi poin</option>
            </select>
          </FormField>
          <FormField label="Jumlah Poin" required>
            <input type="number" inputMode="numeric" step="1" min="1" className={inputClass} aria-invalid={!!errors.amount}
              {...register('amount', {
                required: 'Jumlah poin wajib diisi',
                validate: (v) => {
                  const n = Number(v);
                  if (!Number.isInteger(n) || n <= 0 || n > 1_000_000) return 'Isi bilangan bulat 1 sampai 1.000.000';
                  if (mode === 'sub' && n > member.points) return `Tidak bisa melebihi poin saat ini (${formatAngka(member.points)})`;
                  return true;
                },
              })} />
            {errors.amount && <p className="text-xs text-red-600">{errors.amount.message}</p>}
          </FormField>
        </div>
        {delta !== 0 && <p className="text-xs text-slate-600 -mt-2" data-adjust-preview>Poin menjadi <strong>{formatAngka(Math.max(0, hasil))}</strong>{tierBaru && tierBaru.id !== tierLama?.id ? <>, tingkat berubah ke <strong>{tierBaru.name}</strong></> : null}.</p>}
        <FormField label="Alasan" required hint="Dicatat di riwayat poin. Mis. pindahan dari buku lama, kompensasi, koreksi salah input.">
          <input className={inputClass} placeholder="mis. Pindahan poin dari buku lama" aria-invalid={!!errors.note}
            {...register('note', { required: 'Alasan wajib diisi', validate: (v) => { const l = v.trim().length; return (l >= 3 && l <= 200) || 'Alasan 3 sampai 200 karakter'; } })} />
          {errors.note && <p className="text-xs text-red-600">{errors.note.message}</p>}
        </FormField>
      </form>

      <div className="mt-6" data-points-log>
        <h4 className="text-sm font-semibold text-slate-700 mb-2">Riwayat poin</h4>
        {log.isLoading ? <p className="text-xs text-slate-400">Memuat...</p>
          : log.isError ? <p className="text-xs text-red-600">{pesanError(log.error, 'Gagal memuat riwayat poin.')}</p>
          : (log.data?.length ?? 0) === 0 ? <p className="text-xs text-slate-400">Belum ada riwayat poin.</p>
          : (
            <ul className="divide-y divide-slate-100 rounded-lg border border-slate-100 max-h-56 overflow-y-auto">
              {log.data!.map((r) => (
                <li key={r.id} data-log-row className="flex items-center justify-between gap-3 px-3 py-2 text-xs">
                  <div className="min-w-0">
                    <p className="text-slate-700 truncate">{r.note || (r.kind === 'earn' ? 'Dari pesanan' : 'Penyesuaian')}</p>
                    <p className="text-slate-400">{formatTanggalJam(r.created_at)} {r.kind === 'earn' ? '(otomatis)' : '(manual)'}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`font-semibold ${r.points > 0 ? 'text-emerald-600' : 'text-red-600'}`}>{r.points > 0 ? '+' : '-'}{formatAngka(Math.abs(r.points))}</p>
                    <p className="text-slate-400">saldo {formatAngka(r.balance_after)}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
      </div>
    </Modal>
  );
}
