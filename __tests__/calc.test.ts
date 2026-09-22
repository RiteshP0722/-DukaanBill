import { calcTotals, lineTotal } from '@/lib/calc';
import { formatINR, formatQty } from '@/lib/format';

describe('lineTotal', () => {
  it('multiplies price and quantity', () => {
    expect(lineTotal(46, 2.5)).toBe(115);
  });
  it('avoids floating point errors', () => {
    expect(lineTotal(0.1, 3)).toBe(0.3);
  });
});

describe('calcTotals', () => {
  const lines = [
    { price: 46, quantity: 2 }, // 92
    { price: 10, quantity: 5 }, // 50
  ];

  it('adds up the sub total with no discount', () => {
    expect(calcTotals(lines, 'amount', 0)).toEqual({
      subtotal: 142,
      discount: 0,
      total: 142,
      discountTooBig: false,
    });
  });

  it('applies a rupee discount', () => {
    const t = calcTotals(lines, 'amount', 12);
    expect(t.discount).toBe(12);
    expect(t.total).toBe(130);
  });

  it('applies a percent discount', () => {
    const t = calcTotals(lines, 'percent', 10);
    expect(t.discount).toBe(14.2);
    expect(t.total).toBe(127.8);
  });

  it('never lets the discount go above the bill', () => {
    const t = calcTotals(lines, 'amount', 500);
    expect(t.discount).toBe(142);
    expect(t.total).toBe(0);
    expect(t.discountTooBig).toBe(true);
  });

  it('flags a percent above 100', () => {
    const t = calcTotals(lines, 'percent', 150);
    expect(t.total).toBe(0);
    expect(t.discountTooBig).toBe(true);
  });

  it('ignores negative and invalid discounts', () => {
    expect(calcTotals(lines, 'amount', -5).total).toBe(142);
    expect(calcTotals(lines, 'amount', Number.NaN).total).toBe(142);
  });

  it('handles an empty cart', () => {
    expect(calcTotals([], 'percent', 10).total).toBe(0);
  });
});

describe('formatINR', () => {
  it('uses Indian digit grouping', () => {
    expect(formatINR(123456)).toBe('₹1,23,456.00');
    expect(formatINR(1234567.5)).toBe('₹12,34,567.50');
    expect(formatINR(999)).toBe('₹999.00');
    expect(formatINR(1000)).toBe('₹1,000.00');
    expect(formatINR(0)).toBe('₹0.00');
  });
  it('handles negatives and bad values', () => {
    expect(formatINR(-1500.5)).toBe('-₹1,500.50');
    expect(formatINR(Number.NaN)).toBe('₹0.00');
  });
});

describe('formatQty', () => {
  it('removes useless zeros', () => {
    expect(formatQty(2)).toBe('2');
    expect(formatQty(2.5)).toBe('2.5');
    expect(formatQty(0.125)).toBe('0.125');
  });
});
