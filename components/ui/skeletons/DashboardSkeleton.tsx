import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { AppScreen } from '@/components/ui/Screen';
import { View } from 'react-native';

function ListRowSkeleton() {
  return (
    <View className="mb-3 flex-row items-center justify-between rounded-2xl bg-slate-50 p-3 dark:bg-slate-800/80">
      <View className="flex-row items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-full" />
        <View className="gap-2">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-3 w-36" />
        </View>
      </View>
      <Skeleton className="h-5 w-16" />
    </View>
  );
}

/** Placeholder layout matching the home dashboard while cloud data loads. */
export function DashboardSkeleton() {
  return (
    <AppScreen scroll variant="tab">
      <View className="px-4">
        <View className="mb-4 flex-row items-center justify-between gap-3">
          <View className="flex-1 gap-2">
            <Skeleton className="h-8 w-36" />
            <Skeleton className="h-4 w-44" />
          </View>
          <View className="flex-row items-center gap-2">
            <View className="gap-1.5">
              <Skeleton className="h-3.5 w-20" />
              <Skeleton className="h-3 w-24" />
            </View>
            <Skeleton className="h-11 w-11 rounded-full" />
          </View>
        </View>

        <View className="mb-4 overflow-hidden rounded-3xl bg-slate-200 p-5 dark:bg-slate-800">
          <Skeleton className="mb-2 h-3 w-24 bg-slate-300 dark:bg-slate-600" />
          <Skeleton className="h-9 w-36 bg-slate-300 dark:bg-slate-600" />
        </View>

        <View className="mb-4 flex-row flex-wrap gap-3">
          <Skeleton className="h-[72px] min-w-[30%] flex-1 rounded-2xl" />
          <Skeleton className="h-[72px] min-w-[30%] flex-1 rounded-2xl" />
          <Skeleton className="h-[72px] min-w-[30%] flex-1 rounded-2xl" />
        </View>

        <Card className="mb-4">
          <Skeleton className="mb-4 h-5 w-32" />
          <Skeleton className="mb-3 h-4 w-full" />
          <Skeleton className="mb-3 h-4 w-[92%]" />
          <Skeleton className="h-4 w-[78%]" />
        </Card>

        <View className="mb-4 flex-row gap-3">
          <Skeleton className="h-20 flex-1 rounded-2xl" />
          <Skeleton className="h-20 flex-1 rounded-2xl" />
        </View>

        <Card className="mb-4">
          <Skeleton className="mb-4 h-5 w-36" />
          <Skeleton className="mb-3 h-4 w-full" />
          <Skeleton className="mb-3 h-4 w-full" />
          <Skeleton className="h-4 w-[66%]" />
        </Card>

        <Card>
          <View className="mb-4 flex-row gap-3">
            <Skeleton className="h-[52px] flex-1 rounded-2xl" />
            <Skeleton className="h-[52px] flex-1 rounded-2xl" />
          </View>
          <Skeleton className="mb-2 h-5 w-44" />
          <Skeleton className="mb-4 h-3 w-28" />
          <ListRowSkeleton />
          <ListRowSkeleton />
          <ListRowSkeleton />
        </Card>
      </View>
    </AppScreen>
  );
}
