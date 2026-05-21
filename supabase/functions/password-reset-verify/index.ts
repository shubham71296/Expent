import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import { clientError, handleOptions, jsonResponse } from '../_shared/cors.ts';
import { hashOtp, normalizeEmail } from '../_shared/otp.ts';

Deno.serve(async (req) => {
  const options = handleOptions(req);
  if (options) return options;

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  try {
    const { email: rawEmail, otp: rawOtp } = await req.json();
    if (!rawEmail || !rawOtp) {
      return clientError('Email and code are required');
    }

    const email = normalizeEmail(String(rawEmail));
    const otp = String(rawOtp).replace(/\D/g, '').trim();
    if (otp.length !== 6) {
      return clientError('Enter the 6-digit code from your email');
    }

    const pepper = Deno.env.get('OTP_PEPPER')?.trim() || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const otp_hash = await hashOtp(otp, pepper);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const now = new Date().toISOString();
    const { data: row, error: fetchError } = await admin
      .from('password_reset_otps')
      .select('id, otp_hash, expires_at, used_at, verified_at')
      .eq('email', email)
      .is('used_at', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (fetchError || !row) {
      return clientError('Invalid or expired code');
    }

    if (row.used_at || new Date(row.expires_at) < new Date()) {
      return clientError('Invalid or expired code');
    }

    if (row.otp_hash !== otp_hash) {
      return clientError('Invalid or expired code');
    }

    const reset_token = crypto.randomUUID();
    const { error: updateError } = await admin
      .from('password_reset_otps')
      .update({ verified_at: now, reset_token })
      .eq('id', row.id);

    if (updateError) {
      console.error('[password-reset-verify] update', updateError);
      return jsonResponse({ error: 'Could not verify code' }, 500);
    }

    return jsonResponse({ ok: true, resetToken: reset_token });
  } catch (e) {
    console.error('[password-reset-verify]', e);
    return jsonResponse({ error: 'Unexpected error' }, 500);
  }
});
