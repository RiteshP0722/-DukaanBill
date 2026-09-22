import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Banner } from '@/components/Banner';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { colors } from '@/constants/colors';
import { fontSize, MIN_TOUCH, radius, spacing } from '@/constants/spacing';
import { strings } from '@/constants/strings';
import { useShop } from '@/hooks/useAuth';
import { useLowStock } from '@/hooks/useProducts';
import { fetchDailyReport } from '@/hooks/useReport';
import { useQuery } from '@/hooks/useQuery';
import { formatINR, toDateKey } from '@/lib/format';

interface TileProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  badge?: number;
  sub?: string;
}

function Tile({ icon, label, onPress, badge, sub }: TileProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={badge ? `${label}, ${badge}` : label}
      onPress={onPress}
      style={({ pressed }) => [styles.tile, pressed && styles.tilePressed]}
    >
      <View>
        <Ionicons name={icon} size={36} color={colors.primary} />
        {badge ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badge > 99 ? '99+' : badge}</Text>
          </View>
        ) : null}
      </View>
      <Text style={styles.tileLabel} numberOfLines={2}>
        {label}
      </Text>
      {sub ? <Text style={styles.tileSub}>{sub}</Text> : null}
    </Pressable>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const { shop, profile, isOwner } = useShop();

  // Today's sales are for the owner only. Staff never even ask for them.
  const sales = useQuery(
    async () => (isOwner ? fetchDailyReport(toDateKey(new Date())) : undefined),
    [isOwner],
  );
  const low = useLowStock();
  const lowCount = low.data?.length ?? 0;

  return (
    <Screen
      footer={
        <Button
          label={strings.home.newBill}
          icon="add-circle"
          onPress={() => router.push('/bill/new')}
        />
      }
    >
      <Text style={styles.shopName}>{shop.name}</Text>
      <Text style={styles.hello}>
        {profile.name} · {strings.settings.role[profile.role]}
      </Text>

      {isOwner ? (
        <Card style={styles.salesCard}>
          <Text style={styles.salesLabel}>{strings.home.todaySales}</Text>
          {sales.error ? (
            <Text style={styles.salesError}>{strings.home.salesLoadError}</Text>
          ) : (
            <Text style={styles.salesTotal}>
              {sales.data ? formatINR(sales.data.total) : '...'}
            </Text>
          )}
          {sales.data ? (
            <Text style={styles.salesBills}>{strings.home.bills(sales.data.bill_count)}</Text>
          ) : null}
          {sales.error ? (
            <Button
              label={strings.common.retry}
              variant="outline"
              onPress={() => void sales.reload()}
            />
          ) : null}
        </Card>
      ) : null}

      {low.error ? <Banner message={low.error} tone="info" /> : null}

      <View style={styles.grid}>
        <Tile icon="cube" label={strings.home.products} onPress={() => router.push('/products')} />
        <Tile
          icon="warning"
          label={strings.home.lowStock}
          badge={lowCount}
          sub={
            low.data
              ? lowCount > 0
                ? strings.home.lowStockCount(lowCount)
                : strings.home.stockOk
              : undefined
          }
          onPress={() => router.push('/low-stock')}
        />
        {isOwner ? (
          <Tile
            icon="bar-chart"
            label={strings.home.report}
            onPress={() => router.push('/report')}
          />
        ) : null}
        <Tile icon="receipt" label={strings.home.history} onPress={() => router.push('/history')} />
        {isOwner ? (
          <Tile
            icon="settings"
            label={strings.home.settings}
            onPress={() => router.push('/settings')}
          />
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  shopName: { fontSize: fontSize.title, fontWeight: '800', color: colors.text },
  hello: { fontSize: fontSize.body, color: colors.textMuted, marginBottom: spacing.lg },
  salesCard: { backgroundColor: colors.primary, borderColor: colors.primary },
  salesLabel: { fontSize: fontSize.body, color: colors.onPrimary, fontWeight: '600' },
  salesTotal: {
    fontSize: 40,
    fontWeight: '800',
    color: colors.onPrimary,
    marginVertical: spacing.xs,
  },
  salesError: { fontSize: fontSize.body, color: colors.onPrimary, marginVertical: spacing.sm },
  salesBills: { fontSize: fontSize.large, color: colors.onPrimary },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginTop: spacing.sm },
  tile: {
    width: '47.5%',
    flexGrow: 1,
    minHeight: MIN_TOUCH * 2,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    justifyContent: 'center',
    gap: spacing.sm,
  },
  tilePressed: { backgroundColor: colors.primarySoft },
  tileLabel: { fontSize: fontSize.large, fontWeight: '700', color: colors.text },
  tileSub: { fontSize: fontSize.small, color: colors.warning, fontWeight: '600' },
  badge: {
    position: 'absolute',
    top: -6,
    left: 26,
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  badgeText: { color: colors.onPrimary, fontSize: 13, fontWeight: '800' },
});
