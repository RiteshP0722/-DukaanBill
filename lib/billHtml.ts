import { strings } from '@/constants/strings';
import type { BillWithItems } from '@/types';
import { formatDateTime, formatINR, formatQty } from '@/lib/format';
import { paymentLabel, type ShopHeader } from '@/lib/billText';

const escapeHtml = (value: string): string =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** HTML of the bill, turned into a PDF by expo-print. */
export function buildBillHtml(shop: ShopHeader, bill: BillWithItems): string {
  const b = strings.bill;
  const rows = bill.bill_items
    .map(
      (item, i) => `
      <tr>
        <td>${i + 1}. ${escapeHtml(item.product_name)}</td>
        <td class="r">${formatQty(item.quantity)} ${escapeHtml(item.unit)}</td>
        <td class="r">${formatINR(item.price)}</td>
        <td class="r">${formatINR(item.line_total)}</td>
      </tr>`,
    )
    .join('');

  const customer = [bill.customer_name, bill.customer_phone].filter(Boolean).join(' - ');

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<style>
  body { font-family: Arial, Helvetica, sans-serif; color: #111; padding: 24px; font-size: 14px; }
  h1 { font-size: 24px; margin: 0 0 4px; text-align: center; }
  .c { text-align: center; color: #444; margin: 2px 0; }
  hr { border: none; border-top: 1px dashed #888; margin: 14px 0; }
  table { width: 100%; border-collapse: collapse; }
  th { text-align: left; border-bottom: 1px solid #333; padding: 6px 4px; }
  td { padding: 6px 4px; border-bottom: 1px solid #ddd; }
  .r { text-align: right; }
  th.r { text-align: right; }
  .row { display: flex; justify-content: space-between; margin: 4px 0; }
  .total { font-size: 20px; font-weight: bold; }
  .foot { text-align: center; margin-top: 20px; color: #444; }
</style>
</head>
<body>
  <h1>${escapeHtml(shop.name)}</h1>
  ${shop.address ? `<p class="c">${escapeHtml(shop.address)}</p>` : ''}
  ${shop.phone ? `<p class="c">${b.phone}: ${escapeHtml(shop.phone)}</p>` : ''}
  ${shop.gst_number ? `<p class="c">${b.gst}: ${escapeHtml(shop.gst_number)}</p>` : ''}
  <hr />
  <div class="row"><span><b>${b.billNumber(bill.bill_number)}</b></span><span>${escapeHtml(formatDateTime(bill.created_at))}</span></div>
  ${customer ? `<div class="row"><span>${b.customerLabel}: ${escapeHtml(customer)}</span></div>` : ''}
  <hr />
  <table>
    <thead>
      <tr><th>${b.item}</th><th class="r">${b.qty}</th><th class="r">${b.rate}</th><th class="r">${b.amount}</th></tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
  <hr />
  ${
    bill.discount > 0
      ? `<div class="row"><span>${b.subtotal}</span><span>${formatINR(bill.subtotal)}</span></div>
         <div class="row"><span>${b.discountLine}</span><span>-${formatINR(bill.discount)}</span></div>`
      : ''
  }
  <div class="row total"><span>${b.total}</span><span>${formatINR(bill.total)}</span></div>
  <div class="row"><span>${b.paidBy}</span><span>${paymentLabel(bill.payment_type)}</span></div>
  ${bill.payment_type === 'udhaar' ? `<p>${b.udhaarNote}</p>` : ''}
  <p class="foot">${b.thankYou}</p>
</body>
</html>`;
}
