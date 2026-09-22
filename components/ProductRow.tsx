import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Badge } from '@/components/Badge';
import { colors } from '@/constants/colors';
import { fontSize, radius, spacing } from '@/constants/spacing';
import { strings } from '@/constants/strings';
import { formatINR, formatQty } from '@/lib/format';
import type { Product } from '@/types';

interface Props {
  product: Product;
  onPress?: () => void;
  /** Small number badge, used in the bill picker to show how many are already added. */
  countInBill?: number;
}

export function ProductRow({ product, onPress, countInBill }: Props) {
  const out = product.stock <= 0;
  const low = !out && product.stock <= product.low_stock_limit;
  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={`${product.name}, ${formatINR(product.price)}`}
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && onPress ? styles.pressed : null]}
    >
      <View style={styles.main}>
        <Text style={styles.name} numberOfLines={2}>
          {product.name}
        </Text>
        <Text style={styles.stock}>
          {strings.products.inStock(formatQty(product.stock), product.unit)}
        </Text>
        {out ? <Badge label={strings.products.outBadge} tone="danger" /> : null}
        {low ? <Badge label={strings.products.lowBadge} tone="warning" /> : null}
      </View>
      <View style={styles.side}>
        <Text style={styles.price}>{formatINR(product.price)}</Text>
        {countInBill ? (
          <Text style={styles.count}>{strings.bill.inBill(countInBill)}</Text>
        ) : onPress ? (
          <Ionicons name="chevron-forward" size={22} color={colors.textMuted} />
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    minHeight: 72,
  },
  pressed: { backgroundColor: colors.primarySoft },
  main: { flex: 1, gap: spacing.xs, paddingRight: spacing.md },
  name: { fontSize: fontSize.large, fontWeight: '700', color: colors.text },
  stock: { fontSize: fontSize.small, color: colors.textMuted },
  side: { alignItems: 'flex-end', gap: spacing.xs },
  price: { fontSize: fontSize.large, fontWeight: '700', color: colors.primaryDark },
  count: { fontSize: fontSize.small, fontWeight: '700', color: colors.primary },
});
