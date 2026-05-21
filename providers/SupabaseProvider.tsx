// import { readSubscriptionFromUser } from '@/lib/subscriptionMetadata';
import { supabase } from '@/lib/supabase';
import {
  clearCloudSession,
  pushLocalDataToCloud,
  resetLocalDataForAccountSwitch,
} from '@/services/cloudSync';
import { useAppStore } from '@/store/useAppStore';
import type { Session } from '@supabase/supabase-js';
import type { ReactNode } from 'react';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

type Ctx = {
  session: Session | null;
  loading: boolean;
  /** True while fetching the signed-in user's cloud data (blocks main UI). */
  cloudSyncLoading: boolean;
  setCloudSyncLoading: (v: boolean) => void;
  signInWithPassword: (
    email: string,
    password: string
  ) => Promise<{ error: Error | null; session: Session | null }>;
  signUpWithPassword: (
    name: string,
    email: string,
    password: string
  ) => Promise<{ error: Error | null; session: Session | null }>;
  resetPasswordForEmail: (email: string) => Promise<{ error: Error | null }>;
  updateProfile: (name: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
};

const SupabaseContext = createContext<Ctx | null>(null);

export function SupabaseProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [cloudSyncLoading, setCloudSyncLoading] = useState(false);

  useEffect(() => {
    if (!supabase) {
      setSession(null);
      setLoading(false);
      setCloudSyncLoading(false);
      return;
    }

    const client = supabase;

    let cancelled = false;
    void client.auth.getSession().then(({ data }) => {
      if (!cancelled) {
        const s = data.session;
        if (s?.user?.id) {
          if (useAppStore.getState().cloudDataUserId !== s.user.id) {
            resetLocalDataForAccountSwitch();
          }
          setCloudSyncLoading(true);
        }
        setSession(s);
        setLoading(false);
      }
    });

    const prepareSession = (next: Session | null) => {
      const nextId = next?.user?.id ?? null;
      if (nextId) {
        if (useAppStore.getState().cloudDataUserId !== nextId) {
          resetLocalDataForAccountSwitch();
        }
        setCloudSyncLoading(true);
      }
      setSession(next);
    };

    const { data: sub } = client.auth.onAuthStateChange((event, next) => {
      if (event === 'SIGNED_OUT') {
        clearCloudSession();
        setCloudSyncLoading(false);
        setSession(next);
        return;
      }

      if (event === 'USER_UPDATED') {
        setSession(next);
        return;
      }

      if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        prepareSession(next);
        return;
      }

      setSession(next);
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  // SUBSCRIPTION_LOGIC_DISABLED — sync plan from user_metadata to local store
  // useEffect(() => {
  //   const u = session?.user;
  //   if (!u) return;
  //   const meta = readSubscriptionFromUser(u);
  //   if (meta.onboardingComplete) {
  //     useAppStore.setState({
  //       subscriptionProductId: meta.productId,
  //       trialEndsAt: meta.trialEndsAt,
  //     });
  //   }
  // }, [session?.user?.id, session?.user?.user_metadata]);

  const signInWithPassword = useCallback(async (email: string, password: string) => {
    if (!supabase) {
      return { error: new Error('Supabase is not configured'), session: null };
    }
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    return { error: error as Error | null, session: data.session ?? null };
  }, []);

  const signUpWithPassword = useCallback(async (name: string, email: string, password: string) => {
    if (!supabase) {
      return { error: new Error('Supabase is not configured'), session: null };
    }
    const trimmedName = name.trim();
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          full_name: trimmedName,
          name: trimmedName,
          // SUBSCRIPTION_LOGIC_DISABLED — require plan pick after sign-up
          // subscription_onboarding_complete: false,
        },
      },
    });
    return { error: error as Error | null, session: data.session ?? null };
  }, []);

  const resetPasswordForEmail = useCallback(async (email: string) => {
    if (!supabase) return { error: new Error('Supabase is not configured') };
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim());
    return { error: error as Error | null };
  }, []);

  const updateProfile = useCallback(async (name: string) => {
    if (!supabase) return { error: new Error('Supabase is not configured') };
    const trimmedName = name.trim();
    const { error } = await supabase.auth.updateUser({
      data: {
        full_name: trimmedName,
        name: trimmedName,
      },
    });
    return { error: error as Error | null };
  }, []);

  const signOut = useCallback(async () => {
    if (!supabase) return;
    const userId = useAppStore.getState().cloudDataUserId;
    if (userId) {
      try {
        await pushLocalDataToCloud(userId);
      } catch (e) {
        console.warn('[Expent sync] sign-out push failed', e);
      }
    }
    clearCloudSession();
    setCloudSyncLoading(false);
    await supabase.auth.signOut();
  }, []);

  const value = useMemo(
    () => ({
      session,
      loading,
      cloudSyncLoading,
      setCloudSyncLoading,
      signInWithPassword,
      signUpWithPassword,
      resetPasswordForEmail,
      updateProfile,
      signOut,
    }),
    [
      session,
      loading,
      cloudSyncLoading,
      signInWithPassword,
      signUpWithPassword,
      resetPasswordForEmail,
      updateProfile,
      signOut,
    ]
  );

  return <SupabaseContext.Provider value={value}>{children}</SupabaseContext.Provider>;
}

export function useSupabase(): Ctx {
  const ctx = useContext(SupabaseContext);
  if (!ctx) {
    throw new Error('useSupabase must be used within SupabaseProvider');
  }
  return ctx;
}
