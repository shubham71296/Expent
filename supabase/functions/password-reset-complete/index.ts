import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import { findAuthUserByEmail } from '../_shared/authAdmin.ts';
import { clientError, handleOptions, jsonResponse } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  const options = handleOptions(req);
  if (options) return options;

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  try {
    const { resetToken, password } = await req.json();
    if (!resetToken || !password) {
      return clientError('Reset token and password are required');
    }

    if (typeof password !== 'string' || password.length < 8) {
      return clientError('Password must be at least 8 characters');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: row, error: fetchError } = await admin
      .from('password_reset_otps')
      .select('id, email, verified_at, used_at, expires_at, reset_token')
      .eq('reset_token', resetToken)
      .maybeSingle();

    if (fetchError || !row) {
      return clientError('Invalid or expired reset session');
    }

    if (!row.verified_at || row.used_at || new Date(row.expires_at) < new Date()) {
      return clientError('Invalid or expired reset session');
    }

    const { user, lookupError } = await findAuthUserByEmail(supabaseUrl, serviceKey, row.email);
    if (lookupError) {
      return clientError(lookupError);
    }
    if (!user) {
      return clientError('Account not found');
    }

    const { error: pwdError } = await admin.auth.admin.updateUserById(user.id, {
      password,
    });

    if (pwdError) {
      console.error('[password-reset-complete] updateUser', pwdError);
      return jsonResponse({ error: pwdError.message || 'Could not update password' }, 500);
    }

    const used_at = new Date().toISOString();
    await admin.from('password_reset_otps').update({ used_at }).eq('id', row.id);
    await admin.from('password_reset_otps').delete().eq('email', row.email).is('used_at', null);

    return jsonResponse({ ok: true });
  } catch (e) {
    console.error('[password-reset-complete]', e);
    return jsonResponse({ error: 'Unexpected error' }, 500);
  }
});
