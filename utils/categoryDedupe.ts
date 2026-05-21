import { normalizeCategoryName } from '@/utils/categoryNames';
import type { Category, Expense } from '@/types/models';

function expenseCountFor(categories: Category[], expenses: Expense[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const e of expenses) {
    counts.set(e.categoryId, (counts.get(e.categoryId) ?? 0) + 1);
  }
  for (const c of categories) {
    if (!counts.has(c.id)) counts.set(c.id, 0);
  }
  return counts;
}

/** One row per category name; expenses point at the kept category id. */
export function dedupeCategories(
  categories: Category[],
  expenses: Expense[]
): { categories: Category[]; expenses: Expense[] } {
  if (categories.length <= 1) return { categories, expenses };

  const counts = expenseCountFor(categories, expenses);
  const groups = new Map<string, Category[]>();

  for (const c of categories) {
    const key = normalizeCategoryName(c.name);
    const list = groups.get(key) ?? [];
    list.push(c);
    groups.set(key, list);
  }

  if ([...groups.values()].every((g) => g.length === 1)) {
    return { categories, expenses };
  }

  const idRemap = new Map<string, string>();
  const kept: Category[] = [];

  for (const group of groups.values()) {
    const sorted = [...group].sort((a, b) => {
      const diff = (counts.get(b.id) ?? 0) - (counts.get(a.id) ?? 0);
      if (diff !== 0) return diff;
      if (Boolean(a.isDefault) !== Boolean(b.isDefault)) {
        return a.isDefault ? -1 : 1;
      }
      return a.createdAt.localeCompare(b.createdAt);
    });
    const canonical = sorted[0];
    kept.push(canonical);
    for (const c of group) {
      idRemap.set(c.id, canonical.id);
    }
  }

  kept.sort((a, b) => a.name.localeCompare(b.name));

  const nextExpenses = expenses.map((e) => {
    const mapped = idRemap.get(e.categoryId);
    return mapped && mapped !== e.categoryId ? { ...e, categoryId: mapped } : e;
  });

  return { categories: kept, expenses: nextExpenses };
}
