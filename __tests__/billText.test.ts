import { buildBillText, buildWhatsAppUrl } from '@/lib/billText';
import type { BillWithItems } from '@/types';

const shop = {
  name: 'Sharma General Store',
  address: 'Main Road, Pune',
  phone: '9876543210',
  gst_number: '27ABCDE1234F1Z5',
};

const bill: BillWithItems = {
  id: 'b1',
  shop_id: 's1',
  bill_number: 12,
  customer_name: 'Ravi',
  customer_phone: '9123456780',
  subtotal: 142,
  discount: 12,
  total: 130,
  payment_type: 'udhaar',
  created_by: 'u1',
  created_at: '2026-09-18T10:15:00.000Z',
  bill_items: [
    {
      id: 'i1',
      bill_id: 'b1',
      product_id: 'p1',
      product_name: 'Sugar',
      unit: 'kg',
      price: 46,
      quantity: 2,
      line_total: 92,
    },
    {
      id: 'i2',
      bill_id: 'b1',
      product_id: 'p2',
      product_name: 'Parle-G',
      unit: 'pcs',
      price: 10,
      quantity: 5,
      line_total: 50,
    },
  ],
};

describe('buildBillText', () => {
  const text = buildBillText(shop, bill);

  it('has the shop header', () => {
    expect(text).toContain('*Sharma General Store*');
    expect(text).toContain('Main Road, Pune');
    expect(text).toContain('GSTIN: 27ABCDE1234F1Z5');
  });
  it('has the bill number and customer', () => {
    expect(text).toContain('Bill No. 12');
    expect(text).toContain('Customer: Ravi - 9123456780');
  });
  it('lists every item with rupee amounts', () => {
    expect(text).toContain('1. Sugar');
    expect(text).toContain('2 kg x ₹46.00 = ₹92.00');
    expect(text).toContain('2. Parle-G');
    expect(text).toContain('5 pcs x ₹10.00 = ₹50.00');
  });
  it('shows discount, total and payment', () => {
    expect(text).toContain('Discount: -₹12.00');
    expect(text).toContain('*Total: ₹130.00*');
    expect(text).toContain('Payment: Udhaar');
    expect(text).toContain('Udhaar (pay later)');
  });
  it('leaves out empty parts', () => {
    const plain = buildBillText(
      { name: 'Shop', address: null, phone: null, gst_number: null },
      { ...bill, customer_name: null, customer_phone: null, discount: 0, payment_type: 'cash' },
    );
    expect(plain).not.toContain('GSTIN');
    expect(plain).not.toContain('Customer:');
    expect(plain).not.toContain('Discount');
    expect(plain).not.toContain('Udhaar');
  });
});

describe('buildWhatsAppUrl', () => {
  it('opens the customer chat when the phone is given', () => {
    expect(buildWhatsAppUrl('Hi there', '9123456780')).toBe(
      'https://wa.me/919123456780?text=Hi%20there',
    );
  });
  it('opens the contact picker without a phone', () => {
    expect(buildWhatsAppUrl('Hi', null)).toBe('https://wa.me/?text=Hi');
  });
});
