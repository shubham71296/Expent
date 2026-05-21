import { AuthFieldLabel } from '@/components/ui/AuthForm';
import { BUTTON_ACTIVE_OPACITY } from '@/components/ui/buttonPressable';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { AppScreen } from '@/components/ui/Screen';
import { RAZORPAY_PLAN_OPTIONS } from '@/constants/razorpayPlans';
// Paid Razorpay checkout — commented out while only free trial is offered
// import { fetchRazorpaySubscriptionParams } from '@/lib/razorpayCheckout';
// import {
//   sanitizeRazorpayContact,
//   sanitizeRazorpayCustomerName,
// } from '@/lib/razorpayCustomerName';
// import { setRazorpayCheckoutPending } from '@/lib/razorpayCheckoutPending';
import { syncSubscriptionMetadata } from '@/lib/subscriptionMetadata';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { toast } from '@/lib/toast';
import { useSupabase } from '@/providers/SupabaseProvider';
import { useAppStore } from '@/store/useAppStore';
import type { SubscriptionProductId } from '@/types/subscription';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useLayoutEffect, useState } from 'react';
import {
  ActivityIndicator,
  BackHandler,
  TouchableOpacity,
  Text,
  View,
} from 'react-native';

export default function SubscriptionPlansScreen() {
  const { session } = useSupabase();
  const { source } = useLocalSearchParams<{ source?: string }>();
  const completeSubscriptionPlan = useAppStore((s) => s.completeSubscriptionPlan);

  const [busyId, setBusyId] = useState<SubscriptionProductId | null>(null);

  const showBack = source === 'upgrade';
  const navigation = useNavigation();

  useLayoutEffect(() => {
    navigation.setOptions({
      gestureEnabled: showBack,
    });
  }, [navigation, showBack]);

  useFocusEffect(
    useCallback(() => {
      if (showBack) return;
      const sub = BackHandler.addEventListener('hardwareBackPress', () => true);
      return () => sub.remove();
    }, [showBack])
  );

  const email = session?.user?.email ?? '';
  // Used for Razorpay paid checkout when paid plans are re-enabled
  // const rawDisplayName =
  //   (session?.user?.user_metadata?.full_name as string | undefined)?.trim() ||
  //   (session?.user?.user_metadata?.name as string | undefined)?.trim() ||
  //   '';
  // const displayName = sanitizeRazorpayCustomerName(rawDisplayName, email);
  // const contact = sanitizeRazorpayContact(
  //   (session?.user?.user_metadata?.phone as string | undefined) ??
  //     (session?.user?.user_metadata?.mobile as string | undefined)
  // );

  const goHome = useCallback(() => {
    router.replace('/(tabs)');
  }, []);

  const onChooseTrial = useCallback(async () => {
    if (!session?.user || !isSupabaseConfigured) return;
    const end = new Date();
    end.setDate(end.getDate() + 7);
    const trialEnds = end.toISOString();

    setBusyId('trial_7d');
    try {
      const { error } = await syncSubscriptionMetadata({
        productId: 'trial_7d',
        trialEndsAt: trialEnds,
      });
      if (error) {
        toast.error(error.message ?? 'Could not save subscription');
        return;
      }
      if (supabase) {
        await supabase.auth.getSession();
      }
      completeSubscriptionPlan('trial_7d', trialEnds);
      toast.success('Your 7-day trial is active. Enjoy ExpTrack!', 'Welcome');
      goHome();
    } finally {
      setBusyId(null);
    }
  }, [session?.user, completeSubscriptionPlan, goHome]);

  // Paid plans (Razorpay) — disabled while only free trial is shown
  // const onChoosePaid = useCallback(
  //   async (planId: SubscriptionProductId) => {
  //     if (!session?.user || !email) {
  //       toast.error('Sign in required');
  //       return;
  //     }
  //     if (planId !== 'plan_3m' && planId !== 'plan_6m' && planId !== 'plan_12m') return;
  //
  //     setBusyId(planId);
  //     try {
  //       const { data, error } = await fetchRazorpaySubscriptionParams({
  //         planKey: planId,
  //         email,
  //         name: displayName,
  //         contact,
  //       });
  //       if (error || !data || 'error' in data) {
  //         toast.error(error ?? (data && 'error' in data ? String(data.error) : 'Checkout unavailable'));
  //         return;
  //       }
  //
  //       toast.hide();
  //       setRazorpayCheckoutPending({
  //         planId,
  //         subscriptionId: data.subscriptionId,
  //         razorpayKeyId: data.razorpayKeyId,
  //         customerId: data.customerId,
  //         email,
  //         name: displayName,
  //         contact,
  //       });
  //       setBusyId(null);
  //       router.push('/razorpay-checkout');
  //       return;
  //     } finally {
  //       setBusyId(null);
  //     }
  //   },
  //   [session?.user, email, displayName, contact]
  // );

  if (!isSupabaseConfigured || !session) {
    return (
      <AppScreen scroll variant="auth">
        <View className="mx-4 max-w-md self-center rounded-3xl border border-amber-200/90 bg-white p-6 dark:border-amber-900/50 dark:bg-slate-900">
          <Text className="text-center text-slate-900 dark:text-white">Sign in to continue.</Text>
          <Button title="Go to sign in" className="mt-4" onPress={() => router.replace('/(auth)/login')} />
        </View>
      </AppScreen>
    );
  }

  return (
    <AppScreen scroll variant="auth">
      <View className="w-full max-w-md self-center px-5 py-4">
        {showBack ? (
          <TouchableOpacity
            accessibilityRole="button"
            activeOpacity={BUTTON_ACTIVE_OPACITY}
            onPress={() => router.back()}
            className="mb-4 flex-row items-center gap-1 self-start rounded-full bg-white/90 px-3 py-2 dark:bg-slate-800/90">
            <MaterialCommunityIcons name="chevron-left" size={22} color="#4f46e5" />
            <Text className="text-sm font-semibold text-indigo-600">Back</Text>
          </TouchableOpacity>
        ) : null}

        <View className="mb-6 items-center">
          <View className="mb-3 h-16 w-16 items-center justify-center rounded-2xl bg-indigo-600 shadow-lg shadow-indigo-900/20">
            <MaterialCommunityIcons name="crown-outline" size={36} color="#fff" />
          </View>
          <Text className="text-center text-2xl font-bold text-slate-900 dark:text-white">
            Choose your plan
          </Text>
          <Text className="mt-2 text-center text-sm leading-5 text-slate-600 dark:text-slate-400">
            Start the free trial to continue. Paid plans are coming soon.
          </Text>
        </View>

        <AuthFieldLabel>Your account</AuthFieldLabel>
        <Text className="mb-6 text-sm text-slate-700 dark:text-slate-300">{email}</Text>

        <View className="gap-4" pointerEvents={busyId ? 'none' : 'auto'}>
          {RAZORPAY_PLAN_OPTIONS.map((plan) => {
            const busy = busyId === plan.id;
            return (
              <Card
                key={plan.id}
                className={
                  plan.isTrial
                    ? 'border-2 border-emerald-500/80 bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-950/40'
                    : ''
                }>
                <View className="mb-2 flex-row items-start justify-between gap-2">
                  <Text className="flex-1 text-lg font-bold text-slate-900 dark:text-white">
                    {plan.title}
                  </Text>
                  {plan.isTrial ? (
                    <View className="rounded-full bg-emerald-600 px-2 py-0.5">
                      <Text className="text-[10px] font-bold uppercase text-white">Popular</Text>
                    </View>
                  ) : null}
                </View>
                <Text className="mb-3 text-sm text-slate-600 dark:text-slate-400">{plan.subtitle}</Text>
                <Text className="mb-3 text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                  {plan.priceLabel}{' '}
                  <Text className="text-base font-normal text-slate-500 dark:text-slate-400">
                    {plan.periodLabel}
                  </Text>
                </Text>
                {plan.highlights.map((h) => (
                  <View key={h} className="mb-1.5 flex-row items-center gap-2">
                    <MaterialCommunityIcons name="check" size={16} color="#4f46e5" />
                    <Text className="flex-1 text-sm text-slate-700 dark:text-slate-300">{h}</Text>
                  </View>
                ))}

                {plan.isTrial ? (
                  <Button
                    title="Start 7-day free trial"
                    className="mt-4"
                    onPress={() => void onChooseTrial()}
                    loading={busy}
                    icon="gift-outline"
                  />
                ) : null}
                {/* Paid Razorpay subscribe — re-enable with paid plans in razorpayPlans.ts
                ) : (
                  <Button
                    title="Subscribe with Razorpay"
                    className="mt-4"
                    variant="secondary"
                    onPress={() => void onChoosePaid(plan.id)}
                    loading={busy}
                    icon="credit-card-outline"
                  />
                )}
                */}
              </Card>
            );
          })}
        </View>

        {busyId ? (
          <View className="mt-4 flex-row items-center justify-center gap-2">
            <ActivityIndicator color="#4f46e5" />
            <Text className="text-sm text-slate-500">Processing…</Text>
          </View>
        ) : null}

        {/* <Text className="mt-8 text-center text-xs leading-5 text-slate-500 dark:text-slate-500">
          Configure Razorpay plan ids on the Edge Function and use a dev build for native checkout.
        </Text> */}
      </View>
    </AppScreen>
  );
}
