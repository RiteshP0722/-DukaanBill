import { useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { ErrorView, LoadingView } from '@/components/ScreenState';
import { colors } from '@/constants/colors';
import { fontSize, radius, spacing } from '@/constants/spacing';
import { strings } from '@/constants/strings';
import { BILLS_PAGE_SIZE, useBills } from '@/hooks/useBills';
import { paymentLabel } from '@/lib/billText';
import { formatDateTime, formatINR } from '@/lib/format';
import type { Bill } from '@/types';

function BillRow({ bill, onPress }: { bill: Bill; onPress: () => void }) {
  const who = bill.customer_name || strings.history.walkIn;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${strings.bill.billNumber(bill.bill_number)}, ${who}, ${formatINR(bill.total)}`}
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <View style={styles.main}>
        <Text style={styles.billNo}>{strings.bill.billNumber(bill.bill_number)}</Text>
        <Text style={styles.who} numberOfLines={1}>
          {who}
        </Text>
        <Text style={styles.date}>{formatDateTime(bill.created_at)}</Text>
      </View>
      <View style={styles.side}>
        <Text style={styles.total}>{formatINR(bill.total)}</Text>
        <Badge
          label={paymentLabel(bill.payment_type)}
          tone={bill.payment_type === 'udhaar' ? 'warning' : 'success'}
        />
      </View>
    </Pressable>
  );
}

export default function HistoryScreen() {
  const router = useRouter();
  const [limit, setLimit] = useState(BILLS_PAGE_SIZE);
  const { data, loading, refreshing, error, reload } = useBills(limit);

  if (loading) return <LoadingView />;
  if (error && !data) return <ErrorView message={error} onRetry={() => void reload()} />;

  const bills = data ?? [];
  const mayHaveMore = bills.length >= limit;

  return (
    <FlatList
      style={styles.list}
      data={bills}
      keyExtractor={(b) => b.id}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void reload()} />}
      renderItem={({ item }) => (
        <BillRow
          bill={item}
          onPress={() => router.push({ pathname: '/bill/[id]', params: { id: item.id } })}
        />
      )}
      ListEmptyComponent={
        <EmptyState
          icon="receipt-outline"
          title={strings.history.emptyTitle}
          body={strings.history.emptyBody}
          actionLabel={strings.home.newBill}
          onAction={() => router.push('/bill/new')}
        />
      }
      ListFooterComponent={
        mayHaveMore && bills.length > 0 ? (
          <Button
            label={strings.history.loadMore}
            variant="outline"
            loading={refreshing}
            onPress={() => setLimit((l) => l + BILLS_PAGE_SIZE)}
          />
        ) : null
      }
    />
  );
}

const styles = StyleSheet.create({
  list: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl, flexGrow: 1 },
  row: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    minHeight: 80,
  },
  pressed: { backgroundColor: colors.primarySoft },
  main: { flex: 1, gap: 2, paddingRight: spacing.md },
  billNo: { fontSize: fontSize.large, fontWeight: '800', color: colors.text },
  who: { fontSize: fontSize.body, color: colors.text },
  date: { fontSize: fontSize.small, color: colors.textMuted },
  side: { alignItems: 'flex-end', justifyContent: 'space-between', gap: spacing.xs },
  total: { fontSize: fontSize.large, fontWeight: '800', color: colors.primaryDark },
});
