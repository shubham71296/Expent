import type { Expense } from '@/types/models';
import { useAppStore } from '@/store/useAppStore';
import { sumExpensesForDisplay } from '@/utils/expenseTotals';
import { useCallback } from 'react';

export function formatMoneyAmount(
  amount: number,
  currencyCode: string,
  options?: { minimumFractionDigits?: number }
): string {
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: options?.minimumFractionDigits ?? 0,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currencyCode}`;
  }
}

/** Formats totals in the user's primary currency (dashboard, analytics). */
export function useFormatMoney() {
  const primary = useAppStore((s) => s.settings.primaryCurrency);

  return useCallback(
    (amount: number, options?: { minimumFractionDigits?: number }) =>
      formatMoneyAmount(amount, primary, options),
    [primary]
  );
}

/** Formats a single expense in the currency chosen when it was added or edited. */
export function useFormatExpenseAmount() {
  return useCallback(
    (expense: Pick<Expense, 'originalAmount' | 'currency'>) =>
      formatMoneyAmount(expense.originalAmount, expense.currency),
    []
  );
}

/** Formats a total for a group of expenses (dashboard stats, category totals). */
export function useFormatExpenseGroupTotal() {
  const primary = useAppStore((s) => s.settings.primaryCurrency);

  return useCallback(
    (expenses: Expense[]) => {
      const { total, currency } = sumExpensesForDisplay(expenses, primary);
      return formatMoneyAmount(total, currency);
    },
    [primary]
  );
}
