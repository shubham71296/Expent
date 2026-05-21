import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { useFonts } from 'expo-font';
import 'react-native-reanimated';
import '../global.css';

import { AppToast } from '@/components/AppToast';
import { AppProviders } from '@/providers/AppProviders';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  initialRouteName: 'index',
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  // Do not return null while fonts load: that unmounts the Stack and breaks
  // NavigationContainer ("Couldn't find a navigation context" on Android).

  return (
    <AppProviders>
      <AppToast />
      <Stack screenOptions={{ headerBackTitle: 'Back' }}>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(onboarding)" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="add-expense"
          options={{ presentation: 'modal', headerShown: false }}
        />
        <Stack.Screen
          name="edit-expense/[id]"
          options={{ presentation: 'modal', headerShown: false }}
        />
        <Stack.Screen
          name="view-expense/[id]"
          options={{ presentation: 'modal', headerShown: false }}
        />
        <Stack.Screen
          name="subscription-plans"
          options={{
            headerShown: false,
            animation: 'fade',
            gestureEnabled: false,
          }}
        />
        <Stack.Screen
          name="razorpay-checkout"
          options={{
            headerShown: false,
            animation: 'fade',
            gestureEnabled: false,
          }}
        />
        <Stack.Screen name="reports" options={{ headerShown: false }} />
        <Stack.Screen name="categories" options={{ headerShown: false }} />
        <Stack.Screen
          name="signing-out"
          options={{
            headerShown: false,
            gestureEnabled: false,
            animation: 'fade',
          }}
        />
      </Stack>
    </AppProviders>
  );
}
