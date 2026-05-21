import type { Category, Expense } from '@/types/models';
import { endOfMonth, startOfMonth, subMonths } from 'date-fns';
import { useMemo } from 'react';

export function useSimpleInsights(
  expenses: Expense[],
  categories: Category[]
) {
  return useMemo(() => {
    const now = new Date();
    const thisStart = startOfMonth(now);
    const thisEnd = endOfMonth(now);
    const prevStart = startOfMonth(subMonths(now, 1));
    const prevEnd = endOfMonth(subMonths(now, 1));

    const sumBetween = (start: Date, end: Date) =>
      expenses
        .filter((e) => {
          const d = new Date(e.createdAt);
          return d >= start && d <= end;
        })
        .reduce((a, e) => a + e.amount, 0);

    const thisMonth = sumBetween(thisStart, thisEnd);
    const lastMonth = sumBetween(prevStart, prevEnd);

    const lines: string[] = [];

    if (lastMonth > 0 && thisMonth < lastMonth * 0.9) {
      lines.push('You spent less compared to last month. Nice work.');
    } else if (lastMonth > 0 && thisMonth > lastMonth * 1.1) {
      lines.push('Spending is higher than last month. Worth a quick review.');
    }

    const catTotals = new Map<string, number>();
    expenses
      .filter((e) => {
        const d = new Date(e.createdAt);
        return d >= thisStart && d <= thisEnd;
      })
      .forEach((e) => {
        catTotals.set(e.categoryId, (catTotals.get(e.categoryId) ?? 0) + e.amount);
      });

    const prevCat = new Map<string, number>();
    expenses
      .filter((e) => {
        const d = new Date(e.createdAt);
        return d >= prevStart && d <= prevEnd;
      })
      .forEach((e) => {
        prevCat.set(e.categoryId, (prevCat.get(e.categoryId) ?? 0) + e.amount);
      });

    let biggestIncrease: { name: string; ratio: number } | null = null;
    catTotals.forEach((val, id) => {
      const prev = prevCat.get(id) ?? 0;
      if (prev > 0 && val > prev * 1.25) {
        const ratio = val / prev;
        const name = categories.find((c) => c.id === id)?.name ?? 'A category';
        if (!biggestIncrease || ratio > biggestIncrease.ratio) {
          biggestIncrease = { name, ratio };
        }
      }
    });
    if (biggestIncrease !== null) {
      const { name } = biggestIncrease;
      lines.push(`${name} expenses increased this month.`);
    }

    if (lines.length === 0) {
      lines.push('Keep logging expenses for more personalized tips.');
    }

    return lines.slice(0, 3);
  }, [expenses, categories]);
}
