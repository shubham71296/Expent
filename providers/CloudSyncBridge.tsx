import { isSupabaseConfigured } from '@/lib/supabase';
import { useSupabase } from '@/providers/SupabaseProvider';
import {
  clearCloudSession,
  pushLocalDataToCloud,
  resetLocalDataForAccountSwitch,
  syncUserDataFromCloud,
} from '@/services/cloudSync';
import { useAppStore } from '@/store/useAppStore';
import { useEffect, useRef } from 'react';

/**
 * Keeps local categories/expenses aligned with the signed-in Supabase user.
 * Clears local data immediately on account change so another user's rows never flash.
 */
export function CloudSyncBridge() {
  const { session, setCloudSyncLoading } = useSupabase();
  const userId = session?.user?.id;
  const skipPushRef = useRef(false);
  const activeUserRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setCloudSyncLoading(false);
      return;
    }

    if (!userId) {
      activeUserRef.current = null;
      clearCloudSession();
      setCloudSyncLoading(false);
      return;
    }

    const current = userId;
    activeUserRef.current = current;
    skipPushRef.current = true;
    setCloudSyncLoading(true);

    const { cloudDataUserId } = useAppStore.getState();
    if (cloudDataUserId !== null && cloudDataUserId !== current) {
      resetLocalDataForAccountSwitch();
    }

    void syncUserDataFromCloud(current).finally(() => {
      if (activeUserRef.current !== current) return;
      skipPushRef.current = false;
      setCloudSyncLoading(false);
    });

    return () => {
      if (activeUserRef.current === current) {
        activeUserRef.current = null;
      }
    };
  }, [userId, setCloudSyncLoading]);

  useEffect(() => {
    if (!isSupabaseConfigured || !userId) return;

    let timer: ReturnType<typeof setTimeout> | undefined;
    const unsub = useAppStore.subscribe((state, prev) => {
      if (skipPushRef.current) return;
      if (state.cloudDataUserId !== userId) return;
      if (state.expenses === prev.expenses && state.categories === prev.categories) return;
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        void pushLocalDataToCloud(userId).catch((e) =>
        console.warn('[Pennibly sync] push failed', e)
        );
      }, 700);
    });

    return () => {
      unsub();
      if (timer) clearTimeout(timer);
    };
  }, [userId]);

  return null;
}
