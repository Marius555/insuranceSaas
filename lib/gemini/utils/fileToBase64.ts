import fs from "fs/promises";
import { FILE_LIMITS } from "../constants";
import type { Base64File, FileValidationResult } from "../types";

/**
 * Convert file to base64 for Gemini API
 * Server-side utility function (not a server action)
 *
 * @param filePath - Absolute path to file
 * @returns Base64 string, MIME type, and file size
 */
export async function fileToBase64(filePath: string): Promise<Base64File> {
  const buffer = await fs.readFile(filePath);
  const base64 = buffer.toString("base64");
  const size = buffer.length;

  // Determine MIME type from file extension
  const ext = filePath.split('.').pop()?.toLowerCase();
  const mimeType = getMimeType(ext || '');

  return { base64, mimeType, size };
}

/**
 * Validate file size against Gemini limits
 *
 * @param size - File size in bytes
 * @param maxSizeMB - Maximum size in MB (default: 20MB)
 * @returns Validation result
 */
export function validateFileSize(
  size: number,
  maxSizeMB: number = FILE_LIMITS.MAX_SIZE_MB
): FileValidationResult {
  const maxBytes = maxSizeMB * 1024 * 1024;

  if (size > maxBytes) {
    return {
      valid: false,
      error: `File size (${(size / 1024 / 1024).toFixed(2)}MB) exceeds maximum allowed (${maxSizeMB}MB)`,
    };
  }

  return { valid: true };
}

/**
 * Get MIME type from file extension
 */
function getMimeType(extension: string): string {
  const mimeTypes: Record<string, string> = {
    // Video
    mp4: "video/mp4",
    mov: "video/mov",
    avi: "video/avi",
    mpeg: "video/mpeg",
    // Audio
    mp3: "audio/mp3",
    wav: "audio/wav",
    aac: "audio/aac",
    ogg: "audio/ogg",
    // Image
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    gif: "image/gif",
    webp: "image/webp",
    // Document
    pdf: "application/pdf",
  };

  return mimeTypes[extension] || "application/octet-stream";
}
