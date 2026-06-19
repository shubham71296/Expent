import { BUTTON_ACTIVE_OPACITY } from '@/components/ui/buttonPressable';
import { categoryIconName } from '@/utils/categoryIcons';
import type { Category } from '@/types/models';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { memo, useCallback } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

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
] as const;

type Props = {
  item: Category;
  onDelete: (category: Category) => void;
  onColorChange: (id: string, color: string) => void;
};

export const CategoryRow = memo(function CategoryRow({ item, onDelete, onColorChange }: Props) {
  const handleDelete = useCallback(() => onDelete(item), [item, onDelete]);

  return (
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
            onPress={handleDelete}
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
            <ColorDot
              key={c}
              color={c}
              selected={item.color === c}
              onPress={() => onColorChange(item.id, c)}
            />
          ))}
        </View>
      </View>
    </View>
  );
});

const ColorDot = memo(function ColorDot({
  color,
  selected,
  onPress,
}: {
  color: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      accessibilityLabel={`Set color ${color}`}
      activeOpacity={BUTTON_ACTIVE_OPACITY}
      onPress={onPress}
      style={[styles.colorDot, { backgroundColor: color }, selected && styles.colorDotSelected]}
    />
  );
});

const styles = StyleSheet.create({
  colorDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorDotSelected: {
    borderColor: '#4f46e5',
  },
});
