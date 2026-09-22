export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radius = { md: 12, lg: 16, pill: 999 } as const;

export const fontSize = {
  small: 15,
  body: 18,
  large: 20,
  title: 26,
  big: 34,
} as const;

/** Every button and input is at least this tall. */
export const MIN_TOUCH = 52;
