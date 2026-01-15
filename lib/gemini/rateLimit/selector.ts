/**
 * Model Selector with Rate Limiting
 * Implements priority-based model selection strategy
 */

import { GEMINI_MODELS, MODEL_RATE_LIMITS } from '../constants';
import type { ModelLimits, RateLimitResult } from './types';
import { checkAllLimits, getSecondsUntilRetry } from './checker';

/**
 * Select an available model that hasn't hit rate limits
 * Uses priority-based strategy: flash-lite (Tier 1) → flash/flash-3 (Tier 2)
 *
 * @param estimatedTokens - Estimated tokens for this request
 * @param excludeModels - Set of model names to skip (for automatic fallback)
 * @returns Result with available model or error with retry timing
 */
export async function selectAvailableModel(
  estimatedTokens: number,
  excludeModels: Set<string> = new Set()
): Promise<RateLimitResult> {
  // Tier 1: Try flash-lite first (highest RPM)
  const tier1Model = GEMINI_MODELS.FLASH_LITE;
  const tier1Limits = getModelLimits(tier1Model);

  if (!excludeModels.has(tier1Model) && checkAllLimits(tier1Model, estimatedTokens, tier1Limits)) {
    return {
      available: true,
      modelName: tier1Model,
    };
  }

  if (excludeModels.has(tier1Model)) {
    console.log(`⏭️  Skipping ${tier1Model} (already attempted)`);
  }

  // Tier 2: Try flash and flash-3 (round-robin between them)
  const tier2Models = [GEMINI_MODELS.FLASH, GEMINI_MODELS.FLASH_3];

  for (const modelName of tier2Models) {
    // Skip if model already attempted
    if (excludeModels.has(modelName)) {
      console.log(`⏭️  Skipping ${modelName} (already attempted)`);
      continue;
    }

    const limits = getModelLimits(modelName);

    if (checkAllLimits(modelName, estimatedTokens, limits)) {
      return {
        available: true,
        modelName,
      };
    }
  }

  // All models exhausted - calculate retry timing
  const retryAfter = getRetryAfterSeconds();

  return {
    available: false,
    error: `All models are currently rate-limited. Please retry in ${retryAfter} seconds.`,
    retryAfter,
  };
}

/**
 * Get rate limits for a specific model
 * @param modelName - Name of the Gemini model
 * @returns Rate limit configuration
 */
export function getModelLimits(modelName: string): ModelLimits {
  const limits = MODEL_RATE_LIMITS[modelName as keyof typeof MODEL_RATE_LIMITS];

  if (!limits) {
    throw new Error(`No rate limits configured for model: ${modelName}`);
  }

  return limits;
}

/**
 * Calculate seconds until next available model slot
 * Checks all models and returns the minimum wait time
 *
 * @returns Seconds until retry (minimum 1)
 */
function getRetryAfterSeconds(): number {
  const allModels = [
    GEMINI_MODELS.FLASH_LITE,
    GEMINI_MODELS.FLASH,
    GEMINI_MODELS.FLASH_3,
  ];

  // Get retry time for each model and return the minimum
  const retryTimes = allModels.map((modelName) =>
    getSecondsUntilRetry(modelName)
  );

  return Math.min(...retryTimes, 60); // Cap at 60 seconds max
}
