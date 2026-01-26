"use server";

import { adminAction } from '@/appwrite/adminOrClient';
import { DATABASE_ID, COLLECTION_IDS } from '@/lib/env';
import { ID } from 'node-appwrite';
import { getReportPermissions, getReportRelatedPermissions } from '@/lib/permissions';
import type { EnhancedAutoDamageAnalysis } from '@/lib/gemini/types';
import type { ReportDocument, InsuranceCompanyDocument } from '@/lib/types/appwrite';

/**
 * Report Creation Server Action
 * Creates a report with all related documents and proper permissions
 */

/**
 * Normalize severity value to match database enum
 * Handles Gemini response variations and ensures valid database values
 *
 * Database schema allows: 'minor' | 'moderate' | 'severe' | 'total_loss'
 * Maps 'unknown' → 'moderate' as conservative damage estimate
 */
function normalizeSeverity(severity: string | undefined | null): 'minor' | 'moderate' | 'severe' | 'total_loss' {
  if (!severity) {
    console.warn('⚠️ Missing severity value, defaulting to "moderate"');
    return 'moderate';
  }

  // Normalize to lowercase and trim
  const normalized = severity.toLowerCase().trim();

  // Map variations to valid values
  const severityMap: Record<string, 'minor' | 'moderate' | 'severe' | 'total_loss'> = {
    // Valid values (lowercase)
    'minor': 'minor',
    'moderate': 'moderate',
    'severe': 'severe',
    'total_loss': 'total_loss',
    'totalloss': 'total_loss',
    'unknown': 'moderate',

    // Common alternatives
    'light': 'minor',
    'low': 'minor',
    'minimal': 'minor',
    'slight': 'minor',

    'medium': 'moderate',
    'average': 'moderate',
    'standard': 'moderate',

    'high': 'severe',
    'heavy': 'severe',
    'critical': 'severe',
    'major': 'severe',
    'extensive': 'severe',

    // Total loss variations
    'total': 'total_loss',
    'totaled': 'total_loss',
    'write-off': 'total_loss',
    'writeoff': 'total_loss',
    'write off': 'total_loss',
    'destroyed': 'total_loss',
  };

  const mapped = severityMap[normalized];

  if (!mapped) {
    console.warn(`⚠️ Unknown severity value "${severity}", defaulting to "moderate"`);
    return 'moderate';
  }

  return mapped;
}

/**
 * Normalize damage_type to match Appwrite enum
 * Allowed values: 'collision', 'comprehensive', 'weather', 'vandalism', 'unknown'
 */
function normalizeDamageType(
  damageType: string | undefined | null
): 'collision' | 'comprehensive' | 'weather' | 'vandalism' | 'unknown' {
  if (!damageType) {
    console.warn('⚠️ Missing damage_type, defaulting to "unknown"');
    return 'unknown';
  }

  const normalized = damageType.toLowerCase().trim();

  // Map variations to valid enum values
  const damageTypeMap: Record<string, 'collision' | 'comprehensive' | 'weather' | 'vandalism' | 'unknown'> = {
    // Direct matches
    'collision': 'collision',
    'comprehensive': 'comprehensive',
    'weather': 'weather',
    'vandalism': 'vandalism',
    'unknown': 'unknown',

    // Weather-related
    'hail': 'weather',
    'storm': 'weather',
    'precipitation': 'weather',
    'flood': 'weather',
    'wind': 'weather',
    'lightning': 'weather',
    'ice': 'weather',
    'snow': 'weather',

    // Collision-related
    'impact': 'collision',
    'crash': 'collision',
    'accident': 'collision',
    'rear-end': 'collision',
    'rear end': 'collision',
    'frontal': 'collision',
    'front-end': 'collision',
    'front end': 'collision',
    'side': 'collision',
    'side-impact': 'collision',
    'rollover': 'collision',
    't-bone': 'collision',

    // Vandalism-related
    'malicious': 'vandalism',
    'intentional': 'vandalism',
    'criminal': 'vandalism',
    'damage': 'vandalism',  // Generic "damage" often means vandalism

    // Edge cases
    'wear-and-tear': 'unknown',
    'wear and tear': 'unknown',
    'mechanical': 'unknown',
    'theft': 'unknown',
    'fire': 'comprehensive',
    'animal': 'comprehensive',
  };

  // Direct lookup
  const mapped = damageTypeMap[normalized];
  if (mapped) {
    return mapped;
  }

  // Partial matching for compound terms
  if (normalized.includes('collision') || normalized.includes('crash') || normalized.includes('impact')) {
    console.warn(`⚠️ Unmapped damage_type "${damageType}" contains collision keywords, mapping to "collision"`);
    return 'collision';
  }

  if (normalized.includes('weather') || normalized.includes('hail') || normalized.includes('storm')) {
    console.warn(`⚠️ Unmapped damage_type "${damageType}" contains weather keywords, mapping to "weather"`);
    return 'weather';
  }

  if (normalized.includes('vandal')) {
    console.warn(`⚠️ Unmapped damage_type "${damageType}" contains vandalism keywords, mapping to "vandalism"`);
    return 'vandalism';
  }

  // Fallback to unknown
  console.warn(`⚠️ Unknown damage_type value "${damageType}", defaulting to "unknown"`);
  return 'unknown';
}

/**
 * Normalize repair complexity to match Appwrite enum
 * Allowed values: 'simple', 'moderate', 'complex', 'extensive'
 */
function normalizeRepairComplexity(
  complexity: string | undefined | null
): 'simple' | 'moderate' | 'complex' | 'extensive' {
  if (!complexity) {
    console.warn('⚠️ Missing repair complexity, defaulting to "moderate"');
    return 'moderate';
  }

  const normalized = complexity.toLowerCase().trim();

  // Map variations to valid enum values
  const complexityMap: Record<string, 'simple' | 'moderate' | 'complex' | 'extensive'> = {
    // Direct matches
    'simple': 'simple',
    'moderate': 'moderate',
    'complex': 'complex',
    'extensive': 'extensive',

    // Aliases for simple
    'minor': 'simple',
    'easy': 'simple',
    'basic': 'simple',
    'light': 'simple',
    'minimal': 'simple',

    // Aliases for moderate
    'medium': 'moderate',
    'average': 'moderate',
    'normal': 'moderate',
    'standard': 'moderate',

    // Aliases for complex
    'complicated': 'complex',
    'difficult': 'complex',
    'advanced': 'complex',
    'involved': 'complex',
    'high': 'complex',

    // Aliases for extensive
    'severe': 'extensive',
    'major': 'extensive',
    'significant': 'extensive',
    'substantial': 'extensive',
    'total': 'extensive',
    'total loss': 'extensive',
    'total_loss': 'extensive',
  };

  // Direct lookup
  const mapped = complexityMap[normalized];
  if (mapped) {
    return mapped;
  }

  // Partial matching
  if (normalized.includes('simple') || normalized.includes('minor') || normalized.includes('easy')) {
    console.warn(`⚠️ Unmapped complexity "${complexity}" contains simple keywords, mapping to "simple"`);
    return 'simple';
  }

  if (normalized.includes('extensive') || normalized.includes('severe') || normalized.includes('major')) {
    console.warn(`⚠️ Unmapped complexity "${complexity}" contains extensive keywords, mapping to "extensive"`);
    return 'extensive';
  }

  if (normalized.includes('complex') || normalized.includes('difficult')) {
    console.warn(`⚠️ Unmapped complexity "${complexity}" contains complex keywords, mapping to "complex"`);
    return 'complex';
  }

  // Fallback to moderate (conservative estimate)
  console.warn(`⚠️ Unknown repair complexity "${complexity}", defaulting to "moderate"`);
  return 'moderate';
}

/**
 * Ensure value is a valid number for Appwrite float fields
 * Handles strings, NaN, null, undefined, and other edge cases
 */
function toValidFloat(value: any): number {
  // Handle null/undefined
  if (value == null) {
    return 0;
  }

  // Already a valid number
  if (typeof value === 'number' && !isNaN(value) && isFinite(value)) {
    return Math.max(0, value); // Ensure non-negative
  }

  // Try to parse string
  if (typeof value === 'string') {
    // Remove common non-numeric characters
    const cleaned = value.replace(/[$,\s]/g, '');

    // Handle special keywords and insurance-specific terms
    const lower = cleaned.toLowerCase().trim();

    // Unlimited coverage terms - represent as 999999999
    const unlimitedTerms = [
      'unlimited',
      'no limit',
      'none',
      // Market value
      'marketvalue',
      'actualmarketvalue',
      'amv',
      // Actual cash value
      'actualcashvalue',
      'acv',
      // Replacement cost
      'replacementcost',
      'fullreplacement',
      'replacementvalue',
      'rcv',
      // Other unlimited indicators
      'fullcoverage',
      'statedvalue',
      'agreedvalue'
    ];

    if (unlimitedTerms.includes(lower)) {
      return 999999999; // Represent unlimited coverage
    }

    // Special handling for "N/A" or empty
    if (lower === 'n/a' || lower === 'na' || lower === '') {
      return 0;
    }

    // Parse as float
    const parsed = parseFloat(cleaned);
    if (!isNaN(parsed) && isFinite(parsed)) {
      return Math.max(0, parsed);
    }
  }

  // Fallback to 0 for any other type
  console.warn(`⚠️ Invalid coverage limit value:`, value, `- defaulting to 0`);
  return 0;
}

/**
 * Ensure array contains only valid strings within max length
 * Filters out invalid values and truncates long strings
 */
function toValidStringArray(
  value: any,
  maxLength: number,
  fieldName: string = 'field'
): string[] {
  // Handle null/undefined
  if (value == null) {
    return [];
  }

  // Ensure it's an array
  if (!Array.isArray(value)) {
    console.warn(`⚠️ ${fieldName} is not an array, converting to empty array`);
    return [];
  }

  // Filter and validate each element
  return value
    .filter((item, index) => {
      // Skip null/undefined
      if (item == null) {
        console.warn(`⚠️ ${fieldName}[${index}] is null/undefined, skipping`);
        return false;
      }

      // Skip non-strings
      if (typeof item !== 'string') {
        console.warn(`⚠️ ${fieldName}[${index}] is not a string (type: ${typeof item}), skipping`);
        return false;
      }

      return true;
    })
    .map((item, index) => {
      const str = String(item).trim();

      // Truncate if too long
      if (str.length > maxLength) {
        console.warn(`⚠️ ${fieldName}[${index}] too long (${str.length} chars), truncating to ${maxLength}`);
        return str.substring(0, maxLength);
      }

      return str;
    })
    .filter(str => str.length > 0); // Remove empty strings
}

/**
 * Ensure string is valid and within max length
 * Truncates long strings and logs warnings
 */
function toValidString(
  value: any,
  maxLength: number,
  fieldName: string = 'field'
): string {
  // Handle null/undefined
  if (value == null) {
    return '';
  }

  // Convert to string and trim whitespace
  const str = String(value).trim();

  // Truncate if exceeds limit
  if (str.length > maxLength) {
    console.warn(
      `⚠️ ${fieldName} too long (${str.length} chars), truncating to ${maxLength}`
    );
    return str.substring(0, maxLength);
  }

  return str;
}

/**
 * Ensure value is a valid integer for Appwrite integer fields
 * Handles null, undefined, strings, NaN, Infinity, and range validation
 *
 * IMPORTANT: Returns `undefined` (not `null`) for null/invalid values
 * per Appwrite SDK requirement for nullable integer attributes.
 *
 * @param value - The value to validate
 * @param options - Validation options
 * @param options.min - Minimum value (inclusive), clamps if below
 * @param options.max - Maximum value (inclusive), clamps if above
 * @param options.allowNegative - Allow negative integers (default: true)
 * @param options.fieldName - Field name for logging (default: 'field')
 * @returns Valid integer or undefined
 *
 * @example
 * toValidInteger(year, { min: 1900, max: 2100, fieldName: 'video_year' })
 */
function toValidInteger(
  value: any,
  options?: {
    min?: number;
    max?: number;
    allowNegative?: boolean;
    fieldName?: string;
  }
): number | undefined {
  const { min, max, allowNegative = true, fieldName = 'field' } = options || {};

  // 1. Handle null/undefined
  if (value == null) {
    return undefined; // ✅ Appwrite SDK requirement
  }

  // 2. Handle numbers
  if (typeof value === 'number') {
    if (!isFinite(value) || isNaN(value)) {
      console.warn(`⚠️ ${fieldName} is NaN or Infinity, returning undefined`);
      return undefined;
    }

    const int = Math.floor(value); // Convert to integer

    // Check negative
    if (!allowNegative && int < 0) {
      console.warn(`⚠️ ${fieldName} is negative (${int}), returning undefined`);
      return undefined;
    }

    // Clamp to range
    if (min != null && int < min) {
      console.warn(`⚠️ ${fieldName} below min (${int} < ${min}), clamping to ${min}`);
      return min;
    }
    if (max != null && int > max) {
      console.warn(`⚠️ ${fieldName} above max (${int} > ${max}), clamping to ${max}`);
      return max;
    }

    return int;
  }

  // 3. Handle strings
  if (typeof value === 'string') {
    const cleaned = value.trim().toLowerCase();

    // Empty or N/A
    if (cleaned === '' || cleaned === 'n/a' || cleaned === 'na') {
      return undefined;
    }

    // Parse integer
    const parsed = parseInt(cleaned, 10);
    if (!isNaN(parsed) && isFinite(parsed)) {
      // Recursively validate the parsed number
      return toValidInteger(parsed, options);
    }
  }

  // 4. Fallback
  console.warn(`⚠️ Invalid ${fieldName} value:`, value, `- returning undefined`);
  return undefined;
}

export interface CreateReportResult {
  success: boolean;
  data?: ReportDocument;
  message?: string;
}

/**
 * Create a report from Gemini analysis data
 *
 * @param userId - The user creating the report
 * @param insuranceCompanyId - The insurance company ID (optional)
 * @param analysisData - The Gemini analysis result
 * @param mediaFileIds - IDs of uploaded media files (images/videos)
 * @param policyFileId - ID of uploaded policy PDF (optional)
 * @returns Created report or error
 *
 * @example
 * const result = await createReportFromAnalysis(
 *   userId,
 *   insuranceCompanyId,
 *   geminiAnalysisData,
 *   ['file1', 'file2'],
 *   'policyFile1'
 * );
 *
 * if (result.success) {
 *   console.log('Report created:', result.data);
 * }
 */
export async function createReportFromAnalysis(
  userId: string,
  insuranceCompanyId: string | undefined,
  analysisData: EnhancedAutoDamageAnalysis,
  mediaFileIds: string[],
  policyFileId?: string
): Promise<CreateReportResult> {
  try {
    const { databases } = await adminAction();

    // 1. Get insurance company team ID (if provided)
    let teamId: string | undefined;
    if (insuranceCompanyId) {
      const company = await databases.getDocument<InsuranceCompanyDocument>(
        DATABASE_ID,
        COLLECTION_IDS.INSURANCE_COMPANIES,
        insuranceCompanyId
      );
      teamId = company.team_id;
    }

    const reportId = ID.unique();

    // 2. Create main report with permissions
    const report = await databases.createDocument<ReportDocument>(
      DATABASE_ID,
      COLLECTION_IDS.REPORTS,
      reportId,
      {
        user_id: userId,
        insurance_company_id: insuranceCompanyId,
        claim_number: generateReportNumber(),
        claim_status: 'pending',
        damage_type: normalizeDamageType(analysisData.damageType),
        damage_cause: toValidString(analysisData.damageCause, 500, 'damage_cause'),
        overall_severity: normalizeSeverity(analysisData.overallSeverity),
        estimated_repair_complexity: normalizeRepairComplexity(analysisData.estimatedRepairComplexity),
        estimated_total_repair_cost: analysisData.estimatedTotalRepairCost,
        confidence_score: analysisData.confidence,
        confidence_reasoning: toValidString(analysisData.confidenceReasoning, 1000, 'confidence_reasoning'),
        vehicle_verification_status: analysisData.vehicleVerification.verificationStatus,
        investigation_needed: analysisData.investigationNeeded,
        investigation_reason: analysisData.investigationReason
          ? toValidString(analysisData.investigationReason, 500, 'investigation_reason')
          : undefined,
        safety_concerns: toValidStringArray(analysisData.safetyConcerns, 1200, 'safety_concerns'),
        recommended_actions: toValidStringArray(analysisData.recommendedActions, 1200, 'recommended_actions'),
        media_file_ids: mediaFileIds,
        policy_file_id: policyFileId,
        ai_model_used: 'gemini-2.0-flash-exp',
        analysis_timestamp: new Date().toISOString(),
        is_public: false,
      },
      getReportPermissions(userId, teamId, false)
    );

    // Debug: Log damaged parts to identify invalid severity values
    console.log('🔧 Creating damage details for parts:',
      analysisData.damagedParts.map(p => ({
        part: p.part,
        severity: p.severity
      }))
    );

    // 3. Create damage details (one document per damaged part)
    const damageDetailsPromises = analysisData.damagedParts.map((part, index) => {
      const normalizedSeverity = normalizeSeverity(part.severity);

      // Log if severity was changed
      if (part.severity !== normalizedSeverity) {
        console.warn(`📝 Normalized severity for "${part.part}": "${part.severity}" → "${normalizedSeverity}"`);
      }

      return databases.createDocument(
        DATABASE_ID,
        COLLECTION_IDS.REPORT_DAMAGE_DETAILS,
        ID.unique(),
        {
          claim_id: reportId,
          part_name: part.part,
          severity: normalizedSeverity,
          description: part.description,
          estimated_repair_cost: part.estimatedRepairCost || null,
          sort_order: index,
          // Fraud detection fields
          damage_age: part.damageAge || null,
          age_indicators: toValidStringArray(part.ageIndicators, 200, 'age_indicators'),
          rust_present: part.rustPresent ?? false,
          pre_existing: part.preExisting ?? false,
        },
        getReportRelatedPermissions(userId, teamId)
      );
    });

    // 4. Create vehicle verification document
    const verificationPromise = databases.createDocument(
      DATABASE_ID,
      COLLECTION_IDS.REPORT_VEHICLE_VERIFICATION,
      ID.unique(),
      {
        claim_id: reportId,
        video_license_plate: analysisData.vehicleVerification.videoVehicle.licensePlate,
        video_vin: analysisData.vehicleVerification.videoVehicle.vin,
        video_make: analysisData.vehicleVerification.videoVehicle.make,
        video_model: analysisData.vehicleVerification.videoVehicle.model,
        video_year: toValidInteger(analysisData.vehicleVerification.videoVehicle.year, {
          min: 1900,
          max: 2100,
          fieldName: 'video_year'
        }),
        video_color: analysisData.vehicleVerification.videoVehicle.color,
        policy_license_plate: analysisData.vehicleVerification.policyVehicle.licensePlate,
        policy_vin: analysisData.vehicleVerification.policyVehicle.vin,
        policy_make: analysisData.vehicleVerification.policyVehicle.make,
        policy_model: analysisData.vehicleVerification.policyVehicle.model,
        policy_year: toValidInteger(analysisData.vehicleVerification.policyVehicle.year, {
          min: 1900,
          max: 2100,
          fieldName: 'policy_year'
        }),
        policy_color: analysisData.vehicleVerification.policyVehicle.color,
        verification_status: analysisData.vehicleVerification.verificationStatus,
        mismatches: analysisData.vehicleVerification.mismatches.join(', '),
        confidence_score: analysisData.vehicleVerification.confidenceScore,
        notes: analysisData.vehicleVerification.notes,
      },
      getReportRelatedPermissions(userId, teamId)
    );

    // Debug: Log coverage limits to identify invalid values
    console.log('💰 Coverage limits:', {
      collision: analysisData.policyAnalysis.coverageLimits.collision,
      comprehensive: analysisData.policyAnalysis.coverageLimits.comprehensive,
      liability: analysisData.policyAnalysis.coverageLimits.liability,
    });

    // Debug: Log array lengths to identify issues
    console.log('📋 String arrays:', {
      exclusions: analysisData.policyAnalysis.exclusions?.length ?? 0,
      coverage_types: analysisData.policyAnalysis.coverageTypes?.length ?? 0,
      covered_damages: analysisData.claimAssessment.coveredDamages?.length ?? 0,
      excluded_damages: analysisData.claimAssessment.excludedDamages?.length ?? 0,
    });

    // 5. Create assessment document
    const assessmentPromise = databases.createDocument(
      DATABASE_ID,
      COLLECTION_IDS.REPORT_ASSESSMENTS,
      ID.unique(),
      {
        claim_id: reportId,
        coverage_types: toValidStringArray(analysisData.policyAnalysis.coverageTypes, 100, 'coverage_types'),
        deductible_types: toValidStringArray(analysisData.policyAnalysis.deductibles.map(d => d.type), 50, 'deductible_types'),
        deductible_amounts: analysisData.policyAnalysis.deductibles.map(d => d.amount),
        exclusions: toValidStringArray(analysisData.policyAnalysis.exclusions, 1200, 'exclusions'),
        coverage_limit_collision: toValidFloat(analysisData.policyAnalysis.coverageLimits.collision),
        coverage_limit_comprehensive: toValidFloat(analysisData.policyAnalysis.coverageLimits.comprehensive),
        coverage_limit_liability: toValidFloat(analysisData.policyAnalysis.coverageLimits.liability),
        relevant_policy_sections: toValidStringArray(analysisData.policyAnalysis.relevantPolicySections, 1200, 'relevant_policy_sections'),
        assessment_status: analysisData.claimAssessment.status,
        covered_damages: toValidStringArray(analysisData.claimAssessment.coveredDamages, 1200, 'covered_damages'),
        excluded_damages: toValidStringArray(analysisData.claimAssessment.excludedDamages, 1200, 'excluded_damages'),
        total_repair_estimate: toValidFloat(analysisData.claimAssessment.financialBreakdown.totalRepairEstimate),
        covered_amount: toValidFloat(analysisData.claimAssessment.financialBreakdown.coveredAmount),
        deductible: toValidFloat(analysisData.claimAssessment.financialBreakdown.deductible),
        non_covered_items: toValidFloat(analysisData.claimAssessment.financialBreakdown.nonCoveredItems),
        estimated_payout: toValidFloat(analysisData.claimAssessment.financialBreakdown.estimatedPayout),
        reasoning: analysisData.claimAssessment.reasoning,
        policy_references: toValidStringArray(analysisData.claimAssessment.policyReferences, 1200, 'policy_references'),
      },
      getReportRelatedPermissions(userId, teamId)
    );

    // Debug: Log assessment data before creation
    console.log('📊 Assessment financial data:', {
      total_repair_estimate: analysisData.claimAssessment.financialBreakdown.totalRepairEstimate ?? 0,
      covered_amount: analysisData.claimAssessment.financialBreakdown.coveredAmount ?? 0,
      deductible: analysisData.claimAssessment.financialBreakdown.deductible ?? 0,
      estimated_payout: analysisData.claimAssessment.financialBreakdown.estimatedPayout ?? 0,
    });

    // 6. Create fraud assessment document
    const fraudAssessmentPromise = databases.createDocument(
      DATABASE_ID,
      COLLECTION_IDS.REPORT_FRAUD_ASSESSMENTS,
      ID.unique(),
      {
        claim_id: reportId,
        // Damage age assessment
        damage_age_estimated: analysisData.damageAgeAssessment?.estimatedAge || null,
        damage_age_confidence: analysisData.damageAgeAssessment?.confidenceScore ?? null,
        damage_age_data_json: analysisData.damageAgeAssessment
          ? JSON.stringify({
              reasoning: analysisData.damageAgeAssessment.reasoning,
              indicators: analysisData.damageAgeAssessment.indicators,
            })
          : null,
        // Contamination assessment
        contamination_detected: analysisData.contaminationAssessment?.contaminationDetected ?? false,
        contamination_data_json: analysisData.contaminationAssessment
          ? JSON.stringify({
              riskLevel: analysisData.contaminationAssessment.fraudRiskLevel,
              notes: analysisData.contaminationAssessment.notes,
              contaminants: analysisData.contaminationAssessment.contaminants,
            })
          : null,
        // Rust/corrosion assessment
        rust_detected: analysisData.rustCorrosionAssessment?.rustDetected ?? false,
        rust_fraud_indicator: analysisData.rustCorrosionAssessment?.fraudIndicator ?? false,
        rust_data_json: analysisData.rustCorrosionAssessment
          ? JSON.stringify({
              corrosionLevel: analysisData.rustCorrosionAssessment.overallCorrosionLevel,
              estimatedAge: analysisData.rustCorrosionAssessment.estimatedCorrosionAge,
              notes: analysisData.rustCorrosionAssessment.notes,
              affectedAreas: analysisData.rustCorrosionAssessment.corrosionAreas,
            })
          : null,
        // Pre-existing damage assessment
        pre_existing_detected: analysisData.preExistingDamageAssessment?.preExistingDamageDetected ?? false,
        pre_existing_risk_level: analysisData.preExistingDamageAssessment?.fraudRiskLevel || null,
        pre_existing_data_json: analysisData.preExistingDamageAssessment
          ? JSON.stringify({
              damageConsistency: analysisData.preExistingDamageAssessment.damageConsistency,
              notes: analysisData.preExistingDamageAssessment.notes,
              preExistingItems: analysisData.preExistingDamageAssessment.preExistingItems,
            })
          : null,
      },
      getReportRelatedPermissions(userId, teamId)
    );

    // Debug: Log fraud assessment data
    console.log('🔍 Fraud assessment data:', {
      damage_age: analysisData.damageAgeAssessment?.estimatedAge || 'N/A',
      contamination: analysisData.contaminationAssessment?.contaminationDetected ?? false,
      rust: analysisData.rustCorrosionAssessment?.rustDetected ?? false,
      pre_existing: analysisData.preExistingDamageAssessment?.preExistingDamageDetected ?? false,
    });

    // 7. Wait for all related documents to be created
    await Promise.all([
      ...damageDetailsPromises,
      verificationPromise,
      assessmentPromise,
      fraudAssessmentPromise,
    ]);

    return { success: true, data: report };
  } catch (error: any) {
    console.error('Failed to create report:', error);
    return {
      success: false,
      message: error.message || 'Failed to create report',
    };
  }
}

/**
 * Generate a unique report number
 * Format: RPT-{timestamp}-{random}
 *
 * @returns Unique report number
 *
 * @example
 * generateReportNumber()
 * // Returns: "RPT-1704123456789-A3B4C5D6E"
 */
function generateReportNumber(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 11).toUpperCase();
  return `RPT-${timestamp}-${random}`;
}

/**
 * Update report status and optionally make it public
 * Used by insurance adjusters to approve/deny reports
 *
 * @param reportId - The report document ID
 * @param status - New report status
 * @param isPublic - Whether to make the report publicly readable
 * @returns Updated report or error
 */
export async function updateReportStatus(
  reportId: string,
  status: 'pending' | 'approved' | 'denied' | 'partial' | 'needs_investigation',
  isPublic = false
): Promise<CreateReportResult> {
  try {
    const { databases } = await adminAction();

    // Get existing report to preserve permissions
    const existingReport = await databases.getDocument<ReportDocument>(
      DATABASE_ID,
      COLLECTION_IDS.REPORTS,
      reportId
    );

    // If making public and approved, add public read permission
    let permissions = existingReport.$permissions;
    if (isPublic && status === 'approved') {
      const userId = existingReport.user_id;
      const insuranceCompanyId = existingReport.insurance_company_id;

      let teamId: string | undefined;
      if (insuranceCompanyId) {
        const company = await databases.getDocument<InsuranceCompanyDocument>(
          DATABASE_ID,
          COLLECTION_IDS.INSURANCE_COMPANIES,
          insuranceCompanyId
        );
        teamId = company.team_id;
      }

      permissions = getReportPermissions(userId, teamId, true);
    }

    // Update report
    const report = await databases.updateDocument<ReportDocument>(
      DATABASE_ID,
      COLLECTION_IDS.REPORTS,
      reportId,
      {
        claim_status: status,
        is_public: isPublic,
      },
      permissions
    );

    return { success: true, data: report };
  } catch (error: any) {
    console.error('Failed to update report status:', error);
    return {
      success: false,
      message: error.message || 'Failed to update report status',
    };
  }
}
