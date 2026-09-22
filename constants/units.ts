import type { Unit } from '@/types';

export const UNITS: readonly Unit[] = [
  'pcs',
  'kg',
  'g',
  'litre',
  'ml',
  'packet',
  'box',
  'dozen',
  'metre',
];

/** Units that can only be sold in whole numbers (must match create_bill in schema.sql). */
export const WHOLE_NUMBER_UNITS: readonly Unit[] = ['pcs', 'box', 'packet', 'dozen'];

export const isWholeUnit = (unit: string): boolean =>
  (WHOLE_NUMBER_UNITS as readonly string[]).includes(unit);
