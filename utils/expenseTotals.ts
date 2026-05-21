import type { Expense } from '@/types/models';

/** Sum for display: one currency → use entered amounts; mixed → convert to primary. */
export function sumExpensesForDisplay(
  expenses: Expense[],
  primaryCurrency: string
): { total: number; currency: string } {
  if (expenses.length === 0) {
    return { total: 0, currency: primaryCurrency };
  }

  const currencies = new Set(expenses.map((e) => e.currency));
  if (currencies.size === 1) {
    const currency = expenses[0]!.currency;
    const total = expenses.reduce((sum, e) => sum + e.originalAmount, 0);
    return { total, currency };
  }

  const total = expenses.reduce((sum, e) => sum + e.amount, 0);
  return { total, currency: primaryCurrency };
}

/** Sum in primary currency — use when comparing totals across categories. */
export function sumExpensesInPrimary(expenses: Expense[]): number {
  return expenses.reduce((sum, e) => sum + e.amount, 0);
}
