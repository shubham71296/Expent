/**
 * Supabase Auth errors → user-facing copy.
 * Sign-up / sign-in stay minimal (no “confirm your email” flow in the UI).
 * Forgot password is the screen where we explain email + inbox.
 */
type AuthLikeError = Error & { code?: string };

function codeAndMessage(error: Error | null | undefined): { code?: string; msg: string } {
  if (!error) return { msg: '' };
  return { code: (error as AuthLikeError).code, msg: error.message.trim() };
}

/** Login + register: treat unconfirmed email like a normal sign-in failure (no inbox UX). */
export function credentialAuthErrorMessage(error: Error | null | undefined): string {
  if (!error) return 'Something went wrong. Try again.';
  const { code, msg } = codeAndMessage(error);
  const lower = msg.toLowerCase();

  switch (code) {
    case 'email_not_confirmed':
    case 'invalid_credentials':
      return 'Wrong email or password.';
    case 'user_already_exists':
      return 'That email is already in use. Sign in instead.';
    case 'weak_password':
      return 'Password must be at least 8 characters and include a letter and a number.';
    case 'signup_disabled':
      return 'New sign-ups are disabled.';
    default:
      break;
  }

  if (lower.includes('email not confirmed')) return 'Wrong email or password.';
  if (lower.includes('invalid login credentials')) return 'Wrong email or password.';
  if (lower.includes('user already registered')) return 'That email is already in use. Sign in instead.';

  return msg || 'Something went wrong. Try again.';
}

/** Forgot password: email link flow — clearer errors where the API provides them. */
export function passwordResetAuthErrorMessage(error: Error | null | undefined): string {
  if (!error) return 'Something went wrong. Try again.';
  const { code, msg } = codeAndMessage(error);
  const lower = msg.toLowerCase();

  switch (code) {
    case 'over_email_send_rate_limit':
      return 'Please wait a minute, then try again.';
    case 'email_address_invalid':
      return 'That email does not look valid.';
    default:
      break;
  }

  if (lower.includes('rate limit')) return 'Please wait a minute, then try again.';

  return msg || 'Something went wrong. Try again.';
}

/** OTP password reset (Edge Functions). */
export function passwordResetOtpErrorMessage(message: string): string {
  const lower = message.trim().toLowerCase();
  if (lower.includes('email does not exist')) {
    return 'Email does not exist.';
  }
  if (lower.includes('not found') && lower.includes('email')) {
    return 'Email does not exist.';
  }
  if (lower.includes('password reset is not set up') || lower.includes('password_reset_otps')) {
    return 'Password reset is not set up on the server. Run the database migration in Supabase.';
  }
  if (lower.includes('resend') || lower.includes('email is not configured')) {
    return 'Could not send email. Ask the app admin to configure email (Resend) in Supabase.';
  }
  return message.trim() || 'Something went wrong. Try again.';
}
