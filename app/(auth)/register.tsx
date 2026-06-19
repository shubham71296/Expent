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
import { validateRegisterFields } from '@/lib/authValidation';
import { isSupabaseConfigured } from '@/lib/supabase';
import { toast } from '@/lib/toast';
import { useSupabase } from '@/providers/SupabaseProvider';
import { router } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { BUTTON_ACTIVE_OPACITY } from '@/components/ui/buttonPressable';
import { Text, TouchableOpacity, type TextInput as RNTextInput } from 'react-native';

export default function RegisterScreen() {
  const { signUpWithPassword } = useSupabase();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const nameRef = useRef<RNTextInput>(null);
  const emailRef = useRef<RNTextInput>(null);
  const passwordRef = useRef<RNTextInput>(null);
  const confirmRef = useRef<RNTextInput>(null);

  const trimmedName = name.trim();
  const trimmedEmail = email.trim();

  const onNameChange = useCallback((text: string) => {
    setName(text);
    toast.hide();
  }, []);

  const onEmailChange = useCallback((text: string) => {
    setEmail(text);
    toast.hide();
  }, []);

  const onPasswordChange = useCallback((text: string) => {
    setPassword(text);
    toast.hide();
  }, []);

  const onConfirmChange = useCallback((text: string) => {
    setConfirm(text);
    toast.hide();
  }, []);

  const onSubmit = useCallback(async () => {
    if (!isSupabaseConfigured) {
      toast.error('Add keys to .env and restart Expo.', 'Not configured');
      return;
    }
    const validationError = validateRegisterFields(trimmedName, trimmedEmail, password, confirm);
    if (validationError) {
      toast.error(validationError);
      return;
    }
    setSubmitting(true);
    try {
      const { error: err, session } = await signUpWithPassword(trimmedName, trimmedEmail, password);
      if (err) {
        toast.error(credentialAuthErrorMessage(err));
        return;
      }
      if (session) {
        toast.success('Your account is ready.', 'Welcome');
        router.replace('/subscription-plans');
        return;
      }
      toast.success('You can sign in with your email and password.', 'Account created');
      router.replace('/(auth)/login');
    } finally {
      setSubmitting(false);
    }
  }, [trimmedName, trimmedEmail, password, confirm, signUpWithPassword]);

  if (!isSupabaseConfigured) {
    return <AuthNotConfigured />;
  }

  return (
    <AuthForm
      title="Create account"
      showBack
      subtitle="A few details to back up your categories and expenses securely in the cloud."
      icon="account-plus-outline"
      iconColor="#7c3aed"
      iconBg="bg-violet-100 dark:bg-violet-950/60"
      footer={
        <>
          <Text className="text-sm text-slate-600 dark:text-slate-400">Already have an account?</Text>
          <TouchableOpacity
            onPress={() => router.replace('/(auth)/login')}
            activeOpacity={BUTTON_ACTIVE_OPACITY}
            accessibilityRole="link"
            accessibilityLabel="Sign in">
            <Text className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">Sign in</Text>
          </TouchableOpacity>
        </>
      }>
      <AuthFormCard>
        <AuthFieldLabel>Full name</AuthFieldLabel>
        <IconTextInput
          ref={nameRef}
          icon="account-outline"
          autoCapitalize="words"
          autoCorrect={false}
          textContentType="name"
          returnKeyType="next"
          blurOnSubmit={false}
          onSubmitEditing={() => emailRef.current?.focus()}
          placeholder="Jane Doe"
          value={name}
          onChangeText={onNameChange}
          accessibilityLabel="Full name"
        />

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
          placeholder="8+ chars, letter and number"
          value={password}
          onChangeText={onPasswordChange}
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="password-new"
          textContentType="newPassword"
          returnKeyType="next"
          blurOnSubmit={false}
          onSubmitEditing={() => confirmRef.current?.focus()}
          containerClassName="mb-4"
          accessibilityLabel="Password"
        />

        <AuthFieldLabel>Confirm password</AuthFieldLabel>
        <PasswordInput
          ref={confirmRef}
          icon="lock-check-outline"
          placeholder="Repeat password"
          value={confirm}
          onChangeText={onConfirmChange}
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="password-new"
          textContentType="newPassword"
          returnKeyType="go"
          onSubmitEditing={() => void onSubmit()}
          containerClassName="mb-5"
          accessibilityLabel="Confirm password"
        />

        <Button
          title="Create account"
          onPress={() => void onSubmit()}
          loading={submitting}
          disabled={submitting}
        />
      </AuthFormCard>
    </AuthForm>
  );
}
