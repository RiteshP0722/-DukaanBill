import { useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { OwnerOnly } from '@/components/OwnerOnly';
import { Screen } from '@/components/Screen';
import { ErrorView, LoadingView } from '@/components/ScreenState';
import { colors } from '@/constants/colors';
import { fontSize, spacing } from '@/constants/spacing';
import { strings } from '@/constants/strings';
import { useDailyReport } from '@/hooks/useReport';
import { addDays, formatDate, formatINR, formatQty, isSameDay } from '@/lib/format';
import type { DailyReport } from '@/types';

function SplitRow({
  icon,
  label,
  amount,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  amount: number;
}) {
  return (
    <View style={styles.splitRow}>
      <Ionicons name={icon} size={28} color={colors.primary} />
      <Text style={styles.splitLabel}>{label}</Text>
      <Text style={styles.splitAmount}>{formatINR(amount)}</Text>
    </View>
  );
}

function ReportBody({ report }: { report: DailyReport }) {
  if (report.bill_count === 0) {
    return (
      <EmptyState
        icon="bar-chart-outline"
        title={strings.report.noSales}
        body={strings.report.noSalesBody}
      />
    );
  }
  return (
    <>
      <Card style={styles.totalCard}>
        <Text style={styles.totalLabel}>{strings.report.total}</Text>
        <Text style={styles.totalValue}>{formatINR(report.total)}</Text>
        <Text style={styles.totalBills}>
          {strings.report.bills}: {report.bill_count}
        </Text>
      </Card>

      <Text style={styles.section}>{strings.report.split}</Text>
      <Card>
        <SplitRow icon="cash" label={strings.report.cash} amount={report.cash} />
        <SplitRow icon="phone-portrait" label={strings.report.upi} amount={report.upi} />
        <SplitRow icon="book" label={strings.report.udhaar} amount={report.udhaar} />
      </Card>

      <Text style={styles.section}>{strings.report.top}</Text>
      <Text style={styles.hint}>{strings.report.topHint}</Text>
      <Card>
        {report.top_products.map((p, index) => (
          <View key={`${p.name}-${index}`} style={styles.topRow}>
            <Text style={styles.rank}>{index + 1}</Text>
            <View style={styles.topInfo}>
              <Text style={styles.topName} numberOfLines={2}>
                {p.name}
              </Text>
              <Text style={styles.topQty}>
                {strings.report.soldQty(formatQty(p.quantity), p.unit)}
              </Text>
            </View>
            <Text style={styles.splitAmount}>{formatINR(p.amount)}</Text>
          </View>
        ))}
      </Card>
    </>
  );
}

function ReportScreenContent() {
  const [date, setDate] = useState(() => new Date());
  const [showPicker, setShowPicker] = useState(false);
  const today = new Date();
  const isToday = isSameDay(date, today);
  const { data, loading, refreshing, error, reload } = useDailyReport(date);

  const onPick = (event: DateTimePickerEvent, picked?: Date) => {
    // Android shows a popup: close it. iOS shows it inline: keep it open until "Done".
    if (Platform.OS === 'android') setShowPicker(false);
    if (event.type === 'set' && picked) setDate(picked);
  };

  let body;
  if (loading || (refreshing && !error)) body = <LoadingView />;
  else if (error) body = <ErrorView message={error} onRetry={() => void reload()} />;
  else if (data) body = <ReportBody report={data} />;

  return (
    <Screen>
      <View style={styles.dateRow}>
        <Button
          label="<"
          variant="outline"
          onPress={() => setDate((d) => addDays(d, -1))}
          style={styles.arrow}
        />
        <View style={styles.dateCenter}>
          <Text style={styles.dateText}>{formatDate(date)}</Text>
          {isToday ? <Text style={styles.todayText}>{strings.report.today}</Text> : null}
        </View>
        <Button
          label=">"
          variant="outline"
          disabled={isToday}
          onPress={() => setDate((d) => addDays(d, 1))}
          style={styles.arrow}
        />
      </View>

      <Button
        label={strings.report.changeDate}
        icon="calendar"
        variant="secondary"
        onPress={() => setShowPicker(true)}
      />
      {showPicker ? (
        <View style={styles.picker}>
          <DateTimePicker
            value={date}
            mode="date"
            display={Platform.OS === 'ios' ? 'inline' : 'default'}
            maximumDate={today}
            onChange={onPick}
          />
          {Platform.OS === 'ios' ? (
            <Button label={strings.common.done} onPress={() => setShowPicker(false)} />
          ) : null}
        </View>
      ) : null}

      <View style={styles.body}>{body}</View>
    </Screen>
  );
}

export default function ReportScreen() {
  return (
    <OwnerOnly>
      <ReportScreenContent />
    </OwnerOnly>
  );
}

const styles = StyleSheet.create({
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  arrow: { minWidth: 60 },
  dateCenter: { flex: 1, alignItems: 'center' },
  dateText: { fontSize: fontSize.title, fontWeight: '800', color: colors.text },
  todayText: { fontSize: fontSize.body, color: colors.primary, fontWeight: '700' },
  picker: { marginTop: spacing.md, gap: spacing.md },
  body: { marginTop: spacing.lg, minHeight: 240 },
  totalCard: { backgroundColor: colors.primary, borderColor: colors.primary },
  totalLabel: { fontSize: fontSize.body, color: colors.onPrimary, fontWeight: '600' },
  totalValue: { fontSize: 40, fontWeight: '800', color: colors.onPrimary },
  totalBills: { fontSize: fontSize.large, color: colors.onPrimary, marginTop: spacing.xs },
  section: {
    fontSize: fontSize.large,
    fontWeight: '800',
    color: colors.text,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  hint: {
    fontSize: fontSize.small,
    color: colors.textMuted,
    marginTop: -spacing.xs,
    marginBottom: spacing.sm,
  },
  splitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  splitLabel: { flex: 1, fontSize: fontSize.body, color: colors.text, fontWeight: '600' },
  splitAmount: { fontSize: fontSize.body, fontWeight: '800', color: colors.text },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  rank: {
    width: 32,
    fontSize: fontSize.large,
    fontWeight: '800',
    color: colors.primary,
    textAlign: 'center',
  },
  topInfo: { flex: 1 },
  topName: { fontSize: fontSize.body, fontWeight: '700', color: colors.text },
  topQty: { fontSize: fontSize.small, color: colors.textMuted },
});
