import type { SubscriptionProductId } from '@/types/subscription';

export type RazorpayCheckoutPending = {
  planId: SubscriptionProductId;
  subscriptionId: string;
  razorpayKeyId: string;
  customerId: string;
  email: string;
  name: string;
  contact: string;
};

let pending: RazorpayCheckoutPending | null = null;

export function setRazorpayCheckoutPending(params: RazorpayCheckoutPending): void {
  pending = params;
}

export function consumeRazorpayCheckoutPending(): RazorpayCheckoutPending | null {
  const value = pending;
  pending = null;
  return value;
}
