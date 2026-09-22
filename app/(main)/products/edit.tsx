import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Banner } from '@/components/Banner';
import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { FormInput } from '@/components/FormInput';
import { OwnerOnly } from '@/components/OwnerOnly';
import { Screen } from '@/components/Screen';
import { ErrorView, LoadingView } from '@/components/ScreenState';
import { colors } from '@/constants/colors';
import { fontSize, MIN_TOUCH, radius, spacing } from '@/constants/spacing';
import { strings } from '@/constants/strings';
import { UNITS, isWholeUnit } from '@/constants/units';
import { useShop } from '@/hooks/useAuth';
import { useSingleFlight } from '@/hooks/useSingleFlight';
import {
  createProduct,
  deleteProduct,
  updateProduct,
  useProduct,
  type ProductInput,
} from '@/hooks/useProducts';
import { confirm } from '@/lib/confirm';
import { friendlyError } from '@/lib/errors';
import { formatQty } from '@/lib/format';
import { parseNumber, productSchema, type ProductFormValues } from '@/lib/validation';
import type { Product } from '@/types';

function ProductForm({ product }: { product: Product | null }) {
  const router = useRouter();
  const { shop } = useShop();
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const run = useSingleFlight(); // blocks a second tap on Save / Delete

  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: product?.name ?? '',
      price: product ? String(product.price) : '',
      stock: product ? formatQty(product.stock) : '',
      unit: product?.unit ?? 'pcs',
      lowStockLimit: product ? formatQty(product.low_stock_limit) : '5',
    },
  });

  const unit = useWatch({ control, name: 'unit' });

  const onSubmit = (values: ProductFormValues) =>
    run(
      async () => {
        setError(null);
        const input: ProductInput = {
          name: values.name.trim(),
          price: parseNumber(values.price),
          stock: parseNumber(values.stock),
          unit: values.unit,
          low_stock_limit: parseNumber(values.lowStockLimit),
        };
        try {
          if (product) await updateProduct(product.id, input);
          else await createProduct(shop.id, input);
          router.back();
        } catch (e) {
          setError(friendlyError(e));
          throw e; // unlocks the button so the person can try again
        }
      },
      { lockOnSuccess: true },
    ).catch(() => undefined);

  const onDelete = () => {
    if (!product) return;
    confirm({
      title: strings.products.deleteTitle,
      message: strings.products.deleteBody(product.name),
      confirmText: strings.common.delete,
      destructive: true,
      onConfirm: () => {
        void run(
          async () => {
            setDeleting(true);
            try {
              await deleteProduct(product.id);
              router.back();
            } catch (e) {
              setError(friendlyError(e));
              setDeleting(false);
              throw e;
            }
          },
          { lockOnSuccess: true },
        ).catch(() => undefined);
      },
    });
  };

  return (
    <Screen>
      <Stack.Screen
        options={{ title: product ? strings.products.editTitle : strings.products.addTitle }}
      />
      {error ? <Banner message={error} /> : null}

      <FormInput
        control={control}
        name="name"
        label={strings.products.nameLabel}
        placeholder={strings.products.namePlaceholder}
        autoCapitalize="words"
        maxLength={120}
      />
      <FormInput
        control={control}
        name="price"
        label={strings.products.priceLabel}
        keyboardType="decimal-pad"
        placeholder="0"
      />

      <Text style={styles.label}>{strings.products.unitLabel}</Text>
      <Controller
        control={control}
        name="unit"
        render={({ field }) => (
          <View style={styles.units}>
            {UNITS.map((u) => {
              const selected = field.value === u;
              return (
                <Pressable
                  key={u}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  accessibilityLabel={u}
                  onPress={() => field.onChange(u)}
                  style={[styles.chip, selected && styles.chipSelected]}
                >
                  <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{u}</Text>
                </Pressable>
              );
            })}
          </View>
        )}
      />

      <FormInput
        control={control}
        name="stock"
        label={strings.products.stockLabel}
        keyboardType={isWholeUnit(unit) ? 'number-pad' : 'decimal-pad'}
        placeholder="0"
      />
      <FormInput
        control={control}
        name="lowStockLimit"
        label={strings.products.lowLimitLabel}
        hint={strings.products.lowLimitHint}
        keyboardType="decimal-pad"
        placeholder="5"
      />

      <Button
        label={isSubmitting ? strings.common.saving : strings.common.save}
        icon="checkmark-circle"
        loading={isSubmitting}
        disabled={deleting}
        onPress={handleSubmit(onSubmit)}
      />
      {product ? (
        <View style={styles.delete}>
          <Button
            label={strings.products.delete}
            icon="trash"
            variant="danger"
            loading={deleting}
            disabled={isSubmitting}
            onPress={onDelete}
          />
        </View>
      ) : null}
    </Screen>
  );
}

function EditLoader({ id }: { id: string }) {
  const { data, loading, error, reload } = useProduct(id);
  if (loading) return <LoadingView />;
  if (error && data === undefined)
    return <ErrorView message={error} onRetry={() => void reload()} />;
  if (!data) {
    return <EmptyState icon="help-circle-outline" title={strings.products.notFound} />;
  }
  return <ProductForm product={data} />;
}

export default function ProductEditScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  return <OwnerOnly>{id ? <EditLoader id={id} /> : <ProductForm product={null} />}</OwnerOnly>;
}

const styles = StyleSheet.create({
  label: {
    fontSize: fontSize.body,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  units: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.lg },
  chip: {
    minHeight: MIN_TOUCH - 4,
    minWidth: 68,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: fontSize.body, fontWeight: '700', color: colors.text },
  chipTextSelected: { color: colors.onPrimary },
  delete: { marginTop: spacing.xl },
});
