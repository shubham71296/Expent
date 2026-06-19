import { supabase } from '@/lib/supabase';
import { fetchExpensesAndCategories, pushExpensesAndCategories } from '@/services/supabaseSync';
import { useAppStore } from '@/store/useAppStore';
import { dedupeCategories } from '@/utils/categoryDedupe';

let syncGeneration = 0;

/** Wipes local categories/expenses when switching to a different signed-in account. */
export function resetLocalDataForAccountSwitch(): void {
  useAppStore.getState().clearLocalExpenseData();
  useAppStore.setState({
    cloudDataUserId: null,
    subscriptionProductId: null,
    trialEndsAt: null,
  });
}

/** Ends in-flight sync without deleting local data (e.g. sign-out). */
export function clearCloudSession(): void {
  syncGeneration += 1;
  useAppStore.setState({ cloudDataUserId: null });
}

/** Cancels sync and clears local data (account switch guard). */
export function cancelCloudSync(): void {
  syncGeneration += 1;
  resetLocalDataForAccountSwitch();
}

function mergeById<T extends { id: string }>(cloud: T[], local: T[]): T[] {
  const map = new Map<string, T>();
  cloud.forEach((row) => map.set(row.id, row));
  local.forEach((row) => map.set(row.id, row));
  return [...map.values()];
}

/**
 * Loads cloud data for `userId`. Merges with unsynced local rows (e.g. after sign-out
 * before cloud push succeeded). Returns false if a newer sync superseded this run.
 */
export async function syncUserDataFromCloud(userId: string): Promise<boolean> {
  if (!supabase) return true;

  const generation = ++syncGeneration;
  const localSnapshot = useAppStore.getState();

  try {
    const { categories: cloudCategories, expenses: cloudExpenses } =
      await fetchExpensesAndCategories(supabase, userId);
    if (generation !== syncGeneration) return false;

    const keepLocal =
      localSnapshot.cloudDataUserId === null &&
      (localSnapshot.expenses.length > 0 || localSnapshot.categories.length > 0);

    const mergedCategories = keepLocal
      ? mergeById(cloudCategories, localSnapshot.categories)
      : cloudCategories;
    const mergedExpenses = keepLocal
      ? mergeById(cloudExpenses, localSnapshot.expenses)
      : cloudExpenses;

    const { categories, expenses } = dedupeCategories(mergedCategories, mergedExpenses);

    useAppStore.setState({ categories, expenses, cloudDataUserId: userId });

    if (keepLocal && expenses.length > 0) {
      try {
        await pushExpensesAndCategories(supabase, userId);
      } catch (pushErr) {
        console.warn('[Pennibly sync] merge push after sign-in failed', pushErr);
      }
    }

    return true;
  } catch (e) {
    if (generation === syncGeneration) {
      console.warn('[Pennibly sync] pull failed', e);
      useAppStore.setState({ cloudDataUserId: userId });
    }
    return generation === syncGeneration;
  }
}

export async function pushLocalDataToCloud(userId: string): Promise<void> {
  if (!supabase) return;
  const { cloudDataUserId } = useAppStore.getState();
  if (cloudDataUserId !== null && cloudDataUserId !== userId) return;
  await pushExpensesAndCategories(supabase, userId);
  if (useAppStore.getState().cloudDataUserId === null) {
    useAppStore.setState({ cloudDataUserId: userId });
  }
}