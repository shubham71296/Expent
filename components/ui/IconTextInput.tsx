import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { forwardRef, memo } from 'react';
import {
  TextInput,
  View,
  type TextInput as RNTextInput,
  type TextInputProps,
} from 'react-native';

export type InputIconName = keyof typeof MaterialCommunityIcons.glyphMap;

const defaultWrapperClass =
  'flex-row rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-600 dark:bg-slate-800/80';

type Props = TextInputProps & {
  icon: InputIconName;
  iconColor?: string;
  containerClassName?: string;
  wrapperClassName?: string;
};

export const IconTextInput = memo(forwardRef<RNTextInput, Props>(function IconTextInput(
  {
    icon,
    iconColor = '#64748b',
    containerClassName = 'mb-4',
    wrapperClassName = defaultWrapperClass,
    className = '',
    multiline,
    editable = true,
    placeholderTextColor = '#94a3b8',
    ...rest
  },
  ref
) {
  const rowAlign = multiline ? 'items-start' : 'items-center';
  const iconPad = multiline ? 'pt-3.5' : '';

  return (
    <View className={`${wrapperClassName} ${rowAlign} ${containerClassName}`}>
      <View className={`shrink-0 pl-3.5 ${iconPad}`}>
        <MaterialCommunityIcons name={icon} size={22} color={iconColor} />
      </View>
      <TextInput
        ref={ref}
        multiline={multiline}
        editable={editable}
        placeholderTextColor={placeholderTextColor}
        className={`min-w-0 flex-1 py-3.5 pl-2 pr-4 text-base text-slate-900 dark:text-white ${
          !editable ? 'opacity-70' : ''
        } ${className}`}
        textAlignVertical={multiline ? 'top' : 'center'}
        {...rest}
      />
    </View>
  );
}));
