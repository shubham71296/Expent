// import { readSubscriptionFromUser } from '@/lib/subscriptionMetadata';
import { passwordResetFlow } from '@/lib/passwordResetFlow';
import { useSupabase } from '@/providers/SupabaseProvider';
import { Redirect, Stack, usePathname } from 'expo-router';
import { useColorScheme } from 'react-native';

export default function AuthLayout() {
  const pathname = usePathname() ?? '';
  const { session, loading } = useSupabase();
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const headerBg = isDark ? '#020617' : '#eef2ff';
  const contentBg = isDark ? '#020617' : '#eef2ff';

  const onPasswordRecoveryRoute =
    pathname.includes('forgot-password') ||
    pathname.includes('verify-otp') ||
    pathname.includes('reset-password');

  // SUBSCRIPTION_LOGIC_DISABLED — see lib/subscriptionFeature.ts
  // if (
  //   !loading &&
  //   session?.user &&
  //   !onPasswordRecoveryRoute &&
  //   !passwordResetFlow.isActive() &&
  //   !readSubscriptionFromUser(session.user).onboardingComplete
  // ) {
  //   return <Redirect href="/subscription-plans" />;
  // }

  return (
    <Stack
      screenOptions={{
        headerBackTitle: 'Back',
        headerShadowVisible: false,
        headerStyle: { backgroundColor: headerBg },
        headerTintColor: isDark ? '#a5b4fc' : '#4f46e5',
        contentStyle: { backgroundColor: contentBg },
        headerTitleStyle: { color: isDark ? '#f8fafc' : '#0f172a' },
      }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="register" options={{ headerShown: false }} />
      <Stack.Screen name="forgot-password" options={{ headerShown: false }} />
      <Stack.Screen name="verify-otp" options={{ headerShown: false }} />
      <Stack.Screen name="reset-password" options={{ headerShown: false }} />
    </Stack>
  );
}
