"use server";

import { SECURITY_CONFIG } from "../constants";
import type {
  ValidationResult,
  AutoDamageAnalysis,
  EnhancedAutoDamageAnalysis,
} from "../types";

/**
 * Check if analysis is enhanced (has vehicle verification and policy info)
 */
function isEnhancedAnalysis(
  analysis: AutoDamageAnalysis | EnhancedAutoDamageAnalysis
): analysis is EnhancedAutoDamageAnalysis {
  return 'vehicleVerification' in analysis;
}

/**
 * Validate basic auto damage analysis against business rules
 */
export async function validateAutoDamageAnalysis(
  analysis: AutoDamageAnalysis | EnhancedAutoDamageAnalysis
): Promise<ValidationResult> {
  const warnings: string[] = [];
  const flaggedReasons: string[] = [];
  let requiresManualReview = false;

  // Rule 1: Confidence threshold
  if (analysis.confidence != null && analysis.confidence < SECURITY_CONFIG.LOW_CONFIDENCE_THRESHOLD) {
    warnings.push(`Low confidence score: ${(analysis.confidence * 100).toFixed(0)}%`);
    flaggedReasons.push('low_confidence');
    requiresManualReview = true;
  }

  // Rule 2: No damaged parts detected
  if (!analysis.damagedParts || analysis.damagedParts.length === 0) {
    warnings.push('No damaged parts identified. This may indicate the vehicle has no visible damage or the analysis failed.');
    flaggedReasons.push('no_damage_detected');
  }

  // Rule 3: Overall severity vs damaged parts consistency
  if (analysis.damagedParts && analysis.damagedParts.length > 0) {
    const hasSevereDamage = analysis.damagedParts.some(part => part.severity === 'severe');

    if (hasSevereDamage && analysis.overallSeverity === 'minor') {
      warnings.push('Inconsistency: Severe damage to individual parts but overall severity is minor.');
      flaggedReasons.push('severity_mismatch');
      requiresManualReview = true;
    }
  }

  // Enhanced analysis validation
  if (isEnhancedAnalysis(analysis)) {
    // Check for hallucinated placeholder data
    const hallucinationWarnings = detectPlaceholderHallucination(analysis);
    if (hallucinationWarnings.length > 0) {
      warnings.push(...hallucinationWarnings);
      flaggedReasons.push('placeholder_hallucination');
      requiresManualReview = true;
    }

    // Rule 4: High repair cost
    if (analysis.estimatedTotalRepairCost > SECURITY_CONFIG.HIGH_RISK_THRESHOLD) {
      warnings.push(
        `High repair cost: $${analysis.estimatedTotalRepairCost.toLocaleString()}. Exceeds threshold of $${SECURITY_CONFIG.HIGH_RISK_THRESHOLD.toLocaleString()}.`
      );
      flaggedReasons.push('high_repair_cost');
      requiresManualReview = true;
    }

    // Rule 5: Vehicle verification mismatch
    if (analysis.vehicleVerification.verificationStatus === 'mismatched') {
      warnings.push(
        'Vehicle mismatch detected between video/images and policy. Possible fraud attempt.'
      );
      flaggedReasons.push('vehicle_mismatch');
      requiresManualReview = true;
    }

    // Rule 6: Insufficient data for vehicle verification
    if (analysis.vehicleVerification.verificationStatus === 'insufficient_data') {
      warnings.push(
        'Insufficient vehicle details to verify identity. License plate or VIN not visible.'
      );
      flaggedReasons.push('insufficient_vehicle_data');
    }

    // Rule 6a: Low confidence for "matched" vehicle verification
    if (analysis.vehicleVerification.verificationStatus === 'matched') {
      const confidenceScore = analysis.vehicleVerification.confidenceScore || 0;
      if (confidenceScore < 0.70) {
        warnings.push(
          `Vehicle marked as "matched" but verification confidence is only ${(confidenceScore * 100).toFixed(0)}%. Requires manual review to confirm vehicle identity.`
        );
        flaggedReasons.push('low_verification_confidence');
        requiresManualReview = true;
      }
    }

    // Rule 6b: Validate mismatch details are provided
    if (analysis.vehicleVerification.verificationStatus === 'mismatched') {
      if (!analysis.vehicleVerification.mismatches ||
          analysis.vehicleVerification.mismatches.length === 0) {
        warnings.push(
          'Verification status is "mismatched" but no specific mismatches were listed. Analysis may be incomplete.'
        );
        flaggedReasons.push('missing_mismatch_details');
        requiresManualReview = true;
      }
    }

    // Rule 6c: Require minimum fields for "matched" status
    if (analysis.vehicleVerification.verificationStatus === 'matched') {
      const videoVehicle = analysis.vehicleVerification.videoVehicle;
      const nonNullFields = [
        videoVehicle.licensePlate,
        videoVehicle.vin,
        videoVehicle.make,
        videoVehicle.model,
      ].filter(field => field != null).length;

      if (nonNullFields < 2) {
        warnings.push(
          `Vehicle marked as "matched" but only ${nonNullFields} identification field(s) visible in video/images. Insufficient data for confident match - requires manual verification.`
        );
        flaggedReasons.push('insufficient_match_criteria');
        requiresManualReview = true;
      }
    }

    // Rule 6d: Validate damage_type enum value
    const allowedDamageTypes = ['collision', 'comprehensive', 'weather', 'vandalism', 'unknown'];
    if (analysis.damageType && !allowedDamageTypes.includes(analysis.damageType)) {
      warnings.push(
        `Invalid damage_type value "${analysis.damageType}". Will be normalized to a valid enum value during claim creation.`
      );
      flaggedReasons.push('invalid_damage_type');
      // Note: This won't block the claim - normalization will handle it
    }

    // Rule 7: Payout exceeds coverage limits
    if (analysis.claimAssessment && analysis.policyAnalysis) {
      const payout = analysis.claimAssessment.financialBreakdown.estimatedPayout;
      const maxCoverage = Math.max(...Object.values(analysis.policyAnalysis.coverageLimits));

      if (payout > maxCoverage) {
        warnings.push(
          `Estimated payout ($${payout.toLocaleString()}) exceeds maximum coverage limit ($${maxCoverage.toLocaleString()}).`
        );
        flaggedReasons.push('payout_exceeds_coverage');
        requiresManualReview = true;
      }
    }

    // Rule 8: No damage but high repair cost
    if ((!analysis.damagedParts || analysis.damagedParts.length === 0) &&
        analysis.estimatedTotalRepairCost > 1000) {
      warnings.push(
        `No damaged parts listed but repair cost is $${analysis.estimatedTotalRepairCost.toLocaleString()}. This is inconsistent.`
      );
      flaggedReasons.push('inconsistent_cost');
      requiresManualReview = true;
    }

    // Rule 9: Claim status is "needs_investigation"
    if (analysis.investigationNeeded ||
        analysis.claimAssessment?.status === 'needs_investigation') {
      warnings.push('Analysis flagged for investigation by AI model.');
      flaggedReasons.push('ai_flagged_investigation');
      requiresManualReview = true;
    }

    // Rule 10: Denied claim with high confidence
    if (analysis.claimAssessment?.status === 'denied' &&
        analysis.confidence > 0.8) {
      warnings.push('Claim denied by AI with high confidence. Verify denial reasons are valid.');
      flaggedReasons.push('high_confidence_denial');
    }
  }

  return {
    isValid: warnings.length === 0 && !requiresManualReview,
    warnings,
    requiresManualReview,
    flaggedReasons,
  };
}

/**
 * Validate enhanced analysis specifically
 * Alias for validateAutoDamageAnalysis with type assertion
 */
export async function validateEnhancedAnalysis(
  analysis: EnhancedAutoDamageAnalysis
): Promise<ValidationResult> {
  return await validateAutoDamageAnalysis(analysis);
}

/**
 * Format validation result for display to user
 */
export async function formatValidationWarnings(result: ValidationResult): Promise<string[]> {
  const formatted: string[] = [];

  if (result.requiresManualReview) {
    formatted.push('⚠️ MANUAL REVIEW REQUIRED');
  }

  formatted.push(...result.warnings);

  return formatted;
}

/**
 * Check if validation result requires blocking the claim
 * Currently we don't auto-block - all results are allowed with warnings
 */
export async function shouldBlockClaim(result: ValidationResult): Promise<boolean> {
  // Balanced approach: Never auto-block, always allow with warnings
  // Manual review can make final decision
  return false;
}

/**
 * Detect if AI generated placeholder/example data instead of real values
 * Returns warnings if suspicious patterns detected
 */
function detectPlaceholderHallucination(
  analysis: EnhancedAutoDamageAnalysis
): string[] {
  const warnings: string[] = [];
  const suspiciousPatterns = [
    'ABC123', 'ABC-123', 'XYZ789', 'XYZ-789',
    '1HGBH41JXMN109186', // Old VIN example from prompt
    '[PLATE', '[VIN', '[MAKE', // Leftover placeholders
  ];

  const checkField = (value: string | null | number, fieldName: string): boolean => {
    if (value && typeof value === 'string') {
      const upperValue = value.toUpperCase();
      for (const pattern of suspiciousPatterns) {
        if (upperValue.includes(pattern.toUpperCase())) {
          warnings.push(
            `Suspicious ${fieldName}: "${value}" matches example pattern. ` +
            `This may be hallucinated data. Manual review required.`
          );
          return true;
        }
      }
    }
    return false;
  };

  // Check video vehicle fields
  const vv = analysis.vehicleVerification.videoVehicle;
  checkField(vv.licensePlate, 'video license plate');
  checkField(vv.vin, 'video VIN');

  // Check policy vehicle fields
  const pv = analysis.vehicleVerification.policyVehicle;
  checkField(pv.licensePlate, 'policy license plate');
  checkField(pv.vin, 'policy VIN');

  return warnings;
}
