import { BlockIcon } from '@/components/ui/Card';
import { useKeyboardMetrics } from '@/hooks/useKeyboardMetrics';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { type ReactNode, type RefObject } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  View,
  type ScrollView as ScrollViewType,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type ScreenVariant = 'default' | 'tab' | 'auth';

type Props = {
  children: ReactNode;
  scroll?: boolean;
  className?: string;
  /** `tab` adds extra top/bottom padding above the tab bar; `auth` centers content vertically. */
  variant?: ScreenVariant;
  /** When false, omits bottom safe-area padding (use for full-height lists that manage their own inset). */
  insetBottom?: boolean;
  /** Optional ref to the inner ScrollView when `scroll` is true. */
  scrollRef?: RefObject<ScrollViewType | null>;
  /** Extra space above the keyboard (modal headers, etc.). */
  keyboardVerticalOffset?: number;
};

export function AppScreen({
  children,
  scroll,
  className = '',
  variant = 'default',
  insetBottom = true,
  scrollRef,
  keyboardVerticalOffset = 0,
}: Props) {
  const insets = useSafeAreaInsets();
  const { visible: keyboardOpen, height: keyboardHeight } = useKeyboardMetrics();
  const topExtra = variant === 'tab' ? 12 : variant === 'auth' ? 24 : 0;
  const bottomExtra = variant === 'tab' ? 28 : variant === 'auth' ? 32 : 0;
  const padTop = insets.top + 8 + topExtra;
  const padBottomDefault = insetBottom ? insets.bottom + 24 + bottomExtra : 0;
  const padBottomWithKeyboard = keyboardOpen
    ? keyboardHeight + insets.bottom + (variant === 'auth' ? 40 : 56)
    : padBottomDefault;

  const contentContainerStyle =
    variant === 'auth'
      ? {
          flexGrow: 1,
          paddingTop: padTop,
          paddingBottom: padBottomWithKeyboard,
          justifyContent: keyboardOpen ? ('flex-start' as const) : ('center' as const),
        }
      : {
          flexGrow: 1,
          paddingTop: padTop,
          paddingBottom: scroll ? padBottomWithKeyboard : padBottomDefault,
        };

  const surfaceClass =
    variant === 'auth'
      ? 'flex-1 bg-indigo-50/80 dark:bg-slate-950'
      : 'flex-1 bg-slate-100 dark:bg-slate-950';

  if (scroll) {
    return (
      <KeyboardAvoidingView
        className={`${surfaceClass} ${className}`}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={keyboardVerticalOffset}>
        <ScrollView
          ref={scrollRef}
          className="flex-1"
          contentContainerStyle={contentContainerStyle}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={variant === 'auth' ? 'none' : 'interactive'}
          automaticallyAdjustKeyboardInsets
          showsVerticalScrollIndicator={false}>
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }
  return (
    <View
      className={`${surfaceClass} ${className}`}
      style={{ paddingTop: padTop, paddingBottom: padBottomDefault }}>
      {children}
    </View>
  );
}

export function HeroCard({
  title,
  subtitle,
  icon = 'calendar-month-outline',
  children,
}: {
  title: string;
  subtitle?: string;
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
  children?: ReactNode;
}) {
  return (
    <View
      className="mb-4 w-full rounded-3xl border border-violet-200 bg-violet-50/95 px-4 py-4 shadow-sm dark:border-violet-900/80 dark:bg-violet-950/50"
      accessibilityRole="summary">
      <View className="flex-row items-start justify-between gap-3">
        <View className="min-w-0 flex-1">
          {subtitle ? (
            <Text className="text-[11px] font-semibold uppercase tracking-widest text-violet-800/75 dark:text-violet-200/80">
              {subtitle}
            </Text>
          ) : null}
          <Text className="mt-1 text-[32px] font-bold tracking-tight text-violet-950 dark:text-violet-50">
            {title}
          </Text>
        </View>
        <BlockIcon
          name={icon}
          color="#7c3aed"
          containerClassName="bg-violet-100 dark:bg-violet-900/55"
        />
      </View>
      {children ? <View className="mt-4">{children}</View> : null}
    </View>
  );
}
