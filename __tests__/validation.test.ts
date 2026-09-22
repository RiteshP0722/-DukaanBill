import {
  billFormSchema,
  isValidPhone,
  normalizePhone,
  parseNumber,
  productSchema,
} from '@/lib/validation';

describe('phone validation', () => {
  it('accepts 10 digits', () => {
    expect(isValidPhone('9876543210')).toBe(true);
  });
  it('accepts +91, spaces and a leading 0', () => {
    expect(isValidPhone('+91 98765 43210')).toBe(true);
    expect(isValidPhone('098765 43210')).toBe(true);
    expect(normalizePhone('+919876543210')).toBe('9876543210');
  });
  it('rejects wrong length or letters', () => {
    expect(isValidPhone('98765')).toBe(false);
    expect(isValidPhone('98765432101')).toBe(false);
    expect(isValidPhone('abcdefghij')).toBe(false);
    expect(isValidPhone('')).toBe(false);
  });
});

describe('parseNumber', () => {
  it('reads dots and commas', () => {
    expect(parseNumber('12.5')).toBe(12.5);
    expect(parseNumber('12,5')).toBe(12.5);
  });
  it('gives NaN for empty or wrong text', () => {
    expect(parseNumber('')).toBeNaN();
    expect(parseNumber('abc')).toBeNaN();
  });
});

describe('productSchema', () => {
  const valid = { name: 'Sugar', price: '46', stock: '10', unit: 'kg', lowStockLimit: '5' };

  it('accepts a good product', () => {
    expect(productSchema.safeParse(valid).success).toBe(true);
  });
  it('rejects price 0 or negative', () => {
    expect(productSchema.safeParse({ ...valid, price: '0' }).success).toBe(false);
    expect(productSchema.safeParse({ ...valid, price: '-3' }).success).toBe(false);
  });
  it('rejects negative stock but allows 0', () => {
    expect(productSchema.safeParse({ ...valid, stock: '-1' }).success).toBe(false);
    expect(productSchema.safeParse({ ...valid, stock: '0' }).success).toBe(true);
  });
  it('needs a whole stock number for pcs but not for kg', () => {
    expect(productSchema.safeParse({ ...valid, unit: 'pcs', stock: '2.5' }).success).toBe(false);
    expect(productSchema.safeParse({ ...valid, unit: 'kg', stock: '2.5' }).success).toBe(true);
  });
  it('needs a name', () => {
    expect(productSchema.safeParse({ ...valid, name: '  ' }).success).toBe(false);
  });
});

describe('billFormSchema', () => {
  const base = {
    customerName: '',
    customerPhone: '',
    paymentType: 'cash' as const,
    discountType: 'amount' as const,
    discountValue: '',
  };

  it('allows a cash bill without customer', () => {
    expect(billFormSchema.safeParse(base).success).toBe(true);
  });
  it('needs name and phone for udhaar', () => {
    expect(billFormSchema.safeParse({ ...base, paymentType: 'udhaar' }).success).toBe(false);
    expect(
      billFormSchema.safeParse({
        ...base,
        paymentType: 'udhaar',
        customerName: 'Ravi',
        customerPhone: '9876543210',
      }).success,
    ).toBe(true);
  });
  it('rejects a wrong customer phone even for cash', () => {
    expect(billFormSchema.safeParse({ ...base, customerPhone: '123' }).success).toBe(false);
  });
});
