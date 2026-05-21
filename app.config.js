/**
 * Merges env into Expo `extra` so `expo-constants` can read Supabase keys at runtime.
 * Copy `.env.example` to `.env` and set `EXPO_PUBLIC_SUPABASE_*` (restart Metro after changes).
 *
 * Sign up / sign in without an inbox step: Supabase Dashboard → Authentication →
 * Providers → Email → turn off “Confirm email”.
 *
 * Password reset OTP email: Dashboard → Authentication → Email Templates → Magic link.
 * Replace the body with supabase/templates/magic-link.html (uses {{ .Token }} only,
 * no {{ .ConfirmationURL }}), subject: "Your Expent verification code".
 */
module.exports = ({ config }) => ({
  ...config,
  extra: {
    ...config.extra,
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL ?? '',
    supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '',
  },
});
