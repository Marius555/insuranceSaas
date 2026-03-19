"use server";

import { stripe } from '@/lib/stripe/client';
import { STRIPE_PRO_PRICE_ID, STRIPE_MAX_PRICE_ID, DATABASE_ID, COLLECTION_IDS } from '@/lib/env';
import { adminAction } from '@/appwrite/adminOrClient';
import { updateUserPlan } from '@/appwrite/updateUserPlan';
import type { UserDocument } from '@/lib/types/appwrite';

export interface SubscriptionData {
  id: string;
  status: string;
  currentPeriodEnd: number;
  cancelAtPeriodEnd: boolean;
  items: { id: string; priceId: string }[];
}

export interface InvoiceData {
  id: string;
  number: string | null;
  date: number;
  amountDue: number;
  amountPaid: number;
  currency: string;
  status: string | null;
  hostedInvoiceUrl: string | null;
  invoicePdf: string | null;
}

export interface BillingDataResult {
  success: true;
  subscription: SubscriptionData | null;
  invoices: InvoiceData[];
}

export async function getBillingData(
  userId: string
): Promise<BillingDataResult | { success: false; message: string }> {
  try {
    const { databases } = await adminAction();
    const userDoc = await databases.getDocument<UserDocument>(
      DATABASE_ID,
      COLLECTION_IDS.USERS,
      userId
    );

    const customerId = userDoc.stripe_customer_id;
    const subscriptionId = userDoc.stripe_subscription_id;

    if (!customerId && !subscriptionId) {
      return { success: true, subscription: null, invoices: [] };
    }

    const [subscriptionResult, invoicesResult] = await Promise.all([
      subscriptionId
        ? stripe.subscriptions.retrieve(subscriptionId)
        : Promise.resolve(null),
      customerId
        ? stripe.invoices.list({ customer: customerId, limit: 24 })
        : Promise.resolve({ data: [] }),
    ]);

    const subscription: SubscriptionData | null = subscriptionResult
      ? {
          id: subscriptionResult.id,
          status: subscriptionResult.status,
          currentPeriodEnd: subscriptionResult.items.data[0]?.current_period_end ?? 0,
          cancelAtPeriodEnd: subscriptionResult.cancel_at_period_end,
          items: subscriptionResult.items.data.map((item) => ({
            id: item.id,
            priceId: typeof item.price === 'string' ? item.price : item.price.id,
          })),
        }
      : null;

    const invoices: InvoiceData[] = invoicesResult.data.map((inv) => ({
      id: inv.id,
      number: inv.number,
      date: inv.created,
      amountDue: inv.amount_due,
      amountPaid: inv.amount_paid,
      currency: inv.currency,
      status: inv.status,
      hostedInvoiceUrl: inv.hosted_invoice_url ?? null,
      invoicePdf: inv.invoice_pdf ?? null,
    }));

    return { success: true, subscription, invoices };
  } catch (error: unknown) {
    console.error('Failed to fetch billing data:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to fetch billing data',
    };
  }
}

export async function changePlan(
  userId: string,
  newPlan: 'pro' | 'max'
): Promise<{ success: boolean; message?: string }> {
  try {
    const { databases } = await adminAction();
    const userDoc = await databases.getDocument<UserDocument>(
      DATABASE_ID,
      COLLECTION_IDS.USERS,
      userId
    );

    const subscriptionId = userDoc.stripe_subscription_id;
    if (!subscriptionId) {
      return { success: false, message: 'No active subscription found.' };
    }

    const newPriceId = newPlan === 'pro' ? STRIPE_PRO_PRICE_ID : STRIPE_MAX_PRICE_ID;
    if (!newPriceId) {
      return { success: false, message: `Price ID for ${newPlan} plan is not configured.` };
    }

    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const itemId = subscription.items.data[0]?.id;
    if (!itemId) {
      return { success: false, message: 'Could not find subscription item.' };
    }

    await stripe.subscriptions.update(subscriptionId, {
      items: [{ id: itemId, price: newPriceId }],
      proration_behavior: 'create_prorations',
      cancel_at_period_end: false,
    });

    await updateUserPlan(userId, newPlan);

    return { success: true };
  } catch (error: unknown) {
    console.error('Failed to change plan:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to change plan',
    };
  }
}

export async function cancelSubscription(
  userId: string
): Promise<{ success: boolean; message?: string }> {
  try {
    const { databases } = await adminAction();
    const userDoc = await databases.getDocument<UserDocument>(
      DATABASE_ID,
      COLLECTION_IDS.USERS,
      userId
    );

    const subscriptionId = userDoc.stripe_subscription_id;
    if (!subscriptionId) {
      return { success: false, message: 'No active subscription found.' };
    }

    await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    });

    return { success: true };
  } catch (error: unknown) {
    console.error('Failed to cancel subscription:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to cancel subscription',
    };
  }
}
