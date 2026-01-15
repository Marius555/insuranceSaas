"use server";

import { createHash } from "crypto";
import type { AuditLogEntry } from "../types";

/**
 * Generate SHA-256 hash of file content
 * Used for audit logging to track files without storing content
 */
export async function hashFileContent(base64Content: string): Promise<string> {
  try {
    const hash = createHash('sha256');
    hash.update(base64Content);
    return hash.digest('hex');
  } catch (error) {
    console.error("❌ Hash generation error:", error);
    return "hash_error";
  }
}

/**
 * Generate hashes for multiple files
 */
export async function hashMultipleFiles(
  base64Files: string[]
): Promise<string[]> {
  return Promise.all(base64Files.map(file => hashFileContent(file)));
}

/**
 * Log analysis request for audit trail
 * Phase 1: Console-based logging
 * Future: Integrate with Appwrite database for persistence
 */
export async function logAnalysisRequest(
  entry: AuditLogEntry
): Promise<void> {
  try {
    // Format for console output
    const timestamp = entry.timestamp || new Date().toISOString();
    const action = entry.action.toUpperCase().padEnd(20);
    const result = entry.result.toUpperCase().padEnd(10);
    const tokens = entry.tokenUsage ? `${entry.tokenUsage} tokens` : 'N/A';

    // Log header
    console.log('\n' + '='.repeat(80));
    console.log(`[AUDIT] ${timestamp}`);
    console.log('='.repeat(80));

    // Log details
    console.log(`Action:        ${action}`);
    console.log(`Result:        ${result}`);
    console.log(`Token Usage:   ${tokens}`);

    // Log file hashes
    if (entry.fileHashes.length > 0) {
      console.log(`\nFile Hashes (${entry.fileHashes.length}):`);
      entry.fileHashes.forEach((hash, index) => {
        console.log(`  ${index + 1}. ${hash.substring(0, 16)}...`);
      });
    }

    // Log security flags (if any)
    if (entry.securityFlags.length > 0) {
      console.log(`\n⚠️  Security Flags (${entry.securityFlags.length}):`);
      entry.securityFlags.forEach(flag => {
        console.log(`  - ${flag}`);
      });
    }

    console.log('='.repeat(80) + '\n');
  } catch (error) {
    console.error("❌ Audit logging error:", error);
    // Don't throw - logging failures shouldn't block operations
  }
}

/**
 * Create audit entry for video analysis
 */
export async function createVideoAnalysisAuditEntry(
  videoBase64: string,
  result: 'success' | 'error' | 'flagged',
  securityFlags: string[],
  tokenUsage?: number
): Promise<AuditLogEntry> {
  const fileHashes = [await hashFileContent(videoBase64)];

  return {
    timestamp: new Date().toISOString(),
    action: 'analyze_video',
    fileHashes,
    result,
    securityFlags,
    tokenUsage,
  };
}

/**
 * Create audit entry for image analysis
 */
export async function createImageAnalysisAuditEntry(
  imageBase64Array: string[],
  result: 'success' | 'error' | 'flagged',
  securityFlags: string[],
  tokenUsage?: number
): Promise<AuditLogEntry> {
  const fileHashes = await hashMultipleFiles(imageBase64Array);

  return {
    timestamp: new Date().toISOString(),
    action: 'analyze_image',
    fileHashes,
    result,
    securityFlags,
    tokenUsage,
  };
}

/**
 * Create audit entry for policy analysis (video/image + PDF)
 */
export async function createPolicyAnalysisAuditEntry(
  mediaBase64Array: string[],
  policyBase64: string,
  result: 'success' | 'error' | 'flagged',
  securityFlags: string[],
  tokenUsage?: number
): Promise<AuditLogEntry> {
  const fileHashes = await hashMultipleFiles([...mediaBase64Array, policyBase64]);

  return {
    timestamp: new Date().toISOString(),
    action: 'analyze_policy',
    fileHashes,
    result,
    securityFlags,
    tokenUsage,
  };
}

/**
 * Get audit logs (placeholder for future database integration)
 * Currently returns empty array since we're only logging to console
 */
export async function getAuditLogs(
  filters?: {
    action?: string;
    result?: string;
    fromDate?: Date;
    toDate?: Date;
  }
): Promise<AuditLogEntry[]> {
  // TODO: Implement database query when integrated with Appwrite
  console.warn("getAuditLogs not yet implemented - audit logs are console-only in Phase 1");
  return [];
}
