"use server";

import { getSession } from '@/appwrite/getSession';
import { getUserPoliciesCached } from '@/lib/data/cached-queries';
import type { PolicyInfo } from '@/lib/types/appwrite';

export interface GetUserPoliciesResult {
  success: boolean;
  policies?: PolicyInfo[];
  message?: string;
}

/**
 * Get user's previously uploaded insurance policies
 * Thin wrapper around getUserPoliciesCached with session fallback.
 *
 * @returns List of policies sorted by most recent first
 */
export async function getUserPolicies(userId?: string): Promise<GetUserPoliciesResult> {
  try {
    let resolvedUserId = userId;
    if (!resolvedUserId) {
      const session = await getSession();
      if (!session) {
        return {
          success: false,
          message: 'Not authenticated',
        };
      }
      resolvedUserId = session.id;
    }

    const policies = await getUserPoliciesCached(resolvedUserId);

    return {
      success: true,
      policies,
    };
  } catch (error: unknown) {
    console.error('Failed to get user policies:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch policies';
    return {
      success: false,
      message,
    };
  }
}
