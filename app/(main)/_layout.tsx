import { Stack } from 'expo-router';
import { colors } from '@/constants/colors';
import { fontSize } from '@/constants/spacing';
import { strings } from '@/constants/strings';

export default function MainLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.primary },
        headerTintColor: colors.onPrimary,
        headerTitleStyle: { fontSize: fontSize.large, fontWeight: '700' },
        headerBackButtonDisplayMode: 'minimal',
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="index" options={{ title: strings.appName }} />
      <Stack.Screen name="products/index" options={{ title: strings.products.title }} />
      <Stack.Screen name="products/edit" options={{ title: strings.products.addTitle }} />
      <Stack.Screen name="bill/new" options={{ title: strings.bill.newTitle }} />
      <Stack.Screen name="bill/[id]" options={{ title: strings.bill.previewTitle }} />
      <Stack.Screen name="history" options={{ title: strings.history.title }} />
      <Stack.Screen name="report" options={{ title: strings.report.title }} />
      <Stack.Screen name="low-stock" options={{ title: strings.lowStock.title }} />
      <Stack.Screen name="settings" options={{ title: strings.settings.title }} />
      <Stack.Screen name="staff" options={{ title: strings.staff.title }} />
    </Stack>
  );
}
