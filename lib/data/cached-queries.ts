import { cache } from "react";
import { unstable_cache } from "next/cache";
import { cookies } from "next/headers";
import { decryptData } from "@/utils/decrypt";
import { clientAction, adminAction } from "@/appwrite/adminOrClient";
import { isAppwriteClient } from "@/lib/types/appwrite";
import { withRetry } from "@/lib/utils/retry";
import { DATABASE_ID, COLLECTION_IDS, STORAGE_BUCKET_ID } from "@/lib/env";
import { Query } from "node-appwrite";
import type { UserDocument, ReportDocument, PolicyInfo } from "@/lib/types/appwrite";

interface SessionUser {
  id: string;
  email: string;
  name: string;
  emailVerification: boolean;
}

/**
 * Request-level cached getSession.
 * Duplicate calls within the same React server render are free.
 */
export const getSessionCached = cache(async (): Promise<SessionUser | null> => {
  try {
    const cookieStore = await cookies();
    const localSession = cookieStore.get("localSession");

    if (!localSession || !localSession.value) {
      return null;
    }

    let payload;
    try {
      const decodedJwt = decodeURIComponent(localSession.value);
      payload = await decryptData(decodedJwt, true);
    } catch {
      try {
        payload = await decryptData(localSession.value, true);
      } catch {
        return null;
      }
    }

    if (!payload || !payload.userId) {
      return null;
    }

    try {
      const clientResult = await clientAction();

      if (!isAppwriteClient(clientResult)) {
        throw new Error('Client action failed: ' + clientResult.message);
      }

      const user = await withRetry(() => clientResult.account.get());

      return {
        id: user.$id,
        email: user.email,
        name: user.name,
        emailVerification: user.emailVerification,
      };
    } catch {
      console.log('Using JWT session (Appwrite validation unavailable)');

      return {
        id: payload.userId as string,
        email: (payload.email as string) || 'user@oauth.local',
        name: (payload.name as string) || 'OAuth User',
        emailVerification: true,
      };
    }

  } catch (error: unknown) {
    const isExpectedError =
      (error instanceof Error && error.message?.includes('prerendering')) ||
      (typeof error === 'object' && error !== null && 'digest' in error && typeof error.digest === 'string' && error.digest.includes('HANGING_PROMISE')) ||
      (error instanceof Error && error.message?.includes('guests')) ||
      (error instanceof Error && error.message?.includes('missing scopes')) ||
      (typeof error === 'object' && error !== null && 'code' in error && error.code === 401);

    if (!isExpectedError) {
      console.error('Session verification failed:', error);
    }

    return null;
  }
});

/**
 * Cross-request cached getUserDocument.
 * Inner: unstable_cache — cached across requests with 60s TTL
 * Outer: cache() — deduplicates within a single render
 */
async function _fetchUserDocument(userId: string): Promise<UserDocument | null> {
  try {
    const { databases } = await adminAction();

    const user = await databases.getDocument<UserDocument>(
      DATABASE_ID,
      COLLECTION_IDS.USERS,
      userId
    );

    return user;
  } catch (error: any) {
    if (error.code === 404) {
      return null;
    }

    console.error('Failed to get user document:', error);
    return null;
  }
}

export const getUserDocumentCached = cache((userId: string) =>
  unstable_cache(_fetchUserDocument, [`user-doc-${userId}`], {
    tags: [`user-doc-${userId}`],
    revalidate: 60,
  })(userId)
);

/**
 * Cross-request cached reports list.
 * Returns reports for a user (own reports) or an insurance company (adjuster view).
 */
async function _fetchReports(
  userId: string,
  role?: string,
  insuranceCompanyId?: string,
): Promise<ReportDocument[]> {
  try {
    const { databases } = await adminAction();

    if (role === 'insurance_adjuster' && insuranceCompanyId) {
      const result = await databases.listDocuments<ReportDocument>(
        DATABASE_ID,
        COLLECTION_IDS.REPORTS,
        [
          Query.equal('insurance_company_id', insuranceCompanyId),
          Query.orderDesc('$createdAt'),
          Query.limit(50),
        ]
      );
      return result.documents;
    }

    const result = await databases.listDocuments<ReportDocument>(
      DATABASE_ID,
      COLLECTION_IDS.REPORTS,
      [
        Query.equal('user_id', userId),
        Query.orderDesc('$createdAt'),
        Query.limit(50),
      ]
    );
    return result.documents;
  } catch (error) {
    console.error('Failed to fetch reports:', error);
    return [];
  }
}

export const getReportsCached = cache(
  (userId: string, role?: string, insuranceCompanyId?: string) => {
    const isAdjuster = role === 'insurance_adjuster' && !!insuranceCompanyId;
    const cacheKey = isAdjuster
      ? `reports-company-${insuranceCompanyId}`
      : `reports-${userId}`;

    return unstable_cache(_fetchReports, [cacheKey], {
      tags: isAdjuster
        ? [`reports-company-${insuranceCompanyId}`]
        : [`reports-${userId}`],
      revalidate: 30,
    })(userId, role, insuranceCompanyId);
  }
);

/**
 * Cross-request cached user policies.
 * Fetches unique policy files from user's reports.
 */
async function _fetchUserPolicies(userId: string): Promise<PolicyInfo[]> {
  try {
    const { databases, storage } = await adminAction();

    const reportsResult = await databases.listDocuments<ReportDocument>(
      DATABASE_ID,
      COLLECTION_IDS.REPORTS,
      [
        Query.equal('user_id', userId),
        Query.isNotNull('policy_file_id'),
        Query.orderDesc('$createdAt'),
        Query.limit(50),
      ]
    );

    const uniquePolicyIds = new Map<string, string>();
    for (const report of reportsResult.documents) {
      if (report.policy_file_id && !uniquePolicyIds.has(report.policy_file_id)) {
        uniquePolicyIds.set(report.policy_file_id, report.$createdAt);
      }
    }

    if (uniquePolicyIds.size === 0) {
      return [];
    }

    const entries = Array.from(uniquePolicyIds.entries());
    const results = await Promise.allSettled(
      entries.map(([fileId]) => storage.getFile(STORAGE_BUCKET_ID, fileId))
    );

    const policies: PolicyInfo[] = [];
    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      const [fileId, uploadedAt] = entries[i];
      if (result.status === 'fulfilled') {
        const file = result.value;
        const url = `${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT}/storage/buckets/${STORAGE_BUCKET_ID}/files/${fileId}/view?project=${process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID}`;
        policies.push({
          fileId,
          filename: file.name,
          size: file.sizeOriginal,
          uploadedAt,
          url,
        });
      } else {
        console.warn(`Policy file ${fileId} not found, skipping`);
      }
    }

    policies.sort(
      (a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
    );

    return policies;
  } catch (error) {
    console.error('Failed to fetch user policies:', error);
    return [];
  }
}

export const getUserPoliciesCached = cache((userId: string) =>
  unstable_cache(_fetchUserPolicies, [`policies-${userId}`], {
    tags: [`policies-${userId}`],
    revalidate: 60,
  })(userId)
);
