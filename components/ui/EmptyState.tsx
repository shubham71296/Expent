import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Text, View } from 'react-native';

type Props = {
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
  title: string;
  description?: string;
};

export function EmptyState({ icon = 'wallet-outline', title, description }: Props) {
  return (
    <View
      className="items-center justify-center px-8 py-16"
      accessibilityRole="summary"
      accessibilityLabel={`${title}. ${description ?? ''}`}>
      <MaterialCommunityIcons name={icon} size={48} color="#94a3b8" />
      <Text className="mt-4 text-center text-lg font-semibold text-slate-800 dark:text-slate-100">
        {title}
      </Text>
      {description ? (
        <Text className="mt-2 text-center text-sm text-slate-500 dark:text-slate-400">
          {description}
        </Text>
      ) : null}
    </View>
  );
}
