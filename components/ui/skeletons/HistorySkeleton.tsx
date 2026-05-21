import { Skeleton } from '@/components/ui/Skeleton';
import { AppScreen } from '@/components/ui/Screen';
import { View } from 'react-native';

function HistoryRowSkeleton() {
  return (
    <View className="mx-4 mb-3 flex-row items-center justify-between rounded-2xl bg-white p-4 dark:bg-slate-900">
      <View className="flex-row items-center gap-3">
        <Skeleton className="h-11 w-11 rounded-2xl" />
        <View className="gap-2">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-3 w-40" />
          <Skeleton className="h-3 w-24" />
        </View>
      </View>
      <Skeleton className="h-6 w-16" />
    </View>
  );
}

/** Placeholder layout matching the history list while data loads. */
export function HistorySkeleton() {
  return (
    <AppScreen variant="tab">
      <View className="px-4 pb-4 pt-2">
        <Skeleton className="mb-2 h-8 w-32" />
        <Skeleton className="mb-4 h-4 w-48" />
        <Skeleton className="mb-3 h-11 w-full rounded-2xl" />
        <View className="mb-4 flex-row gap-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-9 flex-1 rounded-full" />
          ))}
        </View>
      </View>
      {Array.from({ length: 6 }).map((_, i) => (
        <HistoryRowSkeleton key={i} />
      ))}
    </AppScreen>
  );
}
