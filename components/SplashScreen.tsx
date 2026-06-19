import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

const penniblyLogo = require('@/assets/images/icon.png');
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Props = {
  /** Optional status line under the tagline (e.g. "Checking account…"). */
  message?: string;
};

function LoadingDot({ delayMs }: { delayMs: number }) {
  const opacity = useSharedValue(0.35);

  useEffect(() => {
    opacity.value = withDelay(
      delayMs,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 420, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.35, { duration: 420, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      )
    );
  }, [delayMs, opacity]);

  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return <Animated.View style={[styles.dot, style]} />;
}

export function SplashScreen({ message }: Props) {
  const insets = useSafeAreaInsets();

  const logoOpacity = useSharedValue(0);
  const logoScale = useSharedValue(0.88);
  const logoRotate = useSharedValue(-6);
  const titleOpacity = useSharedValue(0);
  const titleY = useSharedValue(18);
  const tagOpacity = useSharedValue(0);
  const orb1 = useSharedValue(0);
  const orb2 = useSharedValue(0);

  useEffect(() => {
    orb1.value = withTiming(1, { duration: 900, easing: Easing.out(Easing.cubic) });
    orb2.value = withDelay(120, withTiming(1, { duration: 900, easing: Easing.out(Easing.cubic) }));

    logoOpacity.value = withTiming(1, { duration: 550, easing: Easing.out(Easing.cubic) });
    logoScale.value = withSequence(
      withTiming(1.04, { duration: 480, easing: Easing.out(Easing.back(1.4)) }),
      withTiming(1, { duration: 220 })
    );
    logoRotate.value = withTiming(0, { duration: 600, easing: Easing.out(Easing.cubic) });

    titleOpacity.value = withDelay(280, withTiming(1, { duration: 480 }));
    titleY.value = withDelay(280, withTiming(0, { duration: 480, easing: Easing.out(Easing.cubic) }));
    tagOpacity.value = withDelay(420, withTiming(1, { duration: 450 }));
  }, [logoOpacity, logoScale, logoRotate, titleOpacity, titleY, tagOpacity, orb1, orb2]);

  const orb1Style = useAnimatedStyle(() => ({
    opacity: orb1.value * 0.55,
    transform: [{ scale: 0.92 + orb1.value * 0.08 }],
  }));

  const orb2Style = useAnimatedStyle(() => ({
    opacity: orb2.value * 0.45,
    transform: [{ scale: 0.9 + orb2.value * 0.1 }],
  }));

  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }, { rotate: `${logoRotate.value}deg` }],
  }));

  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ translateY: titleY.value }],
  }));

  const tagStyle = useAnimatedStyle(() => ({
    opacity: tagOpacity.value,
  }));

  return (
    <View className="flex-1 bg-indigo-950">
      <LinearGradient
        colors={['#1e1b4b', '#4338ca', '#4f46e5', '#6366f1']}
        locations={[0, 0.35, 0.65, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <Animated.View style={[styles.orb, styles.orbTopRight, orb1Style]} />
      <Animated.View style={[styles.orb, styles.orbBottomLeft, orb2Style]} />
      <View style={[styles.orb, styles.orbCenter]} />

      <View
        className="flex-1 items-center justify-center px-8"
        style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}>
        <Animated.View style={[logoStyle, styles.logoWrap]}>
          <View style={styles.logoGlow} />
          <Image source={penniblyLogo} style={styles.logoImage} accessibilityLabel="Pennibly logo" />
        </Animated.View>

        <Animated.View style={[titleStyle, styles.titleBlock]}>
          <Text style={styles.brand}>Pennibly</Text>
          <View style={styles.badgeRow}>
            <View style={styles.badge}>
              <MaterialCommunityIcons name="chart-line" size={14} color="#c7d2fe" />
              <Text style={styles.badgeText}>Smart tracking</Text>
            </View>
          </View>
        </Animated.View>

        <Animated.Text style={[tagStyle, styles.tagline]}>
          Expense tracking, simplified
        </Animated.Text>

        <View style={styles.pills}>
          {(['Track', 'Sync', 'Insights'] as const).map((label) => (
            <View key={label} style={styles.pill}>
              <Text style={styles.pillText}>{label}</Text>
            </View>
          ))}
        </View>

        <View style={styles.loaderRow}>
          <LoadingDot delayMs={0} />
          <LoadingDot delayMs={160} />
          <LoadingDot delayMs={320} />
        </View>

        {message ? <Text style={styles.message}>{message}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  orb: {
    position: 'absolute',
    borderRadius: 9999,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  orbTopRight: {
    width: 220,
    height: 220,
    top: -60,
    right: -70,
  },
  orbBottomLeft: {
    width: 180,
    height: 180,
    bottom: 80,
    left: -50,
  },
  orbCenter: {
    width: 320,
    height: 320,
    top: '28%',
    alignSelf: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  logoWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },
  logoGlow: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  logoImage: {
    width: 112,
    height: 112,
    borderRadius: 28,
    shadowColor: '#1e3a8a',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 12,
  },
  titleBlock: {
    alignItems: 'center',
  },
  brand: {
    fontSize: 42,
    fontWeight: '800',
    letterSpacing: -0.5,
    color: '#ffffff',
    textAlign: 'center',
  },
  badgeRow: {
    marginTop: 10,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#e0e7ff',
  },
  tagline: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '500',
    color: '#c7d2fe',
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  pills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginTop: 28,
    maxWidth: 320,
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
  },
  pillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#eef2ff',
    letterSpacing: 0.3,
  },
  loaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 32,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#e0e7ff',
  },
  message: {
    marginTop: 14,
    fontSize: 14,
    fontWeight: '500',
    color: '#a5b4fc',
    textAlign: 'center',
  },
});
