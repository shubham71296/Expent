/**
 * Creates a Razorpay customer + subscription and returns ids for native Checkout.
 * Set secrets: RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET
 * Set plan ids from Dashboard → Subscriptions → Plans:
 *   RAZORPAY_PLAN_ID_3M, RAZORPAY_PLAN_ID_6M, RAZORPAY_PLAN_ID_12M
 */
import { handleOptions, jsonResponse } from '../_shared/razorpayCors.ts';
import { razorpayPost, resolveOrCreateRazorpayCustomer } from '../_shared/razorpayClient.ts';
import { sanitizeRazorpayContact, sanitizeRazorpayCustomerName } from '../_shared/razorpayCustomerName.ts';

const PLAN_KEYS = {
  plan_3m: 'RAZORPAY_PLAN_ID_3M',
  plan_6m: 'RAZORPAY_PLAN_ID_6M',
  plan_12m: 'RAZORPAY_PLAN_ID_12M',
} as const;

Deno.serve(async (req) => {
  const opt = handleOptions(req);
  if (opt) return opt;
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405);

  try {
    const keyId = Deno.env.get('RAZORPAY_KEY_ID')?.trim();
    const keySecret = Deno.env.get('RAZORPAY_KEY_SECRET')?.trim();
    if (!keyId || !keySecret) {
      return jsonResponse(
        {
          error:
            'Razorpay is not configured. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to Edge Function secrets.',
        },
        500
      );
    }

    const body = (await req.json()) as {
      planKey?: 'plan_3m' | 'plan_6m' | 'plan_12m';
      email?: string;
      name?: string;
      contact?: string;
    };

    const planKey = body.planKey;
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const name = sanitizeRazorpayCustomerName(
      typeof body.name === 'string' ? body.name : '',
      email
    );
    const contact = sanitizeRazorpayContact(
      typeof body.contact === 'string' ? body.contact : ''
    );

    if (!planKey || !email) {
      return jsonResponse({ error: 'planKey and email are required' }, 400);
    }

    const envName = PLAN_KEYS[planKey];
    const planId = Deno.env.get(envName)?.trim();
    if (!planId) {
      return jsonResponse(
        {
          error: `Missing ${envName}. Create a plan in Razorpay and set the plan id secret.`,
        },
        500
      );
    }

    const customer = await resolveOrCreateRazorpayCustomer({ name, email, contact });

    const subscription = await razorpayPost<{ id: string; status: string }>('/subscriptions', {
      plan_id: planId,
      customer_id: customer.id,
      customer_notify: 1,
      quantity: 1,
      total_count: 12,
      notes: { app: 'exptrack', plan_key: planKey },
    });

    return jsonResponse({
      razorpayKeyId: keyId,
      subscriptionId: subscription.id,
      customerId: customer.id,
    });
  } catch (e) {
    console.error('[razorpay-subscription-start]', e);
    const message = e instanceof Error ? e.message : String(e);
    return jsonResponse({ error: message }, 500);
  }
});
