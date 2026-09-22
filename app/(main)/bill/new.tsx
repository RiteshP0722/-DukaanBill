import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Banner } from '@/components/Banner';
import { Button } from '@/components/Button';
import { CartLineRow } from '@/components/CartLineRow';
import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { FormInput } from '@/components/FormInput';
import { Input } from '@/components/Input';
import { ProductPicker } from '@/components/ProductPicker';
import { Screen } from '@/components/Screen';
import { SegmentedControl } from '@/components/SegmentedControl';
import { colors } from '@/constants/colors';
import { fontSize, spacing } from '@/constants/spacing';
import { strings } from '@/constants/strings';
import { isWholeUnit } from '@/constants/units';
import { useCart } from '@/hooks/useCart';
import { useSingleFlight } from '@/hooks/useSingleFlight';
import { createBill } from '@/hooks/useBills';
import { calcTotals } from '@/lib/calc';
import { friendlyError } from '@/lib/errors';
import { formatINR, formatQty } from '@/lib/format';
import { newClientRef } from '@/lib/uuid';
import {
  billFormSchema,
  isWholeNumber,
  normalizePhone,
  parseNumber,
  type BillFormValues,
} from '@/lib/validation';
import type { CartLine } from '@/types';

const PAYMENT_OPTIONS = [
  { value: 'cash', label: strings.bill.cash },
  { value: 'upi', label: strings.bill.upi },
  { value: 'udhaar', label: strings.bill.udhaar },
] as const;

const DISCOUNT_OPTIONS = [
  { value: 'amount', label: strings.bill.discountAmount },
  { value: 'percent', label: strings.bill.discountPercent },
] as const;

function lineError(line: CartLine): string | null {
  const { quantity, product } = line;
  if (!Number.isFinite(quantity) || quantity <= 0) return strings.bill.invalidQty;
  if (isWholeUnit(product.unit) && !isWholeNumber(quantity)) return strings.bill.wholeOnly;
  if (quantity > product.stock) {
    return strings.bill.notEnough(formatQty(product.stock), product.unit);
  }
  return null;
}

export default function NewBillScreen() {
  const router = useRouter();
  const cart = useCart();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const run = useSingleFlight(); // a second tap can never start a second save
  const [clientRef] = useState(newClientRef); // same value on retry => the database never makes 2 bills

  const { control, handleSubmit } = useForm<BillFormValues>({
    resolver: zodResolver(billFormSchema),
    defaultValues: {
      customerName: '',
      customerPhone: '',
      paymentType: 'cash',
      discountType: 'amount',
      discountValue: '',
    },
  });

  const discountType = useWatch({ control, name: 'discountType' });
  const discountText = useWatch({ control, name: 'discountValue' });
  const paymentType = useWatch({ control, name: 'paymentType' });

  const totals = useMemo(() => {
    const parsed = parseNumber(discountText);
    const priced = cart.lines.map((l) => ({ price: l.product.price, quantity: l.quantity }));
    return calcTotals(priced, discountType, Number.isNaN(parsed) ? 0 : parsed);
  }, [cart.lines, discountType, discountText]);

  const lineErrors = useMemo(() => cart.lines.map(lineError), [cart.lines]);
  const inBill = useMemo(() => new Set(cart.entries.map((e) => e.product.id)), [cart.entries]);

  const save = (values: BillFormValues) =>
    run(
      async () => {
        if (cart.lines.length === 0) {
          setError(strings.bill.needItems);
          return;
        }
        if (lineErrors.some((e) => e !== null)) {
          setError(strings.bill.fixErrors);
          return;
        }
        if (totals.discountTooBig) {
          setError(
            values.discountType === 'percent'
              ? strings.bill.percentTooBig
              : strings.bill.discountTooBig(formatINR(totals.subtotal)),
          );
          return;
        }

        setSaving(true);
        setError(null);
        try {
          const billId = await createBill({
            lines: cart.lines,
            paymentType: values.paymentType,
            discount: totals.discount,
            customerName: values.customerName,
            customerPhone: normalizePhone(values.customerPhone),
            clientRef,
          });
          // Stay locked: the screen is replaced by the bill, so no second tap can save again.
          router.replace({ pathname: '/bill/[id]', params: { id: billId } });
        } catch (e) {
          setError(`${strings.bill.saveFailed} ${friendlyError(e)}`);
          setSaving(false);
          throw e;
        }
      },
      { lockOnSuccess: true },
    ).catch(() => undefined);

  // Only complain once there are items; an empty bill has nothing to discount yet.
  const discountError =
    totals.discountTooBig && cart.entries.length > 0
      ? discountType === 'percent'
        ? strings.bill.percentTooBig
        : strings.bill.discountTooBig(formatINR(totals.subtotal))
      : undefined;

  return (
    <>
      <Screen
        footer={
          <View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>{strings.bill.total}</Text>
              <Text style={styles.totalValue}>{formatINR(totals.total)}</Text>
            </View>
            <Button
              label={saving ? strings.bill.saving : strings.bill.save}
              icon="checkmark-circle"
              loading={saving}
              onPress={handleSubmit(save, () => setError(null))}
            />
          </View>
        }
      >
        {error ? <Banner message={error} /> : null}

        {cart.entries.length === 0 ? (
          <Card>
            <EmptyState
              icon="cart-outline"
              title={strings.bill.noItemsTitle}
              body={strings.bill.noItemsBody}
            />
          </Card>
        ) : (
          cart.entries.map((entry, index) => (
            <CartLineRow
              key={entry.product.id}
              product={entry.product}
              quantityText={entry.quantityText}
              error={lineErrors[index]}
              onChangeQuantity={(text) => cart.setQuantityText(entry.product.id, text)}
              onRemove={() => cart.remove(entry.product.id)}
            />
          ))
        )}

        <Button
          label={cart.entries.length === 0 ? strings.bill.addItems : strings.bill.addMoreItems}
          icon="add-circle"
          variant={cart.entries.length === 0 ? 'primary' : 'secondary'}
          onPress={() => setPickerOpen(true)}
        />

        <Text style={styles.section}>{strings.bill.discount}</Text>
        <Controller
          control={control}
          name="discountType"
          render={({ field }) => (
            <SegmentedControl
              options={DISCOUNT_OPTIONS}
              value={field.value}
              onChange={field.onChange}
            />
          )}
        />
        <View style={styles.gap} />
        <Controller
          control={control}
          name="discountValue"
          render={({ field, fieldState }) => (
            <Input
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              placeholder={strings.bill.discountPlaceholder}
              keyboardType="decimal-pad"
              prefix={discountType === 'percent' ? '%' : '₹'}
              error={fieldState.error?.message ?? discountError}
            />
          )}
        />

        <Text style={styles.section}>{strings.bill.customer}</Text>
        <FormInput
          control={control}
          name="customerName"
          placeholder={strings.bill.customerName}
          accessibilityLabel={strings.bill.customerName}
          autoCapitalize="words"
          maxLength={100}
        />
        <FormInput
          control={control}
          name="customerPhone"
          placeholder={strings.bill.customerPhone}
          accessibilityLabel={strings.bill.customerPhone}
          prefix="+91"
          keyboardType="number-pad"
          maxLength={14}
        />

        <Text style={styles.section}>{strings.bill.payment}</Text>
        <Controller
          control={control}
          name="paymentType"
          render={({ field }) => (
            <SegmentedControl
              options={PAYMENT_OPTIONS}
              value={field.value}
              onChange={field.onChange}
            />
          )}
        />
        {paymentType === 'udhaar' ? (
          <Text style={styles.udhaarHelp}>{strings.bill.udhaarHelp}</Text>
        ) : null}

        <Card style={styles.summary}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryText}>{strings.bill.subtotal}</Text>
            <Text style={styles.summaryText}>{formatINR(totals.subtotal)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryText}>{strings.bill.discountLine}</Text>
            <Text style={styles.summaryText}>-{formatINR(totals.discount)}</Text>
          </View>
        </Card>
      </Screen>

      {pickerOpen ? (
        <ProductPicker inBill={inBill} onPick={cart.add} onClose={() => setPickerOpen(false)} />
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  section: {
    fontSize: fontSize.large,
    fontWeight: '800',
    color: colors.text,
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
  },
  gap: { height: spacing.md },
  udhaarHelp: {
    fontSize: fontSize.small,
    color: colors.warning,
    fontWeight: '600',
    marginTop: spacing.sm,
  },
  summary: { marginTop: spacing.xl },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 2 },
  summaryText: { fontSize: fontSize.body, color: colors.text },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  totalLabel: { fontSize: fontSize.large, fontWeight: '700', color: colors.text },
  totalValue: { fontSize: fontSize.big, fontWeight: '800', color: colors.primaryDark },
});
