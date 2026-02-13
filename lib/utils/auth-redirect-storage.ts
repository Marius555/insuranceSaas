"use client";

const STORAGE_KEY = 'vehicleclaim_auth_redirect';
const FLOW_KEY = 'vehicleclaim_onboarding_flow';
const MAX_AGE_MS = 60 * 60 * 1000; // 1 hour

export type OnboardingFlow = 'user' | 'insurance';

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

/**
 * Saves the onboarding flow type to localStorage
 */
export function saveOnboardingFlow(flow: OnboardingFlow): void {
  try {
    localStorage.setItem(FLOW_KEY, flow);
  } catch (error) {
    console.error('Failed to save onboarding flow:', error);
  }
}

/**
 * Retrieves the onboarding flow type from localStorage
 */
export function getOnboardingFlow(): OnboardingFlow | null {
  try {
    const flow = localStorage.getItem(FLOW_KEY);
    if (flow === 'user' || flow === 'insurance') {
      return flow;
    }
    return null;
  } catch (error) {
    console.error('Failed to get onboarding flow:', error);
    return null;
  }
}

/**
 * Removes the onboarding flow type from localStorage
 */
export function clearOnboardingFlow(): void {
  try {
    localStorage.removeItem(FLOW_KEY);
  } catch (error) {
    console.error('Failed to clear onboarding flow:', error);
  }
}

// --- Plan selection persistence ---

const PLAN_KEY = 'vehicleclaim_plan_selection';

interface PlanSelection {
  plan: string;
  timestamp: number;
}

/**
 * Saves the selected plan slug to localStorage
 */
export function savePlanSelection(plan: string): void {
  try {
    const data: PlanSelection = { plan, timestamp: Date.now() };
    localStorage.setItem(PLAN_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Failed to save plan selection:', error);
  }
}

/**
 * Retrieves plan selection from localStorage
 * Returns null if data doesn't exist or is stale (>1 hour old)
 */
export function getPlanSelection(): string | null {
  try {
    const data = localStorage.getItem(PLAN_KEY);
    if (!data) return null;

    const parsed: PlanSelection = JSON.parse(data);

    if (Date.now() - parsed.timestamp > MAX_AGE_MS) {
      clearPlanSelection();
      return null;
    }

    return parsed.plan;
  } catch (error) {
    console.error('Failed to get plan selection:', error);
    return null;
  }
}

/**
 * Removes plan selection from localStorage
 */
export function clearPlanSelection(): void {
  try {
    localStorage.removeItem(PLAN_KEY);
  } catch (error) {
    console.error('Failed to clear plan selection:', error);
  }
}
