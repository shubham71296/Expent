import { SplashScreen } from '@/components/SplashScreen';
import { DashboardSkeleton } from '@/components/ui/skeletons/DashboardSkeleton';
import { passwordResetFlow } from '@/lib/passwordResetFlow';
// SUBSCRIPTION_LOGIC_DISABLED — import when re-enabling plan gate in lib/subscriptionFeature.ts
// import { readSubscriptionFromUser } from '@/lib/subscriptionMetadata';
import { isSupabaseConfigured } from '@/lib/supabase';
import { useSupabase } from '@/providers/SupabaseProvider';
import { useAppStore } from '@/store/useAppStore';
import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';

export default function SplashRoute() {
  const [done, setDone] = useState(false);
  const onboardingCompleted = useAppStore((s) => s.onboardingCompleted);
  const { session, loading: authLoading, cloudSyncLoading } = useSupabase();

  useEffect(() => {
    const t = setTimeout(() => setDone(true), 1600);
    return () => clearTimeout(t);
  }, []);

  if (!done) {
    return <SplashScreen />;
  }

  if (isSupabaseConfigured && authLoading) {
    return <SplashScreen message="Checking account…" />;
  }

  if (isSupabaseConfigured && !session) {
    return <Redirect href="/(auth)/login" />;
  }

  if (isSupabaseConfigured && session && passwordResetFlow.isActive()) {
    return <Redirect href="/(auth)/reset-password" />;
  }

  // SUBSCRIPTION_LOGIC_DISABLED — see lib/subscriptionFeature.ts
  // if (isSupabaseConfigured && session?.user) {
  //   const sub = readSubscriptionFromUser(session.user);
  //   if (!sub.onboardingComplete) {
  //     return <Redirect href="/subscription-plans" />;
  //   }
  // }

  if (isSupabaseConfigured && session && cloudSyncLoading) {
    return <DashboardSkeleton />;
  }

  if (!onboardingCompleted) {
    return <Redirect href="/(onboarding)" />;
  }
  return <Redirect href="/(tabs)" />;
}
