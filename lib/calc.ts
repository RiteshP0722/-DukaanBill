import type { DiscountType } from '@/types';

export interface PricedLine {
  price: number;
  quantity: number;
}

export interface Totals {
  subtotal: number;
  /** Discount in rupees, never more than the subtotal. */
  discount: number;
  total: number;
  /** True when the discount the user typed was bigger than the bill. */
  discountTooBig: boolean;
}

const toPaise = (rupees: number): number => Math.round(rupees * 100);

/** Price x quantity, rounded to paise (same rule as create_bill in schema.sql). */
export function lineTotal(price: number, quantity: number): number {
  if (!Number.isFinite(price) || !Number.isFinite(quantity)) return 0;
  return toPaise(price * quantity) / 100;
}

/**
 * Sub total, discount and final total. All maths is done in paise (whole
 * numbers) so 0.1 + 0.2 style rounding errors never reach the bill.
 */
export function calcTotals(
  lines: readonly PricedLine[],
  discountType: DiscountType,
  discountValue: number,
): Totals {
  const subtotalPaise = lines.reduce((sum, l) => sum + toPaise(lineTotal(l.price, l.quantity)), 0);

  const value = Number.isFinite(discountValue) && discountValue > 0 ? discountValue : 0;
  const rawPaise =
    discountType === 'percent'
      ? Math.round((subtotalPaise * Math.min(value, 100)) / 100)
      : toPaise(value);

  const discountTooBig = discountType === 'percent' ? value > 100 : rawPaise > subtotalPaise;
  const discountPaise = Math.min(rawPaise, subtotalPaise);

  return {
    subtotal: subtotalPaise / 100,
    discount: discountPaise / 100,
    total: (subtotalPaise - discountPaise) / 100,
    discountTooBig,
  };
}
