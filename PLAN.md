# Plan

## Folders

```
app/            Expo Router screens
  _layout.tsx           providers + auth gate (Stack.Protected)
  (auth)/               login, verify (OTP)
  (onboarding)/         create-shop (first-time owner)
  (main)/               home, products, bill, history, report, low-stock, settings, staff
components/     Button, Input, Card, ProductRow, EmptyState, ScreenState, ...
lib/            supabase client, formatters, calc, validation, bill text/HTML, sharing, errors
hooks/          useAuth, useQuery + data hooks (products, bills, report, staff)
constants/      colors, spacing, strings (all UI text), units
types/          shared TypeScript types
supabase/       schema.sql, seed.sql
__tests__/      unit tests (calc, bill text, phone validation)
```

## Tables

shops, profiles, products, bills, bill_items, staff_invites — RLS on all.
RPC: create_shop, claim_staff_invite, create_bill, daily_report, low_stock_products.

## Screens

Login, OTP verify, Create shop, Home, Product list, Add/Edit product, New bill,
Bill preview + share, Bill history, Sales report, Low stock, Settings, Staff list.

## Build order

1. Setup (Expo, TS strict, ESLint, Prettier, Jest) 2. schema.sql 3. auth + roles
2. products 5. new bill 6. share 7. history 8. report 9. low stock 10. settings + staff
   Typecheck + lint + tests after each major part.
