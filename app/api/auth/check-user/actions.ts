"use server";

import { adminAction } from "@/appwrite/adminOrClient";
import { DATABASE_ID, COLLECTION_IDS } from "@/lib/env";
import type { UserDocument } from "@/lib/types/appwrite";

export async function checkUserStatus(userId: string) {
  try {
    const { databases } = await adminAction();

    const user = await databases.getDocument<UserDocument>(
      DATABASE_ID,
      COLLECTION_IDS.USERS,
      userId
    );

    return {
      exists: true,
      onboardingCompleted: user.onboarding_completed ?? false,
      userId,
    };
  } catch (error: unknown) {
    // 404 means user document doesn't exist yet (new user)
    if (error instanceof Error && 'code' in error && (error as { code: number }).code === 404) {
      return {
        exists: false,
        onboardingCompleted: false,
        userId,
      };
    }

    console.error("Check user status error:", error);
    return {
      exists: false,
      onboardingCompleted: false,
      userId,
    };
  }
}
