import {
  AuthFieldLabel,
  AuthForm,
  AuthFormCard,
  AuthInfoBanner,
  AuthNotConfigured,
} from '@/components/ui/AuthForm';
import { Button } from '@/components/ui/Button';
import { IconTextInput } from '@/components/ui/IconTextInput';
import { passwordResetOtpErrorMessage } from '@/lib/authUserMessage';
import { validateForgotPasswordEmail } from '@/lib/authValidation';
import { isSupabaseConfigured } from '@/lib/supabase';
import { toast } from '@/lib/toast';
import { requestPasswordResetOtp } from '@/services/passwordResetOtp';
import { router } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { type TextInput as RNTextInput } from 'react-native';

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
    return <AuthNotConfigured message="Configure Supabase in .env first." />;
  }

  return (
    <AuthForm
      title="Reset password"
      showBack
      step={1}
      totalSteps={3}
      icon="lock-reset"
      iconColor="#0284c7"
      iconBg="bg-sky-100 dark:bg-sky-950/50"
      subtitle="Enter your account email. We will send an 8-digit code to verify it is you.">
      <AuthFormCard>
        <AuthInfoBanner icon="email-fast-outline" tone="info">
          You will receive an 8-digit code (not a link). It expires in 10 minutes. Check spam if
          needed.
        </AuthInfoBanner>

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
