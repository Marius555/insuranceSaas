"use server";

import { adminAction } from './adminOrClient';
import { DATABASE_ID, COLLECTION_IDS } from '@/lib/env';
import type { UserDocument } from '@/lib/types/appwrite';

/**
 * Get UserDocument from database by user ID
 * Returns null if document doesn't exist (user needs onboarding)
 */
export async function getUserDocument(userId: string): Promise<UserDocument | null> {
  try {
    const { databases } = await adminAction();

    const user = await databases.getDocument<UserDocument>(
      DATABASE_ID,
      COLLECTION_IDS.USERS,
      userId
    );

    return user;
  } catch (error: any) {
    // Document doesn't exist - user needs onboarding
    if (error.code === 404) {
      return null;
    }

    console.error('Failed to get user document:', error);
    return null;
  }
}
