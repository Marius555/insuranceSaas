"use server";

import { updateUserSettings, UpdateUserSettingsInput, UpdateUserSettingsResult } from '@/appwrite/updateUserSettings';
import { clientAction } from '@/appwrite/adminOrClient';
import { isAppwriteClient } from '@/lib/types/appwrite';

/**
 * Submit user settings update from form data
 * Gets the current user session and updates user document
 *
 * @param input - Settings data to update
 * @returns Result indicating success or failure
 */
export async function submitUserSettingsAction(
  input: UpdateUserSettingsInput
): Promise<UpdateUserSettingsResult> {
  try {
    const result = await clientAction();

    if (!isAppwriteClient(result)) {
      return { success: false, message: 'You must be logged in to update settings' };
    }

    const user = await result.account.get();

    return await updateUserSettings(user.$id, input);
  } catch (error: any) {
    console.error('Failed to submit settings update:', error);
    return {
      success: false,
      message: error.message || 'Failed to update settings',
    };
  }
}
