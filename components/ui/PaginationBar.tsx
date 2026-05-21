import { BUTTON_ACTIVE_OPACITY } from '@/components/ui/buttonPressable';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import * as Haptics from 'expo-haptics';
import { memo, useCallback } from 'react';
import { Platform, Text, TouchableOpacity, useColorScheme, View } from 'react-native';

/** Fixed page size for history list (no user-configurable limit). */
export const HISTORY_PAGE_SIZE = 10;

type Props = {
  page: number;
  pageCount: number;
  total: number;
  onPageChange: (next: number) => void;
};

export const PaginationBar = memo(function PaginationBar({
  page,
  pageCount,
  total,
  onPageChange,
}: Props) {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';

  const safePage = Math.min(page, Math.max(0, pageCount - 1));

  const goPrev = useCallback(() => {
    if (safePage <= 0 || total === 0) return;
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPageChange(safePage - 1);
  }, [safePage, total, onPageChange]);

  const goNext = useCallback(() => {
    if (safePage >= pageCount - 1 || total === 0) return;
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPageChange(safePage + 1);
  }, [safePage, pageCount, total, onPageChange]);

  const prevDisabled = safePage <= 0 || total === 0;
  const nextDisabled = safePage >= pageCount - 1 || total === 0;

  if (pageCount <= 1) return null;

  return (
    <View className="mt-4 flex-row items-center justify-center gap-4">
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel="Previous page"
        disabled={prevDisabled}
        activeOpacity={BUTTON_ACTIVE_OPACITY}
        onPress={goPrev}
        className={`h-11 w-11 items-center justify-center rounded-xl ${
          prevDisabled ? 'bg-slate-200 dark:bg-slate-800' : 'bg-indigo-600 dark:bg-indigo-500'
        }`}>
        <MaterialCommunityIcons
          name="chevron-left"
          size={26}
          color={prevDisabled ? (isDark ? '#475569' : '#94a3b8') : '#ffffff'}
        />
      </TouchableOpacity>

      <Text className="min-w-[72px] text-center text-sm font-semibold text-slate-600 dark:text-slate-300">
        {safePage + 1} / {pageCount}
      </Text>

      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel="Next page"
        disabled={nextDisabled}
        activeOpacity={BUTTON_ACTIVE_OPACITY}
        onPress={goNext}
        className={`h-11 w-11 items-center justify-center rounded-xl ${
          nextDisabled ? 'bg-slate-200 dark:bg-slate-800' : 'bg-indigo-600 dark:bg-indigo-500'
        }`}>
        <MaterialCommunityIcons
          name="chevron-right"
          size={26}
          color={nextDisabled ? (isDark ? '#475569' : '#94a3b8') : '#ffffff'}
        />
      </TouchableOpacity>
    </View>
  );
});
