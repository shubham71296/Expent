import { useExpenseFormScrollIntoView } from '@/components/expense/ExpenseFormLayout';
import { IconTextInput } from '@/components/ui/IconTextInput';
import { CURRENCIES } from '@/constants/currencies';
import { useAppStore } from '@/store/useAppStore';
import type { Category } from '@/types/models';
import {
  recentSubCategoriesForCategory,
  subCategoryPlaceholder,
} from '@/utils/expenseDisplay';
import { formatDisplayDateTime } from '@/utils/dateFormat';
import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { useMemo, useState } from 'react';
import type { Control, FieldErrors, FieldValues } from 'react-hook-form';
import { Controller, useWatch } from 'react-hook-form';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { BUTTON_ACTIVE_OPACITY } from '@/components/ui/buttonPressable';
import { Platform, Text, TouchableOpacity, View } from 'react-native';

type AndroidPickerStep = 'date' | 'time';

const LABEL = 'mb-2.5 text-[11px] font-bold uppercase tracking-wide text-slate-500';
const INPUT_WRAPPER =
  'flex-row rounded-2xl border border-slate-200/90 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900';
const CHIP_IDLE = 'border-slate-200/90 bg-white dark:border-slate-700 dark:bg-slate-900';
const CHIP_PRIMARY_SEL = 'border-indigo-600 bg-indigo-600';
const CHIP_NEUTRAL_SEL = 'border-slate-900 bg-slate-900 dark:border-white dark:bg-white';

type FormShape = {
  amount: string;
  categoryId: string;
  subCategory?: string;
  note?: string;
  currency: string;
};

type Props<T extends FieldValues & FormShape> = {
  control: Control<T>;
  errors: FieldErrors<T>;
  categories: Category[];
  when: Date;
  onWhenChange: (date: Date) => void;
};

function FormError({ message }: { message?: string }) {
  if (!message) return <View className="h-1" />;
  return <Text className="mt-1.5 text-sm text-rose-600 dark:text-rose-400">{message}</Text>;
}

export function ExpenseFormFields<T extends FieldValues & FormShape>({
  control,
  errors,
  categories,
  when,
  onWhenChange,
}: Props<T>) {
  const [iosPickerOpen, setIosPickerOpen] = useState(false);
  const [androidStep, setAndroidStep] = useState<AndroidPickerStep | null>(null);
  const scrollNoteIntoView = useExpenseFormScrollIntoView();
  const expenses = useAppStore((s) => s.expenses);
  const categoryId = useWatch({ control, name: 'categoryId' as keyof T & string }) as string;
  const selectedCategory = categories.find((c) => c.id === categoryId);
  const recentSubCategories = useMemo(
    () => recentSubCategoriesForCategory(expenses, categoryId),
    [expenses, categoryId]
  );
  const subCategoryHint = selectedCategory
    ? subCategoryPlaceholder(selectedCategory.name)
    : 'e.g. Milk, Burger, Pizza';

  const openPicker = () => {
    if (Platform.OS === 'ios') setIosPickerOpen(true);
    else setAndroidStep('date');
  };

  const closePicker = () => {
    setIosPickerOpen(false);
    setAndroidStep(null);
  };

  const onIosChange = (_: DateTimePickerEvent, selected?: Date) => {
    if (selected) onWhenChange(selected);
  };

  const onAndroidChange = (event: DateTimePickerEvent, selected?: Date) => {
    if (event.type === 'dismissed') {
      closePicker();
      return;
    }
    if (event.type !== 'set' || !selected) return;

    if (androidStep === 'date') {
      const merged = new Date(when);
      merged.setFullYear(selected.getFullYear(), selected.getMonth(), selected.getDate());
      onWhenChange(merged);
      setAndroidStep('time');
      return;
    }

    const merged = new Date(when);
    merged.setHours(selected.getHours(), selected.getMinutes(), 0, 0);
    onWhenChange(merged);
    closePicker();
  };

  return (
    <View className="gap-5">
      <View>
        <Text className={LABEL}>Amount</Text>
        <Controller
          control={control}
          name={'amount' as keyof T & string}
          render={({ field: { onChange, onBlur, value } }) => (
            <IconTextInput
              icon="cash"
              keyboardType="decimal-pad"
              onBlur={onBlur}
              onChangeText={onChange}
              value={value as string}
              placeholder="0.00"
              containerClassName="mb-0"
              wrapperClassName={INPUT_WRAPPER}
              className="text-xl font-bold"
              accessibilityLabel="Expense amount"
            />
          )}
        />
        <FormError message={errors.amount?.message as string | undefined} />
      </View>

      <View>
        <Text className={LABEL}>Currency</Text>
        <Controller
          control={control}
          name={'currency' as keyof T & string}
          render={({ field: { value, onChange } }) => (
            <View className="flex-row flex-wrap gap-2">
              {CURRENCIES.map((c) => {
                const selected = value === c.code;
                return (
                  <TouchableOpacity
                    key={c.code}
                    activeOpacity={BUTTON_ACTIVE_OPACITY}
                    onPress={() => onChange(c.code)}
                    className={`rounded-full border px-4 py-2.5 ${
                      selected ? CHIP_PRIMARY_SEL : CHIP_IDLE
                    }`}>
                    <Text
                      className={`text-sm font-semibold ${
                        selected ? 'text-white' : 'text-slate-700 dark:text-slate-200'
                      }`}>
                      {c.code}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        />
      </View>

      <View>
        <Text className={LABEL}>Category</Text>
        <Controller
          control={control}
          name={'categoryId' as keyof T & string}
          render={({ field: { value, onChange } }) => (
            <View className="flex-row flex-wrap gap-2">
              {categories.map((c) => {
                const selected = value === c.id;
                return (
                  <TouchableOpacity
                    key={c.id}
                    activeOpacity={BUTTON_ACTIVE_OPACITY}
                    onPress={() => onChange(c.id)}
                    className={`rounded-full border px-4 py-2.5 ${
                      selected ? CHIP_NEUTRAL_SEL : CHIP_IDLE
                    }`}>
                    <Text
                      className={`text-sm font-semibold ${
                        selected
                          ? 'text-white dark:text-slate-900'
                          : 'text-slate-700 dark:text-slate-200'
                      }`}>
                      {c.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        />
        <FormError message={errors.categoryId?.message as string | undefined} />
      </View>

      <View>
        <Text className={LABEL}>Sub category</Text>
        <Text className="mb-2 text-xs text-slate-500 dark:text-slate-400">
          What you spent inside this category — e.g. Milk, Burger, Pizza for Food.
        </Text>
        <Controller
          control={control}
          name={'subCategory' as keyof T & string}
          render={({ field: { onChange, onBlur, value } }) => (
            <IconTextInput
              icon="tag-outline"
              onBlur={onBlur}
              onChangeText={onChange}
              value={(value as string) ?? ''}
              placeholder={subCategoryHint}
              containerClassName="mb-0"
              wrapperClassName={INPUT_WRAPPER}
              accessibilityLabel="Expense sub category"
            />
          )}
        />
        <FormError message={errors.subCategory?.message as string | undefined} />
        {recentSubCategories.length > 0 ? (
          <View className="mt-2.5">
            <Text className="mb-2 text-[10px] font-bold uppercase tracking-wide text-slate-400">
              Recent for {selectedCategory?.name ?? 'category'}
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {recentSubCategories.map((label) => (
                <Controller
                  key={label}
                  control={control}
                  name={'subCategory' as keyof T & string}
                  render={({ field: { onChange } }) => (
                    <TouchableOpacity
                      activeOpacity={BUTTON_ACTIVE_OPACITY}
                      onPress={() => onChange(label)}
                      className="rounded-full border border-slate-200/90 bg-slate-50 px-3 py-1.5 dark:border-slate-700 dark:bg-slate-800">
                      <Text className="text-sm font-medium text-slate-700 dark:text-slate-200">
                        {label}
                      </Text>
                    </TouchableOpacity>
                  )}
                />
              ))}
            </View>
          </View>
        ) : null}
      </View>

      <View>
        <Text className={LABEL}>Date & time</Text>
        <TouchableOpacity
          activeOpacity={BUTTON_ACTIVE_OPACITY}
          onPress={openPicker}
          className={`${INPUT_WRAPPER} items-center px-3.5 py-3.5`}
          accessibilityRole="button"
          accessibilityLabel="Pick date and time">
          <MaterialCommunityIcons name="calendar-clock-outline" size={22} color="#64748b" />
          <Text className="min-w-0 flex-1 pl-2 text-base text-slate-900 dark:text-white">
            {formatDisplayDateTime(when)}
          </Text>
        </TouchableOpacity>
        {iosPickerOpen ? (
          <View className="mt-2 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/50">
            <DateTimePicker
              value={when}
              mode="datetime"
              display="spinner"
              onChange={onIosChange}
            />
            <TouchableOpacity
              activeOpacity={BUTTON_ACTIVE_OPACITY}
              onPress={closePicker}
              className="border-t border-slate-200 py-3 dark:border-slate-700">
              <Text className="text-center text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                Done
              </Text>
            </TouchableOpacity>
          </View>
        ) : null}
        {androidStep ? (
          <DateTimePicker
            value={when}
            mode={androidStep}
            display="default"
            onChange={onAndroidChange}
          />
        ) : null}
      </View>

      <View>
        <Text className={LABEL}>Note (optional)</Text>
        <Controller
          control={control}
          name={'note' as keyof T & string}
          render={({ field: { onChange, onBlur, value } }) => (
            <IconTextInput
              icon="note-text-outline"
              onBlur={onBlur}
              onFocus={() => scrollNoteIntoView?.()}
              onChangeText={onChange}
              value={(value as string) ?? ''}
              placeholder="Coffee with team"
              multiline
              containerClassName="mb-0"
              wrapperClassName={INPUT_WRAPPER}
              className="min-h-[100px]"
              accessibilityLabel="Expense note"
            />
          )}
        />
      </View>
    </View>
  );
}
