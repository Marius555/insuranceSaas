/**
 * Error Sanitization for Gemini API
 * Converts API errors to user-friendly messages without exposing sensitive information
 *
 * Pattern from appwrite/createUser.ts
 */

/**
 * Sanitize Gemini API error messages
 * Never expose API keys or internal details to users
 *
 * @param error - Unknown error from try/catch
 * @returns User-friendly error message
 */
export function sanitizeGeminiError(error: unknown): string {
  // Check for rate limiting first (handles both 429 and 503)
  if (isRateLimitError(error)) {
    return 'AI models are currently at capacity. Please wait and try again.';
  }

  // Type check for Error instance
  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    // API key errors
    if (message.includes('api_key_invalid') || message.includes('invalid api key')) {
      return 'AI service configuration error. Please contact support.';
    }

    // File size errors
    if (message.includes('file_too_large') || message.includes('too large')) {
      return 'File size exceeds maximum allowed (20MB).';
    }

    // Authentication errors
    if (message.includes('401') || message.includes('unauthorized')) {
      return 'Authentication failed. Please check your API configuration.';
    }

    // Network errors
    if (message.includes('network') || message.includes('fetch failed')) {
      return 'Network error. Please check your connection and try again.';
    }

    // Content safety errors
    if (message.includes('safety') || message.includes('blocked')) {
      return 'Content was blocked by safety filters. Please try different input.';
    }

    // Generic Gemini error with message (sanitized)
    // Only return generic message to avoid leaking details
    if (message.includes('gemini') || message.includes('google')) {
      return 'AI service error. Please try again.';
    }
  }

  // Default fallback for unknown errors
  return 'An unexpected error occurred. Please try again.';
}

/**
 * Checks if an error is a rate limit error (429 or 503)
 * Detects both explicit rate limits and service overload errors
 *
 * @param error - The error to check
 * @returns true if error is rate-limit related
 */
export function isRateLimitError(error: unknown): boolean {
  if (!error) return false;

  const errorStr = JSON.stringify(error).toLowerCase();

  // Check for explicit rate limit indicators
  if (errorStr.includes('rate_limit') ||
      errorStr.includes('quota') ||
      errorStr.includes('429')) {
    return true;
  }

  // Check for 503 overload indicators
  if (errorStr.includes('503') ||
      errorStr.includes('overloaded') ||
      errorStr.includes('unavailable')) {
    return true;
  }

  // Check structured error format
  if (typeof error === 'object' && error !== null) {
    const err = error as any;

    // Check error.code or error.error.code
    const code = err.code || err.error?.code || err.status;
    if (code === 503 || code === 429 || code === '503' || code === '429') {
      return true;
    }

    // Check error.error.status
    if (err.error?.status === 'UNAVAILABLE' || err.error?.status === 'RESOURCE_EXHAUSTED') {
      return true;
    }
  }

  return false;
}
