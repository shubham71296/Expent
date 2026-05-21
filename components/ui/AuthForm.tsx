import { AppScreen } from '@/components/ui/Screen';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { BUTTON_ACTIVE_OPACITY } from '@/components/ui/buttonPressable';
import { Text, TouchableOpacity, View } from 'react-native';

type AuthFormProps = {
  title: string;
  subtitle: string;
  showBack?: boolean;
  /** Extra content below the title block (e.g. form card). */
  children: ReactNode;
  /** Links or secondary actions below the main form. */
  footer?: ReactNode;
  /** Hide the ExpTrack brand row (rare). */
  hideBrand?: boolean;
};

export function AuthFieldLabel({ children }: { children: ReactNode }) {
  return (
    <Text className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
      {children}
    </Text>
  );
}

export function AuthFormCard({ children }: { children: ReactNode }) {
  return (
    <View className="overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-lg shadow-indigo-950/[0.07] dark:border-slate-600/50 dark:bg-slate-900 dark:shadow-none">
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

/** Centered auth layout for sign-in, sign-up, and password reset. */
export function AuthForm({ title, subtitle, showBack, children, footer, hideBrand }: AuthFormProps) {
  return (
    <AppScreen scroll variant="auth">
      <View className="w-full max-w-md self-center px-5 py-4">
        {showBack ? (
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Go back"
            activeOpacity={BUTTON_ACTIVE_OPACITY}
            onPress={() => router.back()}
            className="mb-5 flex-row items-center gap-1 self-start rounded-full bg-white/90 px-3 py-2 shadow-sm dark:bg-slate-800/90">
            <MaterialCommunityIcons name="chevron-left" size={22} color="#4f46e5" />
            <Text className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">Back</Text>
          </TouchableOpacity>
        ) : null}

        {!hideBrand ? (
          <View className="mb-6 items-center">
            <LinearGradient
              colors={['#4f46e5', '#7c3aed', '#6366f1']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ borderRadius: 18, padding: 2 }}>
              <View className="flex-row items-center gap-3 rounded-2xl bg-white px-4 py-3 dark:bg-slate-950">
                <View className="h-11 w-11 items-center justify-center rounded-xl bg-indigo-600 shadow-md shadow-indigo-600/30">
                  <MaterialCommunityIcons name="wallet-outline" size={24} color="#ffffff" />
                </View>
                <View>
                  <Text className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                    ExpTrack
                  </Text>
                  <Text className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                    Simple expense tracking
                  </Text>
                </View>
              </View>
            </LinearGradient>
          </View>
        ) : null}

        <Text className="mb-2 text-center text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          {title}
        </Text>
        <View className="mb-2 h-1 w-10 self-center rounded-full bg-indigo-500 opacity-90" />
        <Text className="mb-6 max-w-sm self-center px-1 text-center text-sm leading-6 text-slate-600 dark:text-slate-400">
          {subtitle}
        </Text>

        <View className="w-full">{children}</View>

        {footer ? <View className="mt-8">{footer}</View> : null}
      </View>
    </AppScreen>
  );
}
