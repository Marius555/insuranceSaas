"use server";

import { adminAction } from '@/appwrite/adminOrClient';
import { DATABASE_ID, COLLECTION_IDS } from '@/lib/env';
import { getPlanLimit } from '@/lib/evaluation-limits';
import { revalidateTag } from 'next/cache';
import type { UserDocument } from '@/lib/types/appwrite';

interface EvaluationCheckResult {
  allowed: boolean;
  remaining: number;
  message?: string;
}

function getTodayUTC(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function checkEvaluationLimit(userId: string): Promise<EvaluationCheckResult> {
  try {
    const { databases } = await adminAction();

    const user = await databases.getDocument<UserDocument>(
      DATABASE_ID,
      COLLECTION_IDS.USERS,
      userId
    );

    const plan = user.pricing_plan || 'free';
    const today = getTodayUTC();
    const limit = getPlanLimit(plan);
    let remaining = user.evaluation_times ?? limit;

    // Cap to current plan limit (handles plan downgrades)
    remaining = Math.min(remaining, limit);

    // Reset if it's a new day (or first time)
    if (user.evaluation_reset_date !== today) {
      remaining = limit;
      await databases.updateDocument(
        DATABASE_ID,
        COLLECTION_IDS.USERS,
        userId,
        {
          evaluation_times: limit,
          evaluation_reset_date: today,
        }
      );
    }

    if (remaining <= 0) {
      return {
        allowed: false,
        remaining: 0,
        message: `Daily evaluation limit reached. Your ${plan} plan allows ${limit} evaluation${limit === 1 ? '' : 's'} per day. Upgrade your plan for more.`,
      };
    }

    return { allowed: true, remaining };
  } catch (error) {
    console.error('Failed to check evaluation limit:', error);
    // Fail open to avoid blocking users due to internal errors
    return { allowed: true, remaining: -1 };
  }
}

export async function decrementEvaluationLimit(userId: string): Promise<void> {
  try {
    const { databases } = await adminAction();

    const user = await databases.getDocument<UserDocument>(
      DATABASE_ID,
      COLLECTION_IDS.USERS,
      userId
    );

    const plan = user.pricing_plan || 'free';
    const today = getTodayUTC();
    let remaining = user.evaluation_times ?? getPlanLimit(plan);

    // Cap to current plan limit (handles plan downgrades)
    remaining = Math.min(remaining, getPlanLimit(plan));

    // Safety: reset if date doesn't match
    if (user.evaluation_reset_date !== today) {
      remaining = getPlanLimit(plan);
    }

    await databases.updateDocument(
      DATABASE_ID,
      COLLECTION_IDS.USERS,
      userId,
      {
        evaluation_times: Math.max(0, remaining - 1),
        evaluation_reset_date: today,
      }
    );

    revalidateTag(`user-doc-${userId}`, { expire: 0 });
  } catch (error) {
    console.error('Failed to decrement evaluation limit:', error);
  }
}
