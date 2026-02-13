"use server";

import { adminAction } from '@/appwrite/adminOrClient';
import { DATABASE_ID, COLLECTION_IDS } from '@/lib/env';
import { Query } from 'node-appwrite';
import type { NotificationDocument } from '@/lib/types/appwrite';

export interface GetNotificationsResult {
  success: boolean;
  notifications: NotificationDocument[];
  unreadCount: number;
  message?: string;
}

export async function getNotifications(userId: string): Promise<GetNotificationsResult> {
  try {
    const { databases } = await adminAction();

    // Fetch 20 most recent notifications
    const result = await databases.listDocuments<NotificationDocument>(
      DATABASE_ID,
      COLLECTION_IDS.NOTIFICATIONS,
      [
        Query.equal('user_id', userId),
        Query.orderDesc('$createdAt'),
        Query.limit(20),
      ]
    );

    // Count unread
    const unreadResult = await databases.listDocuments<NotificationDocument>(
      DATABASE_ID,
      COLLECTION_IDS.NOTIFICATIONS,
      [
        Query.equal('user_id', userId),
        Query.equal('is_read', false),
        Query.limit(1),
        Query.select(['$id']),
      ]
    );

    return {
      success: true,
      notifications: result.documents,
      unreadCount: unreadResult.total,
    };
  } catch (error: any) {
    console.error('Failed to get notifications:', error);
    return {
      success: false,
      notifications: [],
      unreadCount: 0,
      message: error.message || 'Failed to get notifications',
    };
  }
}
