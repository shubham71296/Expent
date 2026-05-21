import { AuthFieldLabel, AuthForm, AuthFormCard } from '@/components/ui/AuthForm';
import { Button } from '@/components/ui/Button';
import { IconTextInput } from '@/components/ui/IconTextInput';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { AppScreen } from '@/components/ui/Screen';
import { credentialAuthErrorMessage } from '@/lib/authUserMessage';
import { validateLoginFields } from '@/lib/authValidation';
import { readSubscriptionFromUser } from '@/lib/subscriptionMetadata';
import { isSupabaseConfigured } from '@/lib/supabase';
import { toast } from '@/lib/toast';
import { useSupabase } from '@/providers/SupabaseProvider';
import { router } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { BUTTON_ACTIVE_OPACITY } from '@/components/ui/buttonPressable';
import { Text, TouchableOpacity, View, type TextInput as RNTextInput } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

export default function LoginScreen() {
  const { signInWithPassword } = useSupabase();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const emailRef = useRef<RNTextInput>(null);
  const passwordRef = useRef<RNTextInput>(null);

  const trimmedEmail = email.trim();

  const onEmailChange = useCallback((text: string) => {
    setEmail(text);
    toast.hide();
  }, []);

  const onPasswordChange = useCallback((text: string) => {
    setPassword(text);
    toast.hide();
  }, []);

  const onSubmit = useCallback(async () => {
    if (!isSupabaseConfigured) {
      toast.error('Add keys to .env and restart Expo.', 'Not configured');
      return;
    }
    const validationError = validateLoginFields(trimmedEmail, password);
    if (validationError) {
      toast.error(validationError);
      return;
    }
    setSubmitting(true);
    try {
      const { error: err, session: signedIn } = await signInWithPassword(trimmedEmail, password);
      if (err) {
        toast.error(credentialAuthErrorMessage(err));
        return;
      }
      const sub = readSubscriptionFromUser(signedIn?.user ?? null);
      if (!sub.onboardingComplete) {
        toast.info('Choose a plan to continue to the app.', 'Subscription required');
        router.replace('/subscription-plans');
        return;
      }
      toast.success('You are signed in.', 'Welcome back');
      router.replace('/(tabs)');
    } finally {
      setSubmitting(false);
    }
  }, [trimmedEmail, password, signInWithPassword]);

  if (!isSupabaseConfigured) {
    return (
      <AppScreen scroll variant="auth">
        <View className="mx-4 max-w-md self-center rounded-3xl border border-amber-200/90 bg-white p-6 shadow-md dark:border-amber-900/50 dark:bg-slate-900">
          <View className="mb-3 items-center">
            <View className="h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 dark:bg-amber-950/50">
              <MaterialCommunityIcons name="alert-circle-outline" size={28} color="#d97706" />
            </View>
          </View>
          <Text className="text-center text-base font-semibold text-slate-900 dark:text-white">
            Supabase not configured
          </Text>
          <Text className="mt-2 text-center text-sm leading-6 text-slate-600 dark:text-slate-400">
            Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY to your .env file, then
            restart the app.
          </Text>
        </View>
      </AppScreen>
    );
  }

  return (
    <AuthForm
      title="Sign in"
      subtitle="Welcome back — sign in to sync your categories and expenses."
      footer={
        <View className="flex-row flex-wrap items-center justify-center gap-1">
          <Text className="text-sm text-slate-600 dark:text-slate-400">No account?</Text>
          <TouchableOpacity
            onPress={() => router.push('/(auth)/register')}
            activeOpacity={BUTTON_ACTIVE_OPACITY}
            accessibilityRole="link"
            accessibilityLabel="Create account">
            <Text className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">
              Create one
            </Text>
          </TouchableOpacity>
        </View>
      }>
      <AuthFormCard>
        <AuthFieldLabel>Email</AuthFieldLabel>
        <IconTextInput
          ref={emailRef}
          icon="email-outline"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          keyboardType="email-address"
          textContentType="emailAddress"
          returnKeyType="next"
          blurOnSubmit={false}
          onSubmitEditing={() => passwordRef.current?.focus()}
          placeholder="you@example.com"
          value={email}
          onChangeText={onEmailChange}
          accessibilityLabel="Email address"
        />

        <AuthFieldLabel>Password</AuthFieldLabel>
        <PasswordInput
          ref={passwordRef}
          icon="lock-outline"
          placeholder="Your password"
          value={password}
          onChangeText={onPasswordChange}
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="password"
          textContentType="password"
          returnKeyType="go"
          onSubmitEditing={() => void onSubmit()}
          containerClassName="mb-4"
          accessibilityLabel="Password"
        />

        <TouchableOpacity
          className="mb-5 self-start py-1"
          activeOpacity={BUTTON_ACTIVE_OPACITY}
          onPress={() => router.push('/(auth)/forgot-password')}
          accessibilityRole="link"
          accessibilityLabel="Forgot password">
          <Text className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">
            Forgot password?
          </Text>
        </TouchableOpacity>

        <Button title="Sign in" onPress={() => void onSubmit()} loading={submitting} disabled={submitting} />
      </AuthFormCard>
    </AuthForm>
  );
}
