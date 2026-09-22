import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/components/Button';
import { colors } from '@/constants/colors';
import { fontSize, spacing } from '@/constants/spacing';
import { strings } from '@/constants/strings';

export function LoadingView({ message = strings.common.loading }: { message?: string }) {
  return (
    <View style={styles.center} accessibilityLiveRegion="polite">
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

interface ErrorProps {
  message: string;
  onRetry?: () => void;
}

/** Shown when loading failed. Always has a "Try again" button. */
export function ErrorView({ message, onRetry }: ErrorProps) {
  return (
    <View style={styles.center} accessibilityLiveRegion="assertive">
      <Ionicons name="cloud-offline-outline" size={56} color={colors.danger} />
      <Text style={styles.title}>{strings.common.errorTitle}</Text>
      <Text style={styles.message}>{message}</Text>
      {onRetry ? (
        <View style={styles.button}>
          <Button label={strings.common.retry} icon="refresh" onPress={onRetry} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  title: { fontSize: fontSize.title, fontWeight: '700', color: colors.text, marginTop: spacing.md },
  message: {
    fontSize: fontSize.body,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.md,
  },
  button: { marginTop: spacing.xl, alignSelf: 'stretch' },
});
