import type { UsageMetadata } from '@google/genai';
import type { RateLimitError } from './rateLimit/types';

/**
 * Gemini API Type Definitions
 * Follows the pattern from lib/types/appwrite.ts
 */

// ========================================
// Standard Result Types (matches Appwrite pattern)
// ========================================

export interface GeminiSuccessResult<T> {
  success: true;
  data: T;
  usage?: UsageMetadata;
  modelUsed: string; // Which model generated this response
}

export interface GeminiErrorResult {
  success: false;
  message: string;
}

export type GeminiResult<T> = GeminiSuccessResult<T> | GeminiErrorResult | RateLimitError;

/**
 * Type guard for Gemini results
 * Checks if the result is a successful response or an error
 *
 * @example
 * const result = await analyzeVideo(input);
 * if (isGeminiSuccess(result)) {
 *   console.log(result.data.analysis);
 * } else {
 *   console.error(result.message);
 * }
 */
export function isGeminiSuccess<T>(
  result: GeminiResult<T>
): result is GeminiSuccessResult<T> {
  return result.success === true;
}

/**
 * Type guard for rate limit errors
 * Checks if the error is specifically a rate limit error
 *
 * @example
 * const result = await analyzeImage(input);
 * if (isRateLimitError(result)) {
 *   console.log(`Retry after ${result.retryAfter} seconds`);
 * }
 */
export function isRateLimitError<T>(
  result: GeminiResult<T>
): result is RateLimitError {
  return !result.success && 'rateLimited' in result && result.rateLimited === true;
}

// ========================================
// Text Generation Types
// ========================================

export interface GenerateTextInput {
  prompt: string;
  model?: string;
  temperature?: number;
  maxOutputTokens?: number;
  topP?: number;
  topK?: number;
  seed?: number;  // Fixed seed for reproducible outputs
  systemInstruction?: string;
}

export interface GenerateTextOutput {
  text: string;
  finishReason?: string;
  safetyRatings?: Array<{
    category: string;
    probability: string;
  }>;
}

// ========================================
// Multimodal Input Types
// ========================================

export type VideoMimeType = 'video/mp4' | 'video/mov' | 'video/avi' | 'video/mpeg' | 'video/webm';
export type AudioMimeType = 'audio/mp3' | 'audio/wav' | 'audio/aac' | 'audio/ogg';
export type ImageMimeType = 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';
export type DocumentMimeType = 'application/pdf';

export interface VideoAnalysisInput {
  videoPath?: string;
  videoBase64?: string;
  mimeType: VideoMimeType;
  prompt: string;
  model?: string;
  temperature?: number;
  seed?: number;
  responseFormat?: 'text' | 'json';
}

export interface PDFAnalysisInput {
  pdfPath?: string;
  pdfBase64?: string;
  prompt: string;
  model?: string;
  temperature?: number;
  responseFormat?: 'text' | 'json';
}

export interface AudioAnalysisInput {
  audioPath?: string;
  audioBase64?: string;
  mimeType: AudioMimeType;
  prompt: string;
  model?: string;
}

export interface ImageAnalysisInput {
  imagePath?: string;
  imageBase64?: string;
  mimeType: ImageMimeType;
  prompt: string;
  model?: string;
  responseFormat?: 'text' | 'json';
}

// ========================================
// Auto Damage Analysis Types (specialized)
// ========================================

export interface DamagedPart {
  part: string;
  severity: 'minor' | 'moderate' | 'severe'; // Must match database schema constraint
  description: string;
  estimatedRepairCost?: string; // Cost range e.g., "$500 - $800"
  // Fraud detection fields
  damageAge?: 'fresh' | 'days_old' | 'weeks_old' | 'months_old' | 'unknown';
  ageIndicators?: string[];
  rustPresent?: boolean;
  preExisting?: boolean;
}

// ========================================
// Fraud Detection Types - Damage Age Assessment
// ========================================

export interface DamageAgeIndicator {
  type: 'oxidation' | 'rust' | 'paint_weathering' | 'edge_condition' | 'debris_accumulation';
  observation: string;
  ageImplication: string;
}

export interface DamageAgeAssessment {
  estimatedAge: 'fresh' | 'days_old' | 'weeks_old' | 'months_old' | 'unknown';
  confidenceScore: number; // 0-1
  indicators: DamageAgeIndicator[];
  reasoning: string;
}

// ========================================
// Fraud Detection Types - Surface Contamination
// ========================================

export interface ContaminantDetail {
  type: 'dirt' | 'grime' | 'dust' | 'snow' | 'ice' | 'salt' | 'water_stains' | 'oil' | 'other';
  location: string;
  obscuresDamage: boolean;
  description: string;
}

export interface ContaminationAssessment {
  contaminationDetected: boolean;
  contaminants: ContaminantDetail[];
  fraudRiskLevel: 'low' | 'medium' | 'high';
  notes: string;
}

// ========================================
// Fraud Detection Types - Rust/Corrosion
// ========================================

export interface CorrosionDetail {
  location: string;
  severity: 'surface_rust' | 'pitting' | 'deep_corrosion' | 'structural';
  color: string; // "bright orange" = fresh, "dark brown/black" = old
  spreadPattern: string;
  estimatedAge: string;
}

export interface RustCorrosionAssessment {
  rustDetected: boolean;
  corrosionAreas: CorrosionDetail[];
  overallCorrosionLevel: 'none' | 'minimal' | 'moderate' | 'severe';
  estimatedCorrosionAge: string;
  fraudIndicator: boolean;
  notes: string;
}

// ========================================
// Fraud Detection Types - Pre-Existing Damage
// ========================================

export interface PreExistingDamageItem {
  location: string;
  damageType: string;
  ageEstimate: string;
  reasoning: string;
  relatedToClaimedIncident: boolean;
}

export interface PreExistingDamageAssessment {
  preExistingDamageDetected: boolean;
  preExistingItems: PreExistingDamageItem[];
  damageConsistency: 'consistent' | 'inconsistent' | 'mixed' | 'unclear';
  fraudRiskLevel: 'low' | 'medium' | 'high';
  notes: string;
}

export interface AutoDamageAnalysis {
  damagedParts: DamagedPart[];
  overallSeverity: 'minor' | 'moderate' | 'severe' | 'total_loss';
  estimatedRepairComplexity: 'simple' | 'moderate' | 'complex' | 'extensive';
  safetyConcerns: string[];
  recommendedActions: string[];
  confidence: number; // 0-1
}

// ========================================
// Enhanced Auto Damage Analysis Types (with Policy)
// ========================================

// Vehicle Verification Types (Fraud Prevention)
export interface VehicleDetails {
  licensePlate: string | null;
  vin: string | null;
  make: string | null;
  model: string | null;
  year: number | null;
  color: string | null;
}

export interface VehicleVerification {
  videoVehicle: VehicleDetails;
  policyVehicle: VehicleDetails;
  verificationStatus: 'matched' | 'mismatched' | 'insufficient_data';
  mismatches: string[];
  confidenceScore: number;
  notes: string;
}

export interface PolicyAnalysis {
  coverageTypes: string[];
  deductibles: Array<{ type: string; amount: number }>;
  exclusions: string[];
  coverageLimits: Record<string, number>;
  relevantPolicySections: string[];
}

export interface FinancialBreakdown {
  totalRepairEstimate: number;
  coveredAmount: number;
  deductible: number;
  nonCoveredItems: number;
  estimatedPayout: number;
}

export interface ClaimAssessment {
  status: 'approved' | 'denied' | 'partial' | 'needs_investigation';
  coveredDamages: string[];
  excludedDamages: string[];
  financialBreakdown: FinancialBreakdown;
  reasoning: string;
  policyReferences: string[];
}

export interface EnhancedAutoDamageAnalysis extends AutoDamageAnalysis {
  estimatedTotalRepairCost: number;
  damageType: 'collision' | 'comprehensive' | 'weather' | 'vandalism' | 'unknown';
  damageCause: string;
  vehicleVerification: VehicleVerification; // Fraud prevention
  policyAnalysis: PolicyAnalysis;
  claimAssessment: ClaimAssessment;
  investigationNeeded: boolean;
  investigationReason: string | null;
  confidenceReasoning: string;
  // Fraud detection assessments
  damageAgeAssessment?: DamageAgeAssessment;
  contaminationAssessment?: ContaminationAssessment;
  rustCorrosionAssessment?: RustCorrosionAssessment;
  preExistingDamageAssessment?: PreExistingDamageAssessment;
}

export interface PolicyDocumentInput {
  policyPath?: string;
  policyBase64?: string;
  mimeType: 'application/pdf';
}

export interface VideoPolicyAnalysisInput extends VideoAnalysisInput {
  policy: PolicyDocumentInput;
}

// ========================================
// File Processing Types
// ========================================

export interface Base64File {
  base64: string;
  mimeType: string;
  size: number;
}

export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

// ========================================
// Multi-Image Analysis Types
// ========================================

export interface MultiImageAnalysisInput {
  images: Array<{
    base64: string;
    mimeType: ImageMimeType;
    angle?: 'front' | 'rear' | 'side_left' | 'side_right' | 'overhead';
  }>;
}

// ========================================
// Security Scanning Types
// ========================================

export interface SecurityScanResult {
  isSuspicious: boolean;
  suspiciousPatterns: string[];
  riskLevel: 'low' | 'medium' | 'high';
  reasoning: string;
}

export interface InjectionPattern {
  pattern: RegExp;
  severity: 'low' | 'medium' | 'high';
  category: 'instruction_override' | 'system_prompt' | 'suspicious_keywords';
}

// ========================================
// Response Validation Types
// ========================================

export interface ValidationResult {
  isValid: boolean;
  warnings: string[];
  requiresManualReview: boolean;
  flaggedReasons: string[];
}

// ========================================
// Audit Logging Types
// ========================================

export interface AuditLogEntry {
  timestamp: string;
  action: 'analyze_video' | 'analyze_image' | 'analyze_policy';
  fileHashes: string[];
  result: 'success' | 'error' | 'flagged';
  securityFlags: string[];
  tokenUsage?: number;
}
