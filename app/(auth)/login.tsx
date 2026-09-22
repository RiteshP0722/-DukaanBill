import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
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
import { normalizePhone, phoneSchema } from '@/lib/validation';

interface Values {
  phone: string;
}

export default function LoginScreen() {
  const router = useRouter();
  const { sendOtp } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const run = useSingleFlight(); // stops a double tap from sending two SMS

  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(phoneSchema), defaultValues: { phone: '' } });

  const onSubmit = ({ phone }: Values) =>
    run(async () => {
      setError(null);
      try {
        const clean = normalizePhone(phone);
        await sendOtp(clean);
        router.push({ pathname: '/verify', params: { phone: clean } });
      } catch (e) {
        setError(friendlyError(e));
      }
    });

  return (
    <Screen>
      <View style={styles.header}>
        <Ionicons name="storefront" size={72} color={colors.primary} />
        <Text style={styles.appName}>{strings.appName}</Text>
        <Text style={styles.title}>{strings.auth.loginTitle}</Text>
        <Text style={styles.subtitle}>{strings.auth.loginSubtitle}</Text>
      </View>

      {error ? <Banner message={error} /> : null}

      <FormInput
        control={control}
        name="phone"
        label={strings.auth.mobileLabel}
        placeholder={strings.auth.mobilePlaceholder}
        prefix="+91"
        keyboardType="number-pad"
        maxLength={14}
        autoComplete="tel"
        textContentType="telephoneNumber"
      />

      <Button
        label={isSubmitting ? strings.auth.sendingCode : strings.auth.sendCode}
        icon="chatbubble-ellipses"
        loading={isSubmitting}
        onPress={handleSubmit(onSubmit)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: 'center', marginTop: spacing.xxl, marginBottom: spacing.xl },
  appName: {
    fontSize: fontSize.large,
    fontWeight: '700',
    color: colors.primary,
    marginTop: spacing.sm,
  },
  title: { fontSize: fontSize.big, fontWeight: '800', color: colors.text, marginTop: spacing.lg },
  subtitle: {
    fontSize: fontSize.body,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
});
