/**
 * Timeout utility for wrapping async operations
 * Helps prevent ECONNRESET errors by failing gracefully when operations take too long
 */

/**
 * Wrap an async operation with a timeout
 *
 * @param promise - The promise to wrap
 * @param timeoutMs - Maximum time to wait in milliseconds
 * @param errorMessage - Custom error message for timeout
 * @returns The result of the promise, or throws if timeout exceeded
 *
 * @example
 * const result = await withTimeout(
 *   fetchData(),
 *   30000,
 *   'Data fetch timed out'
 * );
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  errorMessage: string = 'Operation timed out'
): Promise<T> {
  let timeoutId: NodeJS.Timeout;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(errorMessage));
    }, timeoutMs);
  });

  try {
    const result = await Promise.race([promise, timeoutPromise]);
    clearTimeout(timeoutId!);
    return result;
  } catch (error) {
    clearTimeout(timeoutId!);
    throw error;
  }
}

/**
 * Check if an error is a timeout error
 */
export function isTimeoutError(error: unknown): boolean {
  return error instanceof Error && error.message.includes('timed out');
}
