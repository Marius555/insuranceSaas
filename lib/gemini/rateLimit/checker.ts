/**
 * Rate Limit Checker
 * Validates requests against RPM, TPM, and RPD limits using sliding windows
 */

import type { ModelLimits } from './types';
import { getOrCreateWindow } from './storage';

/**
 * Check if a model can accept a new request (RPM check)
 * Uses sliding window algorithm to count requests in last 60 seconds
 *
 * @param modelName - Name of the Gemini model
 * @param limits - Rate limit configuration for the model
 * @returns True if request is allowed, false if RPM limit exceeded
 */
export function canMakeRequest(
  modelName: string,
  limits: ModelLimits
): boolean {
  const window = getOrCreateWindow(modelName);
  const oneMinuteAgo = Date.now() - 60_000;

  // Remove expired timestamps (older than 1 minute)
  window.requestTimestamps = window.requestTimestamps.filter(
    (ts) => ts > oneMinuteAgo
  );

  // Check if adding this request would exceed RPM limit
  return window.requestTimestamps.length < limits.rpm;
}

/**
 * Check if a model can consume the estimated tokens (TPM check)
 * Uses sliding window algorithm to count tokens in last 60 seconds
 *
 * @param modelName - Name of the Gemini model
 * @param estimatedTokens - Estimated tokens for this request
 * @param limits - Rate limit configuration for the model
 * @returns True if tokens can be consumed, false if TPM limit exceeded
 */
export function canConsumeTokens(
  modelName: string,
  estimatedTokens: number,
  limits: ModelLimits
): boolean {
  const window = getOrCreateWindow(modelName);
  const oneMinuteAgo = Date.now() - 60_000;

  // Remove expired token logs (older than 1 minute)
  window.tokenUsageLog = window.tokenUsageLog.filter(
    (entry) => entry.timestamp > oneMinuteAgo
  );

  // Calculate current token usage in last minute
  const currentUsage = window.tokenUsageLog.reduce(
    (sum, entry) => sum + entry.tokens,
    0
  );

  // Check if adding estimated tokens would exceed TPM limit
  return currentUsage + estimatedTokens <= limits.tpm;
}

/**
 * Check if a model has capacity for daily requests (RPD check)
 * Resets counter at midnight UTC
 *
 * @param modelName - Name of the Gemini model
 * @param limits - Rate limit configuration for the model
 * @returns True if daily limit not exceeded, false otherwise
 */
export function checkDailyLimit(
  modelName: string,
  limits: ModelLimits
): boolean {
  const window = getOrCreateWindow(modelName);
  const nowUtc = Date.now();
  const midnightUtc = getMidnightUtc();

  // Reset daily counter if it's a new day
  if (window.dailyResetTime < midnightUtc) {
    window.dailyRequests = 0;
    window.dailyResetTime = midnightUtc;
  }

  // Check if adding this request would exceed RPD limit
  return window.dailyRequests < limits.rpd;
}

/**
 * Check all rate limits for a model
 * Combines RPM, TPM, and RPD checks
 *
 * @param modelName - Name of the Gemini model
 * @param estimatedTokens - Estimated tokens for this request
 * @param limits - Rate limit configuration for the model
 * @returns True if all limits allow the request, false otherwise
 */
export function checkAllLimits(
  modelName: string,
  estimatedTokens: number,
  limits: ModelLimits
): boolean {
  return (
    canMakeRequest(modelName, limits) &&
    canConsumeTokens(modelName, estimatedTokens, limits) &&
    checkDailyLimit(modelName, limits)
  );
}

/**
 * Get seconds until the next available request slot
 * Calculates the minimum wait time across all limit types
 *
 * @param modelName - Name of the Gemini model
 * @returns Seconds until retry (minimum 1 second)
 */
export function getSecondsUntilRetry(modelName: string): number {
  const window = getOrCreateWindow(modelName);
  const now = Date.now();

  // Calculate seconds until oldest RPM timestamp expires
  const oldestRequest =
    window.requestTimestamps.length > 0
      ? Math.min(...window.requestTimestamps)
      : now;
  const rpmRetry = Math.max(0, 60 - (now - oldestRequest) / 1000);

  // Calculate seconds until oldest TPM entry expires
  const oldestToken =
    window.tokenUsageLog.length > 0
      ? Math.min(...window.tokenUsageLog.map((e) => e.timestamp))
      : now;
  const tpmRetry = Math.max(0, 60 - (now - oldestToken) / 1000);

  // Return the minimum wait time (rounded up), at least 1 second
  return Math.max(1, Math.ceil(Math.min(rpmRetry, tpmRetry)));
}

/**
 * Get midnight UTC timestamp for today
 * Used for daily counter resets
 */
function getMidnightUtc(): number {
  const now = new Date();
  return Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
}
