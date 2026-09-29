import { supabase } from '@/lib/supabase';
import type { Enums, Tables, TablesInsert } from '@/types/database';

export type Service = Tables<'services'>;
export type ServiceUnit = Enums<'service_unit'>;

export interface ServiceListItem extends Service {
  orders30d: number;
  revenue30d: number;
}

export type ServiceInput = Pick<TablesInsert<'services'>, 'name' | 'category' | 'unit' | 'price' | 'est_hours' | 'description' | 'is_active'> & {
  id?: string;
  sort_order?: number;
};

export async function fetchServices(): Promise<ServiceListItem[]> {
  const [services, stats] = await Promise.all([
    supabase.from('services').select('*').order('sort_order').order('name'),
    supabase.from('service_stats').select('*'),
  ]);
  if (services.error) throw services.error;
  if (stats.error) throw stats.error;

  const byId = new Map(stats.data.map((s) => [s.service_id, s]));
  return services.data.map((s) => ({
    ...s,
    orders30d: byId.get(s.id)?.orders_30d ?? 0,
    revenue30d: byId.get(s.id)?.revenue_30d ?? 0,
  }));
}

export async function saveService({ id, ...values }: ServiceInput): Promise<void> {
  const { error } = id
    ? await supabase.from('services').update(values).eq('id', id)
    : await supabase.from('services').insert(values);
  if (error) throw error;
}

export async function setServiceActive(id: string, isActive: boolean): Promise<void> {
  const { error } = await supabase.from('services').update({ is_active: isActive }).eq('id', id);
  if (error) throw error;
}

export async function deleteService(id: string): Promise<void> {
  const { error } = await supabase.from('services').delete().eq('id', id);
  if (error) throw error;
}
