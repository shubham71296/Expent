import { DashboardSkeleton } from '@/components/ui/skeletons/DashboardSkeleton';
import { HistorySkeleton } from '@/components/ui/skeletons/HistorySkeleton';
import { isSupabaseConfigured } from '@/lib/supabase';
import { useSupabase } from '@/providers/SupabaseProvider';
import { useSegments } from 'expo-router';
import type { ReactNode } from 'react';

/** Hides children until the signed-in user's cloud data has finished loading. */
export function CloudSyncGate({ children }: { children: ReactNode }) {
  const { session, cloudSyncLoading } = useSupabase();
  const segments = useSegments() as string[];
  const onHistoryTab = segments.includes('history');

  if (!isSupabaseConfigured || !session) {
    return <>{children}</>;
  }

  if (cloudSyncLoading) {
    return onHistoryTab ? <HistorySkeleton /> : <DashboardSkeleton />;
  }

  return <>{children}</>;
}
