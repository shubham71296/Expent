import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { AppScreen } from '@/components/ui/Screen';
import { useFormatExpenseAmount, useFormatMoney } from '@/hooks/useFormatMoney';
import { useAppStore } from '@/store/useAppStore';
import { categoryIconName } from '@/utils/categoryIcons';
import { formatDisplayDateTime } from '@/utils/dateFormat';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { router, useLocalSearchParams } from 'expo-router';
import { BUTTON_ACTIVE_OPACITY } from '@/components/ui/buttonPressable';
import { Text, TouchableOpacity, View } from 'react-native';

function DetailRow({
  label,
  value,
  multiline,
}: {
  label: string;
  value: string;
  multiline?: boolean;
}) {
  return (
    <View className="rounded-2xl border border-slate-100 bg-slate-50/90 px-4 py-3.5 dark:border-slate-700/80 dark:bg-slate-800/60">
      <Text className="text-[11px] font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
        {label}
      </Text>
      <Text
        className={`mt-2.5 text-base font-semibold leading-6 text-slate-900 dark:text-slate-50 ${
          multiline ? '' : ''
        }`}
        numberOfLines={multiline ? undefined : 2}>
        {value}
      </Text>
    </View>
  );
}

export default function ViewExpenseScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const expense = useAppStore((s) => s.expenses.find((e) => e.id === id));
  const categories = useAppStore((s) => s.categories);
  const primary = useAppStore((s) => s.settings.primaryCurrency);
  const formatExpenseAmount = useFormatExpenseAmount();
  const formatMoney = useFormatMoney();

  if (!expense) {
    return (
      <AppScreen scroll>
        <View className="flex-1 items-center justify-center px-4 py-16">
          <Text className="text-center text-base text-slate-600 dark:text-slate-300">
            Expense not found.
          </Text>
          <View className="mt-6 w-full max-w-xs">
            <Button title="Close" onPress={() => router.back()} />
          </View>
        </View>
      </AppScreen>
    );
  }

  const category = categories.find((c) => c.id === expense.categoryId);
  const categoryColor = category?.color ?? '#64748b';
  const categoryName = category?.name ?? 'Uncategorized';
  const subCategory = expense.subCategory?.trim();
  const note = expense.note?.trim();
  const showConverted = expense.currency !== primary;

  return (
    <AppScreen scroll>
      <View className="gap-4 px-4 pb-6">
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

        <View className="overflow-hidden rounded-3xl border border-sky-200 bg-sky-600 p-5 shadow-sm dark:border-sky-800 dark:bg-sky-700">
          <View className="flex-row items-center gap-4">
            <View className="h-14 w-14 items-center justify-center rounded-2xl bg-white/20">
              <MaterialCommunityIcons name="eye-outline" size={30} color="#ffffff" />
            </View>
            <View className="min-w-0 flex-1">
              <Text className="text-xl font-bold text-white">Expense details</Text>
              <Text className="mt-1 text-sm leading-5 text-sky-100">
                Full breakdown of this entry
              </Text>
            </View>
          </View>
          <View className="mt-4 rounded-2xl bg-white/15 px-4 py-3.5">
            <Text className="text-[11px] font-bold uppercase tracking-widest text-sky-200">Amount</Text>
            <Text className="mt-2 text-3xl font-bold text-white">{formatExpenseAmount(expense)}</Text>
            {showConverted ? (
              <Text className="mt-2 text-sm text-sky-100">
                ≈ {formatMoney(expense.amount)} in {primary}
              </Text>
            ) : null}
          </View>
        </View>

        <Card className="border border-slate-200/80 p-5 dark:border-slate-800">
          <View className="mb-5 flex-row items-center gap-3">
            <View
              className="h-12 w-12 items-center justify-center rounded-2xl"
              style={{ backgroundColor: `${categoryColor}22` }}>
              <MaterialCommunityIcons
                name={categoryIconName(category?.icon ?? 'dots-horizontal')}
                size={26}
                color={categoryColor}
              />
            </View>
            <View className="min-w-0 flex-1 flex-row flex-wrap items-center gap-2">
              <View
                className="rounded-full px-3 py-1.5"
                style={{ backgroundColor: `${categoryColor}22` }}>
                <Text className="text-sm font-semibold" style={{ color: categoryColor }}>
                  {categoryName}
                </Text>
              </View>
              {subCategory ? (
                <View className="rounded-full border border-indigo-200/80 bg-indigo-50 px-3 py-1.5 dark:border-indigo-800 dark:bg-indigo-950/50">
                  <Text className="text-sm font-semibold text-indigo-700 dark:text-indigo-300">
                    {subCategory}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>

          <Text className="mb-3 text-[11px] font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500">
            Details
          </Text>

          <View className="gap-3">
            <DetailRow label="Category" value={categoryName} />
            <DetailRow label="Sub category" value={subCategory || '—'} />
            <DetailRow label="Currency" value={expense.currency} />
            <DetailRow label="Date & time" value={formatDisplayDateTime(expense.createdAt)} />
            <DetailRow label="Note" value={note || '—'} multiline />
          </View>
        </Card>

        <Button title="Edit expense" onPress={() => router.push(`/edit-expense/${expense.id}`)} />
      </View>
    </AppScreen>
  );
}
