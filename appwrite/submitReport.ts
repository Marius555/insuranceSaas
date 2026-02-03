"use server";

import { uploadMediaFiles, uploadPolicyFile, deleteFile } from '@/appwrite/storage';
import { createReportFromAnalysis } from '@/appwrite/createReport';
import { adminAction } from '@/appwrite/adminOrClient';
import { STORAGE_BUCKET_ID } from '@/lib/env';
import {
  convertFilesToBase64Server,
  convertFileToBase64Server,
  isVideo,
  detectFileType,
} from '@/lib/utils/fileConversion';
import { withTimeout, isTimeoutError } from '@/lib/utils/timeout';
import { analyzeAutoDamage } from '@/lib/gemini/actions/analyzeVideo';
import { analyzeAutoDamageWithPolicy } from '@/lib/gemini/actions/analyzeVideoPlusPolicy';
import { analyzeAutoDamageFromImages } from '@/lib/gemini/actions/analyzeImage';
import { analyzeAutoDamageWithPolicyFromImages } from '@/lib/gemini/actions/analyzeImagePlusPolicy';
import type {
  EnhancedAutoDamageAnalysis,
  AutoDamageAnalysis,
  GeminiResult,
} from '@/lib/gemini/types';

// Timeout for Gemini AI analysis (60 seconds)
const GEMINI_TIMEOUT_MS = 60000;

/**
 * Complete Report Submission Server Action
 * Handles the end-to-end flow from file upload to database submission
 */

export interface SubmitReportInput {
  // User info
  userId: string;
  insuranceCompanyId?: string;

  // Files (from client as File objects)
  mediaFiles: File[]; // Images or single video
  policyFile?: File; // Optional policy PDF (new upload)
  existingPolicyFileId?: string; // Optional existing policy file ID (reuse previous)

  // Analysis options
  useEnhancedAnalysis?: boolean; // If true, requires policy (file or existing ID)

  // Localization
  userCountry?: string; // User's country for localized pricing estimates
  userCurrency?: string; // Currency code (e.g., EUR, USD)
  userCurrencySymbol?: string; // Currency symbol (e.g., €, $)

  // Video quality metadata (for forensic analysis)
  videoQualityMetadata?: {
    resolution: string;
    bitrate: string;
    focusMode: string;
    duration: number;
    qualitySeconds: number;
  };
}

export interface SubmitReportResult {
  success: boolean;
  reportId?: string;
  reportNumber?: string;
  analysis?: EnhancedAutoDamageAnalysis | AutoDamageAnalysis;
  message?: string;
  warnings?: string[];
  retryAfter?: number; // Seconds to wait before retry (rate limiting)
}

/**
 * Submit a complete report with files, analysis, and database storage
 *
 * Optimized Flow (prevents ECONNRESET errors):
 * 1. Convert files to base64 for Gemini (fast, in memory)
 * 2. Analyze with Gemini (with 60s timeout)
 * 3. Upload files to Appwrite Storage (only after successful analysis)
 * 4. Validate analysis results
 * 5. Create report in database with permissions
 * 6. Return success with report info
 *
 * This order prevents wasted upload time if Gemini analysis fails,
 * and reduces the overall request duration to prevent connection resets.
 *
 * @param input - Report submission input
 * @returns Report submission result
 *
 * @example
 * const result = await submitReport({
 *   userId: session.userId,
 *   insuranceCompanyId: selectedCompanyId,
 *   mediaFiles: [image1, image2],
 *   policyFile: policyPDF,
 *   useEnhancedAnalysis: true
 * });
 *
 * if (result.success) {
 *   console.log('Report created:', result.reportNumber);
 * } else {
 *   console.error('Failed:', result.message);
 * }
 */
export async function submitReport(
  input: SubmitReportInput
): Promise<SubmitReportResult> {
  try {
    // Validation
    if (input.mediaFiles.length === 0) {
      return {
        success: false,
        message: 'At least one media file (image or video) is required',
      };
    }

    // Check if we have a policy (either new file or existing file ID)
    const hasPolicy = !!input.policyFile || !!input.existingPolicyFileId;

    if (input.useEnhancedAnalysis && !hasPolicy) {
      return {
        success: false,
        message: 'Policy file is required for enhanced analysis',
      };
    }

    // OPTIMIZED FLOW: Convert to base64 → Gemini analysis → Upload to storage
    // This prevents wasted upload time if Gemini analysis fails

    // STEP 1: Convert files to base64 for Gemini FIRST (fast, in memory)
    console.log('🔄 Step 1: Converting files to base64...');

    let mediaBase64: Array<{ base64: string; mimeType: string; filename: string }>;
    let policyBase64: string | undefined;

    try {
      mediaBase64 = await convertFilesToBase64Server(input.mediaFiles);

      if (input.policyFile) {
        // New policy file upload
        const policyData = await convertFileToBase64Server(input.policyFile);
        policyBase64 = policyData.base64;
      } else if (input.existingPolicyFileId) {
        // Fetch existing policy from storage
        console.log('📄 Fetching existing policy from storage...');
        const { storage } = await adminAction();

        try {
          // Get file as buffer from Appwrite Storage
          const fileBuffer = await storage.getFileDownload(
            STORAGE_BUCKET_ID,
            input.existingPolicyFileId
          );

          // Convert Buffer to base64
          policyBase64 = Buffer.from(fileBuffer).toString('base64');
          console.log('✅ Existing policy loaded from storage');
        } catch (storageError: any) {
          console.error('Failed to fetch existing policy:', storageError);
          return {
            success: false,
            message: 'Failed to load existing policy. It may have been deleted.',
          };
        }
      }
    } catch (error: any) {
      return {
        success: false,
        message: `Failed to process files: ${error.message}`,
      };
    }

    console.log('✅ Files converted to base64');

    // STEP 2: Analyze with Gemini (with timeout to prevent hanging)
    console.log('🤖 Step 2: Analyzing with Gemini AI...');

    let analysisResult: GeminiResult<{
      analysis: EnhancedAutoDamageAnalysis | AutoDamageAnalysis;
      securityWarnings?: string[];
    }>;

    // Determine if media is video or images
    const firstFile = mediaBase64[0];
    const isVideoFile = isVideo({ mimeType: firstFile.mimeType });

    try {
      if (policyBase64) {
        // Enhanced analysis with policy
        if (isVideoFile) {
          // Video + Policy
          // Note: MIME type normalization (stripping codec suffix) happens inside the analysis functions
          analysisResult = await withTimeout(
            analyzeAutoDamageWithPolicy(
              mediaBase64[0].base64,
              mediaBase64[0].mimeType as 'video/mp4' | 'video/mov' | 'video/avi' | 'video/webm',
              policyBase64,
              true, // isBase64
              input.userCountry,
              input.userCurrency,
              input.userCurrencySymbol,
              input.videoQualityMetadata
            ),
            GEMINI_TIMEOUT_MS,
            'AI analysis timed out. Please try again with a shorter video or fewer images.'
          );
        } else {
          // Images + Policy
          analysisResult = await withTimeout(
            analyzeAutoDamageWithPolicyFromImages(
              mediaBase64.map((m) => ({
                base64: m.base64,
                mimeType: m.mimeType as any,
                angle: m.filename,
              })),
              policyBase64,
              {
                userCountry: input.userCountry,
                userCurrency: input.userCurrency,
                userCurrencySymbol: input.userCurrencySymbol,
              }
            ),
            GEMINI_TIMEOUT_MS,
            'AI analysis timed out. Please try again with fewer images.'
          );
        }
      } else {
        // Basic analysis without policy
        if (isVideoFile) {
          // Video only
          // Note: MIME type normalization (stripping codec suffix) happens inside the analysis functions
          analysisResult = await withTimeout(
            analyzeAutoDamage(
              mediaBase64[0].base64,
              mediaBase64[0].mimeType as 'video/mp4' | 'video/mov' | 'video/avi' | 'video/webm',
              true, // isBase64
              input.userCountry,
              input.userCurrency,
              input.userCurrencySymbol,
              input.videoQualityMetadata
            ),
            GEMINI_TIMEOUT_MS,
            'AI analysis timed out. Please try again with a shorter video.'
          );
        } else {
          // Images only
          analysisResult = await withTimeout(
            analyzeAutoDamageFromImages(
              mediaBase64.map((m) => ({
                base64: m.base64,
                mimeType: m.mimeType as any,
                angle: m.filename,
              })),
              {
                userCountry: input.userCountry,
                userCurrency: input.userCurrency,
                userCurrencySymbol: input.userCurrencySymbol,
              }
            ),
            GEMINI_TIMEOUT_MS,
            'AI analysis timed out. Please try again with fewer images.'
          );
        }
      }
    } catch (error: any) {
      // Handle timeout errors with user-friendly message
      if (isTimeoutError(error)) {
        return {
          success: false,
          message: error.message,
        };
      }
      throw error;
    }

    // Check if analysis succeeded
    if (!analysisResult.success) {
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

    // STEP 3: Upload files to Appwrite Storage AFTER successful analysis
    // This way, if Gemini fails, we haven't wasted time uploading
    console.log('📤 Step 3: Uploading files to storage...');

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
      // Upload new policy file
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
    } else if (input.existingPolicyFileId) {
      // Reuse existing policy file ID (no upload needed)
      policyFileId = input.existingPolicyFileId;
      console.log('📄 Reusing existing policy file:', policyFileId);
    }

    console.log(`✅ Uploaded ${mediaFileIds.length} media files${policyFileId ? (input.existingPolicyFileId ? ' + existing policy' : ' + new policy') : ''}`);

    // STEP 4: Validate that we have enhanced analysis for database submission
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

    // STEP 5: Create report in database
    console.log('💾 Step 5: Creating report in database...');

    const reportResult = await createReportFromAnalysis(
      input.userId,
      input.insuranceCompanyId,
      enhancedAnalysis,
      mediaFileIds,
      policyFileId
    );

    if (!reportResult.success) {
      // Keep uploaded files for potential retry (don't cleanup)
      return {
        success: false,
        message: `Failed to create report in database: ${reportResult.message}`,
      };
    }

    console.log(`✅ Report created: ${reportResult.data!.claim_number}`);

    // STEP 6: Return success with report info
    return {
      success: true,
      reportId: reportResult.data!.$id,
      reportNumber: reportResult.data!.claim_number,
      analysis: enhancedAnalysis,
      warnings: securityWarnings,
    };
  } catch (error: any) {
    console.error('❌ Failed to submit report:', error);
    return {
      success: false,
      message: error.message || 'Failed to submit report. Please try again.',
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

    vehicleVerification: {
      videoVehicle: {
        licensePlate: null,
        vin: null,
        make: null,
        model: null,
        year: 0,
        color: null,
      },
      policyVehicle: {
        licensePlate: null,
        vin: null,
        make: null,
        model: null,
        year: 0,
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

    // Report assessment - needs manual review without policy
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
        'No insurance policy provided. Report requires manual review by adjuster to determine coverage and payout.',
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
 * Get report submission status
 * Useful for checking if a report was successfully created
 *
 * @param reportId - Report document ID
 * @returns Report status
 */
export async function getReportStatus(reportId: string): Promise<{
  success: boolean;
  status?: string;
  message?: string;
}> {
  try {
    const { adminAction } = await import('@/appwrite/adminOrClient');
    const { DATABASE_ID, COLLECTION_IDS } = await import('@/lib/env');
    const { databases } = await adminAction();

    const report = await databases.getDocument(
      DATABASE_ID,
      COLLECTION_IDS.REPORTS,
      reportId
    );

    return {
      success: true,
      status: report.claim_status,
    };
  } catch (error: any) {
    console.error('Failed to get report status:', error);
    return {
      success: false,
      message: error.message || 'Failed to get report status',
    };
  }
}
