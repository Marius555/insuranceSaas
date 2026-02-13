"use server";

import { adminAction } from '@/appwrite/adminOrClient';
import { DATABASE_ID, COLLECTION_IDS } from '@/lib/env';
import { revalidateTag } from 'next/cache';
import type { UserDocument } from '@/lib/types/appwrite';

export interface UpdateUserSettingsInput {
  phone?: string;
  email_notifications?: boolean;
  push_notifications?: boolean;
  language?: string;
  profile_visibility?: 'public' | 'private';
  data_sharing?: boolean;
  analytics_enabled?: boolean;
  activity_status?: boolean;
}

export interface UpdateUserSettingsResult {
  success: boolean;
  data?: UserDocument;
  message?: string;
}

/**
 * Update user settings in Appwrite
 *
 * @param userId - The user's document ID
 * @param input - Settings data to update
 * @returns Updated user document or error
 */
export async function updateUserSettings(
  userId: string,
  input: UpdateUserSettingsInput
): Promise<UpdateUserSettingsResult> {
  try {
    const { databases } = await adminAction();

    const updated = await databases.updateDocument<UserDocument>(
      DATABASE_ID,
      COLLECTION_IDS.USERS,
      userId,
      input
    );

    revalidateTag(`user-doc-${userId}`, { expire: 0 });

    return { success: true, data: updated };
  } catch (error: any) {
    console.error('Failed to update user settings:', error);
    return {
      success: false,
      message: error.message || 'Failed to update settings',
    };
  }
}
