import { supabase } from '@/lib/supabase';
import type { Tables, TablesInsert } from '@/types/database';

export type Promotion = Tables<'promotions'>;

export interface PromotionListItem extends Promotion {
  usage: number;
  discountTotal: number;
  lastUsedAt: string | null;
}

export type PromotionInput = Pick<TablesInsert<'promotions'>, 'code' | 'name' | 'type' | 'value' | 'min_order' | 'max_usage' | 'valid_from' | 'valid_to' | 'is_active'> & {
  id?: string;
};

export async function fetchPromotions(): Promise<PromotionListItem[]> {
  const [promos, stats] = await Promise.all([
    supabase.from('promotions').select('*').order('created_at', { ascending: false }),
    supabase.from('promotion_stats').select('*'),
  ]);
  if (promos.error) throw promos.error;
  if (stats.error) throw stats.error;

  const byId = new Map(stats.data.map((s) => [s.promo_id, s]));
  return promos.data.map((p) => ({
    ...p,
    usage: byId.get(p.id)?.usage_count ?? 0,
    discountTotal: byId.get(p.id)?.discount_total ?? 0,
    lastUsedAt: byId.get(p.id)?.last_used_at ?? null,
  }));
}

export async function savePromotion({ id, ...values }: PromotionInput): Promise<void> {
  const { error } = id
    ? await supabase.from('promotions').update(values).eq('id', id)
    : await supabase.from('promotions').insert(values);
  if (error) throw error;
}

export async function setPromotionActive(id: string, isActive: boolean): Promise<void> {
  const { error } = await supabase.from('promotions').update({ is_active: isActive }).eq('id', id);
  if (error) throw error;
}

export async function deletePromotion(id: string): Promise<void> {
  const { error } = await supabase.from('promotions').delete().eq('id', id);
  if (error) throw error;
}
