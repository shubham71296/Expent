import { BlockIcon } from '@/components/ui/Card';
import { AppScreen } from '@/components/ui/Screen';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { BUTTON_ACTIVE_OPACITY } from '@/components/ui/buttonPressable';
import { Image, Text, TouchableOpacity, View } from 'react-native';

const penniblyLogo = require('@/assets/images/icon.png');

const FEATURE_CHIPS = ['Track', 'Sync', 'Secure'] as const;

type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

type AuthFormProps = {
  title: string;
  subtitle: string;
  showBack?: boolean;
  children: ReactNode;
  footer?: ReactNode;
  hideBrand?: boolean;
  icon?: IconName;
  iconColor?: string;
  iconBg?: string;
  step?: number;
  totalSteps?: number;
};

type InfoTone = 'info' | 'warning' | 'success';

const INFO_TONE_STYLES: Record<
  InfoTone,
  { wrap: string; icon: string; text: string }
> = {
  info: {
    wrap: 'border-sky-200/90 bg-sky-50/95 dark:border-sky-900/50 dark:bg-sky-950/40',
    icon: '#0284c7',
    text: 'text-sky-950 dark:text-sky-100',
  },
  warning: {
    wrap: 'border-amber-200/90 bg-amber-50/95 dark:border-amber-900/50 dark:bg-amber-950/40',
    icon: '#d97706',
    text: 'text-amber-950 dark:text-amber-100',
  },
  success: {
    wrap: 'border-emerald-200/90 bg-emerald-50/95 dark:border-emerald-900/50 dark:bg-emerald-950/40',
    icon: '#059669',
    text: 'text-emerald-950 dark:text-emerald-100',
  },
};

export function AuthNotConfigured({ message }: { message?: string }) {
  return (
    <AppScreen scroll variant="auth">
      <View className="w-full max-w-md self-center px-4 py-6">
        <View className="overflow-hidden rounded-3xl border border-amber-200/90 bg-white shadow-sm dark:border-amber-900/50 dark:bg-slate-900">
          <LinearGradient
            colors={['#f59e0b', '#fbbf24', '#fcd34d']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ height: 4, width: '100%' }}
          />
          <View className="items-center p-6">
            <View className="mb-4 h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 dark:bg-amber-950/50">
              <MaterialCommunityIcons name="alert-circle-outline" size={30} color="#d97706" />
            </View>
            <Text className="text-center text-lg font-bold text-slate-900 dark:text-white">
              Supabase not configured
            </Text>
            <Text className="mt-2 text-center text-sm leading-6 text-slate-600 dark:text-slate-400">
              {message ??
                'Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY to your .env file, then restart the app.'}
            </Text>
          </View>
        </View>
      </View>
    </AppScreen>
  );
}

export function AuthInfoBanner({
  children,
  icon = 'information-outline',
  tone = 'info',
}: {
  children: ReactNode;
  icon?: IconName;
  tone?: InfoTone;
}) {
  const styles = INFO_TONE_STYLES[tone];
  return (
    <View className={`mb-4 flex-row gap-3 rounded-2xl border px-3.5 py-3 ${styles.wrap}`}>
      <MaterialCommunityIcons name={icon} size={22} color={styles.icon} style={{ marginTop: 1 }} />
      <Text className={`min-w-0 flex-1 text-xs leading-5 ${styles.text}`}>{children}</Text>
    </View>
  );
}

export function AuthFooterLink({ children }: { children: ReactNode }) {
  return (
    <View className="mt-6 rounded-2xl border border-indigo-100/90 bg-indigo-50/60 px-4 py-3.5 dark:border-indigo-950/60 dark:bg-indigo-950/30">
      <View className="flex-row flex-wrap items-center justify-center gap-1">{children}</View>
    </View>
  );
}

export function AuthFieldLabel({ children }: { children: ReactNode }) {
  return (
    <Text className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
      {children}
    </Text>
  );
}

export function AuthFormCard({ children }: { children: ReactNode }) {
  return (
    <View className="overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <LinearGradient
        colors={['#4f46e5', '#6366f1', '#818cf8']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{ height: 4, width: '100%' }}
      />
      <View className="p-5">{children}</View>
    </View>
  );
}

function AuthStepProgress({ step, total }: { step: number; total: number }) {
  return (
    <View className="mb-4">
      <Text className="text-[11px] font-bold uppercase tracking-wide text-indigo-600 dark:text-indigo-400">
        Step {step} of {total}
      </Text>
      <View className="mt-2.5 flex-row gap-1.5">
        {Array.from({ length: total }, (_, i) => (
          <View
            key={i}
            className={`h-1.5 flex-1 rounded-full ${
              i < step ? 'bg-indigo-500' : 'bg-slate-200 dark:bg-slate-700'
            }`}
          />
        ))}
      </View>
    </View>
  );
}

function AuthBrandHero() {
  return (
    <View className="mb-5 overflow-hidden rounded-3xl border border-violet-200 bg-violet-600 p-5 shadow-sm dark:border-violet-800 dark:bg-violet-700">
      <View className="flex-row items-center gap-4">
        <Image
          source={penniblyLogo}
          className="h-14 w-14 rounded-2xl"
          accessibilityLabel="Pennibly logo"
        />
        <View className="min-w-0 flex-1">
          <Text className="text-xl font-bold text-white">Pennibly</Text>
          <Text className="mt-1 text-sm leading-5 text-violet-100">
            Expense tracking, simplified
          </Text>
        </View>
      </View>
      <View className="mt-4 flex-row flex-wrap gap-2">
        {FEATURE_CHIPS.map((label) => (
          <View key={label} className="rounded-full bg-white/15 px-3 py-1">
            <Text className="text-xs font-semibold text-violet-50">{label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

/** Centered auth layout for sign-in, sign-up, and password reset. */
export function AuthForm({
  title,
  subtitle,
  showBack,
  children,
  footer,
  hideBrand,
  icon = 'shield-account-outline',
  iconColor = '#4f46e5',
  iconBg = 'bg-indigo-50 dark:bg-indigo-950/50',
  step,
  totalSteps,
}: AuthFormProps) {
  return (
    <AppScreen scroll variant="auth">
      <View className="w-full max-w-md self-center px-4 py-4">
        {showBack ? (
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Go back"
            activeOpacity={BUTTON_ACTIVE_OPACITY}
            onPress={() => router.back()}
            className="mb-4 flex-row items-center gap-1.5 self-start rounded-full border border-slate-200/90 bg-white px-3.5 py-2 shadow-sm active:opacity-80 dark:border-slate-700 dark:bg-slate-900">
            <MaterialCommunityIcons name="chevron-left" size={22} color="#4f46e5" />
            <Text className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">Back</Text>
          </TouchableOpacity>
        ) : null}

        {!hideBrand ? <AuthBrandHero /> : null}

        <View className="mb-5 rounded-3xl border border-indigo-100/90 bg-white px-4 py-4 shadow-sm dark:border-indigo-950/50 dark:bg-slate-900">
          {step != null && totalSteps != null ? (
            <AuthStepProgress step={step} total={totalSteps} />
          ) : null}
          <View className="flex-row items-start gap-3">
            <BlockIcon name={icon} color={iconColor} containerClassName={iconBg} />
            <View className="min-w-0 flex-1">
              <Text className="text-xl font-bold leading-7 text-slate-900 dark:text-white">
                {title}
              </Text>
              <Text className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                {subtitle}
              </Text>
            </View>
          </View>
        </View>

        <View className="w-full">{children}</View>

        {footer ? <AuthFooterLink>{footer}</AuthFooterLink> : null}
      </View>
    </AppScreen>
  );
}
