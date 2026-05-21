import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { CloudSyncBridge } from '@/providers/CloudSyncBridge';
import { SupabaseProvider } from '@/providers/SupabaseProvider';
import { useAppStore } from '@/store/useAppStore';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 60_000 },
    mutations: { retry: 0 },
  },
});

const NavLight = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#4f46e5',
    background: '#f1f5f9',
    card: '#ffffff',
    text: '#0f172a',
    border: '#e2e8f0',
    notification: '#4f46e5',
  },
};

const NavDark = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: '#818cf8',
    background: '#020617',
    card: '#0f172a',
    text: '#f8fafc',
    border: '#1e293b',
    notification: '#818cf8',
  },
};

export function AppProviders({ children }: { children: React.ReactNode }) {
  const system = useColorScheme();
  const pref = useAppStore((s) => s.settings.theme);
  const resolved = pref === 'system' ? (system ?? 'light') : pref;
  const theme = useMemo(
    () => (resolved === 'dark' ? NavDark : NavLight),
    [resolved]
  );

  return (
    <SafeAreaProvider>
      <SupabaseProvider>
        <CloudSyncBridge />
        <QueryClientProvider client={queryClient}>
          <ThemeProvider value={theme}>{children}</ThemeProvider>
        </QueryClientProvider>
      </SupabaseProvider>
    </SafeAreaProvider>
  );
}
