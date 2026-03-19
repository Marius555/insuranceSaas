"use server";

import { submitReport } from '@/appwrite/submitReport';
import { getSession } from '@/appwrite/getSession';
import { checkEvaluationLimit, decrementEvaluationLimit } from '@/appwrite/checkEvaluationLimit';
import { revalidatePath, revalidateTag } from 'next/cache';

/**
 * Server Action to submit report from analysis page
 * Automatically gets userId from session (server-side only)
 *
 * @param formData - FormData containing mediaFiles, policyFile, and insuranceCompanyId
 * @returns Report submission result
 *
 * @example
 * const formData = new FormData();
 * formData.append('mediaFiles', file1);
 * formData.append('mediaFiles', file2);
 * formData.append('policyFile', policyPDF);
 *
 * const result = await submitReportAction(formData);
 * if (result.success) {
 *   router.push(`/auth/reports/${result.reportId}`);
 * }
 */
export async function submitReportAction(formData: FormData) {
  // Extract files and data from FormData
  const mediaFiles = formData.getAll('mediaFiles') as File[];
  const supplementaryPhotos = formData.getAll('supplementaryPhotos') as File[];
  const policyFile = formData.get('policyFile') as File | null;
  const existingPolicyFileId = formData.get('existingPolicyFileId') as string | null;
  const insuranceCompanyId = formData.get('insuranceCompanyId') as string | null;
  const userCountry = formData.get('userCountry') as string | null;
  const userCurrency = formData.get('userCurrency') as string | null;
  const userCurrencySymbol = formData.get('userCurrencySymbol') as string | null;
  const videoQualityMetadataStr = formData.get('videoQualityMetadata') as string | null;

  // Get userId from session (secure authentication)
  const session = await getSession();
  if (!session) {
    return {
      success: false,
      message: 'Not authenticated. Please log in to submit reports.',
    };
  }
  const userId = session.id;

  // Check evaluation limit before proceeding
  const evalCheck = await checkEvaluationLimit(userId);
  if (!evalCheck.allowed) {
    return { success: false, message: evalCheck.message };
  }

  // Parse video quality metadata if provided
  let videoQualityMetadata: {
    resolution: string;
    bitrate: string;
    focusMode: string;
    duration: number;
    qualitySeconds: number;
  } | undefined;

  if (videoQualityMetadataStr) {
    try {
      videoQualityMetadata = JSON.parse(videoQualityMetadataStr);
    } catch {
      console.warn('Failed to parse video quality metadata');
    }
  }

  // Validate media files
  if (!mediaFiles || mediaFiles.length === 0) {
    return {
      success: false,
      message: 'At least one media file is required to submit a report.',
    };
  }

  // Determine if we have a policy (either new or existing)
  const hasPolicy = !!policyFile || !!existingPolicyFileId;

  console.log(`📋 Submitting report for user: ${userId}`);
  console.log(`   Media files: ${mediaFiles.length}`);
  console.log(`   Supplementary photos: ${supplementaryPhotos.length}`);
  console.log(`   Policy file: ${policyFile ? 'Yes (new upload)' : existingPolicyFileId ? 'Yes (existing)' : 'No'}`);
  console.log(`   Insurance company: ${insuranceCompanyId || 'None'}`);
  console.log(`   User country: ${userCountry || 'Not detected'}`);
  console.log(`   Currency: ${userCurrency || 'USD'} (${userCurrencySymbol || '$'})`);
  if (videoQualityMetadata) {
    console.log(`   Video Quality: ${videoQualityMetadata.resolution}, ${videoQualityMetadata.qualitySeconds}s stable footage`);
  }
  // Call submitReport with userId
  const result = await submitReport({
    userId,
    insuranceCompanyId: insuranceCompanyId || undefined,
    mediaFiles,
    supplementaryPhotos: supplementaryPhotos.length > 0 ? supplementaryPhotos : undefined,
    policyFile: policyFile || undefined,
    existingPolicyFileId: existingPolicyFileId || undefined,
    useEnhancedAnalysis: hasPolicy,
    userCountry: userCountry || undefined,
    userCurrency: userCurrency || undefined,
    userCurrencySymbol: userCurrencySymbol || undefined,
    videoQualityMetadata,
  });

  // Bust Router Cache + Data Cache so the user sees their new report immediately
  if (result.success) {
    await decrementEvaluationLimit(userId);
    revalidatePath(`/auth/dashboard/${userId}/reports`);
    revalidatePath(`/auth/dashboard/${userId}`);
    revalidateTag(`reports-${userId}`, { expire: 0 });
    revalidateTag(`policies-${userId}`, { expire: 0 });
    if (insuranceCompanyId) {
      revalidateTag(`reports-company-${insuranceCompanyId}`, { expire: 0 });
    }
  }

  return result;
}
