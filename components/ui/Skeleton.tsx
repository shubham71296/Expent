import { useEffect } from 'react';
import { View, type ViewProps } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

type Props = ViewProps & {
  className?: string;
  animated?: boolean;
};

export function Skeleton({ className = '', animated = true, style, ...rest }: Props) {
  const opacity = useSharedValue(0.45);

  useEffect(() => {
    if (!animated) return;
    opacity.value = withRepeat(withTiming(1, { duration: 750 }), -1, true);
  }, [animated, opacity]);

  const pulse = useAnimatedStyle(() => ({
    opacity: animated ? opacity.value : 0.55,
  }));

  return (
    <Animated.View
      {...rest}
      style={[pulse, style]}
      className={`rounded-xl bg-slate-200 dark:bg-slate-700 ${className}`}
      accessibilityLabel="Loading"
      accessibilityRole="progressbar"
    />
  );
}
