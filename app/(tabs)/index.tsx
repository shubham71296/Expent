import { TabScreenTopBar } from '@/components/TabScreenTopBar';
import { Card, CardSectionHeader } from '@/components/ui/Card';
import { ExpenseQuickActionsRow } from '@/components/ui/ExpenseQuickActions';
import { AppScreen, HeroCard } from '@/components/ui/Screen';
import { formatMoneyAmount, useFormatExpenseAmount } from '@/hooks/useFormatMoney';
import { useAppStore } from '@/store/useAppStore';
import type { Expense } from '@/types/models';
import { categoryIconName } from '@/utils/categoryIcons';
import { ExpenseActionModal } from '@/components/expense/ExpenseActionModal';
import { ExpenseListRowContent } from '@/components/expense/ExpenseListRowContent';
import { BUTTON_ACTIVE_OPACITY } from '@/components/ui/buttonPressable';
import { sumExpensesForDisplay, sumExpensesInPrimary } from '@/utils/expenseTotals';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { router } from 'expo-router';
import { memo, useCallback, useMemo, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

const RecentRow = memo(function RecentRow({
  expense,
  categoryName,
  categoryColor,
  icon,
  amount,
  onPress,
}: {
  expense: Expense;
  categoryName: string;
  categoryColor: string;
  amount: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={`Edit expense ${categoryName}`}
      activeOpacity={BUTTON_ACTIVE_OPACITY}
      onPress={onPress}
      className="mb-3 flex-row items-start justify-between gap-2 rounded-2xl bg-slate-50 p-3 dark:bg-slate-800/80">
      <View className="min-w-0 flex-1 flex-row items-start gap-3">
        <View
          className="mt-0.5 h-10 w-10 shrink-0 items-center justify-center rounded-full"
          style={{ backgroundColor: `${categoryColor}22` }}>
          <MaterialCommunityIcons name={icon} size={20} color={categoryColor} />
        </View>
        <ExpenseListRowContent
          expense={expense}
          categoryName={categoryName}
          categoryColor={categoryColor}
        />
      </View>
      <Text className="shrink-0 text-base font-bold text-slate-900 dark:text-white">{amount}</Text>
    </TouchableOpacity>
  );
});

function SectionIntro({
  title,
  description,
  className = 'mb-3',
}: {
  title: string;
  description: string;
  className?: string;
}) {
  return (
    <View className={className}>
      <Text className="text-[11px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {title}
      </Text>
      <Text className="mt-1 text-sm leading-5 text-slate-600 dark:text-slate-300">{description}</Text>
    </View>
  );
}

function DashboardIntro({
  expenseCount,
  categoryCount,
  primaryCurrency,
}: {
  expenseCount: number;
  categoryCount: number;
  primaryCurrency: string;
}) {
  const expensePhrase = `${expenseCount} ${expenseCount === 1 ? 'expense' : 'expenses'}`;
  const categoryPhrase = `${categoryCount} ${categoryCount === 1 ? 'category' : 'categories'}`;

  return (
    <View className="mb-4 rounded-3xl border border-indigo-100/90 bg-white px-4 py-4 shadow-sm dark:border-indigo-950/50 dark:bg-slate-900">
      <Text className="text-lg font-bold text-slate-900 dark:text-white">Your spending overview</Text>
      {expenseCount === 0 ? (
        <Text className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
          Welcome to Pennibly. Add your first expense to see monthly totals, category breakdowns, and
          recent activity on this screen.
        </Text>
      ) : (
        <Text className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
          You are tracking{' '}
          <Text className="font-bold text-indigo-600 dark:text-indigo-400">{expensePhrase}</Text>
          {' '}across{' '}
          <Text className="font-bold text-violet-600 dark:text-violet-400">{categoryPhrase}</Text>
          . Amounts below are shown in{' '}
          <Text className="font-bold text-emerald-600 dark:text-emerald-400">{primaryCurrency}</Text>
          {' '}for easy comparison.
        </Text>
      )}
    </View>
  );
}

export default function DashboardScreen() {
  const expenses = useAppStore((s) => s.expenses);
  const categories = useAppStore((s) => s.categories);
  const primaryCurrency = useAppStore((s) => s.settings.primaryCurrency);
  const formatExpenseAmount = useFormatExpenseAmount();

  const [selectedExpenseId, setSelectedExpenseId] = useState<string | null>(null);

  const openExpenseActions = useCallback((id: string) => {
    setSelectedExpenseId(id);
  }, []);

  const stats = useMemo(() => {
    const now = new Date();
    const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const yearStart = new Date(now.getFullYear(), 0, 1);

    const inRange = (start: Date) =>
      expenses.filter((e) => new Date(e.createdAt) >= start);

    return {
      total: sumExpensesForDisplay(expenses, primaryCurrency),
      day: sumExpensesForDisplay(inRange(dayStart), primaryCurrency),
      month: sumExpensesForDisplay(inRange(monthStart), primaryCurrency),
      year: sumExpensesForDisplay(inRange(yearStart), primaryCurrency),
    };
  }, [expenses, primaryCurrency]);

  const categoryRows = useMemo(() => {
    return [...categories]
      .map((c) => {
        const catExpenses = expenses.filter((e) => e.categoryId === c.id);
        const total = sumExpensesInPrimary(catExpenses);
        return { c, total };
      })
      .sort((a, b) => b.total - a.total);
  }, [expenses, categories]);

  const recent = useMemo(() => {
    return [...expenses]
      .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
      .slice(0, 5);
  }, [expenses]);

  return (
    <AppScreen scroll variant="tab">
      <View className="px-4">
        <TabScreenTopBar
          title="Dashboard"
          subtitle="Your spending at a glance"
          icon="view-dashboard-outline"
          showDateTime
        />

        <DashboardIntro
          expenseCount={expenses.length}
          categoryCount={categories.length}
          primaryCurrency={primaryCurrency}
        />

        <HeroCard
          title={formatMoneyAmount(stats.month.total, stats.month.currency)}
          subtitle="This month"
        />

        <View className="mb-4 flex-row flex-wrap gap-3">
          <StatPill
            label="Today"
            value={formatMoneyAmount(stats.day.total, stats.day.currency)}
            icon="white-balance-sunny"
            iconColor="#f59e0b"
            iconBg="bg-amber-50 dark:bg-amber-950/40"
          />
          <StatPill
            label="Year"
            value={formatMoneyAmount(stats.year.total, stats.year.currency)}
            icon="calendar-range"
            iconColor="#4f46e5"
            iconBg="bg-indigo-50 dark:bg-indigo-950/50"
          />
          <StatPill
            label="All time"
            value={formatMoneyAmount(stats.total.total, stats.total.currency)}
            icon="sigma"
            iconColor="#7c3aed"
            iconBg="bg-violet-50 dark:bg-violet-950/50"
          />
        </View>

        <SectionIntro
          title="Quick actions"
          description="Record new spending or open your full expense history with search and filters."
        />
        <ExpenseQuickActionsRow className="mb-4" />

        <SectionIntro
          title="Reports & analytics"
          description="Review charts for trends, or export a polished PDF, Excel, or Word report anytime."
          className="mb-3"
        />
        <View className="mb-3 flex-row gap-2.5">
          <TouchableOpacity
            activeOpacity={BUTTON_ACTIVE_OPACITY}
            className="min-h-[48px] flex-1 flex-row items-center gap-2.5 rounded-2xl border border-indigo-200/90 bg-indigo-50/95 px-3 py-2.5 shadow-sm dark:border-indigo-900 dark:bg-indigo-950/50"
            onPress={() => router.push('/(tabs)/analytics')}>
            <View className="h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-100 dark:bg-indigo-900/60">
              <MaterialCommunityIcons name="chart-line" size={20} color="#4f46e5" />
            </View>
            <Text className="min-w-0 flex-1 text-sm font-bold text-indigo-950 dark:text-indigo-50" numberOfLines={1}>
              Charts
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={BUTTON_ACTIVE_OPACITY}
            className="min-h-[48px] flex-1 flex-row items-center gap-2.5 rounded-2xl border border-sky-200/90 bg-white px-3 py-2.5 shadow-sm dark:border-sky-800 dark:bg-slate-900"
            onPress={() => router.push('/reports')}>
            <View className="h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky-100 dark:bg-sky-900/50">
              <MaterialCommunityIcons name="file-export-outline" size={20} color="#0284c7" />
            </View>
            <Text className="min-w-0 flex-1 text-sm font-bold text-slate-900 dark:text-sky-50" numberOfLines={1}>
              Export
            </Text>
          </TouchableOpacity>
        </View>

        <SectionIntro
          title="By category"
          description="See where your money goes. Totals are sorted from highest to lowest."
          className="mb-3"
        />
        <Card className="mb-4">
          <CardSectionHeader
            title="Categories"
            subtitle="All-time spending per category"
            icon="chart-donut"
            iconColor="#059669"
            iconBg="bg-emerald-50 dark:bg-emerald-950/40"
          />
          {categories.length === 0 ? (
            <Text className="text-sm text-slate-500">No categories yet.</Text>
          ) : (
            <>
              {categoryRows.map(({ c, total }) => (
                <View key={c.id} className="mb-2 flex-row items-center justify-between">
                  <View className="flex-row items-center gap-2">
                    <View
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: c.color }}
                    />
                    <Text className="text-slate-800 dark:text-slate-100">{c.name}</Text>
                  </View>
                  <Text className="font-semibold text-slate-900 dark:text-white">
                    {formatMoneyAmount(total, primaryCurrency)}
                  </Text>
                </View>
              ))}
              <View className="mt-2 flex-row items-center justify-between border-t border-slate-200 pt-3 dark:border-slate-700">
                <Text className="text-sm font-bold uppercase tracking-wide text-slate-600 dark:text-slate-300">
                  Sum
                </Text>
                <Text className="text-base font-bold text-slate-900 dark:text-white">
                  {formatMoneyAmount(stats.total.total, stats.total.currency)}
                </Text>
              </View>
            </>
          )}
        </Card>

        <SectionIntro
          title="Latest activity"
          description="Your five most recent expenses. Tap any row to edit or delete."
          className="mb-3 mt-1"
        />
        <Card>
          <View className="mb-3 flex-row items-start justify-between gap-2">
            <View className="min-w-0 flex-1">
              <CardSectionHeader
                title="Recent transactions"
                subtitle="Latest 5 entries"
                icon="history"
                iconColor="#0284c7"
                iconBg="bg-sky-50 dark:bg-sky-950/50"
                className="mb-0"
              />
            </View>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="View all expenses"
              activeOpacity={BUTTON_ACTIVE_OPACITY}
              onPress={() => router.push('/(tabs)/history')}
              className="rounded-full bg-indigo-50 px-3 py-1.5 dark:bg-indigo-950/50">
              <Text className="text-xs font-semibold text-indigo-600 dark:text-indigo-300">
                See all
              </Text>
            </TouchableOpacity>
          </View>
          {recent.length === 0 ? (
            <Text className="text-sm text-slate-500 dark:text-slate-400">
              No expenses yet. Use Add expense above to create your first entry.
            </Text>
          ) : (
            recent.map((e) => {
              const cat = categories.find((c) => c.id === e.categoryId);
              return (
                <RecentRow
                  key={e.id}
                  expense={e}
                  categoryName={cat?.name ?? 'Category'}
                  categoryColor={cat?.color ?? '#64748b'}
                  amount={formatExpenseAmount(e)}
                  icon={categoryIconName(cat?.icon ?? 'dots-horizontal')}
                  onPress={() => openExpenseActions(e.id)}
                />
              );
            })
          )}
        </Card>
      </View>

      <ExpenseActionModal
        visible={selectedExpenseId !== null}
        expenseId={selectedExpenseId}
        onClose={() => setSelectedExpenseId(null)}
      />
    </AppScreen>
  );
}

function StatPill({
  label,
  value,
  icon,
  iconColor,
  iconBg,
}: {
  label: string;
  value: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  iconColor: string;
  iconBg: string;
}) {
  return (
    <View className="min-w-[30%] flex-1 rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
      <View className="mb-1.5 flex-row items-center justify-between">
        <Text className="text-xs font-medium uppercase text-slate-500 dark:text-slate-400">{label}</Text>
        <View className={`h-7 w-7 items-center justify-center rounded-lg ${iconBg}`}>
          <MaterialCommunityIcons name={icon} size={16} color={iconColor} />
        </View>
      </View>
      <Text className="text-sm font-semibold text-slate-900 dark:text-white">{value}</Text>
    </View>
  );
}
