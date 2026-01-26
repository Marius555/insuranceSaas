"use client";

import { createContext, useContext, useState, ReactNode, useCallback } from "react";
import { type PolicyInfo } from "@/appwrite/getUserPolicies";

interface PolicyContextData {
  policies: PolicyInfo[];
  isLoading: boolean;
  refreshPolicies: () => Promise<void>;
}

const PolicyContext = createContext<PolicyContextData | null>(null);

interface PolicyProviderProps {
  children: ReactNode;
  initialPolicies: PolicyInfo[];
}

/**
 * Provider component that wraps the dashboard and provides policy data to all children.
 * Policies are fetched server-side and passed down to avoid repeated client-side fetching.
 *
 * Use `refreshPolicies()` after uploading a new policy to invalidate the cache.
 */
export function PolicyProvider({ children, initialPolicies }: PolicyProviderProps) {
  const [policies, setPolicies] = useState<PolicyInfo[]>(initialPolicies);
  const [isLoading, setIsLoading] = useState(false);

  const refreshPolicies = useCallback(async () => {
    // Import dynamically to avoid server/client issues
    const { getUserPolicies } = await import("@/appwrite/getUserPolicies");
    setIsLoading(true);
    const result = await getUserPolicies();
    if (result.success && result.policies) {
      setPolicies(result.policies);
    }
    setIsLoading(false);
  }, []);

  return (
    <PolicyContext.Provider value={{ policies, isLoading, refreshPolicies }}>
      {children}
    </PolicyContext.Provider>
  );
}

/**
 * Hook to access policy data from the context.
 * Must be used within a PolicyProvider.
 *
 * @example
 * const { policies, isLoading, refreshPolicies } = usePolicies();
 *
 * // After uploading a new policy:
 * await refreshPolicies();
 */
export function usePolicies(): PolicyContextData {
  const context = useContext(PolicyContext);

  if (!context) {
    throw new Error("usePolicies must be used within a PolicyProvider");
  }

  return context;
}
