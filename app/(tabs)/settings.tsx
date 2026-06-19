import { TabScreenTopBar } from '@/components/TabScreenTopBar';
import { Button } from '@/components/ui/Button';
import { BUTTON_ACTIVE_OPACITY } from '@/components/ui/buttonPressable';
import { Card, CardSectionHeader } from '@/components/ui/Card';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { AppScreen } from '@/components/ui/Screen';
import { CURRENCIES } from '@/constants/currencies';
import { isSupabaseConfigured } from '@/lib/supabase';
import { toast } from '@/lib/toast';
import { useSupabase } from '@/providers/SupabaseProvider';
import { useAppStore } from '@/store/useAppStore';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

export default function SettingsScreen() {
  const settings = useAppStore((s) => s.settings);
  const setPrimaryCurrency = useAppStore((s) => s.setPrimaryCurrency);
  const { session } = useSupabase();
  const [pendingCurrency, setPendingCurrency] = useState<string | null>(null);

  const onPrimaryCurrencyPress = useCallback(
    (code: string) => {
      if (code === settings.primaryCurrency) return;
      setPendingCurrency(code);
    },
    [settings.primaryCurrency]
  );

  const confirmCurrencyChange = useCallback(() => {
    if (!pendingCurrency) return;
    setPrimaryCurrency(pendingCurrency);
    toast.success(
      `Primary currency is now ${pendingCurrency}. All your expenses have been converted.`,
      'Currency updated'
    );
    setPendingCurrency(null);
  }, [pendingCurrency, setPrimaryCurrency]);

  const pendingCurrencyMeta = CURRENCIES.find((c) => c.code === pendingCurrency);
  const currentCurrencyMeta = CURRENCIES.find((c) => c.code === settings.primaryCurrency);

  return (
    <AppScreen scroll variant="tab">
      <View className="px-4">
        <TabScreenTopBar
          title="Settings"
          subtitle="Currency, data tools, and account"
          icon="cog-outline"
        />

        <Card className="mb-4">
          <CardSectionHeader
            title="Primary currency"
            icon="currency-inr"
            iconColor="#059669"
            iconBg="bg-emerald-50 dark:bg-emerald-950/40"
            className="mb-3"
          />
          <Text className="mb-3 text-sm text-slate-500 dark:text-slate-400">
            Default is INR. Pick another currency to convert all existing expenses and use it for new
            entries.
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {CURRENCIES.slice(0, 8).map((c) => (
              <TouchableOpacity
                key={c.code}
                activeOpacity={BUTTON_ACTIVE_OPACITY}
                onPress={() => onPrimaryCurrencyPress(c.code)}
                className={`rounded-full px-3 py-2 ${settings.primaryCurrency === c.code ? 'bg-indigo-600' : 'bg-slate-100 dark:bg-slate-800'}`}>
                <Text
                  className={`text-sm font-semibold ${settings.primaryCurrency === c.code ? 'text-white' : 'text-slate-800 dark:text-slate-100'}`}>
                  {c.code}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        {isSupabaseConfigured ? (
          <Card className="mb-4">
            <CardSectionHeader
              title="Account"
              icon="account-circle-outline"
              iconColor="#4f46e5"
              iconBg="bg-indigo-50 dark:bg-indigo-950/50"
              className="mb-3"
            />
            <TouchableOpacity
              activeOpacity={BUTTON_ACTIVE_OPACITY}
              className="flex-row items-center gap-3 rounded-xl bg-slate-50 py-3 pl-3 pr-3 dark:bg-slate-800"
              onPress={() => router.push('/(tabs)/profile')}>
              <View className="h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 dark:bg-indigo-950/60">
                <MaterialCommunityIcons name="account-edit-outline" size={22} color="#4f46e5" />
              </View>
              <View className="flex-1">
                <Text className="text-base font-medium text-slate-900 dark:text-white">My profile</Text>
                <Text className="text-sm text-slate-500 dark:text-slate-400">
                  {session?.user ? 'Name, email & account details' : 'Sign in to manage your profile'}
                </Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={22} color="#94a3b8" />
            </TouchableOpacity>
          </Card>
        ) : null}

        <Card className="mb-4">
          <CardSectionHeader
            title="Data & tools"
            icon="toolbox-outline"
            iconColor="#0284c7"
            iconBg="bg-sky-50 dark:bg-sky-950/50"
            className="mb-3"
          />
          <TouchableOpacity
            activeOpacity={BUTTON_ACTIVE_OPACITY}
            className="mb-3 flex-row items-center gap-3 rounded-xl bg-slate-50 py-3 pl-3 pr-3 dark:bg-slate-800"
            onPress={() => router.push('/categories')}>
            <MaterialCommunityIcons name="shape-outline" size={22} color="#6366f1" />
            <View className="flex-1">
              <Text className="text-base font-medium text-slate-900 dark:text-white">Categories</Text>
              <Text className="text-sm text-slate-500">Create, edit, colors & icons</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={BUTTON_ACTIVE_OPACITY}
            className="flex-row items-center gap-3 rounded-xl bg-slate-50 py-3 pl-3 pr-3 dark:bg-slate-800"
            onPress={() => router.push('/reports')}>
            <MaterialCommunityIcons name="file-export-outline" size={22} color="#0284c7" />
            <View className="flex-1">
              <Text className="text-base font-medium text-slate-900 dark:text-white">Export reports</Text>
              <Text className="text-sm text-slate-500">PDF, Excel, Word-friendly</Text>
            </View>
          </TouchableOpacity>
        </Card>

        <Card className="mb-4">
          <CardSectionHeader
            title="About"
            icon="information-outline"
            iconColor="#64748b"
            iconBg="bg-slate-100 dark:bg-slate-800"
            className="mb-2"
          />
          <Text className="text-sm text-slate-500 dark:text-slate-400">
            Pennibly v1.0 — expense tracking with optional Supabase backup. When you are signed in,
            categories and expenses sync to your account in the background.
          </Text>
        </Card>

        {isSupabaseConfigured && session ? (
          <View className="mb-4">
            <Button
              title="Sign out"
              variant="secondary"
              onPress={() => router.replace('/signing-out')}
            />
          </View>
        ) : null}
      </View>

      <ConfirmModal
        visible={pendingCurrency !== null}
        tone="success"
        title="Change primary currency?"
        message={
          pendingCurrency
            ? `All expense amounts will be converted to ${pendingCurrency}. New expenses will also use ${pendingCurrency} by default.`
            : ''
        }
        confirmLabel="Change currency"
        cancelLabel="Keep current"
        onClose={() => setPendingCurrency(null)}
        onConfirm={confirmCurrencyChange}>
        {pendingCurrency ? (
          <View className="flex-row items-center justify-center gap-3">
            <View className="min-w-[88px] flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 dark:border-slate-700 dark:bg-slate-800/80">
              <Text className="text-center text-lg font-bold text-slate-800 dark:text-slate-100">
                {settings.primaryCurrency}
              </Text>
              <Text
                className="mt-0.5 text-center text-[11px] text-slate-500 dark:text-slate-400"
                numberOfLines={1}>
                {currentCurrencyMeta?.label ?? 'Current'}
              </Text>
            </View>
            <MaterialCommunityIcons name="arrow-right-bold" size={22} color="#059669" />
            <View className="min-w-[88px] flex-1 rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-3 dark:border-emerald-800 dark:bg-emerald-950/40">
              <Text className="text-center text-lg font-bold text-emerald-800 dark:text-emerald-200">
                {pendingCurrency}
              </Text>
              <Text
                className="mt-0.5 text-center text-[11px] text-emerald-700/80 dark:text-emerald-300/80"
                numberOfLines={1}>
                {pendingCurrencyMeta?.label ?? 'New'}
              </Text>
            </View>
          </View>
        ) : null}
      </ConfirmModal>
    </AppScreen>
  );
}
