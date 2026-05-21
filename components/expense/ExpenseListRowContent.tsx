import type { Expense } from '@/types/models';
import { formatDisplayDateTime } from '@/utils/dateFormat';
import { Text, View } from 'react-native';

type Props = {
  expense: Expense;
  categoryName: string;
  categoryColor: string;
};

export function ExpenseListRowContent({ expense, categoryName, categoryColor }: Props) {
  const subCategory = expense.subCategory?.trim();
  const note = expense.note?.trim();

  return (
    <View className="min-w-0 flex-1 gap-1.5">
      <View className="flex-row flex-wrap items-center gap-1.5">
        <View
          className="rounded-full px-2.5 py-1"
          style={{ backgroundColor: `${categoryColor}22` }}>
          <Text className="text-xs font-semibold" style={{ color: categoryColor }}>
            {categoryName}
          </Text>
        </View>
        {subCategory ? (
          <View className="rounded-full border border-slate-200/90 bg-slate-50 px-2.5 py-1 dark:border-slate-600 dark:bg-slate-800">
            <Text className="text-xs font-semibold text-slate-700 dark:text-slate-200">
              {subCategory}
            </Text>
          </View>
        ) : null}
      </View>

      {note ? (
        <Text numberOfLines={2} className="text-sm leading-5 text-slate-600 dark:text-slate-300">
          {note}
        </Text>
      ) : null}

      <Text className="text-xs text-slate-400 dark:text-slate-500">
        {formatDisplayDateTime(expense.createdAt)}
      </Text>
    </View>
  );
}
