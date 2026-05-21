import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { forwardRef, useState } from 'react';
import { BUTTON_ACTIVE_OPACITY } from '@/components/ui/buttonPressable';
import {
  TextInput,
  TouchableOpacity,
  View,
  type TextInput as RNTextInput,
  type TextInputProps,
} from 'react-native';
import type { InputIconName } from '@/components/ui/IconTextInput';

const wrapperClass =
  'relative flex-row items-center rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-600 dark:bg-slate-800/80';

const fieldClass =
  'min-w-0 flex-1 py-3.5 pl-2 pr-12 text-base text-slate-900 dark:text-white';

type Props = Omit<TextInputProps, 'secureTextEntry'> & {
  containerClassName?: string;
  icon?: InputIconName;
  iconColor?: string;
};

export const PasswordInput = forwardRef<RNTextInput, Props>(function PasswordInput(
  {
    containerClassName = 'mb-3',
    className,
    icon = 'lock-outline',
    iconColor = '#64748b',
    placeholderTextColor = '#94a3b8',
    ...rest
  },
  ref
) {
  const [visible, setVisible] = useState(false);

  return (
    <View className={`${wrapperClass} ${containerClassName}`}>
      <View className="shrink-0 pl-3.5">
        <MaterialCommunityIcons name={icon} size={22} color={iconColor} />
      </View>
      <TextInput
        ref={ref}
        {...rest}
        secureTextEntry={!visible}
        placeholderTextColor={placeholderTextColor}
        className={className ?? fieldClass}
      />
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel={visible ? 'Hide password' : 'Show password'}
        activeOpacity={BUTTON_ACTIVE_OPACITY}
        onPress={() => setVisible((v) => !v)}
        hitSlop={12}
        className="absolute bottom-0 right-0 top-0 justify-center px-3.5">
        <MaterialCommunityIcons
          name={visible ? 'eye-outline' : 'eye-off-outline'}
          size={22}
          color="#64748b"
        />
      </TouchableOpacity>
    </View>
  );
});
