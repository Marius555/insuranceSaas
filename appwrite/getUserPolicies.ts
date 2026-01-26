"use server";

import { adminAction } from '@/appwrite/adminOrClient';
import { getSession } from '@/appwrite/getSession';
import { DATABASE_ID, COLLECTION_IDS, STORAGE_BUCKET_ID } from '@/lib/env';
import { Query } from 'node-appwrite';
import type { ReportDocument } from '@/lib/types/appwrite';

/**
 * Information about a previously uploaded policy
 */
export interface PolicyInfo {
  fileId: string;
  filename: string;
  size: number;
  uploadedAt: string;
  url: string;
}

export interface GetUserPoliciesResult {
  success: boolean;
  policies?: PolicyInfo[];
  message?: string;
}

/**
 * Get user's previously uploaded insurance policies
 * Fetches unique policy files from user's reports
 *
 * @returns List of policies sorted by most recent first
 *
 * @example
 * const result = await getUserPolicies();
 * if (result.success && result.policies?.length > 0) {
 *   const latestPolicy = result.policies[0];
 *   console.log('Latest policy:', latestPolicy.filename);
 * }
 */
export async function getUserPolicies(): Promise<GetUserPoliciesResult> {
  try {
    // Get current user session
    const session = await getSession();
    if (!session) {
      return {
        success: false,
        message: 'Not authenticated',
      };
    }

    const { databases, storage } = await adminAction();

    // Query reports for this user that have a policy file
    const reportsResult = await databases.listDocuments<ReportDocument>(
      DATABASE_ID,
      COLLECTION_IDS.REPORTS,
      [
        Query.equal('user_id', session.id),
        Query.isNotNull('policy_file_id'),
        Query.orderDesc('$createdAt'),
        Query.limit(50), // Limit to recent reports
      ]
    );

    // Deduplicate policy file IDs (same policy may be used across reports)
    const uniquePolicyIds = new Map<string, string>(); // fileId -> createdAt
    for (const report of reportsResult.documents) {
      if (report.policy_file_id && !uniquePolicyIds.has(report.policy_file_id)) {
        uniquePolicyIds.set(report.policy_file_id, report.$createdAt);
      }
    }

    if (uniquePolicyIds.size === 0) {
      return {
        success: true,
        policies: [],
      };
    }

    // Fetch file metadata for each unique policy
    const policies: PolicyInfo[] = [];

    for (const [fileId, uploadedAt] of uniquePolicyIds) {
      try {
        const file = await storage.getFile(STORAGE_BUCKET_ID, fileId);

        const url = `${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT}/storage/buckets/${STORAGE_BUCKET_ID}/files/${fileId}/view?project=${process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID}`;

        policies.push({
          fileId,
          filename: file.name,
          size: file.sizeOriginal,
          uploadedAt,
          url,
        });
      } catch {
        // Skip files that no longer exist (deleted from storage)
        console.warn(`Policy file ${fileId} not found, skipping`);
      }
    }

    // Sort by uploadedAt (most recent first)
    policies.sort((a, b) =>
      new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
    );

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
