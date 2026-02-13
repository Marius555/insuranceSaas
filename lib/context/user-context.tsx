"use client";

import { createContext, useContext, ReactNode } from "react";

export interface UserContextData {
  userId: string;
  email: string;
  role: 'user' | 'admin' | 'insurance_adjuster';
  phone: string;
  emailNotifications: boolean;
  pushNotifications: boolean;
  language: string;
  profileVisibility: 'public' | 'private';
  dataSharing: boolean;
  analyticsEnabled: boolean;
  activityStatus: boolean;
  pricingPlan: 'free' | 'pro' | 'max';
  evaluationTimes: number;
  evaluationLimit: number;
}

const UserContext = createContext<UserContextData | null>(null);

interface UserProviderProps {
  children: ReactNode;
  userData: UserContextData;
}

/**
 * Provider component that wraps the dashboard and provides user data to all children.
 * User data is fetched server-side and passed down to avoid client-side fetching.
 */
export function UserProvider({ children, userData }: UserProviderProps) {
  return (
    <UserContext.Provider value={userData}>
      {children}
    </UserContext.Provider>
  );
}

/**
 * Hook to access user data from the context.
 * Must be used within a UserProvider.
 *
 * @example
 * const { email, role, userId } = useUser();
 */
export function useUser(): UserContextData {
  const context = useContext(UserContext);

  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }

  return context;
}
