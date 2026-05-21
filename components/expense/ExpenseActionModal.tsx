import { ExpenseListRowContent } from '@/components/expense/ExpenseListRowContent';
import { Button } from '@/components/ui/Button';
import { BUTTON_ACTIVE_OPACITY } from '@/components/ui/buttonPressable';
import { DeleteConfirmModal } from '@/components/ui/DeleteConfirmModal';
import { useFormatExpenseAmount } from '@/hooks/useFormatMoney';
import { toast } from '@/lib/toast';
import { useAppStore } from '@/store/useAppStore';
import { categoryIconName } from '@/utils/categoryIcons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Modal, Pressable, Text, TouchableOpacity, useColorScheme, View } from 'react-native';

type Props = {
  visible: boolean;
  expenseId: string | null;
  onClose: () => void;
};

export function ExpenseActionModal({ visible, expenseId, onClose }: Props) {
  const scheme = useColorScheme();
  const expenses = useAppStore((s) => s.expenses);
  const categories = useAppStore((s) => s.categories);
  const removeExpense = useAppStore((s) => s.removeExpense);
  const formatExpenseAmount = useFormatExpenseAmount();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const expense = expenseId ? expenses.find((e) => e.id === expenseId) : undefined;
  const category = expense ? categories.find((c) => c.id === expense.categoryId) : undefined;

  useEffect(() => {
    if (!visible) setShowDeleteModal(false);
  }, [visible]);

  const goView = () => {
    if (!expenseId) return;
    onClose();
    router.push(`/view-expense/${expenseId}`);
  };

  const goEdit = () => {
    if (!expenseId) return;
    onClose();
    router.push(`/edit-expense/${expenseId}`);
  };

  const confirmDelete = () => {
    if (!expenseId) return;
    setDeleting(true);
    removeExpense(expenseId);
    setDeleting(false);
    setShowDeleteModal(false);
    onClose();
    toast.success('The expense has been removed.', 'Expense deleted');
  };

  if (!expense) {
    return (
      <Modal visible={visible && !!expenseId} transparent animationType="fade" onRequestClose={onClose}>
        <View className="flex-1 items-center justify-center px-6">
          <Pressable className="absolute inset-0 bg-slate-900/55" onPress={onClose} />
        </View>
      </Modal>
    );
  }

  const categoryName = category?.name ?? 'Category';
  const categoryColor = category?.color ?? '#64748b';

  return (
    <>
      <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
        <View className="flex-1 items-center justify-center px-6">
          <Pressable
            className="absolute inset-0 bg-slate-900/55"
            onPress={onClose}
            accessibilityLabel="Close"
          />
          <View className="w-full max-w-sm overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
          <View className="items-center bg-sky-50 px-6 pb-5 pt-8 dark:bg-sky-950/25">
            <View className="mb-4 h-[72px] w-[72px] items-center justify-center rounded-full bg-sky-100/90 dark:bg-sky-950/50">
              <View className="h-14 w-14 items-center justify-center rounded-full bg-white dark:bg-slate-900">
                <MaterialCommunityIcons name="receipt-text-outline" size={28} color="#0284c7" />
              </View>
            </View>
            <Text className="text-center text-xl font-bold text-slate-900 dark:text-white">
              Expense
            </Text>
            <Text className="mt-1 text-center text-2xl font-bold text-sky-700 dark:text-sky-300">
              {formatExpenseAmount(expense)}
            </Text>
          </View>

          <View className="border-t border-slate-100 px-5 py-4 dark:border-slate-800">
            <View className="flex-row items-start gap-3 rounded-2xl border border-slate-200/90 bg-slate-50 px-4 py-3.5 dark:border-slate-700 dark:bg-slate-800/80">
              <View
                className="mt-0.5 h-11 w-11 shrink-0 items-center justify-center rounded-2xl"
                style={{ backgroundColor: `${categoryColor}22` }}>
                <MaterialCommunityIcons
                  name={categoryIconName(category?.icon ?? 'dots-horizontal')}
                  size={22}
                  color={categoryColor}
                />
              </View>
              <ExpenseListRowContent
                expense={expense}
                categoryName={categoryName}
                categoryColor={categoryColor}
              />
            </View>
          </View>

          <View className="border-t border-slate-100 px-5 py-3 dark:border-slate-800">
            <View className="flex-row justify-center gap-6">
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="View expense details"
                activeOpacity={BUTTON_ACTIVE_OPACITY}
                onPress={goView}
                className="items-center rounded-xl bg-transparent px-2 py-1.5">
                <MaterialCommunityIcons
                  name="eye-outline"
                  size={18}
                  color={scheme === 'dark' ? '#818cf8' : '#4f46e5'}
                />
                <Text className="mt-0.5 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">
                  View
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Edit expense"
                activeOpacity={BUTTON_ACTIVE_OPACITY}
                onPress={goEdit}
                className="items-center rounded-xl bg-transparent px-2 py-1.5">
                <MaterialCommunityIcons
                  name="pencil-outline"
                  size={18}
                  color={scheme === 'dark' ? '#94a3b8' : '#64748b'}
                />
                <Text className="mt-0.5 text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                  Edit
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Delete expense"
                activeOpacity={BUTTON_ACTIVE_OPACITY}
                onPress={() => setShowDeleteModal(true)}
                className="items-center rounded-xl bg-transparent px-2 py-1.5">
                <MaterialCommunityIcons
                  name="trash-can-outline"
                  size={18}
                  color={scheme === 'dark' ? '#fb7185' : '#e11d48'}
                />
                <Text className="mt-0.5 text-[11px] font-semibold text-rose-600 dark:text-rose-400">
                  Delete
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          <View className="border-t border-slate-100 px-5 pb-4 pt-1 dark:border-slate-800">
            <Button title="Cancel" variant="ghost" onPress={onClose} />
          </View>
        </View>
      </View>
    </Modal>

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
            style={{ backgroundColor: `${categoryColor}22` }}>
            <MaterialCommunityIcons
              name={categoryIconName(category?.icon ?? 'dots-horizontal')}
              size={24}
              color={categoryColor}
            />
          </View>
          <ExpenseListRowContent
            expense={expense}
            categoryName={categoryName}
            categoryColor={categoryColor}
          />
          <Text className="shrink-0 text-base font-bold text-rose-600 dark:text-rose-400">
            {formatExpenseAmount(expense)}
          </Text>
        </View>
      </DeleteConfirmModal>
    </>
  );
}
