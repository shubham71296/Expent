import { BUTTON_ACTIVE_OPACITY } from '@/components/ui/buttonPressable';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { router } from 'expo-router';
import { Text, TouchableOpacity, View } from 'react-native';

/** Compact add button for History and other screens. */
export function AddExpenseButton({ className = '' }: { className?: string }) {
  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel="Add expense"
      activeOpacity={BUTTON_ACTIVE_OPACITY}
      onPress={() => router.push('/add-expense')}
      className={`flex-row items-center justify-center gap-1.5 rounded-2xl bg-emerald-600 px-3.5 py-2.5 web:hover:bg-emerald-700 dark:bg-emerald-600 dark:web:hover:bg-emerald-500 ${className}`}>
      <MaterialCommunityIcons name="plus" size={18} color="#ffffff" />
      <Text className="text-xs font-bold text-white">Add</Text>
    </TouchableOpacity>
  );
}

export function ExpenseQuickActionsRow({ className = '' }: { className?: string }) {
  return (
    <View className={`flex-row gap-2.5 ${className}`}>
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel="Add expense"
        activeOpacity={BUTTON_ACTIVE_OPACITY}
        onPress={() => router.push('/add-expense')}
        className="min-h-[48px] flex-1 flex-row items-center gap-2.5 overflow-hidden rounded-2xl border border-emerald-500/25 bg-emerald-600 px-3 py-2.5 shadow-sm web:hover:bg-emerald-700 dark:border-emerald-700 dark:bg-emerald-600 dark:web:hover:bg-emerald-600">
        <View className="h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/20">
          <MaterialCommunityIcons name="plus" size={20} color="#ffffff" />
        </View>
        <Text className="min-w-0 flex-1 text-sm font-bold text-white" numberOfLines={1}>
          Add expense
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel="View all expenses"
        activeOpacity={BUTTON_ACTIVE_OPACITY}
        onPress={() => router.push('/(tabs)/history')}
        className="min-h-[48px] flex-1 flex-row items-center gap-2.5 overflow-hidden rounded-2xl border border-sky-200/90 bg-white px-3 py-2.5 shadow-sm web:hover:bg-sky-50 dark:border-sky-800 dark:bg-slate-900 dark:web:hover:bg-slate-800/90">
        <View className="h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky-100 dark:bg-sky-900/50">
          <MaterialCommunityIcons name="format-list-bulleted" size={20} color="#0284c7" />
        </View>
        <Text className="min-w-0 flex-1 text-sm font-bold text-slate-900 dark:text-sky-50" numberOfLines={1}>
          All expenses
        </Text>
      </TouchableOpacity>
    </View>
  );
}
