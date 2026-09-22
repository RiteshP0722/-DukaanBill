import { useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { Input } from '@/components/Input';
import { ProductRow } from '@/components/ProductRow';
import { ErrorView, LoadingView } from '@/components/ScreenState';
import { colors } from '@/constants/colors';
import { spacing } from '@/constants/spacing';
import { strings } from '@/constants/strings';
import { useAuth } from '@/hooks/useAuth';
import { useProducts } from '@/hooks/useProducts';
import { useDebounced } from '@/hooks/useDebounced';

export default function ProductListScreen() {
  const router = useRouter();
  const { isOwner } = useAuth();
  const [search, setSearch] = useState('');
  const debounced = useDebounced(search, 300);
  const { data, loading, refreshing, error, reload } = useProducts(debounced);

  let body;
  if (loading) {
    body = <LoadingView />;
  } else if (error && !data) {
    body = <ErrorView message={error} onRetry={() => void reload()} />;
  } else {
    const products = data ?? [];
    body = (
      <FlatList
        data={products}
        keyExtractor={(p) => p.id}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void reload()} />}
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
          debounced.trim() ? (
            <EmptyState
              icon="search"
              title={strings.products.noMatchTitle}
              body={strings.products.noMatchBody}
            />
          ) : (
            <EmptyState
              icon="cube-outline"
              title={strings.products.emptyTitle}
              body={isOwner ? strings.products.emptyBodyOwner : strings.products.emptyBodyStaff}
              actionLabel={isOwner ? strings.products.add : undefined}
              onAction={isOwner ? () => router.push('/products/edit') : undefined}
            />
          )
        }
      />
    );
  }

  return (
    <View style={styles.root}>
      <View style={styles.search}>
        <Input
          value={search}
          onChangeText={setSearch}
          placeholder={strings.products.searchPlaceholder}
          accessibilityLabel={strings.common.search}
          returnKeyType="search"
          style={styles.searchInput}
        />
      </View>
      {body}
      {isOwner ? (
        <View style={styles.footer}>
          <Button
            label={strings.products.add}
            icon="add-circle"
            onPress={() => router.push('/products/edit')}
          />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  search: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
  searchInput: {},
  list: { padding: spacing.lg, paddingTop: 0, paddingBottom: spacing.xxl, flexGrow: 1 },
  footer: {
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});
