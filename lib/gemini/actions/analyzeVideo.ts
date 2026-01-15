"use server";

import { retryWithFallback } from "../utils/retryWithFallback";
import { recordTokenUsage } from "../rateLimit/storage";
import { fileToBase64 } from "../utils/fileToBase64";
import { sanitizeGeminiError, isRateLimitError } from "../utils/sanitizeError";
import { GEMINI_MODELS, GEMINI_SAFETY_SETTINGS } from "../constants";
import type {
  VideoAnalysisInput,
  GeminiResult,
  AutoDamageAnalysis,
} from "../types";

/**
 * Analyze video content using Gemini
 * Optimized for auto damage assessment
 *
 * @param input - Video file path/base64 and analysis prompt
 * @returns Structured analysis result
 */
export async function analyzeVideo(
  input: VideoAnalysisInput
): Promise<GeminiResult<{ analysis: string | AutoDamageAnalysis }>> {
  try {
    // Get video data (either from path or base64)
    let videoBase64: string;
    let mimeType = input.mimeType;

    if (input.videoPath) {
      const fileData = await fileToBase64(input.videoPath);
      videoBase64 = fileData.base64;
      mimeType = fileData.mimeType as typeof input.mimeType;
    } else if (input.videoBase64) {
      videoBase64 = input.videoBase64;
    } else {
      return {
        success: false,
        message: "Either videoPath or videoBase64 must be provided",
      };
    }

    // Define the API call as a function
    const apiCall = async (client: any, modelName: string) => {
      console.log(`🎯 Attempting video analysis with model: ${modelName}`);

      const response = await client.models.generateContent({
        model: modelName,
        contents: [
          {
            parts: [
              { text: input.prompt },
              {
                inlineData: {
                  mimeType,
                  data: videoBase64,
                },
              },
            ],
          },
        ],
        config: {
          temperature: 0.0,        // Override input - maximum determinism
          topP: 0.1,               // Narrow sampling
          topK: 1,                 // Single best token
          seed: 12345,             // Fixed seed for reproducibility
          maxOutputTokens: 2048,
          ...(input.responseFormat === 'json' && {
            responseMIMEType: "application/json",
          }),
          safetySettings: GEMINI_SAFETY_SETTINGS,
        },
      });

      const text = response.text;

      // Parse JSON if requested
      let analysis: string | AutoDamageAnalysis;

      if (input.responseFormat === 'json') {
        const cleanedText = text
          .replace(/^```json\s*\n?/i, '')
          .replace(/\n?```\s*$/i, '')
          .trim();

        try {
          analysis = JSON.parse(cleanedText);
        } catch (parseError) {
          console.error('Failed to parse JSON response:', cleanedText.substring(0, 200));
          throw new Error(`Invalid JSON response from Gemini: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
        }
      } else {
        analysis = text;
      }

      return {
        analysis,
        usage: response.usageMetadata,
      };
    };

    // Execute with automatic fallback
    const result = await retryWithFallback(apiCall, 4000);

    if (!result.success) {
      // All models failed
      if (isRateLimitError(result.error)) {
        return {
          success: false,
          message: `All AI models are currently at capacity. Please retry in 60 seconds.`,
          rateLimited: true,
          retryAfter: 60,
          exhaustedModels: result.exhaustedModels,
        };
      }

      // Other error
      return {
        success: false,
        message: sanitizeGeminiError(result.error),
      };
    }

    // Success!
    const { analysis, usage } = result.result;

    // Record token usage
    if (usage?.totalTokens) {
      await recordTokenUsage(result.modelUsed, usage.totalTokens);
    }

    console.log(`✅ Video analysis succeeded with model: ${result.modelUsed}`);

    return {
      success: true,
      data: { analysis },
      usage,
      modelUsed: result.modelUsed,
    };
  } catch (error: unknown) {
    console.error("❌ Video analysis error:", error);

    return {
      success: false,
      message: sanitizeGeminiError(error),
    };
  }
}

/**
 * Specialized function for auto damage assessment
 * Wrapper around analyzeVideo with optimized prompt
 *
 * @param videoPathOrBase64 - Path to video or base64 string
 * @param mimeType - Video MIME type
 * @param isBase64 - Whether input is base64 string (default: false)
 * @returns Structured damage analysis
 */
export async function analyzeAutoDamage(
  videoPathOrBase64: string,
  mimeType: VideoAnalysisInput['mimeType'],
  isBase64 = false
): Promise<GeminiResult<{ analysis: AutoDamageAnalysis }>> {
  const prompt = `You are an expert auto damage assessor. Analyze this vehicle damage video and provide a structured assessment.

Return a JSON object with the following structure:
{
  "damagedParts": [
    {
      "part": "front bumper",
      "severity": "moderate",
      "description": "Cracked plastic with paint damage"
    }
  ],
  "overallSeverity": "moderate",
  "estimatedRepairComplexity": "moderate",
  "safetyConcerns": ["Headlight damaged - affects visibility"],
  "recommendedActions": ["Replace front bumper", "Repair headlight assembly"],
  "confidence": 0.85
}

Categories:
- severity: "minor" | "moderate" | "severe" | "total_loss"
- repairComplexity: "simple" | "moderate" | "complex" | "extensive"
- confidence: 0.0 to 1.0

Provide thorough analysis based on visible damage in the video.`;

  return analyzeVideo({
    ...(isBase64 ? { videoBase64: videoPathOrBase64 } : { videoPath: videoPathOrBase64 }),
    mimeType,
    prompt,
    model: GEMINI_MODELS.FLASH_LITE, // Fast and cost-effective
    temperature: 0.2, // Very factual
    responseFormat: 'json',
  });
}
