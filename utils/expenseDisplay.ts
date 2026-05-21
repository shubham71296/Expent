import type { Expense } from '@/types/models';
import { formatDisplayDateTime } from '@/utils/dateFormat';

export function expensePrimaryLabel(expense: Expense, categoryName: string): string {
  const sub = expense.subCategory?.trim();
  return sub || categoryName;
}

export function expenseSecondaryLabel(expense: Expense, categoryName: string): string {
  const date = formatDisplayDateTime(expense.createdAt);
  const sub = expense.subCategory?.trim();
  if (sub) {
    const parts = [categoryName, date];
    if (expense.note?.trim()) parts.splice(1, 0, expense.note.trim());
    return parts.join(' · ');
  }
  if (expense.note?.trim()) return `${expense.note.trim()} · ${date}`;
  return date;
}

export function recentSubCategoriesForCategory(
  expenses: Expense[],
  categoryId: string,
  limit = 8
): string[] {
  const seen = new Set<string>();
  const labels: string[] = [];
  for (const e of expenses) {
    if (e.categoryId !== categoryId) continue;
    const name = e.subCategory?.trim();
    if (!name) continue;
    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    labels.push(name);
    if (labels.length >= limit) break;
  }
  return labels;
}

export function topSubCategoriesForCategory(
  expenses: Expense[],
  categoryId: string,
  limit = 4
): { name: string; total: number }[] {
  const map = new Map<string, number>();
  for (const e of expenses) {
    if (e.categoryId !== categoryId) continue;
    const name = e.subCategory?.trim();
    if (!name) continue;
    map.set(name, (map.get(name) ?? 0) + e.amount);
  }
  return [...map.entries()]
    .map(([name, total]) => ({ name, total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, limit);
}

export function subCategoryPlaceholder(categoryName: string): string {
  const lower = categoryName.toLowerCase();
  if (lower.includes('food')) return 'e.g. Milk, Burger, Pizza';
  if (lower.includes('fuel') || lower.includes('gas')) return 'e.g. Petrol, Diesel';
  if (lower.includes('travel')) return 'e.g. Flight, Hotel, Taxi';
  if (lower.includes('shop')) return 'e.g. Shoes, Groceries';
  return `e.g. Subcategory for ${categoryName}`;
}
