"use server";

import { retryWithFallback } from "../utils/retryWithFallback";
import { recordTokenUsage } from "../rateLimit/storage";
import { fileToBase64 } from "../utils/fileToBase64";
import { sanitizeGeminiError, isRateLimitError } from "../utils/sanitizeError";
import { GEMINI_MODELS, GEMINI_SAFETY_SETTINGS } from "../constants";
import type {
  GeminiResult,
  EnhancedAutoDamageAnalysis,
} from "../types";

/**
 * Analyze car damage video WITH insurance policy document
 * Performs cross-reference reasoning to determine claim validity
 *
 * This is the "secret sauce" - holds video + policy in 1M context window
 */
export async function analyzeAutoDamageWithPolicy(
  videoPathOrBase64: string,
  videoMimeType: 'video/mp4' | 'video/mov' | 'video/avi',
  policyPathOrBase64: string,
  isBase64 = false
): Promise<GeminiResult<{ analysis: EnhancedAutoDamageAnalysis }>> {
  try {
    // Get video data
    let videoBase64: string;
    if (isBase64) {
      videoBase64 = videoPathOrBase64;
    } else {
      const videoData = await fileToBase64(videoPathOrBase64);
      videoBase64 = videoData.base64;
    }

    // Get policy PDF data
    let policyBase64: string;
    if (isBase64) {
      policyBase64 = policyPathOrBase64;
    } else {
      const policyData = await fileToBase64(policyPathOrBase64);
      policyBase64 = policyData.base64;
    }

    // Enhanced prompt with cross-reference reasoning and vehicle verification
    const CONSISTENCY_INSTRUCTION = `
CONSISTENCY REQUIREMENT:
You MUST produce identical outputs for identical inputs. Follow these rules:
1. Do NOT introduce random variation in your analysis
2. Use the EXACT SAME phrasing for similar damage patterns
3. Calculate financial estimates using consistent formulas
4. List damaged parts in alphabetical order
5. Be deterministic in your reasoning process
`;

    const prompt = `${CONSISTENCY_INSTRUCTION}

═══════════════════════════════════════════════════════════════════
CRITICAL ANTI-HALLUCINATION INSTRUCTION - READ FIRST
═══════════════════════════════════════════════════════════════════

When extracting vehicle identification details (license plate, VIN, make, model, year, color):
- ONLY include values you can CLEARLY see and read in the video or policy document
- If ANY detail is unclear, not visible, partially obscured, or uncertain, you MUST set it to null
- NEVER guess, infer, assume, or use example/placeholder values
- NEVER use these example values: "ABC123", "ABC-123", "XYZ789", "1HGBH41JXMN109186"
- Better to return null than incorrect data - this is for FRAUD PREVENTION

Examples of when to use null:
- License plate not visible in video → licensePlate: null
- VIN sticker not captured in video → vin: null
- Cannot determine exact year from body style → year: null
- Make/model badges not readable → make: null, model: null

This instruction overrides ALL examples below. When in doubt, use null.

═══════════════════════════════════════════════════════════════════

You are an expert auto insurance claims adjuster with deep knowledge of vehicle damage assessment and insurance policy interpretation.

## YOUR TASK
Analyze the provided car damage video AND insurance policy document to determine claim validity, coverage, and estimated payout.

## ANALYSIS REQUIREMENTS

### STEP 1: VIDEO ANALYSIS - Damage Assessment
Carefully review the damage video and identify:
1. ALL damaged parts (be thorough)
2. Severity of each damaged part (minor/moderate/severe)
3. Likely cause of damage (collision, hail, vandalism, wear-and-tear, etc.)
4. Estimated total repair cost
5. Safety concerns from the damage

### STEP 2: VIDEO ANALYSIS - Vehicle Identification (CRITICAL for fraud prevention)
Extract ALL visible vehicle identification details from the video:
1. **License plate number** - Look carefully at front/rear plates in video (null if not visible)
2. **VIN (Vehicle Identification Number)** - Check if visible through windshield (null if not visible)
3. **Make and Model** - Identify brand and model from badges (null if not readable)
4. **Year/Generation** - Estimate model year based on body style (null if uncertain)
5. **Color** - Primary exterior color (null if lighting prevents determination)
6. **Distinctive features** - Body style (sedan/SUV/truck), trim level, modifications

Remember: Follow the CRITICAL ANTI-HALLUCINATION INSTRUCTION at the top. Use null for any unclear values.

### STEP 3: POLICY ANALYSIS - Coverage Details
Review the insurance policy document and extract:
1. Coverage types (liability, collision, comprehensive, etc.)
2. Deductible amounts for each coverage type
3. Policy exclusions (what is NOT covered)
4. Coverage limits (maximum payout amounts)
5. Relevant policy sections (cite section numbers)

### STEP 4: POLICY ANALYSIS - Insured Vehicle Details
Extract the insured vehicle information from the policy:
1. **License plate number** - Registered plate number
2. **VIN** - Vehicle identification number
3. **Make and Model** - Manufacturer and model name
4. **Year** - Model year
5. **Color** - Registered color
6. **Any other identifying information**

### STEP 5: VEHICLE VERIFICATION - Cross-Check (FRAUD DETECTION)

You MUST follow this EXACT decision tree. Do NOT skip steps.

**STEP 5A: Identify Available Data**
Count how many identification fields you can read from BOTH video AND policy:
- License Plate (readable in both?)
- VIN (visible in both?)
- Make/Model (identifiable in both?)
- Year (determinable in both?)
- Color (visible in both?)

**STEP 5B: Data Sufficiency Check**
- If you have < 2 reliable identification fields visible in the video → \`insufficient_data\`
- If policy is missing vehicle details → \`insufficient_data\`
- Otherwise, proceed to STEP 5C

**STEP 5C: Systematic Field-by-Field Comparison**
For EACH field where you have data from BOTH sources, compare:

1. **License Plate (HIGHEST PRIORITY)**
   - MATCHED: Exact match, ignoring spacing/hyphens (e.g., plate with spaces = same plate without spaces)
   - MISMATCHED: Any different characters or numbers between video and policy
   - If not clearly visible in video → set to null

2. **VIN (HIGHEST PRIORITY)**
   - MATCHED: Exact 17-character match
   - MISMATCHED: Any difference in the VIN number
   - If not visible in video or policy → set to null

3. **Make/Model (HIGH PRIORITY)**
   - MATCHED: Same manufacturer AND same model name
   - MISMATCHED: Different manufacturer OR different model
     - Different brand = MISMATCHED
     - Same brand but different model = MISMATCHED
     - Different body type = MISMATCHED
   - If brand/model badges not identifiable → set to null

4. **Year (MEDIUM PRIORITY)**
   - MATCHED: Exact year OR ±1 year if same generation/body style
   - MISMATCHED: >1 year difference OR clearly different generation
   - If cannot determine exact year from visible features → set to null

5. **Color (LOW PRIORITY - lighting varies)**
   - MATCHED: Same color family (account for lighting variations)
   - MISMATCHED: Completely different color families
   - If lighting conditions make color uncertain → set to null

**STEP 5D: Determine Verification Status**

Apply these rules IN ORDER:

1. If ANY HIGH PRIORITY field mismatches → \`verificationStatus: "mismatched"\`
   - License plate mismatch → mismatched
   - VIN mismatch → mismatched
   - Make/Model mismatch → mismatched

2. If NO high-priority fields available for comparison → \`verificationStatus: "insufficient_data"\`
   - Example: No plate visible, no VIN visible, can't identify make/model

3. If ≥2 high-priority fields match AND no mismatches → \`verificationStatus: "matched"\`

4. Otherwise → \`verificationStatus: "insufficient_data"\`

**STEP 5E: Populate Verification Object**

Example showing proper use of null for undetected fields:

{
  "vehicleVerification": {
    "videoVehicle": {
      "licensePlate": null,  // Example: Not visible in video frames
      "vin": null,           // Example: Not visible in video
      "make": "Mazda",       // Example: Badge visible on front grille
      "model": "CX-5",       // Example: Model badge visible on rear
      "year": 2021,          // Example: Determined from body style
      "color": "Blue"        // Example: Clearly visible
    },
    "policyVehicle": {
      // Extracted from policy document - use null if field missing
      "licensePlate": "[VALUE_FROM_POLICY]" | null,
      "vin": "[17_CHAR_VIN_FROM_POLICY]" | null,
      "make": "[MAKE_FROM_POLICY]" | null,
      "model": "[MODEL_FROM_POLICY]" | null,
      "year": [YEAR_NUMBER] | null,
      "color": "[COLOR_FROM_POLICY]" | null
    },
    "verificationStatus": "matched" | "mismatched" | "insufficient_data",
    "mismatches": [
      "License plate: video shows [PLATE_A] but policy shows [PLATE_B]",
      "Make/Model: video shows [MAKE_MODEL_A] but policy shows [MAKE_MODEL_B]"
    ],  // List ALL field mismatches found (empty array if no mismatches)
    "confidenceScore": 0.85,  // Your confidence in the verification (0-1)
    "notes": "Detailed explanation of what was visible, what matched, what didn't"
  }
}

**CRITICAL RULES:**
- A "match" means you can CONFIRM the vehicles are the same
- If unsure or can't verify → use "insufficient_data", NOT "matched"
- DO NOT assume a match just because both are cars
- DO NOT mark as matched if you can only see make/model and nothing else
- BE CONSERVATIVE: When in doubt → insufficient_data or mismatched

**IMPORTANT**: Even if mismatched, DO NOT auto-deny. Flag the mismatch and continue analysis.

### STEP 6: CROSS-REFERENCE REASONING - Coverage Assessment
Now perform critical reasoning:
1. Map the damage type to the appropriate coverage type
   - Collision damage → Collision coverage
   - Weather/hail/storm damage → Comprehensive coverage
   - Vandalism → Comprehensive coverage
   - Wear-and-tear → NOT COVERED

**CRITICAL: The damageType field in your JSON response MUST be one of these exact values:**
- "collision" - For impact, crash, or collision damage
- "weather" - For hail, storm, flood, or weather-related damage
- "vandalism" - For intentional or malicious damage
- "comprehensive" - For other non-collision damage (fire, theft, animal)
- "unknown" - When damage cause cannot be determined

Example: If you see hail damage, use "weather", NOT "hail".

2. Check if the identified coverage exists in the policy
3. Apply relevant exclusions
4. Calculate estimated payout (repair cost - deductible - exclusions)

### STEP 7: CLAIM DETERMINATION
Provide a clear determination:
- **Status**: approved/denied/partial/needs_investigation
- **Reasoning**: Detailed explanation with policy references
- **Financial Breakdown**:
  - Total repair estimate: $X
  - Covered amount: $Y
  - Client deductible: $Z
  - Non-covered items: $W
  - **Estimated payout: $[Y - Z]**

## OUTPUT FORMAT
Return ONLY valid JSON (no markdown) with this exact structure:

{
  "damagedParts": [
    {
      "part": "front bumper",
      "severity": "severe",
      "description": "detailed description",
      "estimatedRepairCost": 1500
    }
  ],
  "overallSeverity": "severe",
  "estimatedTotalRepairCost": 8500,
  "damageType": "collision",  // MUST be one of: "collision", "weather", "vandalism", "comprehensive", "unknown"
  "damageCause": "Front-end impact, likely rear-end collision",
  "estimatedRepairComplexity": "extensive",

  "vehicleVerification": {
    "videoVehicle": {
      "licensePlate": null,  // Not clearly visible in video
      "vin": null,           // Not visible in video
      "make": "Ford",        // Brand badge visible on front grille
      "model": "Escape",     // Model badge visible on tailgate
      "year": 2018,          // Determined from 3rd gen body style (2017-2019)
      "color": "White"       // Clearly visible
    },
    "policyVehicle": {
      "licensePlate": null,  // Not listed in policy document
      "vin": null,           // Not found in provided policy pages
      "make": "Ford",        // Listed in policy
      "model": "Escape",     // Listed in policy
      "year": 2018,          // Listed in policy
      "color": "White"       // Listed as "Oxford White"
    },
    "verificationStatus": "matched",
    "mismatches": [],
    "confidenceScore": 0.87,
    "notes": "Make, model, year, and color match between video and policy. License plate and VIN not available for comparison but other fields provide sufficient verification. Color variation (White vs Oxford White) is same color family."
  },

  "policyAnalysis": {
    "coverageTypes": ["Liability", "Collision ($500 deductible)", "Comprehensive ($250 deductible)"],
    "deductibles": [
      { "type": "collision", "amount": 500 },
      { "type": "comprehensive", "amount": 250 }
    ],
    "exclusions": ["Wear and tear", "Mechanical breakdown", "Racing"],
    "coverageLimits": {
      "collision": 50000,
      "comprehensive": 50000
    },
    "relevantPolicySections": ["Section 3.2: Collision Coverage", "Section 5.1: Deductibles"]
  },

  "claimAssessment": {
    "status": "approved",
    "coveredDamages": [
      "Front bumper replacement - collision coverage applies",
      "Hood replacement - collision coverage applies",
      "Headlight assembly - collision coverage applies"
    ],
    "excludedDamages": [
      "Pre-existing rust on undercarriage - wear and tear exclusion"
    ],
    "financialBreakdown": {
      "totalRepairEstimate": 8500,
      "coveredAmount": 8000,
      "deductible": 500,
      "nonCoveredItems": 500,
      "estimatedPayout": 7500
    },
    "reasoning": "The damage is consistent with a front-end collision. Policy Section 3.2 provides collision coverage with a $500 deductible. All damaged parts shown in the video are directly related to the collision and are covered. Pre-existing rust on undercarriage is excluded per wear-and-tear clause (Section 7.3).",
    "policyReferences": [
      "Section 3.2: Collision coverage applies to vehicle damage from impact",
      "Section 5.1: $500 collision deductible",
      "Section 7.3: Wear and tear exclusion"
    ]
  },

  "recommendedActions": [
    "Approve claim for $7,500 payout",
    "Require repair at approved facility",
    "Request final invoice for verification",
    "Schedule vehicle safety inspection post-repair"
  ],

  "investigationNeeded": false,
  "investigationReason": null,

  "safetyConcerns": [
    "Structural integrity compromised - requires professional assessment",
    "Airbag deployment indicators - safety system inspection required"
  ],

  "confidence": 0.92,
  "confidenceReasoning": "Clear collision damage visible in video. Policy language is straightforward. Minor uncertainty about pre-existing rust extent."
}

## COVERAGE LIMIT EXTRACTION RULES

When extracting coverage limits from the policy document:
1. **Numeric values**: Extract as numbers (e.g., "$50,000" → 50000)
2. **Unlimited coverage**: Use these EXACT strings when policy states unlimited coverage:
   - "Market value" - for policies covering vehicle's market value
   - "Actual cash value" or "ACV" - for actual cash value policies
   - "Replacement cost" - for replacement cost coverage
   - "Stated value" - for agreed/stated value policies
3. **No coverage**: Use 0 for coverage types not included in the policy
4. **Unclear**: Use "Market value" as the default when the limit is unclear but coverage exists

IMPORTANT: Do NOT convert insurance terms to numbers. Return them as strings exactly as shown above.

## IMPORTANT RULES
1. Be thorough but concise
2. ALWAYS cite specific policy sections
3. Show your reasoning step-by-step
4. If unsure, mark status as "needs_investigation" and explain why
5. Calculate accurate financial breakdowns
6. Consider edge cases (pre-existing damage, multiple causes, etc.)
7. Return ONLY the JSON object (no markdown formatting)`;

    // Define the API call as a function
    const apiCall = async (client: any, modelName: string) => {
      console.log(`🎯 Attempting video+policy analysis with model: ${modelName}`);

      const response = await client.models.generateContent({
        model: modelName,
        contents: [
          {
            parts: [
              { text: prompt },
              {
                inlineData: {
                  mimeType: videoMimeType,
                  data: videoBase64,
                },
              },
              {
                inlineData: {
                  mimeType: 'application/pdf',
                  data: policyBase64,
                },
              },
            ],
          },
        ],
        config: {
          temperature: 0.0,        // Maximum determinism
          topP: 0.1,               // Narrow sampling
          topK: 1,                 // Single best token
          seed: 12345,             // Fixed seed for reproducibility
          maxOutputTokens: 16384,
          responseMIMEType: "application/json",
          safetySettings: GEMINI_SAFETY_SETTINGS,
        },
      });

      const text = response.text;

      // Clean text first (remove markdown fences)
      const cleanedText = text
        .replace(/^```json\s*\n?/i, '')
        .replace(/\n?```\s*$/i, '')
        .trim();

      // Check for truncation using CLEANED text
      if (response.finishReason === 'MAX_TOKENS' ||
          (response.finishReason === undefined && !cleanedText.endsWith('}'))) {
        console.error('⚠️ Response appears truncated');
        console.error('  - Finish reason:', response.finishReason || 'undefined');
        console.error('  - Response length:', text.length);
        console.error('  - Cleaned length:', cleanedText.length);
        console.error('  - Last char of cleaned:', cleanedText[cleanedText.length - 1]);
        console.error('  - Last 200 chars:', cleanedText.substring(Math.max(0, cleanedText.length - 200)));

        throw new Error(
          `Analysis response was truncated (finish reason: ${response.finishReason || 'undefined'}). ` +
          `Response length: ${text.length} chars. Cleaned length: ${cleanedText.length} chars.`
        );
      }

      // Validate JSON structure
      if (!cleanedText.startsWith('{') || !cleanedText.endsWith('}')) {
        console.error('❌ JSON validation failed:');
        console.error('  - Starts with {:', cleanedText.startsWith('{'));
        console.error('  - Ends with }:', cleanedText.endsWith('}'));
        console.error('  - First char:', cleanedText[0]);
        console.error('  - Last char:', cleanedText[cleanedText.length - 1]);
        console.error('  - First 100 chars:', cleanedText.substring(0, 100));
        console.error('  - Last 100 chars:', cleanedText.substring(Math.max(0, cleanedText.length - 100)));
        throw new Error('Response JSON is incomplete or malformed');
      }

      let analysis: EnhancedAutoDamageAnalysis;
      try {
        analysis = JSON.parse(cleanedText);
      } catch (parseError) {
        console.error('❌ JSON Parse Error:');
        console.error('  - Error:', parseError instanceof Error ? parseError.message : 'Unknown');
        console.error('  - Response length:', cleanedText.length);
        console.error('  - Finish reason:', response.finishReason);
        console.error('  - First 500 chars:', cleanedText.substring(0, 500));
        console.error('  - Last 500 chars:', cleanedText.substring(Math.max(0, cleanedText.length - 500)));
        throw new Error('Failed to parse AI response');
      }

      return {
        analysis,
        usage: response.usageMetadata,
      };
    };

    // Execute with automatic fallback
    const result = await retryWithFallback(apiCall, 13000);

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

      // Other error (including truncation)
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

    console.log(`✅ Video+policy analysis succeeded with model: ${result.modelUsed}`);

    return {
      success: true,
      data: { analysis },
      usage,
      modelUsed: result.modelUsed,
    };
  } catch (error: unknown) {
    console.error("❌ Enhanced analysis error:", error);

    return {
      success: false,
      message: sanitizeGeminiError(error),
    };
  }
}
