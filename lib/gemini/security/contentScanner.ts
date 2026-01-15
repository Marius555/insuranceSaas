"use server";

import { extractPDFText } from "./pdfTextExtractor";
import { extractImageText, extractMultipleImagesText } from "./imageOCR";
import type {
  SecurityScanResult,
  InjectionPattern,
  ImageMimeType,
} from "../types";

/**
 * Injection patterns to detect prompt injection attempts
 * Balanced approach - high severity auto-flags, medium warns, low logs
 */
function getInjectionPatterns(): InjectionPattern[] {
  return [
    // High severity - Clear instruction override attempts
    {
      pattern: /(ignore|disregard|override|forget).*(previous|all|these|earlier).*(instructions?|prompts?|rules?|directives?)/i,
      severity: 'high',
      category: 'instruction_override',
    },
    {
      pattern: /new\s+(instructions?|rules?|directives?):\s*/i,
      severity: 'high',
      category: 'instruction_override',
    },

    // Medium severity - System prompt manipulation
    {
      pattern: /(system|assistant|user|ai):\s*[^\n]{15,}/i,
      severity: 'medium',
      category: 'system_prompt',
    },
    {
      pattern: /---\s*(END|START|SYSTEM|ASSISTANT|USER)\s*---/i,
      severity: 'medium',
      category: 'system_prompt',
    },
    {
      pattern: /<\/(prompt|system|instruction)>/i,
      severity: 'medium',
      category: 'system_prompt',
    },

    // Low severity - Suspicious but potentially legitimate
    {
      pattern: /(you are now|act as|pretend to be|assume\s+the\s+role)/i,
      severity: 'low',
      category: 'suspicious_keywords',
    },
    {
      pattern: /(jailbreak|bypass|circumvent).*(filter|safety|restriction)/i,
      severity: 'low',
      category: 'suspicious_keywords',
    },
  ];
}

/**
 * Calculate risk level based on detected patterns
 */
function calculateRiskLevel(
  detectedPatterns: Array<{ category: string; severity: string }>
): 'low' | 'medium' | 'high' {
  const hasCritical = detectedPatterns.some(p => p.severity === 'high');
  const mediumCount = detectedPatterns.filter(p => p.severity === 'medium').length;

  if (hasCritical || mediumCount >= 2) {
    return 'high';
  }

  if (mediumCount >= 1) {
    return 'medium';
  }

  return 'low';
}

/**
 * Generate human-readable reasoning for security scan
 */
function generateReasoning(
  detectedPatterns: Array<{ category: string; severity: string }>
): string {
  if (detectedPatterns.length === 0) {
    return "No suspicious patterns detected. Content appears safe.";
  }

  const highCount = detectedPatterns.filter(p => p.severity === 'high').length;
  const mediumCount = detectedPatterns.filter(p => p.severity === 'medium').length;
  const lowCount = detectedPatterns.filter(p => p.severity === 'low').length;

  const parts: string[] = [];

  if (highCount > 0) {
    parts.push(`${highCount} high-severity pattern(s) detected (instruction override attempts)`);
  }

  if (mediumCount > 0) {
    parts.push(`${mediumCount} medium-severity pattern(s) detected (system prompt manipulation)`);
  }

  if (lowCount > 0) {
    parts.push(`${lowCount} low-severity pattern(s) detected (suspicious keywords)`);
  }

  return parts.join(". ") + ". Manual review recommended for high/medium risk content.";
}

/**
 * Scan text content for injection patterns
 */
export async function scanTextForInjection(text: string): Promise<SecurityScanResult> {
  const patterns = getInjectionPatterns();
  const detectedPatterns: Array<{ category: string; severity: string }> = [];
  const suspiciousPatterns: string[] = [];

  for (const pattern of patterns) {
    if (pattern.pattern.test(text)) {
      detectedPatterns.push({
        category: pattern.category,
        severity: pattern.severity,
      });

      // Add human-readable description
      const categoryLabels = {
        instruction_override: 'Instruction Override',
        system_prompt: 'System Prompt Manipulation',
        suspicious_keywords: 'Suspicious Keywords',
      };

      suspiciousPatterns.push(`${categoryLabels[pattern.category]} (${pattern.severity})`);
    }
  }

  const isSuspicious = detectedPatterns.length > 0;
  const riskLevel = isSuspicious
    ? calculateRiskLevel(detectedPatterns)
    : 'low';

  return {
    isSuspicious,
    suspiciousPatterns,
    riskLevel,
    reasoning: generateReasoning(detectedPatterns),
  };
}

/**
 * Scan PDF for injection patterns
 */
export async function scanPDFForInjection(
  pdfBase64: string
): Promise<SecurityScanResult> {
  try {
    // Extract text from PDF
    const text = await extractPDFText(pdfBase64);

    if (!text || text.trim().length === 0) {
      // Empty or failed extraction - treat as non-suspicious
      return {
        isSuspicious: false,
        suspiciousPatterns: [],
        riskLevel: 'low',
        reasoning: "No text extracted from PDF (empty document or extraction failed). Proceeding with caution.",
      };
    }

    // Scan extracted text
    return await scanTextForInjection(text);
  } catch (error) {
    console.error("❌ PDF scanning error:", error);

    // On error, return non-suspicious (balanced approach)
    // Better to allow suspicious content through than block legitimate PDFs
    return {
      isSuspicious: false,
      suspiciousPatterns: [],
      riskLevel: 'low',
      reasoning: "PDF scanning failed. Content not validated.",
    };
  }
}

/**
 * Scan single image for injection patterns
 */
export async function scanImageForInjection(
  imageBase64: string,
  mimeType: ImageMimeType
): Promise<SecurityScanResult> {
  try {
    // Extract text via OCR
    const text = await extractImageText(imageBase64, mimeType);

    if (!text || text.trim().length === 0) {
      // No text in image - safe
      return {
        isSuspicious: false,
        suspiciousPatterns: [],
        riskLevel: 'low',
        reasoning: "No text detected in image. Content appears safe.",
      };
    }

    // Scan extracted text
    return await scanTextForInjection(text);
  } catch (error) {
    console.error("❌ Image scanning error:", error);

    // On error, return non-suspicious (balanced approach)
    return {
      isSuspicious: false,
      suspiciousPatterns: [],
      riskLevel: 'low',
      reasoning: "Image scanning failed. Content not validated.",
    };
  }
}

/**
 * Scan multiple images for injection patterns
 * Returns combined result from all images
 */
export async function scanMultipleImagesForInjection(
  images: Array<{ base64: string; mimeType: ImageMimeType }>
): Promise<SecurityScanResult> {
  try {
    // Extract text from all images
    const extractedTexts = await extractMultipleImagesText(images);

    // Combine all text
    const combinedText = extractedTexts
      .filter(text => text && text.trim().length > 0)
      .join("\n\n");

    if (!combinedText || combinedText.trim().length === 0) {
      // No text in any image - safe
      return {
        isSuspicious: false,
        suspiciousPatterns: [],
        riskLevel: 'low',
        reasoning: `Scanned ${images.length} image(s). No text detected. Content appears safe.`,
      };
    }

    // Scan combined text
    const result = await scanTextForInjection(combinedText);

    // Add image count to reasoning
    if (result.isSuspicious) {
      result.reasoning = `Scanned ${images.length} image(s). ${result.reasoning}`;
    }

    return result;
  } catch (error) {
    console.error("❌ Multiple image scanning error:", error);

    // On error, return non-suspicious (balanced approach)
    return {
      isSuspicious: false,
      suspiciousPatterns: [],
      riskLevel: 'low',
      reasoning: `Image scanning failed for ${images.length} image(s). Content not validated.`,
    };
  }
}

/**
 * Scan media (images or video) for injection patterns
 * Note: Video scanning is skipped (too expensive to OCR every frame)
 * Relies on response validation instead
 */
export async function scanMediaForInjection(
  mediaType: 'image' | 'video',
  images?: Array<{ base64: string; mimeType: ImageMimeType }>
): Promise<SecurityScanResult> {
  if (mediaType === 'video') {
    // Skip video scanning - too expensive
    // Rely on response validation and prompt hardening
    return {
      isSuspicious: false,
      suspiciousPatterns: [],
      riskLevel: 'low',
      reasoning: "Video content not scanned (OCR too expensive). Relying on response validation.",
    };
  }

  if (!images || images.length === 0) {
    return {
      isSuspicious: false,
      suspiciousPatterns: [],
      riskLevel: 'low',
      reasoning: "No images provided for scanning.",
    };
  }

  return scanMultipleImagesForInjection(images);
}
