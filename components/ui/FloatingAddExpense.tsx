import { BUTTON_ACTIVE_OPACITY } from '@/components/ui/buttonPressable';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { router } from 'expo-router';
import { TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export function FloatingAddExpense() {
  const insets = useSafeAreaInsets();
  return (
    <View
      pointerEvents="box-none"
      className="absolute right-4 z-50"
      style={{ bottom: Math.max(insets.bottom, 16) + 56 }}>
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel="Add expense"
        activeOpacity={BUTTON_ACTIVE_OPACITY}
        onPress={() => router.push('/add-expense')}
        className="h-14 w-14 items-center justify-center rounded-full bg-indigo-600 shadow-lg dark:bg-indigo-500">
        <MaterialCommunityIcons name="plus" size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}
