import { OTP_TTL_MINUTES } from './otp.ts';

type SendOtpParams = {
  to: string;
  otp: string;
};

export async function sendOtpEmail({ to, otp }: SendOtpParams): Promise<void> {
  const resendKey = Deno.env.get('RESEND_API_KEY')?.trim();
  const from =
    Deno.env.get('RESEND_FROM_EMAIL')?.trim() || 'Expent <onboarding@resend.dev>';

  if (!resendKey) {
    const expose = Deno.env.get('EXPOSE_OTP_IN_RESPONSE') === 'true';
    if (expose) {
      console.warn('[password-reset] RESEND_API_KEY missing; OTP logged for dev only:', otp);
      return;
    }
    throw new Error(
      'Email is not configured. Set RESEND_API_KEY and RESEND_FROM_EMAIL in Supabase Edge Function secrets.'
    );
  }

  const subject = 'Your Expent password reset code';
  const html = `<div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;padding:24px">
<h2 style="color:#4f46e5;margin:0 0 12px">Password reset</h2>
<p style="color:#334155;line-height:1.5">Use this 6-digit code in the Expent app. It expires in ${OTP_TTL_MINUTES} minutes.</p>
<p style="font-size:32px;font-weight:700;letter-spacing:8px;color:#0f172a;margin:24px 0">${otp}</p>
<p style="color:#64748b;font-size:13px">If you did not request this, you can ignore this email.</p>
</div>`;

  const text = `Your Expent password reset code is ${otp}. It expires in ${OTP_TTL_MINUTES} minutes.`;

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject,
      html,
      text,
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Failed to send email (${res.status}): ${detail}`);
  }
}
