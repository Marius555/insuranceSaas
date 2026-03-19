"use server";

import { stripe } from '@/lib/stripe/client';
import { STRIPE_PRO_PRICE_ID, STRIPE_MAX_PRICE_ID, DATABASE_ID, COLLECTION_IDS } from '@/lib/env';
import { adminAction } from '@/appwrite/adminOrClient';
import type { UserDocument } from '@/lib/types/appwrite';

const VALID_PLANS = ['pro', 'max'] as const;
type PaidPlan = typeof VALID_PLANS[number];

export async function createCheckoutSession(
  userId: string,
  plan: string,
  userEmail: string
): Promise<{ success: true; url: string } | { success: false; message: string }> {
  if (!VALID_PLANS.includes(plan as PaidPlan)) {
    return { success: false, message: 'Invalid plan. Must be "pro" or "max".' };
  }

  const priceId = plan === 'pro' ? STRIPE_PRO_PRICE_ID : STRIPE_MAX_PRICE_ID;

  if (!priceId) {
    return { success: false, message: `Price ID for ${plan} plan is not configured.` };
  }

  try {
    const { databases } = await adminAction();
    const userDoc = await databases.getDocument<UserDocument>(
      DATABASE_ID,
      COLLECTION_IDS.USERS,
      userId
    );

    const existingCustomerId = userDoc.stripe_customer_id;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      ...(existingCustomerId
        ? { customer: existingCustomerId }
        : { customer_email: userEmail }),
      line_items: [{ price: priceId, quantity: 1 }],
      metadata: { userId, plan },
      subscription_data: {
        metadata: { userId, plan },
      },
      success_url: `${appUrl}/auth/dashboard/${userId}?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/pricing`,
    });

    if (!session.url) {
      return { success: false, message: 'Stripe did not return a checkout URL.' };
    }

    return { success: true, url: session.url };
  } catch (error: unknown) {
    console.error('Failed to create Stripe checkout session:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to create checkout session.',
    };
  }
}
