import { AuthFieldLabel, AuthForm, AuthFormCard } from '@/components/ui/AuthForm';
import { Button } from '@/components/ui/Button';
import { IconTextInput } from '@/components/ui/IconTextInput';
import { AppScreen } from '@/components/ui/Screen';
import { passwordResetOtpErrorMessage } from '@/lib/authUserMessage';
import { validateForgotPasswordEmail } from '@/lib/authValidation';
import { isSupabaseConfigured } from '@/lib/supabase';
import { toast } from '@/lib/toast';
import { requestPasswordResetOtp } from '@/services/passwordResetOtp';
import { router } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { Text, View, type TextInput as RNTextInput } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const emailRef = useRef<RNTextInput>(null);

  const trimmed = email.trim();

  const onEmailChange = useCallback((text: string) => {
    setEmail(text);
    toast.hide();
  }, []);

  const onSubmit = useCallback(async () => {
    if (!isSupabaseConfigured) {
      toast.error('Configure Supabase in .env first.', 'Not configured');
      return;
    }
    const validationError = validateForgotPasswordEmail(trimmed);
    if (validationError) {
      toast.error(validationError);
      return;
    }
    setSubmitting(true);
    try {
      const result = await requestPasswordResetOtp(trimmed);
      if ('error' in result) {
        const msg = passwordResetOtpErrorMessage(result.error);
        toast.error(msg, msg === 'Email does not exist.' ? 'Email not found' : undefined);
        return;
      }
      toast.success('Check your email for an 8-digit code.', 'Code sent');
      router.push({
        pathname: '/(auth)/verify-otp',
        params: { email: trimmed.toLowerCase() },
      });
    } finally {
      setSubmitting(false);
    }
  }, [trimmed]);

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
            Configure Supabase in .env first.
          </Text>
        </View>
      </AppScreen>
    );
  }

  return (
    <AuthForm
      title="Reset password"
      showBack
      subtitle="Enter your account email. We will send an 8-digit code to verify it is you.">
      <AuthFormCard>
        <View className="mb-4 flex-row gap-3 rounded-2xl border border-sky-100 bg-sky-50/90 px-3 py-3 dark:border-sky-900/50 dark:bg-sky-950/40">
          <MaterialCommunityIcons name="email-outline" size={22} color="#0284c7" style={{ marginTop: 2 }} />
          <Text className="min-w-0 flex-1 text-xs leading-5 text-sky-950 dark:text-sky-100">
            You will receive an 8-digit code (not a link). It expires in 10 minutes. Check spam
            if needed.
          </Text>
        </View>

        <AuthFieldLabel>Email</AuthFieldLabel>
        <IconTextInput
          ref={emailRef}
          icon="email-outline"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          keyboardType="email-address"
          textContentType="emailAddress"
          returnKeyType="go"
          onSubmitEditing={() => void onSubmit()}
          placeholder="you@example.com"
          value={email}
          onChangeText={onEmailChange}
          accessibilityLabel="Account email"
        />

        <Button
          title="Send verification code"
          onPress={() => void onSubmit()}
          loading={submitting}
          disabled={submitting}
        />
      </AuthFormCard>
    </AuthForm>
  );
}
