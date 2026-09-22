import { supabase } from '@/lib/supabase';
import { useQuery } from '@/hooks/useQuery';
import type { Bill, BillWithItems, CartLine, PaymentType } from '@/types';

export const BILLS_PAGE_SIZE = 30;

export async function fetchBills(limit: number): Promise<Bill[]> {
  const { data, error } = await supabase
    .from('bills')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data as Bill[];
}

export async function fetchBill(id: string): Promise<BillWithItems | null> {
  const { data, error } = await supabase
    .from('bills')
    .select('*, bill_items(*)')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data as BillWithItems | null;
}

export interface CreateBillInput {
  lines: CartLine[];
  paymentType: PaymentType;
  /** Discount in rupees (percent is already converted). */
  discount: number;
  customerName: string;
  customerPhone: string;
  /** Same value on every retry of the same bill, so the database never makes it twice. */
  clientRef: string;
}

/** Saves the bill in ONE database transaction (see create_bill in schema.sql). Returns the bill id. */
export async function createBill(input: CreateBillInput): Promise<string> {
  const { data, error } = await supabase.rpc('create_bill', {
    p_items: input.lines.map((l) => ({ product_id: l.product.id, quantity: l.quantity })),
    p_payment_type: input.paymentType,
    p_discount: input.discount,
    p_customer_name: input.customerName.trim() || null,
    p_customer_phone: input.customerPhone.trim() || null,
    p_client_ref: input.clientRef,
  });
  if (error) throw error;
  return data as string;
}

export const useBills = (limit: number) => useQuery(() => fetchBills(limit), [limit]);
export const useBill = (id: string | undefined) =>
  useQuery(async () => (id ? fetchBill(id) : null), [id]);
