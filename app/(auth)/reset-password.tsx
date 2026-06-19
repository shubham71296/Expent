import {
  AuthFieldLabel,
  AuthForm,
  AuthFormCard,
  AuthInfoBanner,
} from '@/components/ui/AuthForm';
import { Button } from '@/components/ui/Button';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { validateNewPasswordFields } from '@/lib/authValidation';
import { passwordResetFlow } from '@/lib/passwordResetFlow';
import { isSupabaseConfigured } from '@/lib/supabase';
import { toast } from '@/lib/toast';
import { completePasswordReset } from '@/services/passwordResetOtp';
import { router } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { type TextInput as RNTextInput } from 'react-native';

export default function ResetPasswordScreen() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const confirmRef = useRef<RNTextInput>(null);

  const canReset = passwordResetFlow.isActive();

  const onSubmit = useCallback(async () => {
    if (!isSupabaseConfigured) {
      toast.error('Configure Supabase in .env first.', 'Not configured');
      return;
    }
    if (!passwordResetFlow.isActive()) {
      toast.error('Session expired. Request a new code.');
      router.replace('/(auth)/forgot-password');
      return;
    }
    const validationError = validateNewPasswordFields(password, confirm);
    if (validationError) {
      toast.error(validationError);
      return;
    }
    setSubmitting(true);
    try {
      const result = await completePasswordReset(password);
      if ('error' in result) {
        toast.error(result.error);
        return;
      }
      toast.success('Your password was updated. Sign in with your new password.', 'Done');
      router.replace('/(auth)/login');
    } finally {
      setSubmitting(false);
    }
  }, [password, confirm]);

  if (!canReset) {
    return (
      <AuthForm
        title="Session expired"
        showBack
        step={3}
        totalSteps={3}
        icon="alert-circle-outline"
        iconColor="#d97706"
        iconBg="bg-amber-100 dark:bg-amber-950/50"
        subtitle="Your reset session is missing or expired. Start over to get a new code.">
        <AuthFormCard>
          <AuthInfoBanner icon="clock-alert-outline" tone="warning">
            Go back and verify your email code again to set a new password.
          </AuthInfoBanner>
          <Button title="Start over" onPress={() => router.replace('/(auth)/forgot-password')} />
        </AuthFormCard>
      </AuthForm>
    );
  }

  return (
    <AuthForm
      title="Set new password"
      showBack
      step={3}
      totalSteps={3}
      icon="lock-check-outline"
      iconColor="#059669"
      iconBg="bg-emerald-100 dark:bg-emerald-950/50"
      subtitle="Choose a strong password you have not used here before.">
      <AuthFormCard>
        <AuthInfoBanner icon="shield-check-outline" tone="success">
          Code verified. Enter your new password below — at least 8 characters with a letter and a
          number.
        </AuthInfoBanner>

        <AuthFieldLabel>New password</AuthFieldLabel>
        <PasswordInput
          value={password}
          onChangeText={setPassword}
          placeholder="8+ chars, letter and number"
          autoComplete="new-password"
          textContentType="newPassword"
          returnKeyType="next"
          onSubmitEditing={() => confirmRef.current?.focus()}
          accessibilityLabel="New password"
        />

        <AuthFieldLabel>Confirm password</AuthFieldLabel>
        <PasswordInput
          ref={confirmRef}
          value={confirm}
          onChangeText={setConfirm}
          placeholder="Repeat new password"
          autoComplete="new-password"
          textContentType="newPassword"
          returnKeyType="go"
          onSubmitEditing={() => void onSubmit()}
          containerClassName="mb-5"
          accessibilityLabel="Confirm new password"
        />

        <Button
          title="Update password"
          onPress={() => void onSubmit()}
          loading={submitting}
          disabled={submitting}
        />
      </AuthFormCard>
    </AuthForm>
  );
}
