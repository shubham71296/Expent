import {
  AuthFieldLabel,
  AuthFooterLink,
  AuthForm,
  AuthFormCard,
  AuthNotConfigured,
} from '@/components/ui/AuthForm';
import { Button } from '@/components/ui/Button';
import { IconTextInput } from '@/components/ui/IconTextInput';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { credentialAuthErrorMessage } from '@/lib/authUserMessage';
import { validateLoginFields } from '@/lib/authValidation';
import { isSupabaseConfigured } from '@/lib/supabase';
import { toast } from '@/lib/toast';
import { useSupabase } from '@/providers/SupabaseProvider';
import { router } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { BUTTON_ACTIVE_OPACITY } from '@/components/ui/buttonPressable';
import { Text, TouchableOpacity, View, type TextInput as RNTextInput } from 'react-native';

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
      const { error: err } = await signInWithPassword(trimmedEmail, password);
      if (err) {
        toast.error(credentialAuthErrorMessage(err));
        return;
      }
      toast.success('You are signed in.', 'Welcome back');
      router.replace('/(tabs)');
    } finally {
      setSubmitting(false);
    }
  }, [trimmedEmail, password, signInWithPassword]);

  if (!isSupabaseConfigured) {
    return <AuthNotConfigured />;
  }

  return (
    <AuthForm
      title="Sign in"
      subtitle="Welcome back — sign in to sync your categories and expenses across devices."
      icon="login"
      iconColor="#4f46e5"
      iconBg="bg-indigo-100 dark:bg-indigo-900/60"
      footer={
        <>
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
        </>
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
          className="mb-5 self-start rounded-full bg-indigo-50 px-3 py-1.5 dark:bg-indigo-950/50"
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
