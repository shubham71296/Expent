# Razorpay subscription setup (Expent)

## 1. Razorpay Dashboard

1. Create a Razorpay account and switch to **Test mode** while integrating.
2. Under **Subscriptions → Plans**, create three plans matching the app copy (3 / 6 / 12 months) and note each **Plan ID** (`plan_xxx`).

## 2. Supabase Edge Function secrets

Deploy the function (from this repo on your machine):

```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF
npm run deploy:razorpay
```

(`npm run deploy:razorpay` deploys `razorpay-subscription-start` and `razorpay-subscription-verify` — no global Supabase CLI required.)

In **Supabase → Project Settings → Edge Functions → Secrets**, set:

| Secret | Value |
|--------|--------|
| `RAZORPAY_KEY_ID` | From Razorpay Dashboard → API Keys |
| `RAZORPAY_KEY_SECRET` | Secret key (never put this in the app) |
| `RAZORPAY_PLAN_ID_3M` | Plan ID for 3-month plan |
| `RAZORPAY_PLAN_ID_6M` | Plan ID for 6-month plan |
| `RAZORPAY_PLAN_ID_12M` | Plan ID for 12-month plan |

The app calls this function with the **anon** key; the secret key stays on the server.

## 3. Native checkout (iOS / Android)

Razorpay uses a **native module**. Expo Go does not include it — use a **development build**.

**Red screen `addViewAt` / “child already has a parent” when paying:** Razorpay must not open on top of the busy plans list. The app navigates to a minimal **`/razorpay-checkout`** screen first. **Do not** set `newArchEnabled: false` — Reanimated/Worklets require New Architecture on Expo SDK 54.

```bash
npx expo prebuild
npx expo run:ios
# or
npx expo run:android
```

See `react-native-razorpay` in your `node_modules` for Expo 54 notes.

## 4. New sign-ups

New accounts get `user_metadata.subscription_onboarding_complete: false` on sign-up. They are redirected to **`/subscription-plans`** until they choose the **7-day trial** or complete a **Razorpay** subscription.

Existing users (created before this field) have undefined metadata and are **not** forced onto the plans screen.

## 5. “Seller does not support recurring payments”

Razorpay shows this when **Subscriptions / recurring payments** are **not enabled** on your merchant account. The app code is fine.

1. Razorpay Dashboard → enable **Subscriptions** (or contact Razorpay support).
2. Complete **KYC / business activation** if required.
3. Retry with test card after approval.

## 6. Test payment (avoid “Something went wrong” on UPI)

Razorpay checkout opening means your Edge Function and keys are OK. A generic **“Something went wrong”** during **Google Pay / UPI** in **Test mode** is common.

**Use Card for testing:**

1. In checkout, choose **Pay with card** (not Google Pay).
2. **Card:** `4111 1111 1111 1111`
3. **Expiry:** any future date (e.g. `12/30`)
4. **CVV:** any 3 digits (e.g. `123`)

UPI in test often needs Razorpay test VPAs and may not work with Google Pay intent for subscriptions. Use card first; enable UPI on your live Razorpay account when you go live.

Redeploy after server changes: `npm run deploy:razorpay`.

## 7. Prices in the UI

Display prices live in `constants/razorpayPlans.ts`. Align them with the amounts configured on your Razorpay plans.

## 8. “404” when tapping Subscribe

That usually means **the Edge Function is missing** on the Supabase project your app calls (secrets alone do not deploy code):

1. Deploy from your machine:

   ```bash
   supabase login
   supabase link --project-ref YOUR_PROJECT_REF
   supabase functions deploy razorpay-subscription-start --no-verify-jwt
   ```

2. In Supabase Dashboard → **Edge Functions**, confirm **`razorpay-subscription-start`** appears.

3. Ensure `.env` has **`EXPO_PUBLIC_SUPABASE_URL`** for that **same** project (`https://<ref>.supabase.co`), then restart Metro (or rebuild) so the app loads the URL.
