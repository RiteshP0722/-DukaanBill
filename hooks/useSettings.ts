import { supabase } from '@/lib/supabase';
import type { Shop } from '@/types';

export interface ShopDetailsInput {
  name: string;
  address: string | null;
  phone: string | null;
  gst_number: string | null;
}

/** Owner only (the database refuses this for staff). Returns the saved shop. */
export async function updateShopDetails(shopId: string, input: ShopDetailsInput): Promise<Shop> {
  const { data, error } = await supabase
    .from('shops')
    .update(input)
    .eq('id', shopId)
    .select('*')
    .single();
  if (error) throw error;
  return data as Shop;
}
