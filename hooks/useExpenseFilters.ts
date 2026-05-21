import type { DateFilterPreset, Expense } from '@/types/models';
import {
  endOfDay,
  endOfMonth,
  endOfYear,
  isWithinInterval,
  startOfDay,
  startOfMonth,
  startOfYear,
  subDays,
  subHours,
} from 'date-fns';
import { useMemo } from 'react';

export type FilterRange = {
  start: Date;
  end: Date;
  label: string;
};

export function resolveFilterRange(
  preset: DateFilterPreset,
  customStart?: Date,
  customEnd?: Date
): FilterRange {
  const now = new Date();
  switch (preset) {
    case 'last24h':
      return {
        start: subHours(now, 24),
        end: now,
        label: 'Last 24 hours',
      };
    case 'daily':
      return {
        start: startOfDay(now),
        end: endOfDay(now),
        label: 'Today',
      };
    case 'weekly': {
      const start = startOfDay(subDays(now, 6));
      return { start, end: endOfDay(now), label: 'Last 7 days' };
    }
    case 'monthly':
      return {
        start: startOfMonth(now),
        end: endOfMonth(now),
        label: 'This month',
      };
    case 'yearly':
      return {
        start: startOfYear(now),
        end: endOfYear(now),
        label: 'This year',
      };
    case 'custom':
      return {
        start: startOfDay(customStart ?? subDays(now, 7)),
        end: endOfDay(customEnd ?? now),
        label: 'Custom range',
      };
    default:
      return {
        start: startOfMonth(now),
        end: endOfMonth(now),
        label: 'This month',
      };
  }
}

export function filterExpensesByRange(
  expenses: Expense[],
  range: FilterRange
): Expense[] {
  return expenses.filter((e) => {
    const d = new Date(e.createdAt);
    return isWithinInterval(d, { start: range.start, end: range.end });
  });
}

export function useFilteredExpenses(
  expenses: Expense[],
  preset: DateFilterPreset,
  customStart?: Date,
  customEnd?: Date
) {
  return useMemo(() => {
    const range = resolveFilterRange(preset, customStart, customEnd);
    return { range, list: filterExpensesByRange(expenses, range) };
  }, [expenses, preset, customStart, customEnd]);
}
