/**
 * Rate Limiting Type Definitions
 * Types for tracking and managing Gemini API rate limits across multiple models
 */

/**
 * Rate limit window tracking for a specific model
 * Stores timestamps and token usage for sliding window calculations
 */
export interface RateLimitWindow {
  modelName: string;
  requestTimestamps: number[]; // Array of Unix timestamps for RPM tracking
  tokenUsageLog: Array<{
    timestamp: number;
    tokens: number;
  }>; // Token usage for TPM tracking
  dailyRequests: number; // Counter for RPD tracking
  dailyResetTime: number; // Midnight UTC timestamp for daily reset
}

/**
 * Rate limit configuration for a specific model
 */
export interface ModelLimits {
  rpm: number; // Requests per minute
  tpm: number; // Tokens per minute
  rpd: number; // Requests per day
}

/**
 * Result of model selection with rate limiting
 */
export interface RateLimitResult {
  available: boolean;
  modelName?: string; // Available model name (if available)
  error?: string; // Error message (if not available)
  retryAfter?: number; // Seconds until retry (if not available)
}

/**
 * Rate limit error response
 * Extends the standard error result with rate limit information
 */
export interface RateLimitError {
  success: false;
  message: string;
  rateLimited: true; // Flag to identify rate limit errors
  retryAfter: number; // Seconds until retry
  exhaustedModels: string[]; // Models that hit limits
}
