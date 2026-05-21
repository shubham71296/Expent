import { passwordResetOtpErrorMessage } from '@/lib/authUserMessage';
import { passwordResetFlow } from '@/lib/passwordResetFlow';
import { supabase } from '@/lib/supabase';

function requireClient() {
  if (!supabase) {
    return { client: null as never, error: 'Supabase is not configured.' };
  }
  return { client: supabase, error: null };
}

function mapAuthError(error: { message?: string; code?: string }): string {
  const code = error.code ?? '';
  const msg = error.message ?? '';

  if (code === 'over_email_send_rate_limit' || msg.toLowerCase().includes('rate limit')) {
    return 'Please wait a minute, then try again.';
  }
  if (code === 'otp_expired' || msg.toLowerCase().includes('expired')) {
    return 'Invalid or expired code';
  }
  if (
    code === 'otp_disabled' ||
    msg.toLowerCase().includes('signups not allowed') ||
    msg.toLowerCase().includes('user not found')
  ) {
    return 'Email does not exist.';
  }
  if (msg.toLowerCase().includes('token') || msg.toLowerCase().includes('otp')) {
    return 'Invalid or expired code';
  }

  return passwordResetOtpErrorMessage(msg || 'Something went wrong. Try again.');
}

async function emailExists(email: string): Promise<{ exists: boolean; error: string | null }> {
  const { client, error: configError } = requireClient();
  if (configError) return { exists: false, error: configError };

  const { data, error } = await client.rpc('auth_email_exists', { p_email: email });
  if (error) {
    const msg = error.message ?? '';
    if (msg.includes('auth_email_exists') || msg.includes('Could not find the function')) {
      return {
        exists: false,
        error:
          'Password reset is not set up. Run supabase/migrations/20260518150000_auth_email_exists.sql in Supabase SQL Editor.',
      };
    }
    return { exists: false, error: msg };
  }

  return { exists: Boolean(data), error: null };
}

export async function requestPasswordResetOtp(
  email: string
): Promise<{ ok: true } | { error: string }> {
  const { client, error: configError } = requireClient();
  if (configError) return { error: configError };

  const normalized = email.trim().toLowerCase();
  const check = await emailExists(normalized);
  if (check.error) return { error: check.error };
  if (!check.exists) return { error: 'Email does not exist.' };

  // OTP email (not magic link): Supabase sends {{ .Token }} only when the
  // "Magic link" template uses {{ .Token }} and does NOT include {{ .ConfirmationURL }}.
  // See supabase/templates/magic-link.html
  const { error } = await client.auth.signInWithOtp({
    email: normalized,
    options: {
      shouldCreateUser: false,
      // Do not set emailRedirectTo — that encourages magic-link emails.
    },
  });

  if (error) return { error: mapAuthError(error) };
  return { ok: true };
}

export async function verifyPasswordResetOtp(
  email: string,
  otp: string
): Promise<{ ok: true } | { error: string }> {
  const { client, error: configError } = requireClient();
  if (configError) return { error: configError };

  const { data, error } = await client.auth.verifyOtp({
    email: email.trim().toLowerCase(),
    token: otp.replace(/\D/g, ''),
    type: 'email',
  });

  if (error) return { error: mapAuthError(error) };
  if (!data.session) return { error: 'Invalid or expired code' };

  passwordResetFlow.activate();
  return { ok: true };
}

export async function completePasswordReset(
  password: string
): Promise<{ ok: true } | { error: string }> {
  const { client, error: configError } = requireClient();
  if (configError) return { error: configError };

  const { error } = await client.auth.updateUser({ password });
  if (error) return { error: mapAuthError(error) };

  passwordResetFlow.deactivate();
  await client.auth.signOut();
  return { ok: true };
}
