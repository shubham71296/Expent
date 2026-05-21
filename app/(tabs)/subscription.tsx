import { TabScreenTopBar } from '@/components/TabScreenTopBar';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { AppScreen } from '@/components/ui/Screen';
import {
  planOptionById,
  productDisplayName,
  RAZORPAY_PLAN_OPTIONS,
} from '@/constants/razorpayPlans';
import { readSubscriptionFromUser } from '@/lib/subscriptionMetadata';
import { useSupabase } from '@/providers/SupabaseProvider';
import { useAppStore } from '@/store/useAppStore';
import type { SubscriptionProductId } from '@/types/subscription';
import { formatDisplayDate } from '@/utils/dateFormat';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { router } from 'expo-router';
import { Text, View } from 'react-native';

export default function SubscriptionScreen() {
  const { session } = useSupabase();
  const localProductId = useAppStore((s) => s.subscriptionProductId);
  const localTrialEnd = useAppStore((s) => s.trialEndsAt);

  const meta = session?.user ? readSubscriptionFromUser(session.user) : null;
  const productId = meta?.productId ?? localProductId;
  const trialEndsAt = meta?.trialEndsAt ?? localTrialEnd;

  const current = productId ? planOptionById(productId) : null;
  const isTrial = productId === 'trial_7d';
  const trialActive =
    isTrial &&
    trialEndsAt &&
    new Date(trialEndsAt).getTime() > Date.now();

  return (
    <AppScreen scroll variant="tab">
      <View className="px-4">
        <TabScreenTopBar
          title="Subscription"
          subtitle="Current plan"
          icon="crown-outline"
        />

        <Text className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Current plan
        </Text>
        <Card className="mb-6 border border-indigo-100/80 bg-indigo-50/80 dark:border-indigo-900/50 dark:bg-indigo-950/40">
          <View className="flex-row items-start gap-3">
            <View className="h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 shadow-md shadow-indigo-600/25">
              <MaterialCommunityIcons name="check-decagram" size={26} color="#ffffff" />
            </View>
            <View className="min-w-0 flex-1">
              <Text className="text-base font-bold text-slate-900 dark:text-white">
                {current?.title ?? 'Not selected'}
              </Text>
              <Text className="mt-1 text-sm leading-5 text-slate-600 dark:text-slate-400">
                {current?.subtitle ?? 'Complete subscription setup from the plans screen.'}
              </Text>
              {productId ? (
                <Text className="mt-2 text-xs font-medium text-slate-500 dark:text-slate-500">
                  Product: {productDisplayName(productId as SubscriptionProductId)}
                </Text>
              ) : null}
              {trialEndsAt && isTrial ? (
                <Text className="mt-1 text-xs text-emerald-700 dark:text-emerald-400">
                  {trialActive
                    ? `Trial ends ${formatDisplayDate(trialEndsAt)}`
                    : `Trial ended ${formatDisplayDate(trialEndsAt)}`}
                </Text>
              ) : null}
            </View>
          </View>
        </Card>

        {/* Paid plan list hidden — only free trial is active in RAZORPAY_PLAN_OPTIONS for now */}
        <Text className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Available plan
        </Text>
        <View className="mb-4 gap-3">
          {RAZORPAY_PLAN_OPTIONS.map((p) => {
            const active = productId === p.id;
            return (
              <Card
                key={p.id}
                className={active ? 'border-2 border-indigo-500' : 'border border-slate-200 dark:border-slate-700'}>
                <View className="flex-row items-center justify-between gap-2">
                  <View className="min-w-0 flex-1">
                    <Text className="font-bold text-slate-900 dark:text-white">{p.title}</Text>
                    <Text className="text-sm text-slate-500 dark:text-slate-400">
                      {p.priceLabel} · {p.periodLabel}
                    </Text>
                  </View>
                  {active ? (
                    <View className="rounded-full bg-indigo-100 px-2 py-1 dark:bg-indigo-950/80">
                      <Text className="text-[10px] font-bold text-indigo-700 dark:text-indigo-300">
                        Current
                      </Text>
                    </View>
                  ) : null}
                </View>
              </Card>
            );
          })}
        </View>

        <Button
          title="Start free trial"
          onPress={() =>
            router.push({
              pathname: '/subscription-plans',
              params: { source: 'upgrade' },
            })
          }
          icon="gift-outline"
        />

        {/* Paid upgrade (Razorpay) — commented out until paid plans return
        <Button
          title="View plans & upgrade"
          onPress={() =>
            router.push({
              pathname: '/subscription-plans',
              params: { source: 'upgrade' },
            })
          }
          icon="arrow-up-bold-circle-outline"
        />
        <Text className="mt-6 text-center text-xs leading-5 text-slate-500 dark:text-slate-500">
          Upgrading opens the same screen as after sign-up, with a back button to return here.
        </Text>
        */}
      </View>
    </AppScreen>
  );
}
