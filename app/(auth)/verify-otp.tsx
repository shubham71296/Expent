import { AuthFieldLabel, AuthForm, AuthFormCard } from '@/components/ui/AuthForm';
import { Button } from '@/components/ui/Button';
import { OtpInput } from '@/components/ui/OtpInput';
import { passwordResetOtpErrorMessage } from '@/lib/authUserMessage';
import { validateOtpCode } from '@/lib/authValidation';
import { isSupabaseConfigured } from '@/lib/supabase';
import { toast } from '@/lib/toast';
import { requestPasswordResetOtp, verifyPasswordResetOtp } from '@/services/passwordResetOtp';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { BUTTON_ACTIVE_OPACITY } from '@/components/ui/buttonPressable';
import { Text, TouchableOpacity, View } from 'react-native';

export default function VerifyOtpScreen() {
  const { email: emailParam } = useLocalSearchParams<{ email?: string }>();
  const email = typeof emailParam === 'string' ? emailParam.trim().toLowerCase() : '';
  const [otp, setOtp] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendRemaining, setResendRemaining] = useState(0);

  useEffect(() => {
    if (resendRemaining <= 0) return;
    const t = setInterval(() => {
      setResendRemaining((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(t);
  }, [resendRemaining]);

  const onVerify = useCallback(async () => {
    if (!isSupabaseConfigured) {
      toast.error('Configure Supabase in .env first.', 'Not configured');
      return;
    }
    if (!email) {
      toast.error('Missing email. Start from forgot password again.');
      router.replace('/(auth)/forgot-password');
      return;
    }
    const validationError = validateOtpCode(otp);
    if (validationError) {
      toast.error(validationError);
      return;
    }
    setSubmitting(true);
    try {
      const result = await verifyPasswordResetOtp(email, otp);
      if ('error' in result) {
        toast.error(result.error);
        return;
      }
      toast.success('Code verified. Set your new password.', 'Verified');
      router.replace('/(auth)/reset-password');
    } finally {
      setSubmitting(false);
    }
  }, [email, otp]);

  const onResend = useCallback(async () => {
    if (!email) return;
    if (resendRemaining > 0) return;
    setResending(true);
    try {
      const result = await requestPasswordResetOtp(email);
      if ('error' in result) {
        const msg = passwordResetOtpErrorMessage(result.error);
        toast.error(msg, msg === 'Email does not exist.' ? 'Email not found' : undefined);
        return;
      }
      toast.success('A new code was sent to your email.', 'Code sent');
      setOtp('');
      setResendRemaining(60);
    } finally {
      setResending(false);
    }
  }, [email, resendRemaining]);

  const resendDisabled = resending || submitting || !email || resendRemaining > 0;
  const resendLabel =
    resendRemaining > 0 ? `Resend in 0:${String(resendRemaining).padStart(2, '0')}` : 'Resend code';

  return (
    <AuthForm
      title="Enter verification code"
      showBack
      subtitle={email ? `We sent an 8-digit code to ${email}` : 'Enter the code from your email'}>
      <AuthFormCard>
        <AuthFieldLabel>Verification code</AuthFieldLabel>
        <View className="mb-6">
          <OtpInput value={otp} onChange={setOtp} disabled={submitting} autoFocus />
        </View>

        <Button
          title="Verify code"
          onPress={() => void onVerify()}
          loading={submitting}
          disabled={submitting || resending}
        />

        <TouchableOpacity
          accessibilityRole="button"
          activeOpacity={BUTTON_ACTIVE_OPACITY}
          onPress={() => void onResend()}
          disabled={resendDisabled}
          className={`mt-4 items-center py-2 ${resendDisabled ? 'opacity-50' : ''}`}>
          <Text className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">
            {resending ? 'Sending…' : resendLabel}
          </Text>
        </TouchableOpacity>
      </AuthFormCard>
    </AuthForm>
  );
}
