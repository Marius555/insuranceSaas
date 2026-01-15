"use client";

const STORAGE_KEY = 'vehicleclaim_pending_analysis';
const MAX_AGE_MS = 60 * 60 * 1000; // 1 hour
const MAX_STORAGE_SIZE = 8 * 1024 * 1024; // 8MB safety margin

export interface PendingAnalysisFile {
  name: string;
  type: string;
  size: number;
  base64: string; // Full data URL
  lastModified: number;
}

export interface PendingAnalysis {
  files: PendingAnalysisFile[];
  mediaType: 'image' | 'video';
  timestamp: number;
}

/**
 * Converts a File object to base64 data URL
 */
async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Saves uploaded files to localStorage for persistence through OAuth redirect
 * @throws Error if files exceed storage size limit
 */
export async function savePendingAnalysis(
  files: File[],
  mediaType: 'image' | 'video'
): Promise<void> {
  try {
    // Check total file size before converting to base64
    const totalSize = files.reduce((sum, file) => sum + file.size, 0);

    if (totalSize > MAX_STORAGE_SIZE) {
      throw new Error(`Files too large to save (${(totalSize / 1024 / 1024).toFixed(2)}MB). Maximum ${MAX_STORAGE_SIZE / 1024 / 1024}MB allowed.`);
    }

    const fileData = await Promise.all(
      files.map(async (file) => {
        const base64 = await fileToBase64(file);
        return {
          name: file.name,
          type: file.type,
          size: file.size,
          base64,
          lastModified: file.lastModified,
        };
      })
    );

    const data: PendingAnalysis = {
      files: fileData,
      mediaType,
      timestamp: Date.now(),
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Failed to save pending analysis:', error);
    throw error;
  }
}

/**
 * Retrieves pending analysis from localStorage
 * Returns null if data doesn't exist or is stale (>1 hour old)
 */
export function getPendingAnalysis(): PendingAnalysis | null {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return null;

    const parsed: PendingAnalysis = JSON.parse(data);

    // Check if data is stale
    if (Date.now() - parsed.timestamp > MAX_AGE_MS) {
      clearPendingAnalysis();
      return null;
    }

    return parsed;
  } catch (error) {
    console.error('Failed to get pending analysis:', error);
    return null;
  }
}

/**
 * Removes pending analysis from localStorage
 */
export function clearPendingAnalysis(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear pending analysis:', error);
  }
}

/**
 * Checks if there is pending analysis data in localStorage
 */
export function hasPendingAnalysis(): boolean {
  return getPendingAnalysis() !== null;
}

/**
 * Reconstructs File objects from base64 data stored in localStorage
 */
export function reconstructFilesFromPending(
  pending: PendingAnalysis
): File[] {
  return pending.files.map(fileData => {
    // Convert base64 back to File object
    const byteString = atob(fileData.base64.split(',')[1]);
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    const blob = new Blob([ab], { type: fileData.type });
    return new File([blob], fileData.name, {
      type: fileData.type,
      lastModified: fileData.lastModified,
    });
  });
}
