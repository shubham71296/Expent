import type { ButtonIconName } from '@/utils/buttonIcons';
import { resolveButtonIcon } from '@/utils/buttonIcons';
import { BUTTON_ACTIVE_OPACITY } from '@/components/ui/buttonPressable';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import {
  ActivityIndicator,
  Text,
  TouchableOpacity,
  useColorScheme,
  type TouchableOpacityProps,
} from 'react-native';

type Variant = 'primary' | 'secondary' | 'ghost' | 'destructive';

type Props = TouchableOpacityProps & {
  title: string;
  variant?: Variant;
  loading?: boolean;
  icon?: ButtonIconName;
  iconPosition?: 'left' | 'right';
};

const VARIANT_BG: Record<Variant, string> = {
  primary: 'bg-indigo-600 dark:bg-indigo-500',
  secondary: 'bg-slate-200 dark:bg-slate-700',
  destructive: 'bg-rose-600 dark:bg-rose-500',
  ghost: 'bg-transparent',
};

const VARIANT_HOVER: Record<Variant, string> = {
  primary: 'web:hover:bg-indigo-700 dark:web:hover:bg-indigo-400',
  secondary: 'web:hover:bg-slate-300 dark:web:hover:bg-slate-600',
  destructive: 'web:hover:bg-rose-700 dark:web:hover:bg-rose-400',
  ghost: 'web:hover:bg-indigo-50 dark:web:hover:bg-indigo-950/50',
};

const VARIANT_TEXT: Record<Variant, string> = {
  primary: 'text-white font-semibold text-base',
  secondary: 'text-slate-900 dark:text-slate-100 font-semibold text-base',
  destructive: 'text-white font-semibold text-base',
  ghost: 'text-indigo-600 dark:text-indigo-300 font-semibold text-base',
};

function iconColor(variant: Variant, scheme: 'light' | 'dark' | null | undefined): string {
  if (variant === 'primary' || variant === 'destructive') return '#ffffff';
  if (variant === 'ghost') return scheme === 'dark' ? '#a5b4fc' : '#4f46e5';
  return scheme === 'dark' ? '#f1f5f9' : '#334155';
}

export function Button({
  title,
  variant = 'primary',
  loading,
  disabled,
  icon,
  iconPosition = 'left',
  className = '',
  activeOpacity = BUTTON_ACTIVE_OPACITY,
  ...rest
}: Props) {
  const scheme = useColorScheme();
  const resolvedIcon = icon ?? resolveButtonIcon(title, variant);
  const color = iconColor(variant, scheme);
  const isDisabled = !!disabled || loading;

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled }}
      disabled={isDisabled}
      activeOpacity={activeOpacity}
      className={`flex-row items-center justify-center gap-2 rounded-2xl px-4 py-3.5 min-h-[48px] ${VARIANT_BG[variant]} ${VARIANT_HOVER[variant]} ${isDisabled ? 'opacity-50' : ''} ${className}`}
      {...rest}>
      {loading ? (
        <ActivityIndicator color={color} />
      ) : (
        <>
          {iconPosition === 'left' ? (
            <MaterialCommunityIcons name={resolvedIcon} size={20} color={color} />
          ) : null}
          <Text className={VARIANT_TEXT[variant]}>{title}</Text>
          {iconPosition === 'right' ? (
            <MaterialCommunityIcons name={resolvedIcon} size={20} color={color} />
          ) : null}
        </>
      )}
    </TouchableOpacity>
  );
}
