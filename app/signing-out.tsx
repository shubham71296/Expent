import { toast } from '@/lib/toast';
import { useSupabase } from '@/providers/SupabaseProvider';
import { router } from 'expo-router';
import { useEffect, useRef } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function SigningOutScreen() {
  const insets = useSafeAreaInsets();
  const { signOut } = useSupabase();
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    void (async () => {
      try {
        await signOut();
        toast.info('See you next time.', 'Signed out');
      } catch (e) {
        console.warn('[Expent] sign out error', e);
        toast.error('Something went wrong while signing out.', 'Sign out');
      } finally {
        router.replace('/(auth)/login');
      }
    })();
  }, [signOut]);

  return (
    <View
      className="flex-1 items-center justify-center bg-slate-50 px-8 dark:bg-slate-950"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}>
      <ActivityIndicator size="large" color="#4f46e5" accessibilityLabel="Signing out" />
      <Text className="mt-8 text-center text-xl font-semibold text-slate-900 dark:text-white">
        Signing you out…
      </Text>
      <Text className="mt-3 max-w-sm text-center text-base leading-relaxed text-slate-500 dark:text-slate-400">
        Finishing sync and closing your session. This usually takes just a moment.
      </Text>
    </View>
  );
}
