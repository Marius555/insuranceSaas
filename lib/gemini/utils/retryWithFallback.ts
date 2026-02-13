"use server";

import { getModelWithRateLimiting } from '../client';
import { isRetryableError } from './sanitizeError';

/**
 * Execute a Gemini API call with automatic model fallback on 503 errors
 *
 * When a model returns a rate limit error (503/UNAVAILABLE), this function
 * automatically retries with the next available model in the priority chain.
 *
 * Priority order: FLASH_LITE → FLASH → FLASH_3
 *
 * @param apiCall - Function that makes the Gemini API call (receives client and modelName)
 * @param estimatedTokens - Token estimate for model selection
 * @param attemptedModels - Set of model names already attempted (for recursion)
 * @returns API response or error with exhausted models list
 *
 * @example
 * ```typescript
 * const result = await retryWithFallback(
 *   async (client, modelName) => {
 *     const response = await client.models.generateContent({
 *       model: modelName,
 *       contents: [...]
 *     });
 *     return { analysis: response, usage: response.usageMetadata };
 *   },
 *   3000
 * );
 *
 * if (result.success) {
 *   console.log(`Success with model: ${result.modelUsed}`);
 * } else {
 *   console.log(`All models failed: ${result.exhaustedModels}`);
 * }
 * ```
 */
export async function retryWithFallback<T>(
  apiCall: (client: any, modelName: string) => Promise<T>,
  estimatedTokens: number,
  attemptedModels: Set<string> = new Set()
): Promise<
  | { success: true; result: T; modelUsed: string }
  | { success: false; error: unknown; exhaustedModels: string[] }
> {
  // Get next available model (excluding already attempted ones)
  const modelResult = await getModelWithRateLimiting(estimatedTokens, attemptedModels);

  if ('error' in modelResult) {
    // All models exhausted by rate limits (checked before API call)
    console.log(`❌ All models exhausted by rate limits: ${[...attemptedModels].join(', ')}`);
    return {
      success: false,
      error: new Error(modelResult.error),
      exhaustedModels: [...attemptedModels]
    };
  }

  const { client, modelName } = modelResult;
  attemptedModels.add(modelName);

  console.log(`🎯 Attempting analysis with model: ${modelName}`);

  try {
    // Attempt the API call
    const result = await apiCall(client, modelName);

    console.log(`✅ Analysis succeeded with model: ${modelName}`);

    return {
      success: true,
      result,
      modelUsed: modelName
    };
  } catch (error: unknown) {
    console.log(`❌ Model ${modelName} failed with error:`, error);

    // Check if it's a retryable error (rate limit, 503, or JSON truncation)
    if (isRetryableError(error)) {
      console.log(`🔄 Model ${modelName} failed with retryable error, attempting fallback to next model...`);

      // Recursive retry with next model
      return retryWithFallback(apiCall, estimatedTokens, attemptedModels);
    }

    // Not a rate limit error - don't retry, propagate error immediately
    console.log(`⚠️  Non-rate-limit error detected, not retrying`);
    return {
      success: false,
      error,
      exhaustedModels: [...attemptedModels]
    };
  }
}
