import { Button } from '@/components/ui/Button';
import { useAppStore } from '@/store/useAppStore';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  type ListRenderItem,
  Text,
  View,
  useColorScheme,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

const SLIDES = [
  {
    key: '1',
    title: 'Track in seconds',
    body: 'Log amount, category, and an optional note. Pennibly keeps the flow fast.',
  },
  {
    key: '2',
    title: 'See the full picture',
    body: 'Dashboards, filters, and gentle charts help you understand spending at a glance.',
  },
  {
    key: '3',
    title: 'Own your data',
    body: 'Everything stays on your device. Export polished PDF, Word-friendly, or Excel reports anytime.',
  },
];

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const scheme = useColorScheme();
  const listRef = useRef<FlatList>(null);
  const [index, setIndex] = useState(0);
  const setOnboardingCompleted = useAppStore((s) => s.setOnboardingCompleted);

  const renderItem: ListRenderItem<(typeof SLIDES)[number]> = ({ item }) => (
    <View style={{ width }} className="flex-1 justify-center px-8 pb-24">
      <Text className="text-3xl font-bold text-slate-900 dark:text-white">{item.title}</Text>
      <Text className="mt-4 text-lg leading-7 text-slate-600 dark:text-slate-300">{item.body}</Text>
    </View>
  );

  const finish = () => {
    setOnboardingCompleted(true);
    router.replace('/(tabs)');
  };

  const isDark = scheme === 'dark';

  return (
    <View className="flex-1 bg-white dark:bg-slate-950">
      <LinearGradient
        colors={isDark ? ['#0f172a', '#1e1b4b'] : ['#eef2ff', '#f8fafc']}
        style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
      />
      <View style={{ paddingTop: insets.top + 12 }} className="flex-1">
        <Text className="px-8 text-sm font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-300">
          Welcome
        </Text>
        <FlatList
          ref={listRef}
          data={SLIDES}
          horizontal
          pagingEnabled
          getItemLayout={(_, i) => ({
            length: width,
            offset: width * i,
            index: i,
          })}
          showsHorizontalScrollIndicator={false}
          keyExtractor={(i) => i.key}
          renderItem={renderItem}
          onMomentumScrollEnd={(e) => {
            const i = Math.round(e.nativeEvent.contentOffset.x / width);
            setIndex(i);
          }}
        />
        <View className="flex-row items-center justify-center gap-2 pb-4">
          {SLIDES.map((s, i) => (
            <View
              key={s.key}
              className={`h-2 rounded-full ${i === index ? 'w-6 bg-indigo-600' : 'w-2 bg-slate-300 dark:bg-slate-600'}`}
            />
          ))}
        </View>
        <View className="gap-3 px-6" style={{ paddingBottom: insets.bottom + 16 }}>
          {index < SLIDES.length - 1 ? (
            <Button
              title="Next"
              icon="arrow-right"
              iconPosition="right"
              onPress={() => {
                listRef.current?.scrollToIndex({ index: index + 1, animated: true });
              }}
            />
          ) : (
            <Button title="Get started" onPress={finish} />
          )}
          <Button title="Skip" variant="ghost" onPress={finish} />
        </View>
      </View>
    </View>
  );
}
