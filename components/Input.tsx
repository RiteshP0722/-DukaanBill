import { forwardRef } from 'react';
import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import { colors } from '@/constants/colors';
import { fontSize, MIN_TOUCH, radius, spacing } from '@/constants/spacing';

interface Props extends TextInputProps {
  label?: string;
  hint?: string;
  error?: string;
  /** Text shown before the typed value, for example "+91". */
  prefix?: string;
}

export const Input = forwardRef<TextInput, Props>(function Input(
  { label, hint, error, prefix, style, ...rest },
  ref,
) {
  return (
    <View style={styles.wrap}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={[styles.field, error ? styles.fieldError : null]}>
        {prefix ? <Text style={styles.prefix}>{prefix}</Text> : null}
        <TextInput
          ref={ref}
          accessibilityLabel={label}
          placeholderTextColor={colors.disabled}
          style={[styles.input, style]}
          {...rest}
        />
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {!error && hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.lg },
  label: {
    fontSize: fontSize.body,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: MIN_TOUCH,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
  },
  fieldError: { borderColor: colors.danger },
  prefix: { fontSize: fontSize.large, color: colors.textMuted, marginRight: spacing.sm },
  input: {
    flex: 1,
    minHeight: MIN_TOUCH - 4,
    fontSize: fontSize.large,
    color: colors.text,
    paddingVertical: spacing.sm,
  },
  error: {
    color: colors.danger,
    fontSize: fontSize.small,
    marginTop: spacing.xs,
    fontWeight: '600',
  },
  hint: { color: colors.textMuted, fontSize: fontSize.small, marginTop: spacing.xs },
});
