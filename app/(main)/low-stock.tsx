import { FlatList, RefreshControl, StyleSheet, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { EmptyState } from '@/components/EmptyState';
import { ProductRow } from '@/components/ProductRow';
import { ErrorView, LoadingView } from '@/components/ScreenState';
import { colors } from '@/constants/colors';
import { fontSize, spacing } from '@/constants/spacing';
import { strings } from '@/constants/strings';
import { useAuth } from '@/hooks/useAuth';
import { useLowStock } from '@/hooks/useProducts';

export default function LowStockScreen() {
  const router = useRouter();
  const { isOwner } = useAuth();
  const { data, loading, refreshing, error, reload } = useLowStock();

  if (loading) return <LoadingView />;
  if (error && !data) return <ErrorView message={error} onRetry={() => void reload()} />;

  const products = data ?? [];
  return (
    <FlatList
      style={styles.list}
      data={products}
      keyExtractor={(p) => p.id}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void reload()} />}
      ListHeaderComponent={
        products.length > 0 ? <Text style={styles.hint}>{strings.lowStock.hint}</Text> : null
      }
      renderItem={({ item }) => (
        <ProductRow
          product={item}
          onPress={
            isOwner
              ? () => router.push({ pathname: '/products/edit', params: { id: item.id } })
              : undefined
          }
        />
      )}
      ListEmptyComponent={
        <EmptyState
          icon="checkmark-circle-outline"
          title={strings.lowStock.emptyTitle}
          body={strings.lowStock.emptyBody}
        />
      }
    />
  );
}

const styles = StyleSheet.create({
  list: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl, flexGrow: 1 },
  hint: { fontSize: fontSize.body, color: colors.textMuted, marginBottom: spacing.md },
});
