import { TabScreenTopBar } from '@/components/TabScreenTopBar';
import { BlockIcon } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { AddExpenseButton } from '@/components/ui/ExpenseQuickActions';
import { HISTORY_PAGE_SIZE, PaginationBar } from '@/components/ui/PaginationBar';
import { AppScreen } from '@/components/ui/Screen';
import { useFilteredExpenses } from '@/hooks/useExpenseFilters';
import { formatMoneyAmount, useFormatExpenseAmount } from '@/hooks/useFormatMoney';
import { useAppStore } from '@/store/useAppStore';
import { sumExpensesForDisplay } from '@/utils/expenseTotals';
import type { DateFilterPreset, Expense, ExpenseSort } from '@/types/models';
import { categoryIconName } from '@/utils/categoryIcons';
import { ExpenseActionModal } from '@/components/expense/ExpenseActionModal';
import { ExpenseListRowContent } from '@/components/expense/ExpenseListRowContent';
import { BUTTON_ACTIVE_OPACITY } from '@/components/ui/buttonPressable';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { subDays } from 'date-fns';
import { router } from 'expo-router';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import {
    FlatList,
    Text,
    TouchableOpacity,
    TextInput,
    View,
    type ListRenderItem,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const DEFAULT_PRESET: DateFilterPreset = 'monthly';
const DEFAULT_SORT: ExpenseSort = 'latest';

const PRESETS: { key: DateFilterPreset; label: string }[] = [
  { key: 'last24h', label: '24h' },
  { key: 'daily', label: 'Day' },
  { key: 'weekly', label: 'Week' },
  { key: 'monthly', label: 'Month' },
  { key: 'yearly', label: 'Year' },
  { key: 'custom', label: '30d' },
];

const Row = memo(function Row({
  item,
  categoryName,
  categoryColor,
  icon,
  amount,
  onPress,
}: {
  item: Expense;
  categoryName: string;
  categoryColor: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  amount: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={`Edit expense ${categoryName}`}
      activeOpacity={BUTTON_ACTIVE_OPACITY}
      onPress={onPress}
      className="mx-4 mb-3 flex-row items-start justify-between gap-2 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <View className="min-w-0 flex-1 flex-row items-start gap-3">
        <View
          className="mt-0.5 h-11 w-11 shrink-0 items-center justify-center rounded-2xl"
          style={{ backgroundColor: `${categoryColor}22` }}>
          <MaterialCommunityIcons name={icon} size={22} color={categoryColor} />
        </View>
        <ExpenseListRowContent
          expense={item}
          categoryName={categoryName}
          categoryColor={categoryColor}
        />
      </View>
      <Text className="shrink-0 text-lg font-bold text-slate-900 dark:text-white">{amount}</Text>
    </TouchableOpacity>
  );
});

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const expenses = useAppStore((s) => s.expenses);
  const categories = useAppStore((s) => s.categories);
  const primaryCurrency = useAppStore((s) => s.settings.primaryCurrency);
  const [preset, setPreset] = useState<DateFilterPreset>(DEFAULT_PRESET);
  const [sort, setSort] = useState<ExpenseSort>(DEFAULT_SORT);
  const [query, setQuery] = useState('');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [selectedExpenseId, setSelectedExpenseId] = useState<string | null>(null);
  const [customStart] = useState(() => subDays(new Date(), 30));
  const [customEnd] = useState(() => new Date());
  const formatExpenseAmount = useFormatExpenseAmount();
  const { list: filteredByDate, range } = useFilteredExpenses(
    expenses,
    preset,
    preset === 'custom' ? customStart : undefined,
    preset === 'custom' ? customEnd : undefined
  );

  const list = useMemo(() => {
    let rows = filteredByDate;
    if (categoryId) rows = rows.filter((e) => e.categoryId === categoryId);
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      rows = rows.filter((e) => {
        const catName = categories.find((c) => c.id === e.categoryId)?.name.toLowerCase() ?? '';
        return (
          e.note.toLowerCase().includes(q) ||
          (e.subCategory ?? '').toLowerCase().includes(q) ||
          catName.includes(q)
        );
      });
    }
    const sorted = [...rows];
    if (sort === 'latest') sorted.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
    if (sort === 'amount_desc') sorted.sort((a, b) => b.amount - a.amount);
    if (sort === 'amount_asc') sorted.sort((a, b) => a.amount - b.amount);
    return sorted;
  }, [filteredByDate, categoryId, query, sort, categories]);

  const filterTotal = useMemo(
    () => sumExpensesForDisplay(list, primaryCurrency),
    [list, primaryCurrency]
  );

  const hasActiveFilters = useMemo(
    () =>
      query.trim() !== '' ||
      categoryId !== null ||
      preset !== DEFAULT_PRESET ||
      sort !== DEFAULT_SORT,
    [query, categoryId, preset, sort]
  );

  const filterSummary = useMemo(() => {
    const parts: string[] = [range.label];
    if (categoryId) {
      const name = categories.find((c) => c.id === categoryId)?.name;
      if (name) parts.push(name);
    }
    const q = query.trim();
    if (q) parts.push(`“${q}”`);
    return parts.join(' · ');
  }, [range.label, categoryId, categories, query]);

  const clearFilters = useCallback(() => {
    setQuery('');
    setCategoryId(null);
    setPreset(DEFAULT_PRESET);
    setSort(DEFAULT_SORT);
    setPage(0);
  }, []);

  const pageCount = list.length === 0 ? 0 : Math.ceil(list.length / HISTORY_PAGE_SIZE);
  const safePage = pageCount === 0 ? 0 : Math.min(page, pageCount - 1);
  const displayList = useMemo(
    () => list.slice(safePage * HISTORY_PAGE_SIZE, safePage * HISTORY_PAGE_SIZE + HISTORY_PAGE_SIZE),
    [list, safePage]
  );

  useEffect(() => {
    setPage(0);
  }, [preset, sort, query, categoryId]);

  useEffect(() => {
    if (pageCount === 0) {
      if (page !== 0) setPage(0);
      return;
    }
    if (page !== safePage) setPage(safePage);
  }, [page, safePage, pageCount]);

  const openExpenseActions = useCallback((id: string) => {
    setSelectedExpenseId(id);
  }, []);

  const renderItem: ListRenderItem<(typeof list)[number]> = useCallback(
    ({ item }) => {
      const cat = categories.find((c) => c.id === item.categoryId);
      return (
        <Row
          item={item}
          categoryName={cat?.name ?? '—'}
          categoryColor={cat?.color ?? '#64748b'}
          icon={categoryIconName(cat?.icon ?? 'dots-horizontal')}
          amount={formatExpenseAmount(item)}
          onPress={() => openExpenseActions(item.id)}
        />
      );
    },
    [categories, formatExpenseAmount, openExpenseActions]
  );

  const keyExtractor = useCallback((e: (typeof list)[number]) => e.id, []);

  const listHeader = useMemo(
    () => (
      <View className="px-4 pb-2">
        <TabScreenTopBar
          title="History"
          subtitle="Search, filter, and edit entries"
          icon="format-list-bulleted"
        />

        <View className="gap-5 pb-2">
          <View className="flex-row items-center rounded-2xl border border-slate-200/90 bg-white px-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <MaterialCommunityIcons name="magnify" size={22} color="#94a3b8" />
            <TextInput
              placeholder="Search sub categories, notes, or categories"
              placeholderTextColor="#94a3b8"
              value={query}
              onChangeText={setQuery}
              className="flex-1 py-3.5 pl-2 text-base text-slate-900 dark:text-white"
              accessibilityLabel="Search expenses"
            />
          </View>

          <View>
            <View className="mb-2.5 flex-row items-center gap-1.5">
              <MaterialCommunityIcons name="calendar-range" size={14} color="#64748b" />
              <Text className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Period</Text>
            </View>
            <View className="flex-row flex-wrap gap-2">
              {PRESETS.map((p) => (
                <TouchableOpacity
                  key={p.key}
                  activeOpacity={BUTTON_ACTIVE_OPACITY}
                  onPress={() => setPreset(p.key)}
                  className={`rounded-full border px-4 py-2.5 ${
                    preset === p.key
                      ? 'border-indigo-600 bg-indigo-600'
                      : 'border-slate-200/90 bg-white dark:border-slate-700 dark:bg-slate-900'
                  }`}>
                  <Text
                    className={`text-sm font-semibold ${
                      preset === p.key ? 'text-white' : 'text-slate-700 dark:text-slate-200'
                    }`}>
                    {p.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View>
            <View className="mb-2.5 flex-row items-center gap-1.5">
              <MaterialCommunityIcons name="tag-multiple-outline" size={14} color="#64748b" />
              <Text className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Category</Text>
            </View>
            <View className="flex-row flex-wrap gap-2">
              <TouchableOpacity
                activeOpacity={BUTTON_ACTIVE_OPACITY}
                onPress={() => setCategoryId(null)}
                className={`rounded-full border px-4 py-2.5 ${
                  categoryId === null
                    ? 'border-slate-900 bg-slate-900 dark:border-white dark:bg-white'
                    : 'border-slate-200/90 bg-white dark:border-slate-700 dark:bg-slate-900'
                }`}>
                <Text
                  className={`text-sm font-semibold ${
                    categoryId === null ? 'text-white dark:text-slate-900' : 'text-slate-700 dark:text-slate-200'
                  }`}>
                  All
                </Text>
              </TouchableOpacity>
              {categories.map((c) => (
                <TouchableOpacity
                  key={c.id}
                  activeOpacity={BUTTON_ACTIVE_OPACITY}
                  onPress={() => setCategoryId(c.id)}
                  className={`rounded-full border px-4 py-2.5 ${
                    categoryId === c.id
                      ? 'border-slate-900 bg-slate-900 dark:border-white dark:bg-white'
                      : 'border-slate-200/90 bg-white dark:border-slate-700 dark:bg-slate-900'
                  }`}>
                  <Text
                    className={`text-sm font-semibold ${
                      categoryId === c.id
                        ? 'text-white dark:text-slate-900'
                        : 'text-slate-700 dark:text-slate-200'
                    }`}>
                    {c.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {hasActiveFilters ? (
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Clear all filters"
            activeOpacity={BUTTON_ACTIVE_OPACITY}
            onPress={clearFilters}
            className="mb-4 flex-row items-center justify-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 py-3 dark:border-rose-900 dark:bg-rose-950/40">
            <MaterialCommunityIcons name="filter-off-outline" size={20} color="#e11d48" />
            <Text className="text-sm font-semibold text-rose-700 dark:text-rose-300">
              Clear filters
            </Text>
          </TouchableOpacity>
        ) : null}

        <View className="mb-4 flex-row gap-2">
          {(['latest', 'amount_desc', 'amount_asc'] as const).map((s) => (
            <TouchableOpacity
              key={s}
              activeOpacity={BUTTON_ACTIVE_OPACITY}
              onPress={() => setSort(s)}
              className={`flex-1 rounded-2xl border py-2.5 ${
                sort === s
                  ? 'border-indigo-200 bg-indigo-50 dark:border-indigo-800 dark:bg-indigo-950/50'
                  : 'border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900'
              }`}>
              <Text
                className={`text-center text-xs font-bold ${
                  sort === s ? 'text-indigo-700 dark:text-indigo-200' : 'text-slate-600 dark:text-slate-300'
                }`}>
                {s === 'latest' ? 'Latest' : s === 'amount_desc' ? 'High' : 'Low'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View className="mb-4 overflow-hidden rounded-2xl border border-indigo-200/90 bg-indigo-50 px-4 py-4 dark:border-indigo-900/60 dark:bg-indigo-950/35">
          <Text className="text-[11px] font-bold uppercase tracking-wide text-indigo-600 dark:text-indigo-400">
            Filtered total
          </Text>
          <Text className="mt-1.5 text-2xl font-bold text-indigo-950 dark:text-indigo-50">
            {formatMoneyAmount(filterTotal.total, filterTotal.currency)}
          </Text>
          <Text className="mt-1 text-sm text-indigo-800/80 dark:text-indigo-200/80">
            {filterSummary}
          </Text>
          <Text className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            {list.length} {list.length === 1 ? 'expense' : 'expenses'} in this view
          </Text>
        </View>

        <View className="mt-2 flex-row items-start justify-between gap-3">
          <View className="min-w-0 flex-1 flex-row items-start gap-2.5">
            <BlockIcon
              name="receipt-text-outline"
              color="#0284c7"
              containerClassName="bg-sky-50 dark:bg-sky-950/50"
              size={20}
            />
            <View className="min-w-0 flex-1">
              <Text className="text-base font-bold text-slate-900 dark:text-white">
                List of expense records
              </Text>
              <Text className="mt-0.5 text-sm font-semibold tabular-nums text-slate-500 dark:text-slate-400">
                {list.length} {list.length === 1 ? 'record' : 'records'} total
              </Text>
            </View>
          </View>
          <AddExpenseButton className="shrink-0" />
        </View>

        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Download report"
          activeOpacity={BUTTON_ACTIVE_OPACITY}
          onPress={() => router.push('/reports')}
          className="mt-4 flex-row items-center justify-center gap-2 rounded-2xl border border-sky-200 bg-sky-50 py-3.5 dark:border-sky-800 dark:bg-sky-950/50">
          <MaterialCommunityIcons name="file-download-outline" size={20} color="#0284c7" />
          <Text className="text-base font-semibold text-sky-900 dark:text-sky-100">
            Download report
          </Text>
        </TouchableOpacity>
      </View>
    ),
    [
      query,
      preset,
      categoryId,
      sort,
      categories,
      list.length,
      filterTotal,
      filterSummary,
      hasActiveFilters,
      clearFilters,
    ]
  );

  return (
    <AppScreen variant="tab" className="px-0" insetBottom={false}>
      <View className="flex-1">
        <FlatList
          className="flex-1"
          data={displayList}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          ListHeaderComponent={listHeader}
          initialNumToRender={12}
          windowSize={7}
          removeClippedSubviews={false}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <EmptyState
              title="No expenses here"
              description="Try another period or add a new expense."
            />
          }
          ListFooterComponent={
            list.length > 0 ? (
              <View className="px-4">
                <PaginationBar
                  page={safePage}
                  pageCount={pageCount}
                  total={list.length}
                  onPageChange={setPage}
                />
              </View>
            ) : null
          }
          contentContainerStyle={{
            ...(displayList.length === 0 ? { flexGrow: 1 } : undefined),
            paddingBottom: insets.bottom + 8,
          }}
        />
      </View>

      <ExpenseActionModal
        visible={selectedExpenseId !== null}
        expenseId={selectedExpenseId}
        onClose={() => setSelectedExpenseId(null)}
      />
    </AppScreen>
  );
}
