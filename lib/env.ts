/**
 * Environment Configuration Helper
 * Provides typed constants for Appwrite collection IDs and database configuration
 *
 * Usage:
 * import { COLLECTION_IDS, DATABASE_ID } from '@/lib/env';
 *
 * const claim = await databases.getDocument(DATABASE_ID, COLLECTION_IDS.CLAIMS, claimId);
 */

/**
 * Appwrite Database ID
 */
export const DATABASE_ID = process.env.DATABASE_ID!;

/**
 * Appwrite Storage Bucket ID
 */
export const STORAGE_BUCKET_ID = process.env.STORAGE_BUKET_ID!; // Note: preserving original typo in env var name

/**
 * Collection IDs for all database collections
 * These are automatically populated by the schema submission script
 */
export const COLLECTION_IDS = {
  USERS: process.env.USERS_COLLECTION_ID!,
  INSURANCE_COMPANIES: process.env.INSURANCE_COMPANIES_COLLECTION_ID!,
  CLAIMS: process.env.CLAIMS_COLLECTION_ID!,
  CLAIM_DAMAGE_DETAILS: process.env.CLAIM_DAMAGE_DETAILS_COLLECTION_ID!,
  CLAIM_VEHICLE_VERIFICATION: process.env.CLAIM_VEHICLE_VERIFICATION_COLLECTION_ID!,
  CLAIM_ASSESSMENTS: process.env.CLAIM_ASSESSMENTS_COLLECTION_ID!,
  AUDIT_LOGS: process.env.AUDIT_LOGS_COLLECTION_ID!,
} as const;

/**
 * Type-safe collection ID keys
 */
export type CollectionKey = keyof typeof COLLECTION_IDS;

/**
 * Type guard to check if all required environment variables are set
 * Useful for startup validation
 */
export function validateEnvironment(): { valid: boolean; missing: string[] } {
  const missing: string[] = [];

  if (!DATABASE_ID) missing.push('DATABASE_ID');
  if (!STORAGE_BUCKET_ID) missing.push('STORAGE_BUKET_ID');

  Object.entries(COLLECTION_IDS).forEach(([key, value]) => {
    if (!value) {
      missing.push(`${key}_COLLECTION_ID`);
    }
  });

  return {
    valid: missing.length === 0,
    missing,
  };
}
