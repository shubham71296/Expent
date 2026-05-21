/**
 * Subscription tab screen.
 * SUBSCRIPTION_LOGIC_DISABLED — full implementation preserved in git history.
 * Re-enable: set SUBSCRIPTION_LOGIC_ENABLED in lib/subscriptionFeature.ts and restore from git.
 */
import { TabScreenTopBar } from '@/components/TabScreenTopBar';
import { AppScreen } from '@/components/ui/Screen';
import { Text, View } from 'react-native';

export default function SubscriptionScreen() {
  return (
    <AppScreen scroll variant="tab">
      <View className="px-4 py-8">
        <TabScreenTopBar
          title="Subscription"
          subtitle="Temporarily unavailable"
          icon="crown-outline"
        />
        <Text className="mt-4 text-center text-sm text-slate-600 dark:text-slate-400">
          Subscription plans and billing are disabled for now. Use the rest of the app as usual.
        </Text>
      </View>
    </AppScreen>
  );
}
