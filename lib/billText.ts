import { strings } from '@/constants/strings';
import type { BillWithItems, PaymentType, Shop } from '@/types';
import { formatDateTime, formatINR, formatQty } from '@/lib/format';

export type ShopHeader = Pick<Shop, 'name' | 'address' | 'phone' | 'gst_number'>;

const LINE = '--------------------------';

export const paymentLabel = (type: PaymentType): string => {
  switch (type) {
    case 'cash':
      return strings.bill.cash;
    case 'upi':
      return strings.bill.upi;
    case 'udhaar':
      return strings.bill.udhaar;
  }
};

/** Plain text bill that reads well inside a WhatsApp chat. */
export function buildBillText(shop: ShopHeader, bill: BillWithItems): string {
  const b = strings.bill;
  const out: string[] = [];

  out.push(`*${shop.name}*`);
  if (shop.address) out.push(shop.address);
  if (shop.phone) out.push(`${b.phone}: ${shop.phone}`);
  if (shop.gst_number) out.push(`${b.gst}: ${shop.gst_number}`);
  out.push(LINE);
  out.push(`${b.billNumber(bill.bill_number)}`);
  out.push(`${b.date}: ${formatDateTime(bill.created_at)}`);
  if (bill.customer_name || bill.customer_phone) {
    const who = [bill.customer_name, bill.customer_phone].filter(Boolean).join(' - ');
    out.push(`${b.customerLabel}: ${who}`);
  }
  out.push(LINE);

  bill.bill_items.forEach((item, index) => {
    out.push(`${index + 1}. ${item.product_name}`);
    out.push(
      `   ${formatQty(item.quantity)} ${item.unit} x ${formatINR(item.price)} = ${formatINR(item.line_total)}`,
    );
  });

  out.push(LINE);
  if (bill.discount > 0) {
    out.push(`${b.subtotal}: ${formatINR(bill.subtotal)}`);
    out.push(`${b.discountLine}: -${formatINR(bill.discount)}`);
  }
  out.push(`*${b.total}: ${formatINR(bill.total)}*`);
  out.push(`${b.paidBy}: ${paymentLabel(bill.payment_type)}`);
  if (bill.payment_type === 'udhaar') out.push(b.udhaarNote);
  out.push('');
  out.push(b.thankYou);

  return out.join('\n');
}

/** wa.me link. With a valid phone it opens that customer's chat, otherwise the contact picker. */
export function buildWhatsAppUrl(text: string, customerPhone: string | null): string {
  const digits = (customerPhone ?? '').replace(/\D/g, '');
  const target = digits.length === 10 ? `91${digits}` : '';
  return `https://wa.me/${target}?text=${encodeURIComponent(text)}`;
}
