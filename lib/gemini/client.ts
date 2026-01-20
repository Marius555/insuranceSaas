import { GoogleGenAI } from "@google/genai";
import { GEMINI_MODELS } from "./constants";
import { selectAvailableModel } from "./rateLimit/selector";
import { recordRequest } from "./rateLimit/storage";

/**
 * Get Gemini client instance
 * Server-side utility function (not a server action)
 * Only used by server actions in lib/gemini/actions/*
 *
 * @throws {Error} If GEMINI_API_KEY is not set
 * @returns GoogleGenAI client instance
 */
export function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable not set");
  }

  return new GoogleGenAI({ apiKey });
}

/**
 * Get a specific Gemini model instance
 *
 * @param modelName - Model identifier (default: gemini-2.5-flash-lite)
 * @returns Model instance for content generation
 */
export function getModel(modelName: string = GEMINI_MODELS.FLASH_LITE) {
  const client = getGeminiClient();
  return client.models.get({ model: modelName });
}

/**
 * Get available model with rate limiting
 * Automatically selects a model that hasn't hit rate limits
 * Uses priority-based strategy: flash-lite → flash → flash-3
 *
 * Can be overridden for testing via FORCE_GEMINI_MODEL environment variable
 *
 * @param estimatedTokens - Estimated tokens for this request (default: 3000)
 * @param excludeModels - Set of model names to skip (for automatic fallback on 503 errors)
 * @returns Object with client and modelName, OR error with retry timing
 */
export async function getModelWithRateLimiting(
  estimatedTokens: number = 3000,
  excludeModels: Set<string> = new Set()
): Promise<
  | { client: GoogleGenAI; modelName: string }
  | { error: string; retryAfter: number }
> {
  const client = getGeminiClient();

  // Check for forced model (for testing)
  const forcedModel = process.env.FORCE_GEMINI_MODEL;
  if (forcedModel) {
    console.log(`⚠️ Using forced model for testing: ${forcedModel}`);
    console.log('  (Set via FORCE_GEMINI_MODEL environment variable)');
    console.log('  Rate limiting is BYPASSED in testing mode!');

    return { client, modelName: forcedModel };
  }

  // Normal rate-limited model selection (with exclusion list for fallback)
  const result = await selectAvailableModel(estimatedTokens, excludeModels);

  if (!result.available) {
    return {
      error: result.error || "All models are rate-limited",
      retryAfter: result.retryAfter || 60,
    };
  }

  // Record request immediately
  await recordRequest(result.modelName!);

  return { client, modelName: result.modelName! };
}
