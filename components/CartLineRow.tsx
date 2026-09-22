import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/colors';
import { fontSize, MIN_TOUCH, radius, spacing } from '@/constants/spacing';
import { strings } from '@/constants/strings';
import { isWholeUnit } from '@/constants/units';
import { lineTotal } from '@/lib/calc';
import { formatINR, formatQty } from '@/lib/format';
import type { Product } from '@/types';

interface Props {
  product: Product;
  quantityText: string;
  /** Message shown in red under the line, or null when the quantity is fine. */
  error: string | null;
  onChangeQuantity: (text: string) => void;
  onRemove: () => void;
}

const stepFor = (unit: string): number => (isWholeUnit(unit) ? 1 : 0.5);

export function CartLineRow({ product, quantityText, error, onChangeQuantity, onRemove }: Props) {
  const quantity = Number(quantityText.trim().replace(',', '.') || 'NaN');
  const step = stepFor(product.unit);

  const change = (delta: number) => {
    const base = Number.isFinite(quantity) ? quantity : 0;
    const next = Math.max(step, Math.round((base + delta) * 1000) / 1000);
    onChangeQuantity(formatQty(next));
  };

  return (
    <View style={[styles.row, error ? styles.rowError : null]}>
      <View style={styles.top}>
        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={2}>
            {product.name}
          </Text>
          <Text style={styles.sub}>
            {formatINR(product.price)} / {product.unit} ·{' '}
            {strings.bill.stockLeft(formatQty(product.stock), product.unit)}
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${strings.bill.remove} ${product.name}`}
          onPress={onRemove}
          hitSlop={8}
          style={styles.remove}
        >
          <Ionicons name="trash-outline" size={26} color={colors.danger} />
        </Pressable>
      </View>

      <View style={styles.bottom}>
        <View style={styles.stepper}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Less"
            onPress={() => change(-step)}
            style={styles.stepButton}
          >
            <Ionicons name="remove" size={28} color={colors.primaryDark} />
          </Pressable>
          <TextInput
            accessibilityLabel={`${product.name} ${product.unit}`}
            value={quantityText}
            onChangeText={onChangeQuantity}
            keyboardType={isWholeUnit(product.unit) ? 'number-pad' : 'decimal-pad'}
            selectTextOnFocus
            style={styles.qtyInput}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="More"
            onPress={() => change(step)}
            style={styles.stepButton}
          >
            <Ionicons name="add" size={28} color={colors.primaryDark} />
          </Pressable>
        </View>
        <Text style={styles.unit}>{product.unit}</Text>
        <Text style={styles.total}>{formatINR(lineTotal(product.price, quantity))}</Text>
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    backgroundColor: colors.surface,
  },
  rowError: { borderColor: colors.danger, borderWidth: 2 },
  top: { flexDirection: 'row', alignItems: 'flex-start' },
  info: { flex: 1 },
  name: { fontSize: fontSize.large, fontWeight: '700', color: colors.text },
  sub: { fontSize: fontSize.small, color: colors.textMuted, marginTop: 2 },
  remove: {
    padding: spacing.xs,
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottom: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.sm },
  stepper: { flexDirection: 'row', alignItems: 'center' },
  stepButton: {
    width: MIN_TOUCH - 4,
    height: MIN_TOUCH - 4,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyInput: {
    width: 76,
    height: MIN_TOUCH - 4,
    marginHorizontal: spacing.xs,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: radius.md,
    textAlign: 'center',
    fontSize: fontSize.large,
    fontWeight: '700',
    color: colors.text,
    paddingVertical: 0,
  },
  unit: { fontSize: fontSize.small, color: colors.textMuted, marginLeft: spacing.sm },
  total: {
    flex: 1,
    textAlign: 'right',
    fontSize: fontSize.large,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  error: {
    color: colors.danger,
    fontSize: fontSize.small,
    fontWeight: '700',
    marginTop: spacing.sm,
  },
});
