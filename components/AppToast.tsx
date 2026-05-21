import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useToastStore } from '@/store/useToastStore';
import { useEffect } from 'react';
import { BUTTON_ACTIVE_OPACITY } from '@/components/ui/buttonPressable';
import { Text, TouchableOpacity, useColorScheme, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const STYLES = {
  success: {
    icon: 'check-circle-outline' as const,
    light: { bg: '#ecfdf5', border: '#a7f3d0', text: '#065f46', sub: '#047857' },
    dark: { bg: '#052e16', border: '#166534', text: '#bbf7d0', sub: '#86efac' },
  },
  error: {
    icon: 'alert-circle-outline' as const,
    light: { bg: '#fef2f2', border: '#fecaca', text: '#991b1b', sub: '#b91c1c' },
    dark: { bg: '#450a0a', border: '#991b1b', text: '#fecaca', sub: '#fca5a5' },
  },
  info: {
    icon: 'information-outline' as const,
    light: { bg: '#eef2ff', border: '#c7d2fe', text: '#3730a3', sub: '#4f46e5' },
    dark: { bg: '#1e1b4b', border: '#4338ca', text: '#c7d2fe', sub: '#a5b4fc' },
  },
};

export function AppToast() {
  const scheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const visible = useToastStore((s) => s.visible);
  const type = useToastStore((s) => s.type);
  const title = useToastStore((s) => s.title);
  const message = useToastStore((s) => s.message);
  const hide = useToastStore((s) => s.hide);

  const translateY = useSharedValue(-120);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      translateY.value = withSpring(0, { damping: 18, stiffness: 220 });
      opacity.value = withTiming(1, { duration: 200 });
    } else {
      translateY.value = withTiming(-120, { duration: 200 });
      opacity.value = withTiming(0, { duration: 180 });
    }
  }, [visible, translateY, opacity]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  if (!visible) {
    return null;
  }

  const isDark = scheme === 'dark';
  const style = STYLES[type][isDark ? 'dark' : 'light'];
  const meta = STYLES[type];

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        paddingTop: insets.top + 8,
        paddingHorizontal: 16,
      }}>
      <Animated.View style={animStyle}>
        <TouchableOpacity
          activeOpacity={BUTTON_ACTIVE_OPACITY}
          onPress={hide}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            paddingHorizontal: 16,
            paddingVertical: 14,
            borderRadius: 16,
            backgroundColor: style.bg,
            borderWidth: 1,
            borderColor: style.border,
            shadowColor: '#000',
            shadowOpacity: 0.12,
            shadowRadius: 8,
            shadowOffset: { width: 0, height: 4 },
            elevation: 6,
          }}>
          <MaterialCommunityIcons name={meta.icon} size={26} color={style.text} />
          <View style={{ flex: 1 }}>
            {title ? (
              <Text style={{ fontSize: 15, fontWeight: '700', color: style.text }}>{title}</Text>
            ) : null}
            {message ? (
              <Text style={{ marginTop: 2, fontSize: 13, lineHeight: 18, color: style.sub }}>
                {message}
              </Text>
            ) : null}
          </View>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}
