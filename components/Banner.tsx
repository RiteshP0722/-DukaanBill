import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/colors';
import { fontSize, radius, spacing } from '@/constants/spacing';

type Tone = 'error' | 'success' | 'info';

const tones: Record<Tone, { bg: string; fg: string; icon: keyof typeof Ionicons.glyphMap }> = {
  error: { bg: colors.dangerSoft, fg: colors.danger, icon: 'alert-circle' },
  success: { bg: colors.primarySoft, fg: colors.primaryDark, icon: 'checkmark-circle' },
  info: { bg: colors.warningSoft, fg: colors.warning, icon: 'information-circle' },
};

/** A message box for form-level errors or confirmations. */
export function Banner({ message, tone = 'error' }: { message: string; tone?: Tone }) {
  const t = tones[tone];
  return (
    <View
      style={[styles.box, { backgroundColor: t.bg }]}
      accessibilityLiveRegion={tone === 'error' ? 'assertive' : 'polite'}
    >
      <Ionicons name={t.icon} size={24} color={t.fg} />
      <Text style={[styles.text, { color: t.fg }]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.lg,
  },
  text: { flex: 1, fontSize: fontSize.body, fontWeight: '600' },
});
