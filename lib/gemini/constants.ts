/**
 * Gemini API Constants
 * Configuration values for Gemini 2.5 Flash-Lite integration
 */

/**
 * Available Gemini models
 */
export const GEMINI_MODELS = {
  FLASH_LITE: 'gemini-2.5-flash-lite',  // Default - fastest, cheapest
  FLASH: 'gemini-2.5-flash',
  FLASH_3: 'gemini-3-flash-preview',
  PRO: 'gemini-2.5-pro',
} as const;

/**
 * Default generation configuration
 */
export const DEFAULT_CONFIG = {
  temperature: 1.0,
  maxOutputTokens: 2048,
  topP: 0.95,
  topK: 40,
} as const;

/**
 * Maximum consistency configuration for deterministic responses
 * Use this when identical inputs must produce identical outputs
 * - temperature 0.0: Greedy decoding (no randomness)
 * - topP 0.1: Top 10% probability mass only
 * - topK 1: Single best token selection
 * - seed: Fixed seed for reproducibility
 */
export const MAX_CONSISTENCY_CONFIG = {
  temperature: 0.0,
  topP: 0.1,
  topK: 1,
  seed: 12345,
} as const;

/**
 * File size limits (Gemini API restrictions)
 */
export const FILE_LIMITS = {
  MAX_SIZE_MB: 20,
  MAX_SIZE_BYTES: 20 * 1024 * 1024,
} as const;

/**
 * Rate limits for Gemini 2.5 Flash-Lite (free tier)
 * @deprecated Use MODEL_RATE_LIMITS instead
 */
export const RATE_LIMITS = {
  FREE_TIER_RPM: 15,  // Requests per minute
  FREE_TIER_RPD: 1500, // Requests per day
} as const;

/**
 * Per-model rate limits
 * RPM: Requests per minute
 * TPM: Tokens per minute
 * RPD: Requests per day
 */
export const MODEL_RATE_LIMITS = {
  [GEMINI_MODELS.FLASH_LITE]: {
    rpm: 10,
    tpm: 250_000,
    rpd: 20,
  },
  [GEMINI_MODELS.FLASH]: {
    rpm: 5,
    tpm: 250_000,
    rpd: 20,
  },
  [GEMINI_MODELS.FLASH_3]: {
    rpm: 5,
    tpm: 250_000,
    rpd: 20,
  },
} as const;

/**
 * Security configuration for prompt injection prevention
 */
export const SECURITY_CONFIG = {
  ENABLE_INJECTION_SCANNING: true,  // Enable security scanning for uploaded files
  MAX_IMAGES_PER_REQUEST: 5,         // Maximum number of images per analysis
  HIGH_RISK_THRESHOLD: 100000,        // $100k - flag for manual review
  LOW_CONFIDENCE_THRESHOLD: 0.3,      // Flag results below 30% confidence
} as const;

/**
 * Gemini safety settings for content filtering
 * Balanced approach - blocks clearly harmful content
 */
export const GEMINI_SAFETY_SETTINGS = [
  {
    category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
    threshold: 'BLOCK_MEDIUM_AND_ABOVE',
  },
  {
    category: 'HARM_CATEGORY_HARASSMENT',
    threshold: 'BLOCK_MEDIUM_AND_ABOVE',
  },
] as const;
