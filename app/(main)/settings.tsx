import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Banner } from '@/components/Banner';
import { Button } from '@/components/Button';
import { FormInput } from '@/components/FormInput';
import { OwnerOnly } from '@/components/OwnerOnly';
import { Screen } from '@/components/Screen';
import { colors } from '@/constants/colors';
import { fontSize, spacing } from '@/constants/spacing';
import { strings } from '@/constants/strings';
import { useAuth, useShop } from '@/hooks/useAuth';
import { useSingleFlight } from '@/hooks/useSingleFlight';
import { updateShopDetails } from '@/hooks/useSettings';
import { confirm } from '@/lib/confirm';
import { friendlyError } from '@/lib/errors';
import { normalizePhone, shopSettingsSchema, type ShopSettingsValues } from '@/lib/validation';

function SettingsContent() {
  const router = useRouter();
  const { shop, profile } = useShop();
  const { updateShopLocal, signOut } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const run = useSingleFlight();

  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<ShopSettingsValues>({
    resolver: zodResolver(shopSettingsSchema),
    defaultValues: {
      name: shop.name,
      address: shop.address ?? '',
      phone: shop.phone ?? '',
      gst: shop.gst_number ?? '',
    },
  });

  const onSave = (values: ShopSettingsValues) =>
    run(async () => {
      setError(null);
      setSaved(false);
      try {
        const phone = values.phone.trim() === '' ? null : normalizePhone(values.phone);
        const updated = await updateShopDetails(shop.id, {
          name: values.name.trim(),
          address: values.address.trim() || null,
          phone,
          gst_number: values.gst.trim().toUpperCase() || null,
        });
        updateShopLocal(updated);
        setSaved(true);
      } catch (e) {
        setError(friendlyError(e));
      }
    });

  const onLogout = () =>
    confirm({
      title: strings.settings.logoutTitle,
      message: strings.settings.logoutBody,
      confirmText: strings.settings.logout,
      destructive: true,
      onConfirm: () => void signOut(),
    });

  return (
    <Screen>
      <Text style={styles.account}>
        {strings.settings.account}: {profile.name} (+91 {profile.phone})
      </Text>

      <Button
        label={strings.settings.staff}
        icon="people"
        variant="secondary"
        onPress={() => router.push('/staff')}
      />
      <Text style={styles.staffHint}>{strings.settings.staffSubtitle}</Text>

      <Text style={styles.section}>{strings.settings.shopSection}</Text>
      {error ? <Banner message={error} /> : null}
      {saved ? <Banner message={strings.settings.saved} tone="success" /> : null}

      <FormInput
        control={control}
        name="name"
        label={strings.settings.shopName}
        autoCapitalize="words"
        maxLength={100}
      />
      <FormInput
        control={control}
        name="address"
        label={strings.settings.address}
        placeholder={strings.settings.addressPlaceholder}
        multiline
        maxLength={200}
      />
      <FormInput
        control={control}
        name="phone"
        label={strings.settings.phone}
        keyboardType="number-pad"
        prefix="+91"
        maxLength={14}
      />
      <FormInput
        control={control}
        name="gst"
        label={strings.settings.gst}
        hint={strings.settings.gstHint}
        autoCapitalize="characters"
        maxLength={15}
      />

      <Button
        label={isSubmitting ? strings.common.saving : strings.settings.save}
        icon="checkmark-circle"
        loading={isSubmitting}
        onPress={handleSubmit(onSave)}
      />

      <View style={styles.logout}>
        <Button
          label={strings.settings.logout}
          icon="log-out"
          variant="danger"
          onPress={onLogout}
        />
      </View>
    </Screen>
  );
}

export default function SettingsScreen() {
  return (
    <OwnerOnly>
      <SettingsContent />
    </OwnerOnly>
  );
}

const styles = StyleSheet.create({
  account: { fontSize: fontSize.body, color: colors.textMuted, marginBottom: spacing.lg },
  staffHint: { fontSize: fontSize.small, color: colors.textMuted, marginTop: spacing.xs },
  section: {
    fontSize: fontSize.large,
    fontWeight: '800',
    color: colors.text,
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  logout: { marginTop: spacing.xxl },
});
