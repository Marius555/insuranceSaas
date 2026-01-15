/**
 * In-Memory Rate Limit Storage
 * Manages rate limit windows for all models using an in-memory Map
 */

import type { RateLimitWindow } from './types';

/**
 * Global in-memory cache for rate limit tracking
 * Maps model name to its rate limit window
 */
const rateLimitCache = new Map<string, RateLimitWindow>();

/**
 * Get or create a rate limit window for a model
 * @param modelName - Name of the Gemini model
 * @returns Rate limit window for the model
 */
export function getOrCreateWindow(modelName: string): RateLimitWindow {
  let window = rateLimitCache.get(modelName);

  if (!window) {
    window = {
      modelName,
      requestTimestamps: [],
      tokenUsageLog: [],
      dailyRequests: 0,
      dailyResetTime: getMidnightUtc(),
    };
    rateLimitCache.set(modelName, window);
  }

  return window;
}

/**
 * Record a request timestamp for RPM tracking
 * @param modelName - Name of the model
 */
export async function recordRequest(modelName: string): Promise<void> {
  const window = getOrCreateWindow(modelName);
  window.requestTimestamps.push(Date.now());
  window.dailyRequests++;
}

/**
 * Record token usage for TPM tracking
 * @param modelName - Name of the model
 * @param tokens - Number of tokens consumed
 */
export async function recordTokenUsage(
  modelName: string,
  tokens: number
): Promise<void> {
  const window = getOrCreateWindow(modelName);
  window.tokenUsageLog.push({
    timestamp: Date.now(),
    tokens,
  });
}

/**
 * Clean up expired timestamps and token logs from all windows
 * Removes entries older than 1 hour to prevent memory leaks
 */
export function cleanupExpiredWindows(): void {
  const oneHourAgo = Date.now() - 3600_000;

  for (const [modelName, window] of rateLimitCache.entries()) {
    // Remove old request timestamps
    window.requestTimestamps = window.requestTimestamps.filter(
      (ts) => ts > oneHourAgo
    );

    // Remove old token usage logs
    window.tokenUsageLog = window.tokenUsageLog.filter(
      (entry) => entry.timestamp > oneHourAgo
    );

    // Remove window entirely if empty and old
    if (
      window.requestTimestamps.length === 0 &&
      window.tokenUsageLog.length === 0
    ) {
      rateLimitCache.delete(modelName);
    }
  }
}

/**
 * Get midnight UTC timestamp for today
 * Used for daily counter resets
 */
function getMidnightUtc(): number {
  const now = new Date();
  return Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
}

/**
 * Auto-cleanup: Run cleanup every 5 minutes
 * Prevents memory buildup from old timestamps
 */
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupExpiredWindows, 5 * 60 * 1000);
}

/**
 * Export cache for testing purposes
 * @internal
 */
export const __rateLimitCacheForTesting = rateLimitCache;
