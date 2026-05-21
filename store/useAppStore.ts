import { convertBetweenCurrencies } from '@/constants/currencies';
import { DEFAULT_CATEGORY_TEMPLATES } from '@/constants/defaultCategories';
import type {
  AppSettings,
  Category,
  Expense,
  ThemePreference,
} from '@/types/models';
import type { SubscriptionProductId } from '@/types/subscription';
import { dedupeCategories } from '@/utils/categoryDedupe';
import { isCategoryNameTaken } from '@/utils/categoryNames';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

const nowIso = () => new Date().toISOString();

export function seedCategories(): Category[] {
  const t = nowIso();
  return DEFAULT_CATEGORY_TEMPLATES.map((row) => ({
    id: Crypto.randomUUID(),
    name: row.name,
    icon: row.icon,
    color: row.color,
    isDefault: true,
    createdAt: t,
  }));
}

const defaultSettings: AppSettings = {
  theme: 'system',
  primaryCurrency: 'INR',
  reminderEnabled: false,
  reminderHour: 20,
  reminderMinute: 0,
};

export interface AppState {
  onboardingCompleted: boolean;
  setOnboardingCompleted: (v: boolean) => void;
  expenses: Expense[];
  categories: Category[];
  monthlyBudget: number | null;
  /** Which Supabase user id the current expenses/categories belong to (null = empty / unknown). */
  cloudDataUserId: string | null;
  settings: AppSettings;
  /** Last chosen product from subscription screen (local cache; source of truth is Supabase user_metadata). */
  subscriptionProductId: SubscriptionProductId | null;
  trialEndsAt: string | null;
  completeSubscriptionPlan: (productId: SubscriptionProductId, trialEndsAt: string | null) => void;
  addExpense: (input: {
    amount: number;
    currency: string;
    categoryId: string;
    subCategory?: string;
    note?: string;
    date?: Date;
  }) => void;
  updateExpense: (
    id: string,
    input: Partial<{
      amount: number;
      currency: string;
      categoryId: string;
      subCategory: string;
      note: string;
      createdAt: string;
    }>
  ) => void;
  removeExpense: (id: string) => void;
  categoryNameTaken: (name: string, excludeId?: string) => boolean;
  addCategory: (input: { name: string; icon: string; color: string }) => boolean;
  updateCategory: (
    id: string,
    input: Partial<Pick<Category, 'name' | 'icon' | 'color'>>
  ) => boolean;
  removeCategory: (id: string) => void;
  setMonthlyBudget: (amount: number | null) => void;
  patchSettings: (patch: Partial<AppSettings>) => void;
  setPrimaryCurrency: (code: string) => void;
  setTheme: (theme: ThemePreference) => void;
  resetAll: () => void;
  /** Clears expenses/categories/budget (e.g. from settings). Not used on sign-out. */
  clearLocalExpenseData: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      onboardingCompleted: false,
      setOnboardingCompleted: (v) => set({ onboardingCompleted: v }),
      expenses: [],
      categories: [],
      monthlyBudget: null,
      cloudDataUserId: null,
      settings: defaultSettings,
      subscriptionProductId: null as SubscriptionProductId | null,
      trialEndsAt: null as string | null,

      completeSubscriptionPlan: (productId, tEnd) =>
        set({
          subscriptionProductId: productId,
          trialEndsAt: tEnd,
        }),

      addExpense: ({ amount, currency, categoryId, subCategory, note, date }) => {
        const primary = get().settings.primaryCurrency;
        const normalized = convertBetweenCurrencies(amount, currency, primary);
        const expense: Expense = {
          id: Crypto.randomUUID(),
          amount: Math.round(normalized * 100) / 100,
          currency,
          originalAmount: Math.round(amount * 100) / 100,
          categoryId,
          subCategory: subCategory?.trim() ?? '',
          note: note?.trim() ?? '',
          createdAt: (date ?? new Date()).toISOString(),
        };
        set((s) => ({ expenses: [expense, ...s.expenses] }));
      },

      updateExpense: (id, input) => {
        set((s) => ({
          expenses: s.expenses.map((e) => {
            if (e.id !== id) return e;
            const next = { ...e, ...input };
            if (input.subCategory !== undefined) next.subCategory = input.subCategory.trim();
            if (input.note !== undefined) next.note = input.note.trim();
            if (
              input.amount !== undefined ||
              input.currency !== undefined
            ) {
              const cur = input.currency ?? e.currency;
              const amt = input.amount ?? e.originalAmount;
              const primary = get().settings.primaryCurrency;
              next.originalAmount = Math.round(amt * 100) / 100;
              next.currency = cur;
              next.amount =
                Math.round(convertBetweenCurrencies(amt, cur, primary) * 100) / 100;
            }
            return next;
          }),
        }));
      },

      removeExpense: (id) =>
        set((s) => ({ expenses: s.expenses.filter((e) => e.id !== id) })),

      categoryNameTaken: (name, excludeId) =>
        isCategoryNameTaken(get().categories, name, excludeId),

      addCategory: ({ name, icon, color }) => {
        const trimmed = name.trim();
        if (!trimmed || isCategoryNameTaken(get().categories, trimmed)) {
          return false;
        }
        const cat: Category = {
          id: Crypto.randomUUID(),
          name: trimmed,
          icon,
          color,
          createdAt: nowIso(),
        };
        set((s) => ({ categories: [...s.categories, cat] }));
        return true;
      },

      updateCategory: (id, input) => {
        const { categories } = get();
        const trimmed = input.name?.trim();
        if (trimmed && isCategoryNameTaken(categories, trimmed, id)) {
          return false;
        }
        set((s) => ({
          categories: s.categories.map((c) =>
            c.id === id ? { ...c, ...input, name: trimmed ?? c.name } : c
          ),
        }));
        return true;
      },

      removeCategory: (id) =>
        set((s) => ({
          categories: s.categories.filter((c) => c.id !== id),
          expenses: s.expenses.filter((e) => e.categoryId !== id),
        })),

      setMonthlyBudget: (amount) => set({ monthlyBudget: amount }),

      patchSettings: (patch) =>
        set((s) => ({ settings: { ...s.settings, ...patch } })),

      setPrimaryCurrency: (code) =>
        set((s) => ({
          settings: { ...s.settings, primaryCurrency: code },
          expenses: s.expenses.map((e) => {
            const converted =
              Math.round(
                convertBetweenCurrencies(e.originalAmount, e.currency, code) * 100
              ) / 100;
            return {
              ...e,
              currency: code,
              originalAmount: converted,
              amount: converted,
            };
          }),
        })),

      setTheme: (theme) =>
        set((s) => ({ settings: { ...s.settings, theme } })),

      resetAll: () =>
        set({
          expenses: [],
          categories: seedCategories(),
          monthlyBudget: null,
          settings: defaultSettings,
          onboardingCompleted: false,
          cloudDataUserId: null,
          subscriptionProductId: null,
          trialEndsAt: null,
        }),

      clearLocalExpenseData: () =>
        set({
          expenses: [],
          categories: seedCategories(),
          monthlyBudget: null,
          cloudDataUserId: null,
        }),
    }),
    {
      name: 'exptrack-v1',
      storage: createJSONStorage(() => AsyncStorage),
      version: 8,
      migrate: (persisted, fromVersion) => {
        const s = { ...(persisted as Record<string, unknown>) };
        if (fromVersion < 8) {
          s.subscriptionProductId = null;
          s.trialEndsAt = null;
        }
        if (fromVersion < 2) {
          if (s.lastSignedOutUserId === undefined) {
            s.lastSignedOutUserId = null;
          }
        }
        if (fromVersion < 3) {
          delete s.lastSignedOutUserId;
        }
        if (fromVersion < 4) {
          s.cloudDataUserId = null;
        }
        if (fromVersion < 5 && s.settings && typeof s.settings === 'object') {
          const settings = s.settings as Record<string, unknown>;
          if (!settings.primaryCurrency) {
            settings.primaryCurrency = 'INR';
          }
        }
        if (fromVersion < 6 && Array.isArray(s.expenses)) {
          s.expenses = (s.expenses as Record<string, unknown>[]).map((e) => ({
            ...e,
            subCategory:
              typeof e.subCategory === 'string'
                ? e.subCategory
                : typeof e.item === 'string'
                  ? e.item
                  : '',
          }));
        }
        if (fromVersion < 7 && Array.isArray(s.categories) && Array.isArray(s.expenses)) {
          const deduped = dedupeCategories(
            s.categories as Category[],
            s.expenses as Expense[]
          );
          s.categories = deduped.categories;
          s.expenses = deduped.expenses;
        }
        return s;
      },
      partialize: (state) => ({
        onboardingCompleted: state.onboardingCompleted,
        expenses: state.expenses,
        categories: state.categories,
        monthlyBudget: state.monthlyBudget,
        cloudDataUserId: state.cloudDataUserId,
        settings: state.settings,
        subscriptionProductId: state.subscriptionProductId,
        trialEndsAt: state.trialEndsAt,
      }),
      onRehydrateStorage: () => (persisted) => {
        if (!persisted) return;
        if (!persisted.categories || persisted.categories.length === 0) {
          persisted.categories = seedCategories();
        }
        const deduped = dedupeCategories(persisted.categories, persisted.expenses ?? []);
        persisted.categories = deduped.categories;
        persisted.expenses = deduped.expenses;
        if (!persisted.settings?.primaryCurrency) {
          persisted.settings = { ...persisted.settings, primaryCurrency: 'INR' };
        }
      },
    }
  )
);
