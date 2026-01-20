"use server";

import { getGeminiClient } from "../client";
import { GEMINI_MODELS } from "../constants";
import { sanitizeGeminiError } from "../utils/sanitizeError";
import type { ImageMimeType } from "../types";

/**
 * Extract visible text from images using Gemini vision OCR
 * Used for security scanning to detect prompt injection attempts in images
 */
export async function extractImageText(
  imageBase64: string,
  mimeType: ImageMimeType
): Promise<string> {
  try {
    const ai = getGeminiClient();

    const prompt = `Extract all visible text from this image. Return only the text you can read, without any additional commentary. If there is no text, return "NO_TEXT_FOUND".`;

    const response = await ai.models.generateContent({
      model: GEMINI_MODELS.FLASH_LITE,
      contents: [
        {
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType,
                data: imageBase64,
              },
            },
          ],
        },
      ],
      config: {
        temperature: 0.0, // Very deterministic for OCR
        maxOutputTokens: 2048, // Enough for most text in images
      },
    });

    const text = (response.text ?? '').trim();

    // Return empty string if no text found
    if (text === "NO_TEXT_FOUND") {
      return "";
    }

    return text;
  } catch (error: unknown) {
    console.error("❌ Image OCR error:", error);
    // Return empty string on error - security scanning will skip
    // Better to allow suspicious content through than block legitimate images
    return "";
  }
}

/**
 * Extract text from image with error handling
 * Returns both text and success status
 */
export async function extractImageTextSafe(
  imageBase64: string,
  mimeType: ImageMimeType
): Promise<{ text: string; success: boolean; error?: string }> {
  try {
    const text = await extractImageText(imageBase64, mimeType);
    return { text, success: true };
  } catch (error: unknown) {
    return {
      text: "",
      success: false,
      error: sanitizeGeminiError(error),
    };
  }
}

/**
 * Extract text from multiple images
 * Returns array of extracted texts (empty string if no text or error)
 */
export async function extractMultipleImagesText(
  images: Array<{ base64: string; mimeType: ImageMimeType }>
): Promise<string[]> {
  const extractionPromises = images.map(img =>
    extractImageText(img.base64, img.mimeType)
  );

  try {
    return await Promise.all(extractionPromises);
  } catch (error) {
    console.error("❌ Multiple image OCR error:", error);
    // Return empty strings for all images on error
    return new Array(images.length).fill("");
  }
}
