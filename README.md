# DukaanBill (Shop Billing App)

A simple billing app for small shops in India (grocery, mobile shop, medical store, clothes shop).

- Make a bill in under a minute and send it on **WhatsApp** or as a **PDF**
- Stock reduces automatically. Low-stock alert on the Home screen
- Cash / UPI / **Udhaar** (pay later) payment types
- Daily sales report for the owner
- Owner and Staff roles, enforced in the app **and** in the database (Row Level Security)

Built with React Native (Expo SDK 57), TypeScript (strict), Expo Router, Supabase, react-hook-form + zod.

---

## 1. Set up Supabase (about 10 minutes)

1. Go to <https://supabase.com>, create a free account and click **New project**. Choose a region close to India (for example _Mumbai_). Wait until the project is ready.
2. Open **SQL Editor → New query**. Paste the whole file [`supabase/schema.sql`](supabase/schema.sql) and click **Run**. You should see "Success". (It is safe to run again later.)
3. Enable phone login: **Authentication → Providers → Phone** → switch **Enable Phone provider** on.
   - Supabase does not send SMS by itself. Pick an SMS provider in the same screen (Twilio, MessageBird, Vonage or TextLocal) and paste its keys. SMS costs money and is charged by that provider, not by this app.
   - **To test for free**, do not add a provider. In the same screen open **Test Phone Numbers and OTPs** and add for example `919876543210=123456`. That number will always accept the code `123456` and no SMS is sent.
   - Keep the OTP length at **6** (the default). The app expects a 6 digit code.
4. Copy your keys: **Project Settings → API**. You need the **Project URL** and the **anon public** key.
5. In this folder copy `.env.example` to `.env` and fill it in:

   ```
   EXPO_PUBLIC_SUPABASE_URL=https://xxxxxxxx.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...your-anon-key...
   ```

   The anon key is meant to be in the app; your data is protected by the RLS rules in `schema.sql`. **Never** put the `service_role` key in the app. `.env` is in `.gitignore`.

6. (Optional) Log in to the app once and create your shop. Then run [`supabase/seed.sql`](supabase/seed.sql) in the SQL editor to add 10 sample products.

## 2. Run the app

```bash
npm install
npx expo start
```

- Android: install **Expo Go** from the Play Store, scan the QR code shown in the terminal (phone and computer on the same Wi-Fi). Or press `a` to open an Android emulator.
- iOS: scan the QR code with the Camera app (Expo Go must be installed). No code changes are needed.
- After you change `.env`, restart with `npx expo start -c`.

Other commands:

| Command             | What it does                                              |
| ------------------- | --------------------------------------------------------- |
| `npm run typecheck` | TypeScript check (strict mode, no `any`)                  |
| `npm run lint`      | ESLint                                                    |
| `npm run format`    | Prettier                                                  |
| `npm test`          | Unit tests (totals/discount, bill text, phone validation) |

> `.npmrc` contains `legacy-peer-deps=true`. Expo SDK 57 has an optional peer dependency (`react-native-worklets`) that npm otherwise reports as a conflict. Keep the file.

## 3. Build an APK with EAS

```bash
npm install -g eas-cli
eas login
eas build:configure          # first time only; keeps the provided eas.json
```

`.env` is not uploaded to EAS, so give EAS the two values once:

```bash
eas env:create --environment preview --name EXPO_PUBLIC_SUPABASE_URL --value "https://xxxxxxxx.supabase.co" --visibility plaintext
eas env:create --environment preview --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "eyJ..." --visibility plaintext
```

Then build an installable APK (the `preview` profile in `eas.json` produces an `.apk`):

```bash
eas build --platform android --profile preview
```

When it finishes, EAS gives you a download link. Open it on the phone and install. For the Play Store use `--profile production` (makes an `.aab`).

The app id is `com.shopbilling.app`. Change it in `app.json` before publishing. Replace the placeholder icons in `assets/` with your own logo.

---

## What is where

```
app/                Expo Router screens
  _layout.tsx         providers and the login gate (Stack.Protected)
  (auth)/             login, verify (OTP)
  (onboarding)/       create-shop (first-time owner)
  (main)/             home, products, bill, history, report, low-stock, settings, staff
components/         Button, Input, FormInput, Card, Screen, ProductRow, ProductPicker,
                    CartLineRow, EmptyState, ScreenState (loading/error), Banner, Badge, ...
lib/                supabase client, formatters (₹ Indian format), calc, validation (zod),
                    bill text + HTML builders, sharing, friendly errors
hooks/              useAuth, useQuery, useProducts, useBills, useReport, useStaff, useCart, ...
constants/          colors, spacing, strings (ALL UI text), units
types/              shared TypeScript types
supabase/           schema.sql, seed.sql
__tests__/          unit tests
```

**Changes to the suggested structure:** added `__tests__/` (tests), `PLAN.md`, `TESTING.md`, `eas.json`. Screens are split into three route groups — `(auth)`, `(onboarding)`, `(main)` — so Expo Router can show each group only in the right login state. `useAuth` holds the session, profile and shop.

### How the important parts work

- **Bill saving** — `create_bill()` in `schema.sql` runs in one transaction: it locks the products, checks stock, creates the bill with the next per-shop number, copies name and price into `bill_items`, and reduces stock. If anything fails, nothing is saved. Prices are read from the database, not trusted from the phone. A `client_ref` id makes a retry of the same bill return the same bill (no duplicates), and the Save button ignores a second tap.
- **Roles** — Staff can only read products (RLS blocks insert/update/delete), see only bills they made themselves, and `daily_report()` refuses anyone who is not the owner. The UI also hides those screens.
- **Staff joining** — The owner adds a name and mobile number (`staff_invites`). When that person logs in with OTP, `claim_staff_invite()` links their account to the shop as staff.
- **Languages** — All text is in `constants/strings.ts`. To add Hindi or Marathi later, create the same object in another file and select it there.

---

## Assumptions

- Mobile numbers are Indian (+91, 10 digits). The app adds `+91` when sending the OTP.
- The OTP is 6 digits (Supabase default).
- A "day" in the sales report is the Indian Standard Time day (`Asia/Kolkata`), whatever the phone's time zone is.
- "Top 5 selling products" is ranked by **sales amount** (₹), because pieces and kilograms cannot be compared fairly.
- Units `pcs`, `box`, `packet`, `dozen` must be sold and stocked in whole numbers; `kg`, `g`, `litre`, `ml`, `metre` allow decimals (for example 0.5). The database enforces this too.
- A percent discount is turned into a rupee amount in the app, and the database re-checks it is not more than the bill.
- The bill total is not rounded to whole rupees; each line is rounded to paise.
- A person belongs to **one** shop. A staff member who is removed loses access and, if they log in again, is asked to create their own shop.
- Staff see only the bills they made themselves in Bill History; the owner sees all bills. Staff can view Home, Products, Low Stock, New Bill and Bill History (own).
- Deleting a product does not change old bills (bill items keep a copy of the name and price).
- Only the owner can change stock, by editing the product. There is no separate "add stock" screen in version 1.
- "Udhaar" is only stored as a payment type on the bill in version 1. There is no udhaar book yet.
- Jest runs with plain Babel (`babel-preset-expo`) and not `jest-expo`, because the `jest-expo` preset for React Native 0.86 needs an extra package. The tests only cover pure TypeScript logic, so this is enough.

## Known limitations / Next version

Not built on purpose (as asked): udhaar book with payments, GST invoice calculation (GST number is only printed), barcode scan, Bluetooth printer, offline mode.

Also good to know:

- **Not tested on a real phone or real database by the author of this code.** The code compiles (`tsc`), passes lint, the unit tests, and produces an Android bundle, and `npx expo start` starts. But `schema.sql` was not executed against a live Supabase project and the screens were not clicked through on a device. Follow `TESTING.md` first.
- SMS OTP needs a paid SMS provider in production (see step 1.3).
- Bills cannot be edited, cancelled or returned. Fix a mistake by adjusting stock and making a new bill.
- Bill History shows the latest bills (30 at a time, "Show older bills" loads more). No date filter or search yet.
- The sales report is one day at a time (no week/month view or CSV export).
- Stock shown while making a bill is a snapshot; if two people sell the last item together, the second bill is refused by the database with a clear message.
- Next ideas: udhaar book and payment entries, Hindi/Marathi (`strings.ts` is ready), barcode scan, Bluetooth thermal printer, offline queue, GST invoice, bill return/cancel, low-stock push notification.
