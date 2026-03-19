"use server";

import { adminAction } from '@/appwrite/adminOrClient';
import { DATABASE_ID, COLLECTION_IDS } from '@/lib/env';
import { revalidateTag } from 'next/cache';

export async function updateUserStripeInfo(
  userId: string,
  customerId: string,
  subscriptionId: string
): Promise<{ success: boolean; message?: string }> {
  try {
    const { databases } = await adminAction();

    await databases.updateDocument(DATABASE_ID, COLLECTION_IDS.USERS, userId, {
      stripe_customer_id: customerId,
      stripe_subscription_id: subscriptionId,
    });

    revalidateTag(`user-doc-${userId}`, { expire: 0 });

    return { success: true };
  } catch (error: unknown) {
    console.error('Failed to update user Stripe info:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to update Stripe info',
    };
  }
}

export async function clearUserStripeSubscription(
  userId: string
): Promise<{ success: boolean; message?: string }> {
  try {
    const { databases } = await adminAction();

    await databases.updateDocument(DATABASE_ID, COLLECTION_IDS.USERS, userId, {
      stripe_subscription_id: null,
    });

    revalidateTag(`user-doc-${userId}`, { expire: 0 });

    return { success: true };
  } catch (error: unknown) {
    console.error('Failed to clear user Stripe subscription:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to clear subscription',
    };
  }
}
