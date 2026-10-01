-- =============================================================================
-- WashFlow M6a: halaman Promo admin (statistik pemakaian + pengaman hapus)
-- =============================================================================

-- Pemakaian per promo: jumlah pesanan yang memakainya dan total diskon yang diberikan.
-- security_invoker: mengikuti RLS pemanggil (admin melihat semua cabang).
create view public.promotion_stats with (security_invoker = true) as
select p.id                              as promo_id,
       count(o.id)::int                  as usage_count,
       coalesce(sum(o.discount), 0)::bigint as discount_total,
       max(o.created_at)                 as last_used_at
  from public.promotions p
  left join public.orders o on o.promo_id = p.id
 group by p.id;

revoke all on public.promotion_stats from anon, public;
grant select on public.promotion_stats to authenticated;

-- Promo yang sudah dipakai tidak boleh dihapus: orders.promo_id akan menjadi kosong, sehingga riwayat
-- diskon hilang dan kuota promo "kembali penuh". Cukup dinonaktifkan. (Skrip SQL role postgres tidak dibatasi.)
create function private.trg_promotions_guard_delete() returns trigger
language plpgsql set search_path = '' as $$
begin
  if current_user not in ('authenticated', 'anon') then return old; end if;
  if exists (select 1 from public.orders o where o.promo_id = old.id) then
    raise exception 'Promo ini sudah dipakai pada pesanan. Nonaktifkan saja agar riwayat diskonnya tetap utuh.' using errcode = 'P0001';
  end if;
  return old;
end $$;

revoke all on function private.trg_promotions_guard_delete() from public, anon, authenticated;
create trigger promotions_guard_delete before delete on public.promotions
  for each row execute function private.trg_promotions_guard_delete();
