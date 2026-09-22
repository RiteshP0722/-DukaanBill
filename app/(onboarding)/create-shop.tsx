import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Ionicons } from '@expo/vector-icons';
import { Banner } from '@/components/Banner';
import { Button } from '@/components/Button';
import { FormInput } from '@/components/FormInput';
import { Screen } from '@/components/Screen';
import { colors } from '@/constants/colors';
import { fontSize, spacing } from '@/constants/spacing';
import { strings } from '@/constants/strings';
import { useAuth } from '@/hooks/useAuth';
import { useSingleFlight } from '@/hooks/useSingleFlight';
import { friendlyError } from '@/lib/errors';
import { createShopSchema } from '@/lib/validation';

interface Values {
  shopName: string;
  ownerName: string;
}

export default function CreateShopScreen() {
  const { createShop, signOut } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const run = useSingleFlight(); // no double tap = no two shops

  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(createShopSchema),
    defaultValues: { shopName: '', ownerName: '' },
  });

  const onSubmit = (values: Values) =>
    run(async () => {
      setError(null);
      try {
        // On success the auth gate moves us to Home.
        await createShop(values.shopName.trim(), values.ownerName.trim());
      } catch (e) {
        setError(friendlyError(e));
      }
    });

  return (
    <Screen>
      <View style={styles.header}>
        <Ionicons name="storefront" size={64} color={colors.primary} />
        <Text style={styles.title}>{strings.auth.createShopTitle}</Text>
        <Text style={styles.subtitle}>{strings.auth.createShopSubtitle}</Text>
      </View>

      {error ? <Banner message={error} /> : null}

      <FormInput
        control={control}
        name="shopName"
        label={strings.auth.shopNameLabel}
        placeholder={strings.auth.shopNamePlaceholder}
        autoCapitalize="words"
        maxLength={100}
      />
      <FormInput
        control={control}
        name="ownerName"
        label={strings.auth.ownerNameLabel}
        placeholder={strings.auth.ownerNamePlaceholder}
        autoCapitalize="words"
        maxLength={100}
      />

      <Button
        label={isSubmitting ? strings.auth.creatingShop : strings.auth.createShop}
        icon="checkmark-circle"
        loading={isSubmitting}
        onPress={handleSubmit(onSubmit)}
      />
      <View style={styles.logout}>
        <Button label={strings.auth.logout} variant="outline" onPress={() => void signOut()} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: 'center', marginTop: spacing.xl, marginBottom: spacing.xl },
  title: { fontSize: fontSize.title, fontWeight: '800', color: colors.text, marginTop: spacing.md },
  subtitle: {
    fontSize: fontSize.body,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  logout: { marginTop: spacing.xl },
});
