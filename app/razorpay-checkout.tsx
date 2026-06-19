/**
 * Razorpay native checkout route.
 * SUBSCRIPTION_LOGIC_DISABLED — checkout flow commented below.
 */
import { AppScreen } from '@/components/ui/Screen';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { Text, View } from 'react-native';

export default function RazorpayCheckoutScreen() {
  useEffect(() => {
    router.replace('/(tabs)');
  }, []);

  return (
    <AppScreen>
      <View className="flex-1 items-center justify-center px-6">
        <Text className="text-center text-base text-slate-600 dark:text-slate-400">
          Payment checkout is temporarily disabled.
        </Text>
      </View>
    </AppScreen>
  );
}

/* SUBSCRIPTION_LOGIC_DISABLED — restore when enabling subscriptions (see lib/subscriptionFeature.ts)

import {
  openRazorpaySubscriptionCheckout,
  settleUiBeforeRazorpayCheckout,
  verifyRazorpaySubscriptionOnServer,
} from '@/lib/razorpayCheckout';
import { consumeRazorpayCheckoutPending } from '@/lib/razorpayCheckoutPending';
import { syncSubscriptionMetadata } from '@/lib/subscriptionMetadata';
import { supabase } from '@/lib/supabase';
import { toast } from '@/lib/toast';
import { useAppStore } from '@/store/useAppStore';
import { router } from 'expo-router';
import { useCallback, useEffect, useRef } from 'react';
import { ActivityIndicator, BackHandler, Text, View } from 'react-native';

export default function RazorpayCheckoutScreenOriginal() {
  const started = useRef(false);
  const completeSubscriptionPlan = useAppStore((s) => s.completeSubscriptionPlan);

  const finishAndGoBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/subscription-plans');
    }
  }, []);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      finishAndGoBack();
      return true;
    });
    return () => sub.remove();
  }, [finishAndGoBack]);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    void (async () => {
      const params = consumeRazorpayCheckoutPending();
      if (!params) {
        finishAndGoBack();
        return;
      }

      await settleUiBeforeRazorpayCheckout();

      const checkout = await openRazorpaySubscriptionCheckout({
        subscriptionId: params.subscriptionId,
        razorpayKeyId: params.razorpayKeyId,
        name: params.name,
        email: params.email,
        contact: params.contact,
        description: 'Pennibly subscription',
      });

      if (!checkout.paid) {
        const msg = checkout.errorMessage?.trim();
        if (!checkout.cancelled && msg && msg !== 'undefined') {
          toast.error(msg);
        }
        finishAndGoBack();
        return;
      }

      const subId =
        checkout.razorpaySubscriptionId ?? params.subscriptionId;
      const verify = await verifyRazorpaySubscriptionOnServer(subId);

      if (!verify.verified) {
        if (verify.error) {
          toast.error(verify.error);
        } else {
          toast.error(
            `Payment received but subscription status is "${verify.status}". Check Razorpay Dashboard or try again.`
          );
        }
        finishAndGoBack();
        return;
      }

      const { error: metaErr } = await syncSubscriptionMetadata({
        productId: params.planId,
        trialEndsAt: null,
      });
      if (metaErr) {
        toast.error(metaErr.message ?? 'Payment OK but profile sync failed');
        finishAndGoBack();
        return;
      }
      if (supabase) {
        await supabase.auth.getSession();
      }
      completeSubscriptionPlan(params.planId, null);
      toast.success('Your subscription is active. Thank you!', 'Premium');
      router.replace('/(tabs)');
    })();
  }, [completeSubscriptionPlan, finishAndGoBack]);

  return (
    <View className="flex-1 items-center justify-center bg-slate-100 dark:bg-slate-950">
      <ActivityIndicator size="large" color="#4f46e5" />
      <Text className="mt-4 text-base text-slate-600 dark:text-slate-400">Opening secure checkout…</Text>
      <Text className="mt-2 px-8 text-center text-xs text-slate-500 dark:text-slate-500">
        Use test card 4111 1111 1111 1111 in Test mode. Subscriptions must be enabled on your Razorpay account.
      </Text>
    </View>
  );
}

*/
