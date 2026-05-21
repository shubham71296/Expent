import { Button } from '@/components/ui/Button';
import { BUTTON_ACTIVE_OPACITY } from '@/components/ui/buttonPressable';
import { IconTextInput } from '@/components/ui/IconTextInput';
import { Card, CardSectionHeader } from '@/components/ui/Card';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { AppScreen } from '@/components/ui/Screen';
import { toast } from '@/lib/toast';
import { useAppStore } from '@/store/useAppStore';
import type { Category } from '@/types/models';
import { categoryIconName } from '@/utils/categoryIcons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  FlatList,
  TouchableOpacity,
  Text,
  View,
  type ListRenderItem,
} from 'react-native';

const COLORS = [
  '#F97316',
  '#EC4899',
  '#3B82F6',
  '#64748B',
  '#EAB308',
  '#A855F7',
  '#EF4444',
  '#14B8A6',
  '#22C55E',
  '#0EA5E9',
];

const ICON_KEYS = [
  'food',
  'shopping',
  'airplane',
  'file-document',
  'gas-station',
  'movie',
  'heart-pulse',
  'school',
  'cash',
  'dots-horizontal',
  'coffee',
  'car',
  'home',
  'wifi',
];

const INPUT_WRAPPER =
  'flex-row items-center rounded-2xl border border-slate-200/90 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900';

export default function CategoriesScreen() {
  const categories = useAppStore((s) => s.categories);
  const addCategory = useAppStore((s) => s.addCategory);
  const updateCategory = useAppStore((s) => s.updateCategory);
  const removeCategory = useAppStore((s) => s.removeCategory);
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('food');
  const [color, setColor] = useState(COLORS[0]);
  const [pendingDelete, setPendingDelete] = useState<Category | null>(null);

  const create = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const added = addCategory({ name: trimmed, icon, color });
    if (!added) {
      toast.error(
        `A category named “${trimmed}” already exists. Try a different name.`,
        'Category already exists'
      );
      return;
    }
    setName('');
    toast.success(`“${trimmed}” has been added.`, 'Category created');
  };

  const confirmDelete = useCallback(() => {
    if (!pendingDelete) return;
    const label = pendingDelete.name;
    removeCategory(pendingDelete.id);
    setPendingDelete(null);
    toast.success(`“${label}” and its expenses were removed.`, 'Category deleted');
  }, [pendingDelete, removeCategory]);

  const renderItem: ListRenderItem<Category> = ({ item }) => (
    <View className="mx-4 mb-3 overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <View className="flex-row items-center gap-3 p-4">
        <View
          className="h-12 w-12 items-center justify-center rounded-2xl"
          style={{ backgroundColor: `${item.color}22` }}>
          <MaterialCommunityIcons
            name={categoryIconName(item.icon)}
            size={24}
            color={item.color}
          />
        </View>
        <View className="min-w-0 flex-1">
          <Text className="text-base font-bold text-slate-900 dark:text-white">{item.name}</Text>
          {item.isDefault ? (
            <View className="mt-1.5 self-start rounded-full bg-indigo-50 px-2.5 py-0.5 dark:bg-indigo-950/50">
              <Text className="text-[11px] font-semibold text-indigo-700 dark:text-indigo-300">
                Default
              </Text>
            </View>
          ) : null}
        </View>
        {!item.isDefault ? (
          <TouchableOpacity
            accessibilityLabel={`Delete ${item.name}`}
            activeOpacity={BUTTON_ACTIVE_OPACITY}
            onPress={() => setPendingDelete(item)}
            className="h-10 w-10 items-center justify-center rounded-full bg-rose-50 active:opacity-80 dark:bg-rose-950/40">
            <MaterialCommunityIcons name="trash-can-outline" size={20} color="#e11d48" />
          </TouchableOpacity>
        ) : null}
      </View>
      <View className="border-t border-slate-100 bg-slate-50/80 px-4 py-3 dark:border-slate-800 dark:bg-slate-950/40">
        <Text className="mb-2 text-[11px] font-bold uppercase tracking-wide text-slate-500">
          Color
        </Text>
        <View className="flex-row flex-wrap gap-2">
          {COLORS.map((c) => (
            <TouchableOpacity
              key={c}
              accessibilityLabel={`Set color ${c}`}
              activeOpacity={BUTTON_ACTIVE_OPACITY}
              onPress={() => updateCategory(item.id, { color: c })}
              className={`h-9 w-9 rounded-full border-2 ${
                item.color === c ? 'border-indigo-600 dark:border-indigo-400' : 'border-transparent'
              }`}
              style={{ backgroundColor: c }}
            />
          ))}
        </View>
      </View>
    </View>
  );

  const listHeader = (
    <View className="pb-2">
      <View className="mb-4 flex-row items-center px-4">
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Go back"
          activeOpacity={BUTTON_ACTIVE_OPACITY}
          onPress={() => router.back()}
          className="h-10 w-10 items-center justify-center rounded-full border border-slate-200/90 bg-white shadow-sm active:opacity-80 dark:border-slate-700 dark:bg-slate-900">
          <MaterialCommunityIcons name="arrow-left" size={22} color="#64748b" />
        </TouchableOpacity>
      </View>

      <View className="mx-4 mb-5 overflow-hidden rounded-3xl border border-violet-200 bg-violet-600 p-5 shadow-sm dark:border-violet-800 dark:bg-violet-700">
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
            {categories.length} {categories.length === 1 ? 'category' : 'categories'} · tap a color dot
            to update
          </Text>
        </View>
      </View>

      <Card className="mx-4 mb-4 border border-violet-100 dark:border-violet-900/50">
        <CardSectionHeader
          title="New category"
          subtitle="Preview updates as you type"
          icon="plus-circle-outline"
          iconColor="#7c3aed"
          iconBg="bg-violet-100 dark:bg-violet-950/60"
          className="mb-4"
        />

        <View className="mb-4 flex-row items-center gap-3 rounded-2xl border border-slate-200/80 bg-slate-50 px-4 py-3.5 dark:border-slate-700 dark:bg-slate-800/80">
          <View
            className="h-12 w-12 items-center justify-center rounded-2xl"
            style={{ backgroundColor: `${color}22` }}>
            <MaterialCommunityIcons
              name={categoryIconName(icon)}
              size={26}
              color={color}
            />
          </View>
          <View className="min-w-0 flex-1">
            <Text className="text-base font-bold text-slate-900 dark:text-white">
              {name.trim() || 'Category name'}
            </Text>
            <Text className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Live preview</Text>
          </View>
        </View>

        <Text className="mb-2 text-[11px] font-bold uppercase tracking-wide text-slate-500">Name</Text>
        <IconTextInput
          icon="tag-outline"
          placeholder="e.g. Groceries, Rent, Travel"
          value={name}
          onChangeText={setName}
          containerClassName="mb-4"
          wrapperClassName={INPUT_WRAPPER}
        />

        <Text className="mb-2 text-[11px] font-bold uppercase tracking-wide text-slate-500">Icon</Text>
        <View className="mb-4 flex-row flex-wrap gap-2">
          {ICON_KEYS.map((k) => {
            const selected = icon === k;
            return (
              <TouchableOpacity
                key={k}
                activeOpacity={BUTTON_ACTIVE_OPACITY}
                onPress={() => setIcon(k)}
                className={`rounded-xl border p-2.5 ${
                  selected
                    ? 'border-indigo-400 bg-indigo-50 dark:border-indigo-500 dark:bg-indigo-950/50'
                    : 'border-transparent bg-slate-100 dark:bg-slate-800'
                }`}>
                <MaterialCommunityIcons
                  name={categoryIconName(k)}
                  size={22}
                  color={selected ? color : '#64748b'}
                />
              </TouchableOpacity>
            );
          })}
        </View>

        <Text className="mb-2 text-[11px] font-bold uppercase tracking-wide text-slate-500">Color</Text>
        <View className="mb-4 flex-row flex-wrap gap-2">
          {COLORS.map((c) => (
            <TouchableOpacity
              key={c}
              activeOpacity={BUTTON_ACTIVE_OPACITY}
              onPress={() => setColor(c)}
              className={`h-10 w-10 rounded-full border-2 ${
                color === c ? 'border-indigo-600 dark:border-indigo-400' : 'border-transparent'
              }`}
              style={{ backgroundColor: c }}
            />
          ))}
        </View>

        <Button title="Add category" onPress={create} disabled={!name.trim()} />
      </Card>

      <Text className="mb-2 px-4 text-[11px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        Your categories
      </Text>
    </View>
  );

  return (
    <AppScreen scroll={false}>
      <View className="flex-1">
        <FlatList
          data={categories}
          keyExtractor={(c) => c.id}
          renderItem={renderItem}
          ListHeaderComponent={listHeader}
          contentContainerStyle={{ paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
        />
      </View>

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
