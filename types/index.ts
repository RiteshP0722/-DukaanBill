export type Role = 'owner' | 'staff';
export type PaymentType = 'cash' | 'upi' | 'udhaar';
export type Unit = 'pcs' | 'kg' | 'g' | 'litre' | 'ml' | 'packet' | 'box' | 'dozen' | 'metre';

export interface Shop {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  gst_number: string | null;
  owner_id: string;
  created_at: string;
}

export interface Profile {
  id: string;
  shop_id: string;
  role: Role;
  name: string;
  phone: string;
  created_at: string;
}

export interface Product {
  id: string;
  shop_id: string;
  name: string;
  price: number;
  stock: number;
  unit: string;
  low_stock_limit: number;
  created_at: string;
  updated_at: string;
}

export interface BillItem {
  id: string;
  bill_id: string;
  product_id: string | null;
  product_name: string;
  unit: string;
  price: number;
  quantity: number;
  line_total: number;
}

export interface Bill {
  id: string;
  shop_id: string;
  bill_number: number;
  customer_name: string | null;
  customer_phone: string | null;
  subtotal: number;
  discount: number;
  total: number;
  payment_type: PaymentType;
  created_by: string;
  created_at: string;
}

export interface BillWithItems extends Bill {
  bill_items: BillItem[];
}

export interface StaffInvite {
  id: string;
  shop_id: string;
  phone: string;
  name: string | null;
  created_at: string;
}

export interface TopProduct {
  name: string;
  unit: string;
  quantity: number;
  amount: number;
}

export interface DailyReport {
  total: number;
  bill_count: number;
  cash: number;
  upi: number;
  udhaar: number;
  top_products: TopProduct[];
}

export type DiscountType = 'amount' | 'percent';

export interface CartLine {
  product: Product;
  quantity: number;
}
