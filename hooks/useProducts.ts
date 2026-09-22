import { supabase } from '@/lib/supabase';
import { useQuery } from '@/hooks/useQuery';
import type { Product } from '@/types';

const escapeLike = (text: string): string => text.replace(/[\\%_]/g, (c) => `\\${c}`);

export async function fetchProducts(search = ''): Promise<Product[]> {
  let query = supabase.from('products').select('*').order('name', { ascending: true }).limit(1000);
  const term = search.trim();
  if (term) query = query.ilike('name', `%${escapeLike(term)}%`);
  const { data, error } = await query;
  if (error) throw error;
  return data as Product[];
}

export async function fetchProduct(id: string): Promise<Product | null> {
  const { data, error } = await supabase.from('products').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data as Product | null;
}

export async function fetchLowStock(): Promise<Product[]> {
  const { data, error } = await supabase.rpc('low_stock_products');
  if (error) throw error;
  return data as Product[];
}

export interface ProductInput {
  name: string;
  price: number;
  stock: number;
  unit: string;
  low_stock_limit: number;
}

export async function createProduct(shopId: string, input: ProductInput): Promise<void> {
  const { error } = await supabase.from('products').insert({ ...input, shop_id: shopId });
  if (error) throw error;
}

export async function updateProduct(id: string, input: ProductInput): Promise<void> {
  const { error } = await supabase
    .from('products')
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}

export async function deleteProduct(id: string): Promise<void> {
  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) throw error;
}

export const useProducts = (search: string) => useQuery(() => fetchProducts(search), [search]);
export const useProduct = (id: string | undefined) =>
  useQuery(async () => (id ? fetchProduct(id) : null), [id]);
export const useLowStock = () => useQuery(fetchLowStock, []);
