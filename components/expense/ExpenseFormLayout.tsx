import { Card } from '@/components/ui/Card';
import { AppScreen } from '@/components/ui/Screen';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { router } from 'expo-router';
import { createContext, useContext, useRef, type ReactNode } from 'react';
import { BUTTON_ACTIVE_OPACITY } from '@/components/ui/buttonPressable';
import { Platform, ScrollView, Text, TouchableOpacity, View } from 'react-native';

const ExpenseFormScrollContext = createContext<(() => void) | null>(null);

export function useExpenseFormScrollIntoView() {
  return useContext(ExpenseFormScrollContext);
}

type FormMode = 'add' | 'edit';

const MODE_CONFIG: Record<
  FormMode,
  {
    title: string;
    icon: keyof typeof MaterialCommunityIcons.glyphMap;
    bannerClass: string;
    subtitleClass: string;
  }
> = {
  add: {
    title: 'New expense',
    icon: 'cash-plus',
    bannerClass: 'border-indigo-200 bg-indigo-600 dark:border-indigo-800 dark:bg-indigo-700',
    subtitleClass: 'text-indigo-100',
  },
  edit: {
    title: 'Edit expense',
    icon: 'square-edit-outline',
    bannerClass: 'border-violet-200 bg-violet-600 dark:border-violet-800 dark:bg-violet-700',
    subtitleClass: 'text-violet-100',
  },
};

type Props = {
  mode: FormMode;
  subtitle?: string;
  children: ReactNode;
  footer: ReactNode;
};

export function ExpenseFormLayout({ mode, subtitle, children, footer }: Props) {
  const config = MODE_CONFIG[mode];
  const scrollRef = useRef<ScrollView>(null);

  const scrollNoteIntoView = () => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    });
  };

  return (
    <AppScreen scroll scrollRef={scrollRef} keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}>
      <View className="gap-4 px-4 pb-4">
        <View className="flex-row items-center">
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Go back"
            activeOpacity={BUTTON_ACTIVE_OPACITY}
            onPress={() => router.back()}
            className="h-10 w-10 items-center justify-center rounded-full border border-slate-200/90 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <MaterialCommunityIcons name="arrow-left" size={22} color="#64748b" />
          </TouchableOpacity>
        </View>

        <View className={`overflow-hidden rounded-3xl border p-5 shadow-sm ${config.bannerClass}`}>
          <View className="flex-row items-center gap-4">
            <View className="h-14 w-14 items-center justify-center rounded-2xl bg-white/20">
              <MaterialCommunityIcons name={config.icon} size={30} color="#ffffff" />
            </View>
            <View className="min-w-0 flex-1">
              <Text className="text-xl font-bold text-white">{config.title}</Text>
              {subtitle ? (
                <Text className={`mt-1 text-sm leading-5 ${config.subtitleClass}`}>{subtitle}</Text>
              ) : null}
            </View>
          </View>
        </View>

        <ExpenseFormScrollContext.Provider value={scrollNoteIntoView}>
          <Card className="border border-slate-200/80 p-5 dark:border-slate-800">{children}</Card>
        </ExpenseFormScrollContext.Provider>

        <View className="gap-3 pt-1">{footer}</View>
      </View>
    </AppScreen>
  );
}
