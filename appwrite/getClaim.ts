"use server";

import { adminAction } from '@/appwrite/adminOrClient';
import { DATABASE_ID, COLLECTION_IDS } from '@/lib/env';
import { fetchFullClaimData, type FullClaimData } from '@/lib/types/appwrite';
import { getFileUrl, getFileDownloadUrl } from '@/appwrite/storage';

export interface MediaFile {
  fileId: string;
  url: string;
  downloadUrl: string;
}

export interface PolicyFile {
  fileId: string;
  url: string;
  downloadUrl: string;
}

export interface ClaimWithFiles extends FullClaimData {
  mediaFiles: MediaFile[];
  policyFile: PolicyFile | null;
}

/**
 * Fetch claim data with generated file URLs
 *
 * @param claimId - Claim document ID
 * @returns Claim data with file URLs or error
 */
export async function getClaimById(claimId: string): Promise<{
  success: boolean;
  data?: ClaimWithFiles;
  message?: string;
}> {
  try {
    const { databases } = await adminAction();

    // Fetch full claim data (claim + damage details + verification + assessment)
    const fullClaim = await fetchFullClaimData(
      databases,
      DATABASE_ID,
      COLLECTION_IDS,
      claimId
    );

    // Generate media file URLs from file IDs
    const mediaFiles: MediaFile[] = await Promise.all(
      (fullClaim.claim.media_file_ids || []).map(async (fileId) => ({
        fileId,
        url: await getFileUrl(fileId),
        downloadUrl: await getFileDownloadUrl(fileId),
      }))
    );

    // Generate policy file URLs if policy exists
    let policyFile: PolicyFile | null = null;
    if (fullClaim.claim.policy_file_id) {
      policyFile = {
        fileId: fullClaim.claim.policy_file_id,
        url: await getFileUrl(fullClaim.claim.policy_file_id),
        downloadUrl: await getFileDownloadUrl(fullClaim.claim.policy_file_id),
      };
    }

    return {
      success: true,
      data: {
        ...fullClaim,
        mediaFiles,
        policyFile,
      },
    };
  } catch (error: any) {
    console.error('Failed to fetch claim:', error);

    // Handle specific error cases
    if (error.code === 404) {
      return {
        success: false,
        message: 'Claim not found',
      };
    }

    return {
      success: false,
      message: error.message || 'Failed to fetch claim data',
    };
  }
}
