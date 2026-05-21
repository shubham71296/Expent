import { AuthFieldLabel, AuthForm, AuthFormCard } from '@/components/ui/AuthForm';
import { Button } from '@/components/ui/Button';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { validateNewPasswordFields } from '@/lib/authValidation';
import { passwordResetFlow } from '@/lib/passwordResetFlow';
import { isSupabaseConfigured } from '@/lib/supabase';
import { toast } from '@/lib/toast';
import { completePasswordReset } from '@/services/passwordResetOtp';
import { router } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { Text, View, type TextInput as RNTextInput } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

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
      <AuthForm title="New password" showBack subtitle="Your reset session is missing or expired.">
        <AuthFormCard>
          <View className="mb-4 flex-row gap-3 rounded-2xl border border-amber-100 bg-amber-50/90 px-3 py-3 dark:border-amber-900/50 dark:bg-amber-950/40">
            <MaterialCommunityIcons name="alert-outline" size={22} color="#d97706" style={{ marginTop: 2 }} />
            <Text className="min-w-0 flex-1 text-xs leading-5 text-amber-950 dark:text-amber-100">
              Go back and verify your email code again.
            </Text>
          </View>
          <Button title="Start over" onPress={() => router.replace('/(auth)/forgot-password')} />
        </AuthFormCard>
      </AuthForm>
    );
  }

  return (
    <AuthForm
      title="Set new password"
      showBack
      subtitle="Choose a strong password you have not used here before.">
      <AuthFormCard>
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
