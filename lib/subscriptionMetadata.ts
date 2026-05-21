import type { SubscriptionProductId } from '@/types/subscription';
import { supabase } from '@/lib/supabase';
import type { SupabaseClient } from '@supabase/supabase-js';

export async function syncSubscriptionMetadata(params: {
  client?: SupabaseClient | null;
  productId: SubscriptionProductId;
  trialEndsAt: string | null;
}): Promise<{ error: Error | null }> {
  const client = params.client ?? supabase;
  if (!client) {
    return { error: new Error('Supabase is not configured') };
  }

  const { error } = await client.auth.updateUser({
    data: {
      subscription_onboarding_complete: true,
      subscription_product: params.productId,
      ...(params.trialEndsAt
        ? { trial_ends_at: params.trialEndsAt }
        : { trial_ends_at: null }),
    },
  });

  return { error: error as Error | null };
}

export function readSubscriptionFromUser(user: {
  user_metadata?: Record<string, unknown>;
} | null): {
  /** False only when the user still must pick a plan (new signups). Legacy users: treated as done. */
  onboardingComplete: boolean;
  productId: SubscriptionProductId | null;
  trialEndsAt: string | null;
} {
  const m = user?.user_metadata ?? {};
  const raw = m.subscription_onboarding_complete;
  if (raw === false) {
    return { onboardingComplete: false, productId: null, trialEndsAt: null };
  }

  const pid = m.subscription_product;
  const productId =
    pid === 'trial_7d' || pid === 'plan_3m' || pid === 'plan_6m' || pid === 'plan_12m'
      ? pid
      : null;
  const trial = m.trial_ends_at;
  const trialEndsAt = typeof trial === 'string' ? trial : null;
  return { onboardingComplete: true, productId, trialEndsAt };
}
