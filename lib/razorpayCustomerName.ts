/** Indian mobile for Razorpay prefill.contact (10 digits, starts 6–9). */
export function sanitizeRazorpayContact(phone: string | undefined | null): string {
  const digits = (phone ?? '').replace(/\D/g, '');
  const ten =
    digits.length >= 10 ? digits.slice(-10) : digits.length > 0 ? digits.padStart(10, '9') : '';
  if (/^[6-9]\d{9}$/.test(ten)) return ten;
  return '9876543210';
}

/** Razorpay customer/checkout name: 3–50 chars, limited punctuation. */
export function sanitizeRazorpayCustomerName(
  name: string | undefined | null,
  email: string
): string {
  const fallback = 'Pennibly User';
  const trimmedEmail = email.trim().toLowerCase();

  let raw = (name ?? '').trim().replace(/\s+/g, ' ');
  raw = raw.replace(/[^\p{L}\p{N} .'/@()]/gu, '').trim();

  if (raw.length < 3) {
    const local = trimmedEmail.split('@')[0] ?? '';
    const fromEmail = local.replace(/[^a-zA-Z0-9 .'/@()]/g, '').trim();
    raw = fromEmail.length >= 3 ? fromEmail : fallback;
  }

  if (raw.length > 50) {
    raw = raw.slice(0, 50).trim();
  }

  return raw.length >= 3 ? raw : fallback;
}

/** Pull Razorpay `description` out of thrown Error text / JSON blobs. */
export function formatRazorpayApiErrorMessage(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return 'Payment setup failed. Please try again.';

  const jsonStart = trimmed.indexOf('{');
  if (jsonStart >= 0) {
    try {
      const parsed = JSON.parse(trimmed.slice(jsonStart)) as {
        error?: { description?: string; reason?: string };
      };
      const desc = parsed.error?.description ?? parsed.error?.reason;
      if (desc) return desc;
    } catch {
      /* ignore */
    }
  }

  if (trimmed.startsWith('Error: ')) {
    return formatRazorpayApiErrorMessage(trimmed.slice(7));
  }

  return trimmed.length > 200 ? `${trimmed.slice(0, 200)}…` : trimmed;
}
