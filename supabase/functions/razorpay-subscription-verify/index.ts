/**
 * Verifies a Razorpay subscription status after checkout (server-side).
 * Secrets: RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET
 */
import { handleOptions, jsonResponse } from '../_shared/razorpayCors.ts';
import { razorpayGet } from '../_shared/razorpayClient.ts';

const PAID_STATUSES = new Set(['authenticated', 'active']);

Deno.serve(async (req) => {
  const opt = handleOptions(req);
  if (opt) return opt;
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405);

  try {
    const keyId = Deno.env.get('RAZORPAY_KEY_ID')?.trim();
    const keySecret = Deno.env.get('RAZORPAY_KEY_SECRET')?.trim();
    if (!keyId || !keySecret) {
      return jsonResponse({ error: 'Razorpay is not configured' }, 500);
    }

    const body = (await req.json()) as { subscriptionId?: string };
    const subscriptionId =
      typeof body.subscriptionId === 'string' ? body.subscriptionId.trim() : '';
    if (!subscriptionId) {
      return jsonResponse({ error: 'subscriptionId is required' }, 400);
    }

    const sub = await razorpayGet<{ status?: string }>(`/subscriptions/${subscriptionId}`);
    const status = sub.status ?? 'unknown';
    return jsonResponse({
      status,
      verified: PAID_STATUSES.has(status),
    });
  } catch (e) {
    console.error('[razorpay-subscription-verify]', e);
    return jsonResponse({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});
