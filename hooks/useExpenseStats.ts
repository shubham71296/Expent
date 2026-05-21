import type { Category, Expense } from '@/types/models';
import { useAppStore } from '@/store/useAppStore';
import { sumExpensesForDisplay, sumExpensesInPrimary } from '@/utils/expenseTotals';
import type { DateFilterPreset } from '@/types/models';
import {
  eachMonthOfInterval,
  endOfDay,
  endOfMonth,
  format,
  min,
  startOfDay,
  startOfMonth,
  startOfYear,
  subMonths,
} from 'date-fns';
import { useMemo } from 'react';

export function useExpenseStats(expenses: Expense[]) {
  const categories = useAppStore((s) => s.categories);
  const primary = useAppStore((s) => s.settings.primaryCurrency);

  return useMemo(() => {
    const rangeTotal = sumExpensesForDisplay(expenses, primary);

    const topCategories: { category: Category; total: number; currency: string }[] = [];
    categories.forEach((c) => {
      const catExpenses = expenses.filter((e) => e.categoryId === c.id);
      const total = sumExpensesInPrimary(catExpenses);
      if (total > 0) {
        topCategories.push({ category: c, total, currency: primary });
      }
    });
    topCategories.sort((a, b) => b.total - a.total);

    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);
    const monthExpenses = expenses.filter((e) => {
      const d = new Date(e.createdAt);
      return d >= monthStart && d <= monthEnd;
    });
    const monthTotal = sumExpensesForDisplay(monthExpenses, primary);

    const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const dayExpenses = expenses.filter((e) => new Date(e.createdAt) >= dayStart);
    const dayTotal = sumExpensesForDisplay(dayExpenses, primary);

    const yearStart = new Date(now.getFullYear(), 0, 1);
    const yearExpenses = expenses.filter((e) => new Date(e.createdAt) >= yearStart);
    const yearTotal = sumExpensesForDisplay(yearExpenses, primary);

    return {
      rangeTotal,
      monthTotal,
      dayTotal,
      yearTotal,
      topCategories,
      primaryCurrency: primary,
    };
  }, [expenses, categories, primary]);
}

function sumInRange(expenses: Expense[], start: Date, end: Date) {
  return expenses.reduce((acc, e) => {
    const t = new Date(e.createdAt);
    if (t >= start && t <= end) return acc + e.amount;
    return acc;
  }, 0);
}

/** Split current month into 4 date-range buckets (fits on screen, no week labels). */
function monthPeriodBuckets(expenses: Expense[], now: Date) {
  const monthStart = startOfMonth(now);
  const lastDay = min([now, endOfMonth(now)]).getDate();
  const segments = [
    { from: 1, to: 7, label: '1–7' },
    { from: 8, to: 14, label: '8–14' },
    { from: 15, to: 21, label: '15–21' },
    { from: 22, to: 31, label: '22+' },
  ];

  return segments
    .filter((s) => s.from <= lastDay)
    .map((s) => {
      const endDay = Math.min(s.to, lastDay);
      const start = startOfDay(
        new Date(monthStart.getFullYear(), monthStart.getMonth(), s.from)
      );
      const end = endOfDay(
        new Date(monthStart.getFullYear(), monthStart.getMonth(), endDay)
      );
      return {
        label: s.label,
        value: sumInRange(expenses, start, end),
      };
    });
}

function yearMonthBuckets(expenses: Expense[], now: Date) {
  const yearStart = startOfYear(now);
  const months = eachMonthOfInterval({ start: yearStart, end: now });
  return months.map((m) => ({
    label: format(m, 'MMM'),
    value: sumInRange(expenses, startOfMonth(m), endOfMonth(m)),
  }));
}

/** Bar buckets that match the analytics preset (uses expenses already filtered to that range). */
export function useSpendingBars(expenses: Expense[], preset: DateFilterPreset) {
  return useMemo(() => {
    const now = new Date();

    if (preset === 'yearly') {
      return {
        points: yearMonthBuckets(expenses, now),
        title: 'Monthly spending (this year)',
      };
    }

    return {
      points: monthPeriodBuckets(expenses, now),
      title: 'Spending by period (this month)',
    };
  }, [expenses, preset]);
}

/** Line trend aligned with the analytics preset. */
export function useSpendingTrend(expenses: Expense[], preset: DateFilterPreset) {
  return useMemo(() => {
    const now = new Date();

    if (preset === 'yearly') {
      return {
        points: yearMonthBuckets(expenses, now),
        title: 'Yearly trend (by month)',
      };
    }

    return {
      points: monthPeriodBuckets(expenses, now),
      title: 'Monthly trend (by period)',
    };
  }, [expenses, preset]);
}

export function useMonthlyBars(expenses: Expense[], monthsBack = 6) {
  return useMemo(() => {
    const now = new Date();
    const start = startOfMonth(subMonths(now, monthsBack - 1));
    const months = eachMonthOfInterval({ start, end: now });
    return months.map((m) => {
      const ms = startOfMonth(m);
      const me = endOfMonth(m);
      const label = format(m, 'MMM');
      const total = expenses.reduce((acc, e) => {
        const d = new Date(e.createdAt);
        if (d >= ms && d <= me) return acc + e.amount;
        return acc;
      }, 0);
      return { label, value: total, month: m };
    });
  }, [expenses, monthsBack]);
}

export function useDailyTrend(expenses: Expense[], days = 14) {
  return useMemo(() => {
    const now = new Date();
    const points: { label: string; value: number }[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const start = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      const end = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59);
      const value = expenses.reduce((acc, e) => {
        const t = new Date(e.createdAt);
        if (t >= start && t <= end) return acc + e.amount;
        return acc;
      }, 0);
      points.push({ label: format(start, 'd MMM'), value });
    }
    return points;
  }, [expenses, days]);
}
