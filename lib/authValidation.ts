import { OTP_DIGIT_COUNT, OTP_DIGIT_MIN } from '@/lib/otp';

/** Practical email format check (local part @ domain with TLD). */
const EMAIL_PATTERN =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

const MIN_PASSWORD_LENGTH = 8;

export function isValidEmail(email: string): boolean {
  const e = email.trim();
  if (!e || e.length > 254) return false;
  return EMAIL_PATTERN.test(e);
}

export function validateEmail(email: string): string | null {
  const e = email.trim();
  if (!e) return 'Enter your email.';
  if (!isValidEmail(e)) return 'Enter a valid email address.';
  return null;
}

export function validateSignupPassword(password: string): string | null {
  if (!password) return 'Enter a password.';
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
  }
  if (/\s/.test(password)) return 'Password cannot contain spaces.';
  if (!/[a-zA-Z]/.test(password)) return 'Password must include at least one letter.';
  if (!/\d/.test(password)) return 'Password must include at least one number.';
  return null;
}

export function validateLoginFields(email: string, password: string): string | null {
  const emailError = validateEmail(email);
  if (emailError) return emailError;
  if (!password) return 'Enter your password.';
  return null;
}

export function validateRegisterFields(
  name: string,
  email: string,
  password: string,
  confirm: string
): string | null {
  const n = name.trim();
  const e = email.trim();
  const p = password;
  const c = confirm;

  if (!n && !e && !p && !c) return 'Fill in all fields to create an account.';
  if (!n) return 'Enter your name.';
  if (n.length < 2) return 'Name must be at least 2 characters.';

  const emailError = validateEmail(e);
  if (emailError) return emailError;

  const passwordError = validateSignupPassword(p);
  if (passwordError) return passwordError;

  if (!c) return 'Confirm your password.';
  if (p !== c) return 'Passwords do not match.';
  return null;
}

export function validateForgotPasswordEmail(email: string): string | null {
  return validateEmail(email);
}

export function validateOtpCode(otp: string): string | null {
  const code = otp.replace(/\D/g, '');
  if (!code) return 'Enter the verification code from your email.';
  if (code.length < OTP_DIGIT_MIN || code.length > OTP_DIGIT_COUNT) {
    return `Enter the full ${OTP_DIGIT_COUNT}-digit code from your email.`;
  }
  if (code.length !== OTP_DIGIT_COUNT && code.length !== OTP_DIGIT_MIN) {
    return `Enter all ${OTP_DIGIT_COUNT} digits from your email.`;
  }
  return null;
}

export function validateNewPasswordFields(password: string, confirm: string): string | null {
  const p = password;
  const c = confirm;
  if (!p && !c) return 'Enter and confirm your new password.';

  const passwordError = validateSignupPassword(p);
  if (passwordError) return passwordError;

  if (!c) return 'Confirm your new password.';
  if (p !== c) return 'Passwords do not match.';
  return null;
}

export function validateProfileName(name: string): string | null {
  const n = name.trim();
  if (!n) return 'Enter your name.';
  if (n.length < 2) return 'Name must be at least 2 characters.';
  return null;
}
