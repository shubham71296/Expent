/**
 * Subscription plans + trial screen.
 * SUBSCRIPTION_LOGIC_DISABLED — full implementation preserved in git history.
 * Re-enable: set SUBSCRIPTION_LOGIC_ENABLED in lib/subscriptionFeature.ts and restore this file from git.
 */
import { AppScreen } from '@/components/ui/Screen';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { Text, View } from 'react-native';

export default function SubscriptionPlansScreen() {
  useEffect(() => {
    router.replace('/(tabs)');
  }, []);

  return (
    <AppScreen scroll variant="auth">
      <View className="flex-1 items-center justify-center px-6 py-12">
        <Text className="text-center text-base text-slate-600 dark:text-slate-400">
          Subscription setup is temporarily disabled.
        </Text>
      </View>
    </AppScreen>
  );
}
