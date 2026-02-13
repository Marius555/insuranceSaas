"use server";

import { adminAction } from '@/appwrite/adminOrClient';
import { DATABASE_ID, COLLECTION_IDS } from '@/lib/env';
import { revalidateTag } from 'next/cache';
import { Query } from 'node-appwrite';
import type { NotificationDocument } from '@/lib/types/appwrite';

export async function markAllNotificationsRead(userId: string): Promise<{ success: boolean; message?: string }> {
  try {
    const { databases } = await adminAction();

    // Fetch all unread notifications for this user
    const unread = await databases.listDocuments<NotificationDocument>(
      DATABASE_ID,
      COLLECTION_IDS.NOTIFICATIONS,
      [
        Query.equal('user_id', userId),
        Query.equal('is_read', false),
        Query.limit(100),
        Query.select(['$id']),
      ]
    );

    // Mark each as read
    await Promise.all(
      unread.documents.map((doc) =>
        databases.updateDocument(
          DATABASE_ID,
          COLLECTION_IDS.NOTIFICATIONS,
          doc.$id,
          { is_read: true }
        )
      )
    );

    revalidateTag(`notifications-${userId}`, { expire: 0 });

    return { success: true };
  } catch (error: any) {
    console.error('Failed to mark all notifications as read:', error);
    return { success: false, message: error.message || 'Failed to mark all notifications as read' };
  }
}
