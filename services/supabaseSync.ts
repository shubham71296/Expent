import { supabase } from '@/lib/supabase';
import { useAppStore, seedCategories } from '@/store/useAppStore';
import type { Category, Expense } from '@/types/models';
import { dedupeCategories } from '@/utils/categoryDedupe';
import type { SupabaseClient } from '@supabase/supabase-js';

type CategoryRow = {
  id: string;
  user_id: string;
  name: string;
  icon: string;
  color: string;
  is_default: boolean | null;
  created_at: string;
};

type ExpenseRow = {
  id: string;
  user_id: string;
  amount: number;
  currency: string;
  original_amount: number;
  category_id: string;
  sub_category?: string;
  note: string;
  created_at: string;
};

type ExpenseRowLegacy = Omit<ExpenseRow, 'sub_category'>;

const SUB_CATEGORY_NOTE_PREFIX = 'expent:sub:';
const LEGACY_SUB_CATEGORY_NOTE_PREFIX = 'exptrack:sub:';

let subCategoryColumnWarned = false;

function isMissingSubCategoryColumn(error: unknown): boolean {
  const row = error as { code?: string; message?: string };
  return (
    row?.code === 'PGRST204' &&
    typeof row.message === 'string' &&
    row.message.includes('sub_category')
  );
}

function encodeSubCategoryInNote(subCategory: string, note: string): string {
  const sub = subCategory.trim();
  if (!sub) return note;
  const tag = `${SUB_CATEGORY_NOTE_PREFIX}${sub}::`;
  if (note.startsWith(tag)) return note;
  return `${tag}${note}`.trim();
}

function decodeSubCategoryFromNote(note: string): { subCategory: string; note: string } {
  const prefix = note.startsWith(SUB_CATEGORY_NOTE_PREFIX)
    ? SUB_CATEGORY_NOTE_PREFIX
    : note.startsWith(LEGACY_SUB_CATEGORY_NOTE_PREFIX)
      ? LEGACY_SUB_CATEGORY_NOTE_PREFIX
      : null;
  if (!prefix) {
    return { subCategory: '', note };
  }
  const rest = note.slice(prefix.length);
  const sep = rest.indexOf('::');
  if (sep < 0) return { subCategory: '', note };
  return {
    subCategory: rest.slice(0, sep),
    note: rest.slice(sep + 2),
  };
}

function toCategoryRow(c: Category, userId: string): CategoryRow {
  return {
    id: c.id,
    user_id: userId,
    name: c.name,
    icon: c.icon,
    color: c.color,
    is_default: c.isDefault ?? false,
    created_at: c.createdAt,
  };
}

function fromCategoryRow(r: CategoryRow): Category {
  return {
    id: r.id,
    name: r.name,
    icon: r.icon,
    color: r.color,
    isDefault: r.is_default ?? false,
    createdAt: r.created_at,
  };
}

function toExpenseRow(e: Expense, userId: string): ExpenseRow {
  return {
    id: e.id,
    user_id: userId,
    amount: e.amount,
    currency: e.currency,
    original_amount: e.originalAmount,
    category_id: e.categoryId,
    sub_category: e.subCategory ?? '',
    note: e.note,
    created_at: e.createdAt,
  };
}

function toLegacyExpenseRow(e: Expense, userId: string): ExpenseRowLegacy {
  return {
    id: e.id,
    user_id: userId,
    amount: e.amount,
    currency: e.currency,
    original_amount: e.originalAmount,
    category_id: e.categoryId,
    note: encodeSubCategoryInNote(e.subCategory ?? '', e.note),
    created_at: e.createdAt,
  };
}

function fromExpenseRow(r: ExpenseRow | ExpenseRowLegacy): Expense {
  const withSub = r as ExpenseRow;
  let subCategory = withSub.sub_category ?? '';
  let note = r.note;

  if (!subCategory.trim() && note.startsWith(SUB_CATEGORY_NOTE_PREFIX)) {
    const decoded = decodeSubCategoryFromNote(note);
    subCategory = decoded.subCategory;
    note = decoded.note;
  }

  return {
    id: r.id,
    amount: Number(r.amount),
    currency: r.currency,
    originalAmount: Number(r.original_amount),
    categoryId: r.category_id,
    subCategory,
    note,
    createdAt: r.created_at,
  };
}

async function upsertExpenses(client: SupabaseClient, expenses: Expense[], userId: string) {
  if (expenses.length === 0) return;

  const fullRows = expenses.map((e) => toExpenseRow(e, userId));
  const { error } = await client.from('expenses').upsert(fullRows, { onConflict: 'id' });

  if (!error) return;

  if (isMissingSubCategoryColumn(error)) {
    const legacyRows = expenses.map((e) => toLegacyExpenseRow(e, userId));
    const { error: legacyError } = await client
      .from('expenses')
      .upsert(legacyRows, { onConflict: 'id' });
    if (legacyError) throw legacyError;
    if (!subCategoryColumnWarned) {
      subCategoryColumnWarned = true;
      console.warn(
        '[Expent sync] sub_category column missing on Supabase. In SQL Editor run: alter table public.expenses add column if not exists sub_category text not null default \'\'; Sub categories sync in note until then.'
      );
    }
    return;
  }

  throw error;
}

/** Remove cloud rows that were deleted locally (upsert alone leaves stale rows). */
async function deleteRemoteRowsMissingLocally(
  client: SupabaseClient,
  table: 'categories' | 'expenses',
  userId: string,
  localIds: string[]
) {
  const { data, error } = await client.from(table).select('id').eq('user_id', userId);
  if (error) throw error;

  const localSet = new Set(localIds);
  const toDelete = ((data ?? []) as { id: string }[])
    .map((row) => row.id)
    .filter((id) => !localSet.has(id));

  if (toDelete.length === 0) return;

  const { error: delError } = await client.from(table).delete().in('id', toDelete);
  if (delError) throw delError;
}

export async function pushExpensesAndCategories(client: SupabaseClient, userId: string) {
  const raw = useAppStore.getState();
  const { categories, expenses } = dedupeCategories(raw.categories, raw.expenses);
  const expensesRemapped = expenses.some((e) => {
    const prev = raw.expenses.find((x) => x.id === e.id);
    return prev && prev.categoryId !== e.categoryId;
  });
  if (categories.length !== raw.categories.length || expensesRemapped) {
    useAppStore.setState({ categories, expenses });
  }
  const categoryIds = categories.map((c) => c.id);
  const expenseIds = expenses.map((e) => e.id);

  await deleteRemoteRowsMissingLocally(client, 'expenses', userId, expenseIds);
  await deleteRemoteRowsMissingLocally(client, 'categories', userId, categoryIds);

  if (categories.length) {
    const { error } = await client
      .from('categories')
      .upsert(categories.map((c) => toCategoryRow(c, userId)), { onConflict: 'id' });
    if (error) throw error;
  }

  await upsertExpenses(client, expenses, userId);
}

export async function fetchExpensesAndCategories(client: SupabaseClient, userId: string) {
  const { data: catData, error: catErr } = await client
    .from('categories')
    .select('*')
    .eq('user_id', userId);
  if (catErr) throw catErr;

  const { data: expData, error: expErr } = await client
    .from('expenses')
    .select('*')
    .eq('user_id', userId);
  if (expErr) throw expErr;

  let categories = ((catData ?? []) as CategoryRow[]).map(fromCategoryRow);
  const expenses = ((expData ?? []) as (ExpenseRow | ExpenseRowLegacy)[]).map(fromExpenseRow);
  if (categories.length === 0) {
    categories = seedCategories();
  }
  return dedupeCategories(categories, expenses);
}

export async function pullExpensesAndCategories(client: SupabaseClient, userId: string) {
  const { categories, expenses } = await fetchExpensesAndCategories(client, userId);
  useAppStore.setState({ categories, expenses, cloudDataUserId: userId });
}

export function getSupabaseClientOrThrow() {
  if (!supabase) {
    throw new Error('Supabase is not configured. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY.');
  }
  return supabase;
}
