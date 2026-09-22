import { z } from 'zod';
import { strings } from '@/constants/strings';
import { UNITS, isWholeUnit } from '@/constants/units';

const e = strings.errors;

/**
 * Turns what a person typed into 10 digits when possible.
 * "+91 98765 43210", "098765 43210" and "9876543210" all become "9876543210".
 */
export function normalizePhone(input: string): string {
  let digits = input.replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) digits = digits.slice(2);
  else if (digits.length === 11 && digits.startsWith('0')) digits = digits.slice(1);
  return digits;
}

export function isValidPhone(input: string): boolean {
  return /^\d{10}$/.test(normalizePhone(input));
}

/** "12,50" or "12.5" -> 12.5. Empty or wrong text -> NaN. */
export function parseNumber(input: string): number {
  const cleaned = input.trim().replace(',', '.');
  if (cleaned === '') return NaN;
  return Number(cleaned);
}

export function isWholeNumber(value: number): boolean {
  return Number.isFinite(value) && Math.floor(value) === value;
}

const MAX_MONEY = 10_000_000;
const MAX_QTY = 1_000_000_000;

const phoneField = z.string().refine(isValidPhone, e.phone);
const optionalPhoneField = z.string().refine((v) => v.trim() === '' || isValidPhone(v), e.phone);

export const phoneSchema = z.object({ phone: phoneField });

export const otpSchema = z.object({
  code: z.string().regex(/^\d{6}$/, e.otp),
});

export const createShopSchema = z.object({
  shopName: z.string().trim().min(1, e.required).max(100, e.tooLong),
  ownerName: z.string().trim().min(1, e.required).max(100, e.tooLong),
});

export const productSchema = z
  .object({
    name: z.string().trim().min(1, e.required).max(120, e.tooLong),
    price: z.string().refine((v) => {
      const n = parseNumber(v);
      return Number.isFinite(n) && n > 0 && n <= MAX_MONEY;
    }, e.price),
    stock: z.string().refine((v) => {
      const n = parseNumber(v);
      return Number.isFinite(n) && n >= 0 && n <= MAX_QTY;
    }, e.stock),
    unit: z.string().refine((v) => (UNITS as readonly string[]).includes(v), e.required),
    lowStockLimit: z.string().refine((v) => {
      const n = parseNumber(v);
      return Number.isFinite(n) && n >= 0 && n <= MAX_QTY;
    }, e.lowLimit),
  })
  .superRefine((value, ctx) => {
    if (isWholeUnit(value.unit) && !isWholeNumber(parseNumber(value.stock))) {
      // Only complain when the stock itself is a valid number (other rule handles the rest).
      if (Number.isFinite(parseNumber(value.stock))) {
        ctx.addIssue({ code: 'custom', path: ['stock'], message: e.whole });
      }
    }
  });
export type ProductFormValues = z.infer<typeof productSchema>;

const GST_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;

export const shopSettingsSchema = z.object({
  name: z.string().trim().min(1, e.required).max(100, e.tooLong),
  address: z.string().trim().max(200, e.tooLong),
  phone: optionalPhoneField,
  gst: z
    .string()
    .trim()
    .refine((v) => v === '' || GST_REGEX.test(v.toUpperCase()), e.gst),
});
export type ShopSettingsValues = z.infer<typeof shopSettingsSchema>;

export const staffSchema = z.object({
  name: z.string().trim().min(1, e.required).max(100, e.tooLong),
  phone: phoneField,
});
export type StaffFormValues = z.infer<typeof staffSchema>;

export const billFormSchema = z
  .object({
    customerName: z.string().trim().max(100, e.tooLong),
    customerPhone: optionalPhoneField,
    paymentType: z.enum(['cash', 'upi', 'udhaar']),
    discountType: z.enum(['amount', 'percent']),
    discountValue: z.string().refine((v) => {
      if (v.trim() === '') return true;
      const n = parseNumber(v);
      return Number.isFinite(n) && n >= 0;
    }, e.number),
  })
  .superRefine((value, ctx) => {
    if (value.paymentType !== 'udhaar') return;
    if (value.customerName.trim() === '') {
      ctx.addIssue({ code: 'custom', path: ['customerName'], message: e.udhaarNeedsCustomer });
    }
    if (!isValidPhone(value.customerPhone)) {
      ctx.addIssue({ code: 'custom', path: ['customerPhone'], message: e.udhaarNeedsCustomer });
    }
  });
export type BillFormValues = z.infer<typeof billFormSchema>;
