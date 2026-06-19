import { CategoryRow } from '@/components/category/CategoryRow';
import { NewCategoryForm } from '@/components/category/NewCategoryForm';
import { BUTTON_ACTIVE_OPACITY } from '@/components/ui/buttonPressable';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { AppScreen } from '@/components/ui/Screen';
import { toast } from '@/lib/toast';
import { useAppStore } from '@/store/useAppStore';
import type { Category } from '@/types/models';
import { categoryIconName } from '@/utils/categoryIcons';
import { useKeyboardMetrics } from '@/hooks/useKeyboardMetrics';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { router } from 'expo-router';
import { memo, useCallback, useMemo, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Text,
  View,
  type ListRenderItem,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const CategoriesListHeader = memo(function CategoriesListHeader({
  categoriesCount,
}: {
  categoriesCount: number;
}) {
  return (
    <View className="pb-2">
      <View className="mb-4 flex-row items-center px-4">
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Go back"
          activeOpacity={BUTTON_ACTIVE_OPACITY}
          onPress={() => router.back()}
          className="h-10 w-10 items-center justify-center rounded-full border border-slate-200/90 bg-white active:opacity-80 dark:border-slate-700 dark:bg-slate-900">
          <MaterialCommunityIcons name="arrow-left" size={22} color="#64748b" />
        </TouchableOpacity>
      </View>

      <View className="mx-4 mb-5 overflow-hidden rounded-3xl border border-violet-200 bg-violet-600 p-5 dark:border-violet-800 dark:bg-violet-700">
        <View className="flex-row items-center gap-4">
          <View className="h-14 w-14 items-center justify-center rounded-2xl bg-white/20">
            <MaterialCommunityIcons name="shape-outline" size={30} color="#ffffff" />
          </View>
          <View className="min-w-0 flex-1">
            <Text className="text-xl font-bold text-white">Categories</Text>
            <Text className="mt-1 text-sm leading-5 text-violet-100">
              Organize spending with custom labels, icons, and colors.
            </Text>
          </View>
        </View>
        <View className="mt-3 rounded-2xl bg-white/15 px-3.5 py-2.5">
          <Text className="text-sm font-semibold text-white">
            {categoriesCount} {categoriesCount === 1 ? 'category' : 'categories'} · tap a color dot
            to update
          </Text>
        </View>
      </View>
    </View>
  );
});

const ListFooterTitle = memo(function ListFooterTitle() {
  return (
    <Text className="mb-2 px-4 text-[11px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
      Your categories
    </Text>
  );
});

export default function CategoriesScreen() {
  const insets = useSafeAreaInsets();
  const { visible: keyboardOpen, height: keyboardHeight } = useKeyboardMetrics();
  const categories = useAppStore((s) => s.categories);
  const addCategory = useAppStore((s) => s.addCategory);
  const updateCategory = useAppStore((s) => s.updateCategory);
  const removeCategory = useAppStore((s) => s.removeCategory);
  const [pendingDelete, setPendingDelete] = useState<Category | null>(null);

  const handleAdd = useCallback(
    (payload: { name: string; icon: string; color: string }) =>
      addCategory({ name: payload.name, icon: payload.icon, color: payload.color }),
    [addCategory]
  );

  const handleColorChange = useCallback(
    (id: string, color: string) => updateCategory(id, { color }),
    [updateCategory]
  );

  const confirmDelete = useCallback(() => {
    if (!pendingDelete) return;
    const label = pendingDelete.name;
    removeCategory(pendingDelete.id);
    setPendingDelete(null);
    toast.success(`“${label}” and its expenses were removed.`, 'Category deleted');
  }, [pendingDelete, removeCategory]);

  const renderItem = useCallback<ListRenderItem<Category>>(
    ({ item }) => (
      <CategoryRow
        item={item}
        onDelete={setPendingDelete}
        onColorChange={handleColorChange}
      />
    ),
    [handleColorChange]
  );

  const listHeader = useMemo(
    () => (
      <>
        <CategoriesListHeader categoriesCount={categories.length} />
        <NewCategoryForm onAdd={handleAdd} />
        <ListFooterTitle />
      </>
    ),
    [categories.length, handleAdd]
  );

  const listContentStyle = useMemo(
    () => ({
      flexGrow: 1,
      paddingBottom: keyboardOpen
        ? keyboardHeight + insets.bottom + 24
        : insets.bottom + 32,
    }),
    [insets.bottom, keyboardHeight, keyboardOpen]
  );

  return (
    <AppScreen scroll={false} insetBottom={false}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <FlatList
          data={categories}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          ListHeaderComponent={listHeader}
          contentContainerStyle={listContentStyle}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          automaticallyAdjustKeyboardInsets
          removeClippedSubviews
          initialNumToRender={8}
          maxToRenderPerBatch={6}
          windowSize={7}
        />
      </KeyboardAvoidingView>

      <ConfirmModal
        visible={pendingDelete !== null}
        tone="danger"
        title="Delete this category?"
        message={
          pendingDelete
            ? `“${pendingDelete.name}” will be removed. All expenses in this category will also be deleted.`
            : ''
        }
        confirmLabel="Delete"
        cancelLabel="Keep it"
        onClose={() => setPendingDelete(null)}
        onConfirm={confirmDelete}>
        {pendingDelete ? (
          <View className="flex-row items-center gap-3 rounded-2xl border border-slate-200/90 bg-slate-50 px-4 py-3.5 dark:border-slate-700 dark:bg-slate-800/80">
            <View
              className="h-12 w-12 items-center justify-center rounded-2xl"
              style={{ backgroundColor: `${pendingDelete.color}22` }}>
              <MaterialCommunityIcons
                name={categoryIconName(pendingDelete.icon)}
                size={24}
                color={pendingDelete.color}
              />
            </View>
            <Text className="flex-1 text-base font-semibold text-slate-900 dark:text-white">
              {pendingDelete.name}
            </Text>
          </View>
        ) : null}
      </ConfirmModal>
    </AppScreen>
  );
}

const keyExtractor = (item: Category) => item.id;
