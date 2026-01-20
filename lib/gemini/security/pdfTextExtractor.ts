"use server";

import { getGeminiClient } from "../client";
import { GEMINI_MODELS } from "../constants";
import { sanitizeGeminiError } from "../utils/sanitizeError";

/**
 * Extract text from PDF using Gemini vision/document processing
 * Used for security scanning to detect prompt injection attempts
 */
export async function extractPDFText(pdfBase64: string): Promise<string> {
  try {
    const ai = getGeminiClient();

    const prompt = `Extract all text from this PDF document. Return only the extracted text without any additional commentary or formatting.`;

    const response = await ai.models.generateContent({
      model: GEMINI_MODELS.FLASH_LITE,
      contents: [
        {
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: 'application/pdf',
                data: pdfBase64,
              },
            },
          ],
        },
      ],
      config: {
        temperature: 0.0, // Very deterministic for text extraction
        maxOutputTokens: 4096, // Enough for most PDFs
      },
    });

    return (response.text ?? '').trim();
  } catch (error: unknown) {
    console.error("❌ PDF text extraction error:", error);
    // Return empty string on error - security scanning will skip
    // Better to allow suspicious content through than block legitimate PDFs
    return "";
  }
}

/**
 * Extract text from PDF with error handling
 * Returns both text and success status
 */
export async function extractPDFTextSafe(
  pdfBase64: string
): Promise<{ text: string; success: boolean; error?: string }> {
  try {
    const text = await extractPDFText(pdfBase64);
    return { text, success: true };
  } catch (error: unknown) {
    return {
      text: "",
      success: false,
      error: sanitizeGeminiError(error),
    };
  }
}
