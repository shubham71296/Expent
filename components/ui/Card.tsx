import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Text, View, type TextProps, type ViewProps } from 'react-native';

/** True if className sets its own background (avoids stacking `bg-white` + `bg-emerald-…` → two-tone cards). */
function hasCustomBackground(className: string) {
  return /\bbg-/.test(className) || /\bdark:bg-/.test(className);
}

export function Card({ children, className = '' }: ViewProps & { className?: string }) {
  const trimmed = className.trim();
  const defaultSurface = 'bg-white dark:bg-slate-900';
  const surface = hasCustomBackground(trimmed) ? '' : defaultSurface;

  return (
    <View
      className={`rounded-2xl p-4 shadow-sm ${surface} ${trimmed}`.trim()}
      accessibilityRole="none">
      {children}
    </View>
  );
}

export function ScreenTitle({ className, ...props }: TextProps) {
  return (
    <Text
      {...props}
      className={`text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50 ${className ?? ''}`}
      accessibilityRole="header"
    />
  );
}

export function Muted(props: TextProps) {
  return (
    <Text
      {...props}
      className={`text-sm text-slate-500 dark:text-slate-400 ${props.className ?? ''}`}
    />
  );
}

type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

export function BlockIcon({
  name,
  color = '#6366f1',
  containerClassName = 'bg-indigo-50 dark:bg-indigo-950/50',
  size = 22,
}: {
  name: IconName;
  color?: string;
  containerClassName?: string;
  size?: number;
}) {
  return (
    <View className={`h-10 w-10 items-center justify-center rounded-xl ${containerClassName}`}>
      <MaterialCommunityIcons name={name} size={size} color={color} />
    </View>
  );
}

export function CardSectionHeader({
  title,
  subtitle,
  icon,
  iconColor = '#6366f1',
  iconBg = 'bg-indigo-50 dark:bg-indigo-950/50',
  className = 'mb-3',
}: {
  title: string;
  subtitle?: string;
  icon: IconName;
  iconColor?: string;
  iconBg?: string;
  className?: string;
}) {
  return (
    <View className={`flex-row items-center gap-3 ${className}`}>
      <BlockIcon name={icon} color={iconColor} containerClassName={iconBg} />
      <View className="min-w-0 flex-1">
        <Text className="text-base font-semibold text-slate-900 dark:text-white">{title}</Text>
        {subtitle ? (
          <Text className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{subtitle}</Text>
        ) : null}
      </View>
    </View>
  );
}
