import type { SubscriptionProductId } from '@/types/subscription';

export type RazorpayPlanOption = {
  id: SubscriptionProductId;
  title: string;
  subtitle: string;
  /** Shown price (configure matching amounts in Razorpay Dashboard). */
  priceLabel: string;
  periodLabel: string;
  highlights: string[];
  isTrial: boolean;
};

/** Plans shown in the app. Paid Razorpay plans are commented out until subscriptions go live. */
export const RAZORPAY_PLAN_OPTIONS: RazorpayPlanOption[] = [
  {
    id: 'trial_7d',
    title: '7-day free trial',
    subtitle: 'Try everything free — full access for 7 days.',
    priceLabel: 'Free',
    periodLabel: '7 days',
    highlights: ['Full app access', 'Cloud sync', 'No card required for trial'],
    isTrial: true,
  },
  // --- Paid plans (Razorpay) — hidden for now; uncomment to re-enable ---
  // {
  //   id: 'plan_3m',
  //   title: '3 months',
  //   subtitle: 'Billed every 3 months',
  //   priceLabel: '₹299',
  //   periodLabel: 'per 3 months',
  //   highlights: ['All premium features', 'Cancel anytime', 'Secure Razorpay checkout'],
  //   isTrial: false,
  // },
  // {
  //   id: 'plan_6m',
  //   title: '6 months',
  //   subtitle: 'Better value for regular trackers',
  //   priceLabel: '₹549',
  //   periodLabel: 'per 6 months',
  //   highlights: ['All premium features', 'Best for half-year budgeting', 'Receipts & exports'],
  //   isTrial: false,
  // },
  // {
  //   id: 'plan_12m',
  //   title: '12 months',
  //   subtitle: 'Lowest effective monthly cost',
  //   priceLabel: '₹999',
  //   periodLabel: 'per year',
  //   highlights: ['All premium features', 'Priority support (when available)', 'Lowest total cost'],
  //   isTrial: false,
  // },
];

export function planOptionById(id: SubscriptionProductId): RazorpayPlanOption | undefined {
  return RAZORPAY_PLAN_OPTIONS.find((p) => p.id === id);
}

export function productDisplayName(
  id: SubscriptionProductId | null | undefined
): string {
  if (!id) return 'Not set';
  const o = planOptionById(id);
  return o ? o.title : id;
}
