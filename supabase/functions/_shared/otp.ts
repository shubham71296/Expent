export const OTP_TTL_MINUTES = 10;
const OTP_TTL_MS = OTP_TTL_MINUTES * 60 * 1000;

export function generateOtpCode(): string {
  const n = crypto.getRandomValues(new Uint32Array(1))[0] % 1_000_000;
  return String(n).padStart(6, '0');
}

export function otpExpiresAt(): string {
  return new Date(Date.now() + OTP_TTL_MS).toISOString();
}

export async function hashOtp(otp: string, pepper: string): Promise<string> {
  const data = new TextEncoder().encode(`${otp.trim()}:${pepper}`);
  const buf = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}
