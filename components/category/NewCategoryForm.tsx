import { Button } from '@/components/ui/Button';
import { BUTTON_ACTIVE_OPACITY } from '@/components/ui/buttonPressable';
import { Card, CardSectionHeader } from '@/components/ui/Card';
import { IconTextInput } from '@/components/ui/IconTextInput';
import { toast } from '@/lib/toast';
import { categoryIconName } from '@/utils/categoryIcons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { memo, useCallback, useState } from 'react';
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
] as const;

const INPUT_WRAPPER =
  'flex-row items-center rounded-2xl border border-slate-200/90 bg-white dark:border-slate-800 dark:bg-slate-900';

type AddPayload = { name: string; icon: string; color: string };

type Props = {
  onAdd: (payload: AddPayload) => boolean;
};

export const NewCategoryForm = memo(function NewCategoryForm({ onAdd }: Props) {
  const [name, setName] = useState('');
  const [icon, setIcon] = useState<string>(ICON_KEYS[0]);
  const [color, setColor] = useState<string>(COLORS[0]);

  const handleIconSelect = useCallback((key: string) => setIcon(key), []);
  const handleColorSelect = useCallback((next: string) => setColor(next), []);

  const create = useCallback(() => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const added = onAdd({ name: trimmed, icon, color });
    if (!added) {
      toast.error(
        `A category named “${trimmed}” already exists. Try a different name.`,
        'Category already exists'
      );
      return;
    }
    setName('');
    toast.success(`“${trimmed}” has been added.`, 'Category created');
  }, [color, icon, name, onAdd]);

  const displayName = name.trim() || 'Category name';

  return (
    <Card className="mx-4 mb-4 border border-violet-100 dark:border-violet-900/50">
      <CardSectionHeader
        title="New category"
        subtitle="Preview updates as you type"
        icon="plus-circle-outline"
        iconColor="#7c3aed"
        iconBg="bg-violet-100 dark:bg-violet-950/60"
        className="mb-4"
      />

      <CategoryPreview name={displayName} icon={icon} color={color} />

      <Text className="mb-2 text-[11px] font-bold uppercase tracking-wide text-slate-500">Name</Text>
      <NameField value={name} onChangeText={setName} />

      <Text className="mb-2 text-[11px] font-bold uppercase tracking-wide text-slate-500">Icon</Text>
      <IconGrid selected={icon} accentColor={color} onSelect={handleIconSelect} />

      <Text className="mb-2 text-[11px] font-bold uppercase tracking-wide text-slate-500">Color</Text>
      <ColorGrid selected={color} onSelect={handleColorSelect} />

      <Button title="Add category" onPress={create} disabled={!name.trim()} />
    </Card>
  );
});

const CategoryPreview = memo(function CategoryPreview({
  name,
  icon,
  color,
}: {
  name: string;
  icon: string;
  color: string;
}) {
  return (
    <View className="mb-4 flex-row items-center gap-3 rounded-2xl border border-slate-200/80 bg-slate-50 px-4 py-3.5 dark:border-slate-700 dark:bg-slate-800/80">
      <View
        className="h-12 w-12 items-center justify-center rounded-2xl"
        style={previewStyles.iconBg(color)}>
        <MaterialCommunityIcons name={categoryIconName(icon)} size={26} color={color} />
      </View>
      <View className="min-w-0 flex-1">
        <Text className="text-base font-bold text-slate-900 dark:text-white">{name}</Text>
        <Text className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Live preview</Text>
      </View>
    </View>
  );
});

const NameField = memo(function NameField({
  value,
  onChangeText,
}: {
  value: string;
  onChangeText: (text: string) => void;
}) {
  return (
    <IconTextInput
      icon="tag-outline"
      placeholder="e.g. Groceries, Rent, Travel"
      value={value}
      onChangeText={onChangeText}
      autoCorrect={false}
      containerClassName="mb-4"
      wrapperClassName={INPUT_WRAPPER}
    />
  );
});

const IconGrid = memo(function IconGrid({
  selected,
  accentColor,
  onSelect,
}: {
  selected: string;
  accentColor: string;
  onSelect: (key: string) => void;
}) {
  return (
    <View className="mb-4 flex-row flex-wrap gap-2">
      {ICON_KEYS.map((key) => (
        <IconOption
          key={key}
          iconKey={key}
          selected={selected === key}
          accentColor={accentColor}
          onPress={onSelect}
        />
      ))}
    </View>
  );
});

const IconOption = memo(function IconOption({
  iconKey,
  selected,
  accentColor,
  onPress,
}: {
  iconKey: string;
  selected: boolean;
  accentColor: string;
  onPress: (key: string) => void;
}) {
  const handlePress = useCallback(() => onPress(iconKey), [iconKey, onPress]);

  return (
    <TouchableOpacity
      activeOpacity={BUTTON_ACTIVE_OPACITY}
      onPress={handlePress}
      style={[styles.iconOption, selected && styles.iconOptionSelected]}>
      <MaterialCommunityIcons
        name={categoryIconName(iconKey)}
        size={22}
        color={selected ? accentColor : '#64748b'}
      />
    </TouchableOpacity>
  );
});

const ColorGrid = memo(function ColorGrid({
  selected,
  onSelect,
}: {
  selected: string;
  onSelect: (color: string) => void;
}) {
  return (
    <View className="mb-4 flex-row flex-wrap gap-2">
      {COLORS.map((c) => (
        <FormColorDot
          key={c}
          color={c}
          selected={selected === c}
          onPress={onSelect}
        />
      ))}
    </View>
  );
});

const FormColorDot = memo(function FormColorDot({
  color,
  selected,
  onPress,
}: {
  color: string;
  selected: boolean;
  onPress: (color: string) => void;
}) {
  const handlePress = useCallback(() => onPress(color), [color, onPress]);

  return (
    <TouchableOpacity
      activeOpacity={BUTTON_ACTIVE_OPACITY}
      onPress={handlePress}
      style={[styles.formColorDot, { backgroundColor: color }, selected && styles.formColorDotSelected]}
    />
  );
});

const previewStyles = {
  iconBg: (color: string) => ({ backgroundColor: `${color}22` }),
};

const styles = StyleSheet.create({
  iconOption: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'transparent',
    padding: 10,
    backgroundColor: '#f1f5f9',
  },
  iconOptionSelected: {
    borderColor: '#818cf8',
    backgroundColor: '#eef2ff',
  },
  formColorDot: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  formColorDotSelected: {
    borderColor: '#4f46e5',
  },
});
