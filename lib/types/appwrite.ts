import { Models, Account, Databases, Storage, Teams } from 'node-appwrite';

/**
 * Appwrite Document Type Definitions
 * Extends Models.Document to provide type-safe access to collection documents
 */

// Users Collection
export interface UserDocument extends Models.Document {
  full_name: string;
  email: string;
  phone?: string;
  role: 'user' | 'admin' | 'insurance_adjuster';
  insurance_company_id?: string;
  onboarding_completed: boolean;
}

// Insurance Companies Collection
export interface InsuranceCompanyDocument extends Models.Document {
  name: string;
  company_code: string;
  team_id?: string;
  contact_email?: string;
  contact_phone?: string;
  website?: string;
  api_endpoint?: string;
  is_active: boolean;
}

/**
 * Client Action Types
 * Used for type-safe returns from adminOrClient.ts
 */

export interface AppwriteClient {
  account: Account;
  databases: Databases;
  storage: Storage;
  teams: Teams;
}

export interface ErrorResult {
  success: false;
  message: string;
}

/**
 * Type guard for clientAction results
 * Checks if the result is a successful AppwriteClient or an error
 *
 * @example
 * const result = await clientAction();
 * if (isAppwriteClient(result)) {
 *   const user = await result.account.get();
 * } else {
 *   console.error(result.message);
 * }
 */
export function isAppwriteClient(
  result: AppwriteClient | ErrorResult
): result is AppwriteClient {
  return !('success' in result);
}

/**
 * Type guard for AppwriteException errors
 * Use this to check if an error is from Appwrite and access error properties safely
 *
 * @example
 * try {
 *   await operation();
 * } catch (error: unknown) {
 *   if (isAppwriteError(error)) {
 *     console.log(error.code, error.type, error.message);
 *   }
 * }
 */
export interface AppwriteError {
  code: number;
  type: string;
  message: string;
  response?: unknown;
}

export function isAppwriteError(error: unknown): error is AppwriteError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    'type' in error &&
    'message' in error &&
    typeof (error as AppwriteError).code === 'number' &&
    typeof (error as AppwriteError).type === 'string' &&
    typeof (error as AppwriteError).message === 'string'
  );
}

// Claims Collection (Core Data)
export interface ClaimDocument extends Models.Document {
  user_id: string;
  insurance_company_id?: string;
  claim_number: string;
  claim_status: 'pending' | 'approved' | 'denied' | 'partial' | 'needs_investigation';
  damage_type: 'collision' | 'comprehensive' | 'weather' | 'vandalism' | 'unknown';
  damage_cause?: string;
  overall_severity: 'minor' | 'moderate' | 'severe' | 'total_loss';
  estimated_repair_complexity: 'simple' | 'moderate' | 'complex' | 'extensive';
  estimated_total_repair_cost: number;
  confidence_score: number;
  confidence_reasoning?: string;
  vehicle_verification_status: 'matched' | 'mismatched' | 'insufficient_data';
  investigation_needed: boolean;
  investigation_reason?: string;

  // Arrays
  safety_concerns?: string[];
  recommended_actions?: string[];
  media_file_ids?: string[];

  // References
  policy_file_id?: string;

  // Metadata
  ai_model_used: string;
  token_usage?: number;
  analysis_timestamp: string; // DateTime
  updated_by_user_id?: string;
  is_public: boolean;
}

// Claim Damage Details Collection (One-to-Many)
export interface ClaimDamageDetailDocument extends Models.Document {
  claim_id: string;
  part_name: string;
  severity: 'minor' | 'moderate' | 'severe'; // Database enum constraint (schema/database.schema.json:352)
  description: string;
  estimated_repair_cost?: number;
  sort_order: number;
}

// Claim Vehicle Verification Collection (One-to-One)
export interface ClaimVehicleVerificationDocument extends Models.Document {
  claim_id: string;
  video_license_plate?: string;
  video_vin?: string;
  video_make?: string;
  video_model?: string;
  video_year?: number;
  video_color?: string;
  policy_license_plate?: string;
  policy_vin?: string;
  policy_make?: string;
  policy_model?: string;
  policy_year?: number;
  policy_color?: string;
  verification_status: 'matched' | 'mismatched' | 'insufficient_data';
  mismatches?: string;
  confidence_score: number;
  notes?: string;
}

// Claim Assessments Collection (One-to-One)
export interface ClaimAssessmentDocument extends Models.Document {
  claim_id: string;
  coverage_types?: string[];
  deductible_types?: string[];
  deductible_amounts?: number[];
  exclusions?: string[];
  coverage_limit_collision?: number;
  coverage_limit_comprehensive?: number;
  coverage_limit_liability?: number;
  relevant_policy_sections?: string[];
  assessment_status: 'approved' | 'denied' | 'partial' | 'needs_investigation';
  covered_damages?: string[];
  excluded_damages?: string[];
  total_repair_estimate: number;
  covered_amount: number;
  deductible: number;
  non_covered_items: number;
  estimated_payout: number;
  reasoning?: string;
  policy_references?: string[];
}

// Audit Logs Collection
export interface AuditLogDocument extends Models.Document {
  user_id?: string;
  action: 'analyze_video' | 'analyze_image' | 'analyze_policy' | 'create_claim' | 'update_claim' | 'delete_claim' | 'user_login' | 'user_logout';
  resource_type: 'claim' | 'analysis' | 'user' | 'insurance_company';
  resource_id?: string;
  result: 'success' | 'error' | 'flagged';
  file_hashes?: string[];
  security_flags?: string[];
  token_usage?: number;
  ip_address?: string;
  user_agent?: string;
  error_message?: string;
  metadata?: string; // JSON object
}

/**
 * Helper functions for fetching full claim data with related collections
 */

import type { Databases } from 'node-appwrite';
import { Query } from 'node-appwrite';

/**
 * Full claim data with all related collections
 */
export interface FullClaimData {
  claim: ClaimDocument;
  damageDetails: ClaimDamageDetailDocument[];
  vehicleVerification: ClaimVehicleVerificationDocument | null;
  assessment: ClaimAssessmentDocument | null;
}

/**
 * Fetch full claim data including all related collections
 *
 * @example
 * import { adminAction } from '@/appwrite/adminOrClient';
 * import { DATABASE_ID, COLLECTION_IDS } from '@/lib/env';
 *
 * const { databases } = await adminAction();
 * const fullClaim = await fetchFullClaimData(databases, DATABASE_ID, COLLECTION_IDS, claimId);
 */
export async function fetchFullClaimData(
  databases: Databases,
  databaseId: string,
  collectionIds: {
    CLAIMS: string;
    CLAIM_DAMAGE_DETAILS: string;
    CLAIM_VEHICLE_VERIFICATION: string;
    CLAIM_ASSESSMENTS: string;
  },
  claimId: string
): Promise<FullClaimData> {
  // Fetch main claim
  const claim = await databases.getDocument<ClaimDocument>(
    databaseId,
    collectionIds.CLAIMS,
    claimId
  );

  // Fetch damage details (one-to-many)
  const damageDetailsResult = await databases.listDocuments<ClaimDamageDetailDocument>(
    databaseId,
    collectionIds.CLAIM_DAMAGE_DETAILS,
    [Query.equal('claim_id', claimId), Query.orderAsc('sort_order')]
  );

  // Fetch vehicle verification (one-to-one)
  const verificationResult = await databases.listDocuments<ClaimVehicleVerificationDocument>(
    databaseId,
    collectionIds.CLAIM_VEHICLE_VERIFICATION,
    [Query.equal('claim_id', claimId), Query.limit(1)]
  );

  // Fetch assessment (one-to-one)
  const assessmentResult = await databases.listDocuments<ClaimAssessmentDocument>(
    databaseId,
    collectionIds.CLAIM_ASSESSMENTS,
    [Query.equal('claim_id', claimId), Query.limit(1)]
  );

  return {
    claim,
    damageDetails: damageDetailsResult.documents,
    vehicleVerification: verificationResult.documents[0] || null,
    assessment: assessmentResult.documents[0] || null,
  };
}

/**
 * Parse audit log metadata JSON string
 */
export function parseAuditLogMetadata(log: AuditLogDocument): Record<string, any> | null {
  if (!log.metadata) return null;
  try {
    return JSON.parse(log.metadata);
  } catch (error) {
    console.error('Failed to parse audit log metadata:', error);
    return null;
  }
}

/**
 * File upload result from Appwrite Storage
 * Represents a successfully uploaded file with metadata
 */
export interface UploadedFile {
  fileId: string;
  filename: string;
  mimeType: string;
  size: number;
  url?: string;
}
