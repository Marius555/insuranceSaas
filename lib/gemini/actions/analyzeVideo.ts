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

### DAMAGE AGE ANALYSIS (CRITICAL FOR FRAUD DETECTION)
For each damaged area, assess whether the damage appears FRESH or OLD:

**Fresh Damage Indicators (0-48 hours):**
- Exposed metal is shiny, silver, or bright
- Clean break edges without discoloration
- No rust or oxidation on exposed surfaces
- Fresh paint chips with clean edges
- No dirt/debris accumulation in damage area

**Old Damage Indicators (days to weeks):**
- Exposed metal shows orange-brown oxidation
- Rust spots forming at damage edges
- Dirt/grime accumulated in scratches/dents
- Paint edges show weathering/chalking
- Water staining patterns visible

**Very Old Damage (weeks to months):**
- Deep rust with pitting
- Dark brown or black oxidation
- Heavy contamination in damaged areas
- Multiple layers of rust/paint deterioration
- Structural corrosion visible

### SURFACE CONTAMINATION CHECK
Identify any substances covering or near the damage:
- Dirt, mud, road grime
- Snow, ice, salt residue
- Water stains, mineral deposits
- Oil, grease, chemical stains
- Dust accumulation patterns

### RUST/CORROSION ASSESSMENT
For ALL metal surfaces visible, note:
- Location of any rust/corrosion
- Color (bright orange = new, dark brown = old)
- Spread pattern (localized vs spreading)
- Depth (surface rust vs pitting vs structural)

Return a JSON object with the following structure:
{
  "damagedParts": [
    {
      "part": "front bumper",
      "severity": "moderate",
      "description": "Cracked plastic with paint damage",
      "damageAge": "fresh",
      "ageIndicators": ["Shiny exposed metal", "No oxidation visible"],
      "rustPresent": false,
      "preExisting": false
    }
  ],
  "overallSeverity": "moderate",
  "estimatedRepairComplexity": "moderate",
  "safetyConcerns": ["Headlight damaged - affects visibility"],
  "recommendedActions": ["Replace front bumper", "Repair headlight assembly"],
  "confidence": 0.85,
  "damageAgeAssessment": {
    "estimatedAge": "fresh",
    "confidenceScore": 0.85,
    "indicators": [
      {
        "type": "oxidation",
        "observation": "Exposed metal on bumper is shiny silver",
        "ageImplication": "Damage occurred within 24-48 hours"
      }
    ],
    "reasoning": "No rust or oxidation visible on exposed metal. Paint edges are clean and sharp."
  },
  "contaminationAssessment": {
    "contaminationDetected": false,
    "contaminants": [],
    "fraudRiskLevel": "low",
    "notes": "Damage area is clean, consistent with recent incident"
  },
  "rustCorrosionAssessment": {
    "rustDetected": false,
    "corrosionAreas": [],
    "overallCorrosionLevel": "none",
    "estimatedCorrosionAge": "N/A",
    "fraudIndicator": false,
    "notes": "No rust detected in damage areas"
  }
}

Categories:
- severity: "minor" | "moderate" | "severe" | "total_loss"
- repairComplexity: "simple" | "moderate" | "complex" | "extensive"
- damageAge: "fresh" | "days_old" | "weeks_old" | "months_old" | "unknown"
- confidence: 0.0 to 1.0

Provide thorough analysis based on visible damage in the video.`;

  const result = await analyzeVideo({
    ...(isBase64 ? { videoBase64: videoPathOrBase64 } : { videoPath: videoPathOrBase64 }),
    mimeType,
    prompt,
    model: GEMINI_MODELS.FLASH_LITE, // Fast and cost-effective
    temperature: 0.2, // Very factual
    responseFormat: 'json',
  });

  // Type assertion: when responseFormat is 'json', analysis is always AutoDamageAnalysis
  return result as GeminiResult<{ analysis: AutoDamageAnalysis }>;
}
