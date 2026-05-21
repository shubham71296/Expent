import { formatRazorpayApiErrorMessage } from '@/lib/razorpayCustomerName';

/** Map Razorpay / gateway text to short in-app messages. */
export function formatRazorpayUserMessage(raw: string): string {
  const trimmed = formatRazorpayApiErrorMessage(raw);
  const lower = trimmed.toLowerCase();

  if (
    lower.includes('recurring payment') ||
    lower.includes('does not support recurring') ||
    lower.includes('seller does not support')
  ) {
    return (
      'Subscriptions are not enabled on your Razorpay account yet. ' +
      'In Razorpay Dashboard enable Subscriptions (recurring payments) or contact Razorpay support, then try again.'
    );
  }

  if (lower.includes('customer_id is not required')) {
    return 'Payment setup error. Update the app to the latest build and try again.';
  }

  if (lower.includes('customer already exists')) {
    return 'Could not start checkout for your account. Deploy the latest razorpay-subscription-start function, then try again.';
  }

  if (lower.includes('authentication failed') || lower.includes('invalid key')) {
    return 'Razorpay keys are invalid. Check RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in Supabase secrets (Test vs Live must match).';
  }

  if (lower.includes('no such plan') || lower.includes('plan_id')) {
    return 'Plan ID mismatch. Set RAZORPAY_PLAN_ID_3M / _6M / _12M in Supabase secrets to match your Razorpay plans.';
  }

  return trimmed;
}
