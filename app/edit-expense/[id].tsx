import { ExpenseFormFields } from '@/components/expense/ExpenseFormFields';
import { ExpenseFormLayout } from '@/components/expense/ExpenseFormLayout';
import { Button } from '@/components/ui/Button';
import { DeleteConfirmModal } from '@/components/ui/DeleteConfirmModal';
import { AppScreen } from '@/components/ui/Screen';
import { useFormatExpenseAmount } from '@/hooks/useFormatMoney';
import { toast } from '@/lib/toast';
import { useAppStore } from '@/store/useAppStore';
import { categoryIconName } from '@/utils/categoryIcons';
import { ExpenseListRowContent } from '@/components/expense/ExpenseListRowContent';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { zodResolver } from '@hookform/resolvers/zod';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Text, View } from 'react-native';
import { z } from 'zod';

const schema = z.object({
  amount: z.string().min(1, 'Enter an amount'),
  categoryId: z.string().min(1, 'Pick a category'),
  subCategory: z.string().max(80).optional(),
  note: z.string().max(280).optional(),
  currency: z.string().length(3),
});

type FormValues = z.infer<typeof schema>;

export default function EditExpenseScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const categories = useAppStore((s) => s.categories);
  const primary = useAppStore((s) => s.settings.primaryCurrency);
  const expense = useAppStore((s) => s.expenses.find((e) => e.id === id));
  const updateExpense = useAppStore((s) => s.updateExpense);
  const removeExpense = useAppStore((s) => s.removeExpense);
  const formatExpenseAmount = useFormatExpenseAmount();
  const [when, setWhen] = useState(new Date());
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      amount: '',
      categoryId: '',
      subCategory: '',
      note: '',
      currency: primary,
    },
  });

  useEffect(() => {
    if (!expense) return;
    reset({
      amount: String(expense.originalAmount),
      categoryId: expense.categoryId,
      subCategory: expense.subCategory ?? '',
      note: expense.note,
      currency: expense.currency,
    });
    setWhen(new Date(expense.createdAt));
  }, [expense, reset]);

  if (!expense) {
    return (
      <AppScreen scroll>
        <View className="flex-1 items-center justify-center px-4 py-16">
          <Text className="text-center text-base text-slate-600 dark:text-slate-300">
            Expense not found.
          </Text>
          <View className="mt-6 w-full max-w-xs">
            <Button title="Close" onPress={() => router.back()} />
          </View>
        </View>
      </AppScreen>
    );
  }

  const onSubmit = handleSubmit((values) => {
    const n = parseFloat(values.amount.replace(',', '.'));
    if (isNaN(n) || n <= 0) return;
    updateExpense(expense.id, {
      amount: n,
      currency: values.currency,
      categoryId: values.categoryId,
      subCategory: values.subCategory ?? '',
      note: values.note,
      createdAt: when.toISOString(),
    });
    toast.success('Your changes have been saved.', 'Expense updated');
    router.back();
  });

  const category = categories.find((c) => c.id === expense.categoryId);

  const confirmDelete = () => {
    setDeleting(true);
    removeExpense(expense.id);
    setShowDeleteModal(false);
    setDeleting(false);
    toast.success('The expense has been removed.', 'Expense deleted');
    router.back();
  };

  return (
    <ExpenseFormLayout
      mode="edit"
      subtitle="Update amount, category, sub category, date, or note."
      footer={
        <>
          <Button title="Save changes" onPress={onSubmit} loading={isSubmitting} />
          <Button title="Delete expense" variant="secondary" onPress={() => setShowDeleteModal(true)} />
        </>
      }>
      <ExpenseFormFields
        control={control}
        errors={errors}
        categories={categories}
        when={when}
        onWhenChange={setWhen}
      />

      <DeleteConfirmModal
        visible={showDeleteModal}
        title="Delete this expense?"
        message="This will permanently remove the entry from your records. You can’t undo this action."
        confirmLabel="Delete"
        cancelLabel="Keep it"
        loading={deleting}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}>
        <View className="flex-row items-start gap-3 rounded-2xl border border-slate-200/90 bg-slate-50 px-4 py-3.5 dark:border-slate-700 dark:bg-slate-800/80">
          <View
            className="mt-0.5 h-12 w-12 shrink-0 items-center justify-center rounded-2xl"
            style={{ backgroundColor: `${category?.color ?? '#64748b'}22` }}>
            <MaterialCommunityIcons
              name={categoryIconName(category?.icon ?? 'dots-horizontal')}
              size={24}
              color={category?.color ?? '#64748b'}
            />
          </View>
          <ExpenseListRowContent
            expense={expense}
            categoryName={category?.name ?? 'Expense'}
            categoryColor={category?.color ?? '#64748b'}
          />
          <Text className="shrink-0 text-base font-bold text-rose-600 dark:text-rose-400">
            {formatExpenseAmount(expense)}
          </Text>
        </View>
      </DeleteConfirmModal>
    </ExpenseFormLayout>
  );
}
