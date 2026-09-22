# Manual test checklist (15 cases)

Do these on your phone with the app running. Before you start:

1. `supabase/schema.sql` has been run and phone login is enabled (see README).
2. Use two phones (or one phone and one Supabase test number) so you can test the owner **and** a staff member.
   - Owner test number example: `9876543210` (code `123456` if you added it under _Test Phone Numbers_).
   - Staff test number example: `9123456780` (code `123456`).
3. Tick each box when it works. Write down anything that does not.

---

### 1. Login with OTP (first time) and create shop

- [ ] Open the app. Enter the owner number and tap **Send Code**. Enter a wrong code → friendly red message. Enter the correct code.
- [ ] The **Set up your shop** screen appears. Leave the shop name empty and tap **Create My Shop** → "This is required". Fill shop name and your name → Home opens with your shop name.
- [ ] Close the app fully and open it again → you are still logged in (no new SMS).

### 2. Phone number validation

- [ ] On the login screen type `12345` and tap **Send Code** → "Enter a 10 digit mobile number". Typing `+91 98765 43210` also works.

### 3. Add a product

- [ ] Home → **Products** → **Add Product**. Try price `0` → error "Price must be more than 0". Try stock `-1` → error.
- [ ] Choose unit **pcs** and stock `2.5` → "Use a whole number". Change unit to **kg** → `2.5` is accepted.
- [ ] Add "Sugar", price `46`, stock `10`, unit `kg`, low limit `3`. It appears in the list with "10 kg in stock".

### 4. Search, edit and delete a product

- [ ] Type "sug" in the search box → Sugar shows. Type "zzz" → "No product found".
- [ ] Tap Sugar, change the price to `48`, Save → list shows ₹48.00.
- [ ] Add a second product, open it, tap **Delete Product** → a confirm popup appears. Tap **Cancel** (product stays). Delete again and confirm → it is gone.

### 5. Make a cash bill

- [ ] Home → **New Bill** → **Add Items** → tap Sugar (it says "1 in bill") → **Done**.
- [ ] Change quantity to `2` using the **+** button. The total shows ₹96.00 live (2 × ₹48).
- [ ] Payment **Cash** → **Save Bill**. The bill preview opens with **Bill No. 1**.

### 6. Stock reduces

- [ ] Go back to Home → **Products**. Sugar now shows **8 kg in stock**.

### 7. Not enough stock is blocked

- [ ] New Bill, add Sugar, type quantity `50`. A red message "Only 8 kg in stock" appears and the line is red. Tap **Save Bill** → "Please fix the items marked in red." No bill is created (check Bill History).

### 8. Discount (amount and percent)

- [ ] New Bill with 2 kg Sugar (₹96). Choose **₹ Amount** and enter `6` → total ₹90.00.
- [ ] Switch to **% Percent**, enter `10` → total ₹86.40. Enter `150` → red "Percent must be 100 or less" and Save is refused.

### 9. Udhaar bill needs customer details

- [ ] New Bill, add an item, choose **Udhaar**, leave name/phone empty and Save → red "Name and mobile number are needed for Udhaar".
- [ ] Enter name "Ravi" and phone `9123456780` → Save works. The bill shows "Payment: Udhaar" and the note "Amount is on Udhaar (pay later)".

### 10. WhatsApp share

- [ ] On the bill preview tap **Send on WhatsApp**. WhatsApp opens the chat with the customer's number (for the Udhaar bill) with a readable bill text: shop name, bill number, items with ₹, total. For a bill without a phone number, WhatsApp asks whom to send it to.

### 11. PDF share

- [ ] Tap **Share PDF**. The phone share sheet opens. Send it to yourself and open the PDF: shop name, items table, total in the Indian format (for example ₹1,23,456.00 for a big bill).

### 12. Bill history

- [ ] Home → **Bill History** shows your bills newest first with number, customer, time, total and payment type. Tap one → same preview opens. Pull down to refresh.

### 13. Sales report (owner)

- [ ] Home → **Report**. Today's total equals the sum of today's bills. Check the number of bills, the Cash / UPI / Udhaar split and the Top 5 products list.
- [ ] Tap **<** for yesterday → "No sales on this day". Tap **Change Date**, pick another date. **>** is disabled on today.

### 14. Low stock alert

- [ ] Set Sugar's low-stock limit to `10` (stock is below it). Home shows a red number badge on **Low Stock** and "1 item is low". Open it → Sugar is listed with a "Low" tag. Raise the stock to `100` → the badge disappears.

### 15. Staff role: add staff, and what staff can NOT do

- [ ] Owner: Home → **Settings** → **Staff**. Add name "Sunil" and the staff number. It shows "Has not logged in yet". Trying to add the same number again → "This number is already added".
- [ ] On the staff phone log in with that number and code. It opens straight to Home (no "Set up your shop").
- [ ] Staff Home has only **New Bill**, **Products**, **Low Stock** and **Bill History** — no **Report**, no **Settings**, no "Today's sales" card.
- [ ] Staff Products: tapping a product does nothing and there is no **Add Product** button.
- [ ] Staff can make a bill and it appears in staff's Bill History; the owner sees it too. Staff sees only their own bills.
- [ ] Database check (Supabase SQL editor → Table Editor): as staff you cannot change products (RLS). The report is owner-only even if someone tried to call it directly.
- [ ] Owner: Staff → **Remove** → confirm popup → removed. The staff phone can no longer open the shop.

---

### Bonus checks (if you have time)

- [ ] **Double tap Save Bill** very quickly → only one bill is created (Bill History).
- [ ] Turn on Airplane mode and open Products → friendly "No internet" message with a **Try again** button. Turn it off, tap **Try again** → list loads.
- [ ] Settings: add a GST number `27ABCDE1234F1Z5` and shop address, save. Make a bill → they show on the preview, WhatsApp text and PDF. A wrong GST like `123` → error.
- [ ] Settings → **Log Out** → confirm popup → back to login screen.
