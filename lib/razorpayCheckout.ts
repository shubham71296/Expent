import { sanitizeRazorpayContact, sanitizeRazorpayCustomerName } from '@/lib/razorpayCustomerName';
import { formatRazorpayUserMessage } from '@/lib/razorpayErrors';
import { supabase } from '@/lib/supabase';
import Constants from 'expo-constants';
import { InteractionManager, NativeModules, Platform } from 'react-native';

type StartResponse =
  | { razorpayKeyId: string; subscriptionId: string; customerId: string }
  | { error: string };

type VerifyResponse = { status?: string; verified?: boolean; error?: string };

export type RazorpayCheckoutSuccess = {
  paid: true;
  razorpayPaymentId?: string;
  razorpaySubscriptionId?: string;
};

export type RazorpayCheckoutFailure = {
  paid: false;
  cancelled?: boolean;
  errorMessage?: string;
};

function isStartResponse(data: object): data is Extract<StartResponse, { razorpayKeyId: string }> {
  return 'razorpayKeyId' in data && 'subscriptionId' in data && 'customerId' in data;
}

function deployRazorpayHint(): string {
  return 'Subscribe needs the Supabase function razorpay-subscription-start. Run: supabase login, supabase link, then npm run deploy:razorpay. See docs/RAZORPAY_SETUP.md.';
}

async function readEdgeFunctionErrorMessage(error: unknown): Promise<string> {
  const fallback =
    error instanceof Error ? error.message : typeof error === 'string' ? error : 'Unknown error';

  if (!error || typeof error !== 'object' || !('context' in error)) {
    return formatRazorpayUserMessage(
      fallback.includes('non-2xx')
        ? 'Payment setup failed on the server. Check Supabase Edge Function logs.'
        : fallback
    );
  }

  const ctx = (error as { context?: Response }).context;
  if (!ctx || typeof ctx.json !== 'function') {
    return formatRazorpayUserMessage(fallback);
  }

  try {
    const body = (await ctx.json()) as { error?: unknown; message?: unknown };
    if (body?.error != null) return formatRazorpayUserMessage(String(body.error));
    if (body?.message != null) return formatRazorpayUserMessage(String(body.message));
  } catch {
    try {
      const text = await ctx.text();
      if (text) return formatRazorpayUserMessage(text);
    } catch {
      /* ignore */
    }
  }

  const status = typeof ctx.status === 'number' ? ctx.status : undefined;
  if (fallback.includes('non-2xx')) {
    return formatRazorpayUserMessage(
      status
        ? `Payment setup failed (${status}). Check Razorpay keys and plan IDs in Supabase secrets.`
        : 'Payment setup failed. Check Razorpay keys and plan IDs in Supabase secrets.'
    );
  }
  return formatRazorpayUserMessage(fallback);
}

export async function fetchRazorpaySubscriptionParams(params: {
  planKey: 'plan_3m' | 'plan_6m' | 'plan_12m';
  email: string;
  name: string;
  contact?: string;
}): Promise<{ data: StartResponse | null; error: string | null }> {
  if (!supabase) {
    return { data: null, error: 'Supabase is not configured' };
  }

  const email = params.email.trim().toLowerCase();
  const name = sanitizeRazorpayCustomerName(params.name, email);
  const contact = sanitizeRazorpayContact(params.contact);

  try {
    const { data, error } = await supabase.functions.invoke<StartResponse>('razorpay-subscription-start', {
      body: {
        planKey: params.planKey,
        email,
        name,
        contact,
      },
    });

    if (error) {
      const msg = await readEdgeFunctionErrorMessage(error);
      const status =
        typeof error === 'object' &&
        error !== null &&
        'context' in error &&
        (error as { context?: Response }).context instanceof Response
          ? (error as { context: Response }).context.status
          : undefined;

      const looks404 =
        status === 404 ||
        /\b404\b/i.test(msg) ||
        /not\s*found/i.test(msg) ||
        /requested function/i.test(msg);

      if (looks404) {
        return { data: null, error: deployRazorpayHint() };
      }
      return { data: null, error: msg };
    }

    if (!data || typeof data !== 'object') {
      return { data: null, error: 'Invalid response from subscription service' };
    }

    if ('error' in data && data.error) {
      return { data: null, error: formatRazorpayUserMessage(String(data.error)) };
    }

    if (!isStartResponse(data)) {
      return { data: null, error: 'Invalid response from subscription service' };
    }

    return { data, error: null };
  } catch {
    return { data: null, error: 'Network error' };
  }
}

/** Confirm subscription reached authenticated/active on Razorpay (best-effort). */
export async function verifyRazorpaySubscriptionOnServer(subscriptionId: string): Promise<{
  verified: boolean;
  status: string;
  error: string | null;
}> {
  if (!supabase) {
    return { verified: false, status: 'unknown', error: 'Supabase is not configured' };
  }

  try {
    const { data, error } = await supabase.functions.invoke<VerifyResponse>(
      'razorpay-subscription-verify',
      { body: { subscriptionId } }
    );

    if (error) {
      const msg = await readEdgeFunctionErrorMessage(error);
      return { verified: false, status: 'unknown', error: msg };
    }

    if (data && 'error' in data && data.error) {
      return { verified: false, status: 'unknown', error: formatRazorpayUserMessage(String(data.error)) };
    }

    const status = data?.status ?? 'unknown';
    const verified = data?.verified === true;
    return { verified, status, error: null };
  } catch {
    return { verified: false, status: 'unknown', error: 'Could not verify subscription' };
  }
}

type CheckoutResult = {
  success?: boolean;
  error?: { description?: string; code?: string; reason?: string; message?: string };
  razorpay_payment_id?: string;
  razorpay_subscription_id?: string;
  razorpay_signature?: string;
};

function parseRazorpayCheckoutSuccess(result: unknown): RazorpayCheckoutSuccess | null {
  if (!result || typeof result !== 'object') return null;
  const r = result as CheckoutResult & Record<string, unknown>;
  const paymentId =
    (typeof r.razorpay_payment_id === 'string' && r.razorpay_payment_id) ||
    (typeof r.payment_id === 'string' && r.payment_id) ||
    undefined;
  const subscriptionId =
    (typeof r.razorpay_subscription_id === 'string' && r.razorpay_subscription_id) || undefined;

  if (paymentId || subscriptionId || r.success === true) {
    return {
      paid: true,
      razorpayPaymentId: paymentId,
      razorpaySubscriptionId: subscriptionId,
    };
  }
  return null;
}

function parseRazorpayCheckoutFailure(e: unknown): RazorpayCheckoutFailure {
  const nested =
    e && typeof e === 'object' && 'error' in e ? (e as CheckoutResult).error : undefined;
  const description =
    nested?.description?.trim() ||
    nested?.message?.trim() ||
    (typeof e === 'string' ? e.trim() : '');

  const closed =
    !description ||
    description === 'undefined' ||
    /user has closed|payment cancelled|cancelled|dismissed/i.test(description);

  if (closed) {
    return { paid: false, cancelled: true };
  }

  return {
    paid: false,
    errorMessage: formatRazorpayUserMessage(description),
  };
}

function razorpayNativeUnavailableMessage(): string {
  const inExpoGo = Constants.appOwnership === 'expo';
  if (inExpoGo) {
    return 'Razorpay does not work in Expo Go. Build and run: npx expo run:android (or run:ios).';
  }
  return 'Razorpay native checkout is not available. Rebuild the app: npx expo run:android.';
}

/** Let React finish updates before Razorpay opens a native Activity (avoids Fabric "child already has a parent"). */
export function settleUiBeforeRazorpayCheckout(): Promise<void> {
  return new Promise((resolve) => {
    InteractionManager.runAfterInteractions(() => {
      requestAnimationFrame(() => {
        setTimeout(resolve, 400);
      });
    });
  });
}

function loadRazorpayCheckout(): { open: (opts: Record<string, unknown>) => Promise<unknown> } | null {
  if (!NativeModules.RNRazorpayCheckout) {
    return null;
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require('react-native-razorpay') as {
      default?: { open: (opts: Record<string, unknown>) => Promise<unknown> };
      open?: (opts: Record<string, unknown>) => Promise<unknown>;
    };
    const checkout = mod?.default ?? mod;
    return typeof checkout?.open === 'function' ? checkout : null;
  } catch {
    return null;
  }
}

/**
 * Opens Razorpay Standard Checkout for subscription authentication.
 * Do not pass customer_id — Razorpay rejects it for subscription checkout.
 */
export async function openRazorpaySubscriptionCheckout(options: {
  subscriptionId: string;
  razorpayKeyId: string;
  name: string;
  email: string;
  contact?: string;
  description: string;
}): Promise<RazorpayCheckoutSuccess | RazorpayCheckoutFailure> {
  if (Platform.OS === 'web') {
    return {
      paid: false,
      errorMessage: 'Razorpay checkout is available in the iOS and Android app.',
    };
  }

  const RazorpayCheckout = loadRazorpayCheckout();
  if (!RazorpayCheckout) {
    return { paid: false, errorMessage: razorpayNativeUnavailableMessage() };
  }

  try {
    await settleUiBeforeRazorpayCheckout();

    const contact = sanitizeRazorpayContact(options.contact);
    const payload: Record<string, unknown> = {
      description: options.description,
      subscription_id: options.subscriptionId,
      key: options.razorpayKeyId,
      name: sanitizeRazorpayCustomerName(options.name, options.email),
      prefill: {
        email: options.email.trim().toLowerCase(),
        contact,
      },
      theme: { color: '#4f46e5' },
      retry: { enabled: true, max_count: 2 },
    };

    const result = await RazorpayCheckout.open(payload);
    const success = parseRazorpayCheckoutSuccess(result);
    if (success) {
      return success;
    }
    return { paid: false, errorMessage: 'Payment was not completed. Please try again.' };
  } catch (e: unknown) {
    return parseRazorpayCheckoutFailure(e);
  }
}
