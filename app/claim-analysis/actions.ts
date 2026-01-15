"use server";

import { submitClaim } from '@/appwrite/submitClaim';
import { getSession } from '@/appwrite/getSession';

/**
 * Server Action to submit claim from analysis page
 * Automatically gets userId from session (server-side only)
 *
 * @param formData - FormData containing mediaFiles, policyFile, and insuranceCompanyId
 * @returns Claim submission result
 *
 * @example
 * const formData = new FormData();
 * formData.append('mediaFiles', file1);
 * formData.append('mediaFiles', file2);
 * formData.append('policyFile', policyPDF);
 *
 * const result = await submitClaimAction(formData);
 * if (result.success) {
 *   router.push(`/claims/${result.claimId}`);
 * }
 */
export async function submitClaimAction(formData: FormData) {
  // Get userId from session
  const session = await getSession();
  if (!session) {
    return {
      success: false,
      message: 'Not authenticated. Please log in to submit claims.',
    };
  }

  // Extract files and data from FormData
  const mediaFiles = formData.getAll('mediaFiles') as File[];
  const policyFile = formData.get('policyFile') as File | null;
  const insuranceCompanyId = formData.get('insuranceCompanyId') as string | null;

  // Validate media files
  if (!mediaFiles || mediaFiles.length === 0) {
    return {
      success: false,
      message: 'At least one media file is required to submit a claim.',
    };
  }

  console.log(`📋 Submitting claim for user: ${session.id}`);
  console.log(`   Media files: ${mediaFiles.length}`);
  console.log(`   Policy file: ${policyFile ? 'Yes' : 'No'}`);
  console.log(`   Insurance company: ${insuranceCompanyId || 'None'}`);

  // Call submitClaim with session userId
  return await submitClaim({
    userId: session.id,
    insuranceCompanyId: insuranceCompanyId || undefined,
    mediaFiles,
    policyFile: policyFile || undefined,
    useEnhancedAnalysis: !!policyFile,
  });
}
