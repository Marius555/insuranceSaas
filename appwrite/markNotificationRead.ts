"use server";

import { adminAction } from '@/appwrite/adminOrClient';
import { DATABASE_ID, COLLECTION_IDS } from '@/lib/env';
import { revalidateTag } from 'next/cache';
import type { NotificationDocument } from '@/lib/types/appwrite';

export async function markNotificationRead(notificationId: string): Promise<{ success: boolean; message?: string }> {
  try {
    const { databases } = await adminAction();

    const doc = await databases.updateDocument<NotificationDocument>(
      DATABASE_ID,
      COLLECTION_IDS.NOTIFICATIONS,
      notificationId,
      { is_read: true }
    );

    revalidateTag(`notifications-${doc.user_id}`, { expire: 0 });

    return { success: true };
  } catch (error: any) {
    console.error('Failed to mark notification as read:', error);
    return { success: false, message: error.message || 'Failed to mark notification as read' };
  }
}
