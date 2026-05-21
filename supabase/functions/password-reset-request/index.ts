import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import { findAuthUserByEmail } from '../_shared/authAdmin.ts';
import { clientError, handleOptions, jsonResponse } from '../_shared/cors.ts';
import { generateOtpCode, hashOtp, normalizeEmail, otpExpiresAt } from '../_shared/otp.ts';
import { sendOtpEmail } from '../_shared/mail.ts';

Deno.serve(async (req) => {
  const options = handleOptions(req);
  if (options) return options;

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  try {
    const { email: rawEmail } = await req.json();
    if (!rawEmail || typeof rawEmail !== 'string') {
      return clientError('Email is required');
    }

    const email = normalizeEmail(rawEmail);
    const pepper = Deno.env.get('OTP_PEPPER')?.trim() || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { user, lookupError } = await findAuthUserByEmail(supabaseUrl, serviceKey, email);
    if (lookupError) {
      return clientError(lookupError);
    }
    if (!user) {
      return clientError('Email does not exist.');
    }

    const successBody = { ok: true as const, message: 'Verification code sent to your email.' };

    const otp = generateOtpCode();
    const otp_hash = await hashOtp(otp, pepper);

    await admin.from('password_reset_otps').delete().eq('email', email).is('used_at', null);

    const { error: insertError } = await admin.from('password_reset_otps').insert({
      email,
      otp_hash,
      expires_at: otpExpiresAt(),
    });

    if (insertError) {
      console.error('[password-reset-request] insert', insertError);
      const code = String(insertError.code ?? '');
      if (code === '42P01' || code === 'PGRST205' || insertError.message?.includes('password_reset_otps')) {
        return clientError(
          'Password reset is not set up on the server. Run the password_reset_otps migration in Supabase.'
        );
      }
      return clientError('Could not create reset code. Try again.');
    }

    try {
      await sendOtpEmail({ to: email, otp });
    } catch (mailErr) {
      console.error('[password-reset-request] mail', mailErr);
      await admin.from('password_reset_otps').delete().eq('email', email).eq('otp_hash', otp_hash);
      const expose = Deno.env.get('EXPOSE_OTP_IN_RESPONSE') === 'true';
      if (expose) {
        return jsonResponse({ ...successBody, devOtp: otp });
      }
      const mailMsg = String(mailErr);
      if (mailMsg.toLowerCase().includes('resend') || mailMsg.toLowerCase().includes('email is not configured')) {
        return clientError('Could not send email. Configure RESEND_API_KEY in Supabase Edge Function secrets.');
      }
      return clientError('Could not send verification email. Try again later.');
    }

    const expose = Deno.env.get('EXPOSE_OTP_IN_RESPONSE') === 'true';
    return jsonResponse(expose ? { ...successBody, devOtp: otp } : successBody);
  } catch (e) {
    console.error('[password-reset-request]', e);
    return clientError('Unexpected error. Try again.');
  }
});
