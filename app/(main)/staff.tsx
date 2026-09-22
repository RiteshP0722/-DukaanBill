import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Badge } from '@/components/Badge';
import { Banner } from '@/components/Banner';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { FormInput } from '@/components/FormInput';
import { OwnerOnly } from '@/components/OwnerOnly';
import { Screen } from '@/components/Screen';
import { ErrorView, LoadingView } from '@/components/ScreenState';
import { colors } from '@/constants/colors';
import { fontSize, spacing } from '@/constants/spacing';
import { strings } from '@/constants/strings';
import { useShop } from '@/hooks/useAuth';
import { useSingleFlight } from '@/hooks/useSingleFlight';
import { addStaffInvite, removeStaffInvite, removeStaffMember, useStaff } from '@/hooks/useStaff';
import { confirm } from '@/lib/confirm';
import { friendlyError } from '@/lib/errors';
import { normalizePhone, staffSchema, type StaffFormValues } from '@/lib/validation';

function StaffContent() {
  const { shop, profile } = useShop();
  const { data, loading, error, reload } = useStaff();
  const [formError, setFormError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const run = useSingleFlight();

  const {
    control,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<StaffFormValues>({
    resolver: zodResolver(staffSchema),
    defaultValues: { name: '', phone: '' },
  });

  const onAdd = (values: StaffFormValues) =>
    run(async () => {
      const phone = normalizePhone(values.phone);
      setFormError(null);
      setNotice(null);

      if (phone === profile.phone) {
        setFormError(strings.staff.ownNumber);
        return;
      }
      const exists =
        data?.members.some((m) => m.phone === phone) ||
        data?.pending.some((p) => p.phone === phone);
      if (exists) {
        setFormError(strings.staff.alreadyAdded);
        return;
      }

      try {
        await addStaffInvite(shop.id, values.name, phone);
        reset({ name: '', phone: '' });
        setNotice(strings.staff.added);
        await reload();
      } catch (e) {
        setFormError(friendlyError(e));
      }
    });

  const onRemove = (label: string, action: () => Promise<void>) =>
    confirm({
      title: strings.staff.removeTitle,
      message: strings.staff.removeBody(label),
      confirmText: strings.staff.remove,
      destructive: true,
      onConfirm: async () => {
        try {
          await action();
          setNotice(null);
          await reload();
        } catch (e) {
          setFormError(friendlyError(e));
        }
      },
    });

  // Removing a staff member also removes any invite left for the same number,
  // otherwise they could join again by logging in.
  const removeMember = async (id: string, phone: string) => {
    await removeStaffMember(id);
    const invite = data?.pending.find((p) => p.phone === phone);
    if (invite) await removeStaffInvite(invite.id);
  };

  let list;
  if (loading) list = <LoadingView />;
  else if (error && !data) list = <ErrorView message={error} onRetry={() => void reload()} />;
  else if (data && data.members.length === 0 && data.pending.length === 0) {
    list = (
      <EmptyState
        icon="people-outline"
        title={strings.staff.emptyTitle}
        body={strings.staff.emptyBody}
      />
    );
  } else if (data) {
    list = (
      <>
        {data.members.map((m) => (
          <Card key={m.id}>
            <Text style={styles.name}>{m.name}</Text>
            <Text style={styles.phone}>+91 {m.phone}</Text>
            <View style={styles.rowBottom}>
              <Badge label={strings.staff.active} tone="success" />
            </View>
            <Button
              label={strings.staff.remove}
              icon="trash"
              variant="danger"
              onPress={() => onRemove(m.name, () => removeMember(m.id, m.phone))}
            />
          </Card>
        ))}
        {data.pending.map((p) => (
          <Card key={p.id}>
            <Text style={styles.name}>{p.name || strings.staff.title}</Text>
            <Text style={styles.phone}>+91 {p.phone}</Text>
            <View style={styles.rowBottom}>
              <Badge label={strings.staff.pending} tone="warning" />
            </View>
            <Button
              label={strings.staff.remove}
              icon="trash"
              variant="danger"
              onPress={() => onRemove(p.name || p.phone, () => removeStaffInvite(p.id))}
            />
          </Card>
        ))}
      </>
    );
  }

  return (
    <Screen>
      <Text style={styles.section}>{strings.staff.addTitle}</Text>
      <Text style={styles.help}>{strings.staff.addHelp}</Text>
      {formError ? <Banner message={formError} /> : null}
      {notice ? <Banner message={notice} tone="success" /> : null}

      <FormInput
        control={control}
        name="name"
        label={strings.staff.nameLabel}
        autoCapitalize="words"
        maxLength={100}
      />
      <FormInput
        control={control}
        name="phone"
        label={strings.staff.phoneLabel}
        prefix="+91"
        keyboardType="number-pad"
        maxLength={14}
      />
      <Button
        label={isSubmitting ? strings.staff.adding : strings.staff.add}
        icon="person-add"
        loading={isSubmitting}
        onPress={handleSubmit(onAdd)}
      />

      <Text style={[styles.section, styles.listTitle]}>{strings.staff.title}</Text>
      <View style={styles.list}>{list}</View>
    </Screen>
  );
}

export default function StaffScreen() {
  return (
    <OwnerOnly>
      <StaffContent />
    </OwnerOnly>
  );
}

const styles = StyleSheet.create({
  section: {
    fontSize: fontSize.large,
    fontWeight: '800',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  help: { fontSize: fontSize.body, color: colors.textMuted, marginBottom: spacing.lg },
  listTitle: { marginTop: spacing.xxl },
  list: { minHeight: 120, marginTop: spacing.sm },
  name: { fontSize: fontSize.large, fontWeight: '700', color: colors.text },
  phone: { fontSize: fontSize.body, color: colors.textMuted, marginTop: 2 },
  rowBottom: { marginVertical: spacing.md },
});
