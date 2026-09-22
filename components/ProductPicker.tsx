import { useState } from 'react';
import { FlatList, Modal, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { Input } from '@/components/Input';
import { ProductRow } from '@/components/ProductRow';
import { ErrorView, LoadingView } from '@/components/ScreenState';
import { colors } from '@/constants/colors';
import { fontSize, spacing } from '@/constants/spacing';
import { strings } from '@/constants/strings';
import { useDebounced } from '@/hooks/useDebounced';
import { useProducts } from '@/hooks/useProducts';
import type { Product } from '@/types';

interface Props {
  onPick: (product: Product) => void;
  onClose: () => void;
  /** product id -> how many lines/pieces are already in the bill (only used to show a label). */
  inBill: ReadonlySet<string>;
}

/** Full-screen list to search and tap products for the bill. Stays open so many items can be added. */
export function ProductPicker({ onPick, onClose, inBill }: Props) {
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');
  const debounced = useDebounced(search, 300);
  const { data, loading, error, reload } = useProducts(debounced);

  let body;
  if (loading) body = <LoadingView />;
  else if (error && !data) body = <ErrorView message={error} onRetry={() => void reload()} />;
  else {
    body = (
      <FlatList
        data={data ?? []}
        keyExtractor={(p) => p.id}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <ProductRow
            product={item}
            countInBill={inBill.has(item.id) ? 1 : undefined}
            onPress={item.stock > 0 ? () => onPick(item) : undefined}
          />
        )}
        ListEmptyComponent={
          <EmptyState
            icon={debounced.trim() ? 'search' : 'cube-outline'}
            title={debounced.trim() ? strings.products.noMatchTitle : strings.products.emptyTitle}
            body={debounced.trim() ? strings.products.noMatchBody : strings.products.emptyBodyStaff}
          />
        }
      />
    );
  }

  return (
    <Modal animationType="slide" onRequestClose={onClose} visible>
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Text style={styles.title}>{strings.bill.pickerTitle}</Text>
          <Text style={styles.hint}>{strings.bill.pickerHint}</Text>
          <Input
            value={search}
            onChangeText={setSearch}
            placeholder={strings.products.searchPlaceholder}
            accessibilityLabel={strings.common.search}
            returnKeyType="search"
            autoFocus={false}
          />
        </View>
        <View style={styles.flex}>{body}</View>
        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
          <Button label={strings.common.done} icon="checkmark-circle" onPress={onClose} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  header: { padding: spacing.lg, paddingBottom: 0 },
  title: { fontSize: fontSize.title, fontWeight: '800', color: colors.text },
  hint: { fontSize: fontSize.body, color: colors.textMuted, marginBottom: spacing.md },
  list: { padding: spacing.lg, paddingTop: 0, flexGrow: 1 },
  footer: {
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});
