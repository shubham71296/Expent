import { ExpenseFormFields } from '@/components/expense/ExpenseFormFields';
import { ExpenseFormLayout } from '@/components/expense/ExpenseFormLayout';
import { Button } from '@/components/ui/Button';
import { toast } from '@/lib/toast';
import { useAppStore } from '@/store/useAppStore';
import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

const schema = z.object({
  amount: z.string().min(1, 'Enter an amount'),
  categoryId: z.string().min(1, 'Pick a category'),
  subCategory: z.string().max(80).optional(),
  note: z.string().max(280).optional(),
  currency: z.string().length(3),
});

type FormValues = z.infer<typeof schema>;

export default function AddExpenseScreen() {
  const categories = useAppStore((s) => s.categories);
  const primary = useAppStore((s) => s.settings.primaryCurrency);
  const addExpense = useAppStore((s) => s.addExpense);
  const [when, setWhen] = useState(new Date());

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      amount: '',
      categoryId: categories[0]?.id ?? '',
      subCategory: '',
      note: '',
      currency: primary,
    },
  });

  const onSubmit = handleSubmit((values) => {
    const n = parseFloat(values.amount.replace(',', '.'));
    if (isNaN(n) || n <= 0) return;
    addExpense({
      amount: n,
      currency: values.currency,
      categoryId: values.categoryId,
      subCategory: values.subCategory,
      note: values.note,
      date: when,
    });
    toast.success('Your expense has been saved.', 'Expense added');
    router.back();
  });

  return (
    <ExpenseFormLayout
      mode="add"
      subtitle="Log what you spent. Currency defaults from Settings."
      footer={<Button title="Save expense" onPress={onSubmit} loading={isSubmitting} />}>
      <ExpenseFormFields
        control={control}
        errors={errors}
        categories={categories}
        when={when}
        onWhenChange={setWhen}
      />
    </ExpenseFormLayout>
  );
}
