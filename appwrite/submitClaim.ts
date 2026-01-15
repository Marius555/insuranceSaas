"use server";

import { uploadMediaFiles, uploadPolicyFile, deleteFile } from '@/appwrite/storage';
import { createClaimFromAnalysis } from '@/appwrite/createClaim';
import {
  convertFilesToBase64Server,
  convertFileToBase64Server,
  isVideo,
  detectFileType,
} from '@/lib/utils/fileConversion';
import { analyzeAutoDamage } from '@/lib/gemini/actions/analyzeVideo';
import { analyzeAutoDamageWithPolicy } from '@/lib/gemini/actions/analyzeVideoPlusPolicy';
import { analyzeAutoDamageFromImages } from '@/lib/gemini/actions/analyzeImage';
import { analyzeAutoDamageWithPolicyFromImages } from '@/lib/gemini/actions/analyzeImagePlusPolicy';
import type {
  EnhancedAutoDamageAnalysis,
  AutoDamageAnalysis,
  GeminiResult,
} from '@/lib/gemini/types';

/**
 * Complete Claim Submission Server Action
 * Handles the end-to-end flow from file upload to database submission
 */

export interface SubmitClaimInput {
  // User info
  userId: string;
  insuranceCompanyId?: string;

  // Files (from client as File objects)
  mediaFiles: File[]; // Images or single video
  policyFile?: File; // Optional policy PDF

  // Analysis options
  useEnhancedAnalysis?: boolean; // If true, requires policy file
}

export interface SubmitClaimResult {
  success: boolean;
  claimId?: string;
  claimNumber?: string;
  analysis?: EnhancedAutoDamageAnalysis | AutoDamageAnalysis;
  message?: string;
  warnings?: string[];
  retryAfter?: number; // Seconds to wait before retry (rate limiting)
}

/**
 * Submit a complete claim with files, analysis, and database storage
 *
 * Flow:
 * 1. Upload files to Appwrite Storage
 * 2. Convert files to base64 for Gemini
 * 3. Analyze with Gemini (enhanced or basic)
 * 4. Validate analysis results
 * 5. Create claim in database with permissions
 * 6. Return success with claim info
 *
 * @param input - Claim submission input
 * @returns Claim submission result
 *
 * @example
 * const result = await submitClaim({
 *   userId: session.userId,
 *   insuranceCompanyId: selectedCompanyId,
 *   mediaFiles: [image1, image2],
 *   policyFile: policyPDF,
 *   useEnhancedAnalysis: true
 * });
 *
 * if (result.success) {
 *   console.log('Claim created:', result.claimNumber);
 * } else {
 *   console.error('Failed:', result.message);
 * }
 */
export async function submitClaim(
  input: SubmitClaimInput
): Promise<SubmitClaimResult> {
  try {
    // Validation
    if (input.mediaFiles.length === 0) {
      return {
        success: false,
        message: 'At least one media file (image or video) is required',
      };
    }

    if (input.useEnhancedAnalysis && !input.policyFile) {
      return {
        success: false,
        message: 'Policy file is required for enhanced analysis',
      };
    }

    // STEP 1: Upload files to Appwrite Storage
    console.log('📤 Step 1: Uploading files to storage...');

    const mediaUploadResult = await uploadMediaFiles(input.mediaFiles);
    if (!mediaUploadResult.success) {
      return {
        success: false,
        message: `Failed to upload media files: ${mediaUploadResult.message}`,
      };
    }

    const mediaFileIds = mediaUploadResult.fileIds!;

    let policyFileId: string | undefined;
    if (input.policyFile) {
      const policyUploadResult = await uploadPolicyFile(input.policyFile);
      if (!policyUploadResult.success) {
        // Cleanup uploaded media files
        await Promise.all(mediaFileIds.map((id) => deleteFile(id)));

        return {
          success: false,
          message: `Failed to upload policy file: ${policyUploadResult.message}`,
        };
      }
      policyFileId = policyUploadResult.fileId;
    }

    console.log(`✅ Uploaded ${mediaFileIds.length} media files${policyFileId ? ' + policy' : ''}`);

    // STEP 2: Convert files to base64 for Gemini
    console.log('🔄 Step 2: Converting files to base64...');

    let mediaBase64: Array<{ base64: string; mimeType: string; filename: string }>;
    let policyBase64: string | undefined;

    try {
      mediaBase64 = await convertFilesToBase64Server(input.mediaFiles);

      if (input.policyFile) {
        const policyData = await convertFileToBase64Server(input.policyFile);
        policyBase64 = policyData.base64;
      }
    } catch (error: any) {
      // Cleanup uploaded files
      await cleanupUploadedFiles(mediaFileIds, policyFileId);

      return {
        success: false,
        message: `Failed to convert files to base64: ${error.message}`,
      };
    }

    console.log('✅ Files converted to base64');

    // STEP 3: Analyze with Gemini
    console.log('🤖 Step 3: Analyzing with Gemini AI...');

    let analysisResult: GeminiResult<{
      analysis: EnhancedAutoDamageAnalysis | AutoDamageAnalysis;
      securityWarnings?: string[];
    }>;

    // Determine if media is video or images
    const firstFile = mediaBase64[0];
    const isVideoFile = isVideo({ mimeType: firstFile.mimeType });

    if (policyBase64) {
      // Enhanced analysis with policy
      if (isVideoFile) {
        // Video + Policy
        analysisResult = await analyzeAutoDamageWithPolicy(
          mediaBase64[0].base64,
          mediaBase64[0].mimeType as 'video/mp4' | 'video/mov' | 'video/avi',
          policyBase64,
          true // isBase64
        );
      } else {
        // Images + Policy
        analysisResult = await analyzeAutoDamageWithPolicyFromImages(
          mediaBase64.map((m) => ({
            base64: m.base64,
            mimeType: m.mimeType as any,
            angle: m.filename,
          })),
          policyBase64
        );
      }
    } else {
      // Basic analysis without policy
      if (isVideoFile) {
        // Video only
        analysisResult = await analyzeAutoDamage(
          mediaBase64[0].base64,
          mediaBase64[0].mimeType as 'video/mp4' | 'video/mov' | 'video/avi',
          true // isBase64
        );
      } else {
        // Images only
        analysisResult = await analyzeAutoDamageFromImages(
          mediaBase64.map((m) => ({
            base64: m.base64,
            mimeType: m.mimeType as any,
            angle: m.filename,
          }))
        );
      }
    }

    // STEP 4: Check if analysis succeeded
    if (!analysisResult.success) {
      // Cleanup uploaded files
      await cleanupUploadedFiles(mediaFileIds, policyFileId);

      // Handle rate limiting
      if ('rateLimited' in analysisResult && analysisResult.rateLimited) {
        return {
          success: false,
          message: `AI models at capacity. ${analysisResult.message}`,
          retryAfter: analysisResult.retryAfter,
        };
      }

      return {
        success: false,
        message: `Analysis failed: ${analysisResult.message}`,
      };
    }

    const analysis = analysisResult.data.analysis;
    const securityWarnings = analysisResult.data.securityWarnings;

    console.log(`✅ Analysis completed (Model: ${analysisResult.modelUsed})`);
    if (securityWarnings && securityWarnings.length > 0) {
      console.warn('⚠️ Security warnings detected:', securityWarnings);
    }

    // STEP 5: Validate that we have enhanced analysis for database submission
    // If we don't have a policy, we need to convert AutoDamageAnalysis to EnhancedAutoDamageAnalysis
    let enhancedAnalysis: EnhancedAutoDamageAnalysis;

    if (policyBase64) {
      // We already have enhanced analysis
      enhancedAnalysis = analysis as EnhancedAutoDamageAnalysis;
    } else {
      // Convert basic analysis to enhanced format with default values
      const basicAnalysis = analysis as AutoDamageAnalysis;
      enhancedAnalysis = convertToEnhancedAnalysis(basicAnalysis);
    }

    // STEP 6: Create claim in database
    console.log('💾 Step 4: Creating claim in database...');

    const claimResult = await createClaimFromAnalysis(
      input.userId,
      input.insuranceCompanyId,
      enhancedAnalysis,
      mediaFileIds,
      policyFileId
    );

    if (!claimResult.success) {
      // Keep uploaded files for potential retry (don't cleanup)
      return {
        success: false,
        message: `Failed to create claim in database: ${claimResult.message}`,
      };
    }

    console.log(`✅ Claim created: ${claimResult.data!.claim_number}`);

    // STEP 7: Return success with claim info
    return {
      success: true,
      claimId: claimResult.data!.$id,
      claimNumber: claimResult.data!.claim_number,
      analysis: enhancedAnalysis,
      warnings: securityWarnings,
    };
  } catch (error: any) {
    console.error('❌ Failed to submit claim:', error);
    return {
      success: false,
      message: error.message || 'Failed to submit claim. Please try again.',
    };
  }
}

/**
 * Cleanup uploaded files when operation fails
 * Deletes files from Appwrite Storage
 */
async function cleanupUploadedFiles(
  mediaFileIds: string[],
  policyFileId?: string
): Promise<void> {
  console.log('🧹 Cleaning up uploaded files...');

  const deletePromises = [
    ...mediaFileIds.map((id) => deleteFile(id)),
    ...(policyFileId ? [deleteFile(policyFileId)] : []),
  ];

  await Promise.allSettled(deletePromises);
}

/**
 * Convert basic AutoDamageAnalysis to EnhancedAutoDamageAnalysis
 * Fills in default values for policy-related fields
 */
function convertToEnhancedAnalysis(
  basic: AutoDamageAnalysis
): EnhancedAutoDamageAnalysis {
  // Calculate estimated total repair cost from damaged parts
  let estimatedTotalRepairCost = 0;

  if (basic.damagedParts && basic.damagedParts.length > 0) {
    // Estimate costs based on severity if not provided
    // NOTE: 'unknown' severity is normalized to 'moderate' in normalizeSeverity()
    estimatedTotalRepairCost = basic.damagedParts.reduce((total, part) => {
      // Use provided cost or estimate based on severity
      const cost =
        (part as any).estimatedRepairCost ||
        (part.severity === 'severe' ? 2000
          : part.severity === 'moderate' ? 800
          : 300); // minor
      return total + cost;
    }, 0);
  }

  return {
    ...basic,
    estimatedTotalRepairCost,
    damageType: 'unknown', // Will be manually reviewed
    damageCause: 'Unknown - requires manual review',

    // Vehicle verification - insufficient data without policy
    vehicleVerification: {
      videoVehicle: {
        licensePlate: null,
        vin: null,
        make: null,
        model: null,
        year: 0, // ✅ Changed from null to 0 for numeric field
        color: null,
      },
      policyVehicle: {
        licensePlate: null,
        vin: null,
        make: null,
        model: null,
        year: 0, // ✅ Changed from null to 0 for numeric field
        color: null,
      },
      verificationStatus: 'insufficient_data',
      mismatches: [],
      confidenceScore: 0,
      notes: 'No policy provided - vehicle verification not performed',
    },

    // Policy analysis - no policy provided
    policyAnalysis: {
      coverageTypes: [],
      deductibles: [],
      exclusions: [],
      coverageLimits: {
        collision: 0, // ✅ Changed from null to 0 for Appwrite validation
        comprehensive: 0, // ✅ Changed from null to 0 for Appwrite validation
        liability: 0, // ✅ Changed from null to 0 for Appwrite validation
      },
      relevantPolicySections: [],
    },

    // Claim assessment - needs manual review without policy
    claimAssessment: {
      status: 'needs_investigation',
      coveredDamages: [],
      excludedDamages: [],
      financialBreakdown: {
        totalRepairEstimate: estimatedTotalRepairCost,
        coveredAmount: 0,
        deductible: 0,
        nonCoveredItems: estimatedTotalRepairCost,
        estimatedPayout: 0,
      },
      reasoning:
        'No insurance policy provided. Claim requires manual review by adjuster to determine coverage and payout.',
      policyReferences: [],
    },

    // Investigation needed since no policy
    investigationNeeded: true,
    investigationReason:
      'No insurance policy provided - requires manual review to verify coverage and calculate payout',

    // Lower confidence without policy verification
    confidence: Math.max(0, (basic.confidence || 0.5) - 0.2),
    confidenceReasoning:
      (basic as any).confidenceReasoning ||
      'Analysis based on visual damage only. Policy verification not performed.',
  };
}

/**
 * Get claim submission status
 * Useful for checking if a claim was successfully created
 *
 * @param claimId - Claim document ID
 * @returns Claim status
 */
export async function getClaimStatus(claimId: string): Promise<{
  success: boolean;
  status?: string;
  message?: string;
}> {
  try {
    const { adminAction } = await import('@/appwrite/adminOrClient');
    const { DATABASE_ID, COLLECTION_IDS } = await import('@/lib/env');
    const { databases } = await adminAction();

    const claim = await databases.getDocument(
      DATABASE_ID,
      COLLECTION_IDS.CLAIMS,
      claimId
    );

    return {
      success: true,
      status: claim.claim_status,
    };
  } catch (error: any) {
    console.error('Failed to get claim status:', error);
    return {
      success: false,
      message: error.message || 'Failed to get claim status',
    };
  }
}
