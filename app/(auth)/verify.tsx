import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Banner } from '@/components/Banner';
import { Button } from '@/components/Button';
import { FormInput } from '@/components/FormInput';
import { Screen } from '@/components/Screen';
import { colors } from '@/constants/colors';
import { fontSize, spacing } from '@/constants/spacing';
import { strings } from '@/constants/strings';
import { useAuth } from '@/hooks/useAuth';
import { useSingleFlight } from '@/hooks/useSingleFlight';
import { friendlyError, isNetworkError } from '@/lib/errors';
import { otpSchema } from '@/lib/validation';

interface Values {
  code: string;
}

const RESEND_SECONDS = 30;

export default function VerifyScreen() {
  const router = useRouter();
  const { phone = '' } = useLocalSearchParams<{ phone: string }>();
  const { verifyOtp, sendOtp } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);
  const [resending, setResending] = useState(false);
  const run = useSingleFlight();

  const {
    control,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(otpSchema), defaultValues: { code: '' } });

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft]);

  const onSubmit = ({ code }: Values) =>
    run(async () => {
      setError(null);
      setInfo(null);
      try {
        // On success the auth gate in app/_layout.tsx moves us to the next screen.
        await verifyOtp(phone, code);
      } catch (e) {
        setError(isNetworkError(e) ? friendlyError(e) : strings.auth.wrongCode);
      }
    });

  const onResend = async () => {
    if (resending || secondsLeft > 0) return;
    setResending(true);
    setError(null);
    try {
      await sendOtp(phone);
      reset({ code: '' });
      setInfo(strings.auth.codeSent);
      setSecondsLeft(RESEND_SECONDS);
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      setResending(false);
    }
  };

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.title}>{strings.auth.verifyTitle}</Text>
        <Text style={styles.subtitle}>{strings.auth.verifySubtitle(phone)}</Text>
      </View>

      {error ? <Banner message={error} /> : null}
      {info ? <Banner message={info} tone="success" /> : null}

      <FormInput
        control={control}
        name="code"
        label={strings.auth.codeLabel}
        placeholder={strings.auth.codePlaceholder}
        keyboardType="number-pad"
        maxLength={6}
        autoComplete="sms-otp"
        textContentType="oneTimeCode"
        style={styles.codeInput}
      />

      <Button
        label={isSubmitting ? strings.auth.verifying : strings.auth.verify}
        icon="checkmark-circle"
        loading={isSubmitting}
        onPress={handleSubmit(onSubmit)}
      />

      <View style={styles.links}>
        <Button
          label={secondsLeft > 0 ? strings.auth.resendIn(secondsLeft) : strings.auth.resend}
          variant="outline"
          loading={resending}
          disabled={secondsLeft > 0}
          onPress={() => void onResend()}
        />
        <Button
          label={strings.auth.changeNumber}
          variant="secondary"
          onPress={() => router.back()}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { marginTop: spacing.xl, marginBottom: spacing.xl },
  title: { fontSize: fontSize.big, fontWeight: '800', color: colors.text },
  subtitle: { fontSize: fontSize.body, color: colors.textMuted, marginTop: spacing.sm },
  codeInput: { letterSpacing: 8, fontWeight: '700' },
  links: { marginTop: spacing.xl, gap: spacing.md },
});
