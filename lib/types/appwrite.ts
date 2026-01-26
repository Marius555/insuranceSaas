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

// Reports Collection (Core Data)
export interface ReportDocument extends Models.Document {
  user_id: string;
  insurance_company_id?: string;
  claim_number: string;
  claim_status: 'pending' | 'analyzed' | 'approved' | 'denied' | 'partial' | 'needs_investigation';
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

// Report Damage Details Collection (One-to-Many)
export interface ReportDamageDetailDocument extends Models.Document {
  claim_id: string;
  part_name: string;
  severity: 'minor' | 'moderate' | 'severe'; // Database enum constraint (schema/database.schema.json:352)
  description: string;
  estimated_repair_cost?: string; // e.g., "$500 - $800"
  sort_order: number;
}

// Report Vehicle Verification Collection (One-to-One)
export interface ReportVehicleVerificationDocument extends Models.Document {
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

// Report Assessments Collection (One-to-One)
export interface ReportAssessmentDocument extends Models.Document {
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

// Report Fraud Assessments Collection (One-to-One)
export interface ReportFraudAssessmentDocument extends Models.Document {
  claim_id: string;
  damage_age_estimated?: string;
  damage_age_confidence?: number;
  damage_age_data_json?: string;
  contamination_detected: boolean;
  contamination_data_json?: string;
  rust_detected: boolean;
  rust_fraud_indicator: boolean;
  rust_data_json?: string;
  pre_existing_detected: boolean;
  pre_existing_risk_level?: string;
  pre_existing_data_json?: string;
}

// Audit Logs Collection
export interface AuditLogDocument extends Models.Document {
  user_id?: string;
  action: 'analyze_video' | 'analyze_image' | 'analyze_policy' | 'create_report' | 'update_report' | 'delete_report' | 'user_login' | 'user_logout';
  resource_type: 'report' | 'analysis' | 'user' | 'insurance_company';
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

// Feedback Collection
export interface FeedbackDocument extends Models.Document {
  user_id: string;
  category: 'bug_report' | 'feature_request' | 'general' | 'complaint';
  rating: number;
  feedback_text: string;
  status: 'pending_review' | 'reviewed' | 'addressed';
}

/**
 * Helper functions for fetching full report data with related collections
 */

import { Query } from 'node-appwrite';

/**
 * Full report data with all related collections
 */
export interface FullReportData {
  report: ReportDocument;
  damageDetails: ReportDamageDetailDocument[];
  vehicleVerification: ReportVehicleVerificationDocument | null;
  assessment: ReportAssessmentDocument | null;
}

/**
 * Fetch full report data including all related collections
 *
 * @example
 * import { adminAction } from '@/appwrite/adminOrClient';
 * import { DATABASE_ID, COLLECTION_IDS } from '@/lib/env';
 *
 * const { databases } = await adminAction();
 * const fullReport = await fetchFullReportData(databases, DATABASE_ID, COLLECTION_IDS, reportId);
 */
export async function fetchFullReportData(
  databases: Databases,
  databaseId: string,
  collectionIds: {
    REPORTS: string;
    REPORT_DAMAGE_DETAILS: string;
    REPORT_VEHICLE_VERIFICATION: string;
    REPORT_ASSESSMENTS: string;
  },
  reportId: string
): Promise<FullReportData> {
  // Fetch main report
  const report = await databases.getDocument<ReportDocument>(
    databaseId,
    collectionIds.REPORTS,
    reportId
  );

  // Fetch damage details (one-to-many)
  const damageDetailsResult = await databases.listDocuments<ReportDamageDetailDocument>(
    databaseId,
    collectionIds.REPORT_DAMAGE_DETAILS,
    [Query.equal('claim_id', reportId), Query.orderAsc('sort_order')]
  );

  // Fetch vehicle verification (one-to-one)
  const verificationResult = await databases.listDocuments<ReportVehicleVerificationDocument>(
    databaseId,
    collectionIds.REPORT_VEHICLE_VERIFICATION,
    [Query.equal('claim_id', reportId), Query.limit(1)]
  );

  // Fetch assessment (one-to-one)
  const assessmentResult = await databases.listDocuments<ReportAssessmentDocument>(
    databaseId,
    collectionIds.REPORT_ASSESSMENTS,
    [Query.equal('claim_id', reportId), Query.limit(1)]
  );

  return {
    report,
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
