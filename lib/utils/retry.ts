/**
 * Retry utility with exponential backoff for transient failures.
 * Handles 502/503/504 gateway errors and timeouts common with Appwrite.
 */

/**
 * Check if an error is retryable (transient gateway/network error).
 */
export function isRetryableError(error: unknown): boolean {
  if (typeof error === 'object' && error !== null && 'code' in error) {
    const code = (error as { code: number }).code;
    return code === 502 || code === 503 || code === 504;
  }

  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    return (
      msg.includes('bad gateway') ||
      msg.includes('service unavailable') ||
      msg.includes('gateway timeout') ||
      msg.includes('timed out') ||
      msg.includes('econnreset') ||
      msg.includes('fetch failed')
    );
  }

  return false;
}

/**
 * Retry an async function with exponential backoff.
 *
 * @param fn - The async function to retry
 * @param maxAttempts - Maximum number of attempts (default: 3)
 * @param baseDelayMs - Base delay in milliseconds (default: 100)
 * @returns The result of the function
 *
 * @example
 * const docs = await withRetry(() => databases.listDocuments(db, col, queries));
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  baseDelayMs: number = 100
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt < maxAttempts) {
        // Exponential backoff: 100ms, 200ms, 400ms
        await new Promise(r => setTimeout(r, baseDelayMs * Math.pow(2, attempt - 1)));
      }
    }
  }
  throw lastError;
}
