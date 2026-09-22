import { useCallback, useMemo, useState } from 'react';
import type { CartLine, Product } from '@/types';

/** One item of the bill being made. Quantity is kept as text so typing "2." works. */
export interface CartEntry {
  product: Product;
  quantityText: string;
}

export function useCart() {
  const [entries, setEntries] = useState<CartEntry[]>([]);

  const add = useCallback((product: Product) => {
    setEntries((current) => {
      const existing = current.find((e) => e.product.id === product.id);
      if (existing) {
        const next = (Number(existing.quantityText) || 0) + 1;
        return current.map((e) =>
          e.product.id === product.id ? { ...e, quantityText: String(next) } : e,
        );
      }
      return [...current, { product, quantityText: '1' }];
    });
  }, []);

  const setQuantityText = useCallback((productId: string, quantityText: string) => {
    setEntries((current) =>
      current.map((e) => (e.product.id === productId ? { ...e, quantityText } : e)),
    );
  }, []);

  const remove = useCallback((productId: string) => {
    setEntries((current) => current.filter((e) => e.product.id !== productId));
  }, []);

  const lines = useMemo<CartLine[]>(
    () =>
      entries.map((e) => ({
        product: e.product,
        quantity: Number(e.quantityText.trim().replace(',', '.') || 'NaN'),
      })),
    [entries],
  );

  return { entries, lines, add, setQuantityText, remove };
}
