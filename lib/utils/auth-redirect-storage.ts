"use client";

const STORAGE_KEY = 'vehicleclaim_auth_redirect';
const MAX_AGE_MS = 60 * 60 * 1000; // 1 hour

export interface AuthRedirect {
  returnTo: string;
  timestamp: number;
}

/**
 * Saves the intended redirect path to localStorage
 */
export function saveAuthRedirect(returnTo: string): void {
  try {
    const data: AuthRedirect = {
      returnTo,
      timestamp: Date.now(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Failed to save auth redirect:', error);
  }
}

/**
 * Retrieves auth redirect from localStorage
 * Returns null if data doesn't exist or is stale (>1 hour old)
 */
export function getAuthRedirect(): string | null {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return null;

    const parsed: AuthRedirect = JSON.parse(data);

    // Check if data is stale
    if (Date.now() - parsed.timestamp > MAX_AGE_MS) {
      clearAuthRedirect();
      return null;
    }

    return parsed.returnTo;
  } catch (error) {
    console.error('Failed to get auth redirect:', error);
    return null;
  }
}

/**
 * Removes auth redirect from localStorage
 */
export function clearAuthRedirect(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear auth redirect:', error);
  }
}
