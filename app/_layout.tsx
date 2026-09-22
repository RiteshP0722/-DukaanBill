import { StyleSheet, View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { ErrorView, LoadingView } from '@/components/ScreenState';
import { colors } from '@/constants/colors';
import { spacing } from '@/constants/spacing';
import { strings } from '@/constants/strings';
import { AuthProvider, useAuth } from '@/hooks/useAuth';
import { isSupabaseConfigured } from '@/lib/supabase';

function RootNavigator() {
  const { initializing, session, profile, profileReady, profileError, refreshProfile, signOut } =
    useAuth();

  if (!isSupabaseConfigured) {
    return (
      <EmptyState
        icon="construct-outline"
        title={strings.common.notSetUpTitle}
        body={strings.common.notSetUpBody}
      />
    );
  }

  if (initializing || (session && !profileReady && !profileError)) {
    return <LoadingView message={session ? strings.auth.loggingIn : undefined} />;
  }

  // Could not load the shop (for example no internet): let the person retry or log out.
  if (session && !profile && profileError) {
    return (
      <View style={styles.flex}>
        <ErrorView message={profileError} onRetry={() => void refreshProfile()} />
        <View style={styles.logout}>
          <Button label={strings.auth.logout} variant="outline" onPress={() => void signOut()} />
        </View>
      </View>
    );
  }

  const ready = Boolean(session && profile);
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={!session}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
      <Stack.Protected guard={Boolean(session) && !profile}>
        <Stack.Screen name="(onboarding)" />
      </Stack.Protected>
      <Stack.Protected guard={ready}>
        <Stack.Screen name="(main)" />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={styles.flex}>
      <SafeAreaProvider>
        <AuthProvider>
          <StatusBar style="dark" />
          <RootNavigator />
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  logout: { padding: spacing.lg },
});
