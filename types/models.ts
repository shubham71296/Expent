export type ThemePreference = 'light' | 'dark' | 'system';

export type DateFilterPreset =
  | 'last24h'
  | 'daily'
  | 'weekly'
  | 'monthly'
  | 'yearly'
  | 'custom';

export type ExpenseSort = 'latest' | 'amount_desc' | 'amount_asc';

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  isDefault?: boolean;
  createdAt: string;
}

export interface Expense {
  id: string;
  amount: number;
  currency: string;
  originalAmount: number;
  categoryId: string;
  /** Detail within the category (e.g. Milk under Food). */
  subCategory: string;
  note: string;
  createdAt: string;
}

export interface AppSettings {
  theme: ThemePreference;
  primaryCurrency: string;
  reminderEnabled: boolean;
  reminderHour: number;
  reminderMinute: number;
}
