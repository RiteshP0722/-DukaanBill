import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Banner } from '@/components/Banner';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { Screen } from '@/components/Screen';
import { ErrorView, LoadingView } from '@/components/ScreenState';
import { colors } from '@/constants/colors';
import { fontSize, spacing } from '@/constants/spacing';
import { strings } from '@/constants/strings';
import { useShop } from '@/hooks/useAuth';
import { useBill } from '@/hooks/useBills';
import { paymentLabel } from '@/lib/billText';
import { formatDateTime, formatINR, formatQty } from '@/lib/format';
import { shareBillOnWhatsApp, shareBillPdf } from '@/lib/share';
import type { BillWithItems, Shop } from '@/types';

function BillPreview({ bill, shop }: { bill: BillWithItems; shop: Shop }) {
  const router = useRouter();
  const [message, setMessage] = useState<{ text: string; tone: 'error' | 'info' } | null>(null);
  const [makingPdf, setMakingPdf] = useState(false);
  const b = strings.bill;

  const onWhatsApp = async () => {
    setMessage(null);
    try {
      await shareBillOnWhatsApp(shop, bill);
    } catch {
      setMessage({ text: b.whatsappFailed, tone: 'error' });
    }
  };

  const onPdf = async () => {
    if (makingPdf) return;
    setMakingPdf(true);
    setMessage(null);
    try {
      const shared = await shareBillPdf(shop, bill);
      if (!shared) setMessage({ text: b.pdfNotAvailable, tone: 'info' });
    } catch {
      setMessage({ text: b.pdfFailed, tone: 'error' });
    } finally {
      setMakingPdf(false);
    }
  };

  return (
    <Screen
      footer={<Button label={b.whatsapp} icon="logo-whatsapp" onPress={() => void onWhatsApp()} />}
    >
      {message ? <Banner message={message.text} tone={message.tone} /> : null}

      <Card>
        <Text style={styles.shopName}>{shop.name}</Text>
        {shop.address ? <Text style={styles.center}>{shop.address}</Text> : null}
        {shop.phone ? (
          <Text style={styles.center}>
            {b.phone}: {shop.phone}
          </Text>
        ) : null}
        {shop.gst_number ? (
          <Text style={styles.center}>
            {b.gst}: {shop.gst_number}
          </Text>
        ) : null}

        <View style={styles.divider} />
        <Text style={styles.billNo}>{b.billNumber(bill.bill_number)}</Text>
        <Text style={styles.muted}>{formatDateTime(bill.created_at)}</Text>
        {bill.customer_name || bill.customer_phone ? (
          <Text style={styles.muted}>
            {b.customerLabel}:{' '}
            {[bill.customer_name, bill.customer_phone].filter(Boolean).join(' - ')}
          </Text>
        ) : null}
        <View style={styles.divider} />

        {bill.bill_items.map((item) => (
          <View key={item.id} style={styles.item}>
            <Text style={styles.itemName}>{item.product_name}</Text>
            <View style={styles.itemRow}>
              <Text style={styles.muted}>
                {formatQty(item.quantity)} {item.unit} x {formatINR(item.price)}
              </Text>
              <Text style={styles.itemTotal}>{formatINR(item.line_total)}</Text>
            </View>
          </View>
        ))}

        <View style={styles.divider} />
        {bill.discount > 0 ? (
          <>
            <View style={styles.itemRow}>
              <Text style={styles.body}>{b.subtotal}</Text>
              <Text style={styles.body}>{formatINR(bill.subtotal)}</Text>
            </View>
            <View style={styles.itemRow}>
              <Text style={styles.body}>{b.discountLine}</Text>
              <Text style={styles.body}>-{formatINR(bill.discount)}</Text>
            </View>
          </>
        ) : null}
        <View style={styles.itemRow}>
          <Text style={styles.totalLabel}>{b.total}</Text>
          <Text style={styles.totalValue}>{formatINR(bill.total)}</Text>
        </View>
        <View style={styles.itemRow}>
          <Text style={styles.body}>{b.paidBy}</Text>
          <Text style={styles.bodyBold}>{paymentLabel(bill.payment_type)}</Text>
        </View>
        {bill.payment_type === 'udhaar' ? <Text style={styles.udhaar}>{b.udhaarNote}</Text> : null}
        <Text style={[styles.center, styles.thanks]}>{b.thankYou}</Text>
      </Card>

      <View style={styles.actions}>
        <Button
          label={makingPdf ? b.makingPdf : b.sharePdf}
          icon="document-text"
          variant="secondary"
          loading={makingPdf}
          onPress={() => void onPdf()}
        />
        <Button
          label={b.anotherBill}
          icon="add-circle"
          variant="outline"
          onPress={() => router.replace('/bill/new')}
        />
      </View>
    </Screen>
  );
}

export default function BillScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { shop } = useShop();
  const { data, loading, error, reload } = useBill(id);

  if (loading) return <LoadingView />;
  if (error && data === undefined)
    return <ErrorView message={error} onRetry={() => void reload()} />;
  if (!data) return <EmptyState icon="help-circle-outline" title={strings.bill.notFound} />;
  return <BillPreview bill={data} shop={shop} />;
}

const styles = StyleSheet.create({
  shopName: {
    fontSize: fontSize.title,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
  },
  center: { fontSize: fontSize.body, color: colors.textMuted, textAlign: 'center' },
  divider: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    borderStyle: 'dashed',
    marginVertical: spacing.md,
  },
  billNo: { fontSize: fontSize.large, fontWeight: '800', color: colors.text },
  muted: { fontSize: fontSize.body, color: colors.textMuted },
  item: { marginBottom: spacing.sm },
  itemName: { fontSize: fontSize.body, fontWeight: '700', color: colors.text },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.md,
  },
  itemTotal: { fontSize: fontSize.body, fontWeight: '700', color: colors.text },
  body: { fontSize: fontSize.body, color: colors.text },
  bodyBold: { fontSize: fontSize.body, fontWeight: '700', color: colors.text },
  totalLabel: { fontSize: fontSize.large, fontWeight: '800', color: colors.text },
  totalValue: { fontSize: fontSize.title, fontWeight: '800', color: colors.primaryDark },
  udhaar: {
    fontSize: fontSize.small,
    color: colors.warning,
    fontWeight: '700',
    marginTop: spacing.xs,
  },
  thanks: { marginTop: spacing.lg },
  actions: { gap: spacing.md, marginTop: spacing.sm },
});
