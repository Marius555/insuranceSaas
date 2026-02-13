"use server";

import { adminAction } from '@/appwrite/adminOrClient';
import { DATABASE_ID, COLLECTION_IDS } from '@/lib/env';
import { getPlanLimit } from '@/lib/evaluation-limits';
import { revalidateTag } from 'next/cache';

const VALID_PLANS = ['free', 'pro', 'max'] as const;
type PricingPlan = typeof VALID_PLANS[number];

export interface UpdateUserPlanResult {
  success: boolean;
  message?: string;
}

/**
 * Update a user's pricing_plan field in Appwrite
 */
export async function updateUserPlan(
  userId: string,
  plan: string
): Promise<UpdateUserPlanResult> {
  if (!VALID_PLANS.includes(plan as PricingPlan)) {
    return { success: false, message: 'Invalid plan' };
  }

  try {
    const { databases } = await adminAction();

    const newLimit = getPlanLimit(plan);
    const today = new Date().toISOString().slice(0, 10);

    await databases.updateDocument(
      DATABASE_ID,
      COLLECTION_IDS.USERS,
      userId,
      {
        pricing_plan: plan,
        evaluation_times: newLimit,
        evaluation_reset_date: today,
      }
    );

    revalidateTag(`user-doc-${userId}`, { expire: 0 });

    return { success: true };
  } catch (error: unknown) {
    console.error('Failed to update user plan:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to update plan',
    };
  }
}
