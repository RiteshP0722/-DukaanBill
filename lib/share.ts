import { Linking } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import type { BillWithItems } from '@/types';
import { buildBillHtml } from '@/lib/billHtml';
import { buildBillText, buildWhatsAppUrl, type ShopHeader } from '@/lib/billText';

/** Opens WhatsApp with the bill text ready to send. Throws if it cannot open. */
export async function shareBillOnWhatsApp(shop: ShopHeader, bill: BillWithItems): Promise<void> {
  const url = buildWhatsAppUrl(buildBillText(shop, bill), bill.customer_phone);
  await Linking.openURL(url);
}

/** Makes a PDF file of the bill and opens the phone's share sheet. Returns false if sharing is not possible. */
export async function shareBillPdf(shop: ShopHeader, bill: BillWithItems): Promise<boolean> {
  if (!(await Sharing.isAvailableAsync())) return false;
  const { uri } = await Print.printToFileAsync({ html: buildBillHtml(shop, bill) });
  await Sharing.shareAsync(uri, {
    mimeType: 'application/pdf',
    UTI: 'com.adobe.pdf',
    dialogTitle: `Bill ${bill.bill_number}`,
  });
  return true;
}
