"use server";

import { adminAction } from '@/appwrite/adminOrClient';
import { DATABASE_ID, COLLECTION_IDS } from '@/lib/env';
import { Query } from 'node-appwrite';
import type { NotificationDocument } from '@/lib/types/appwrite';

export type NotificationFilter = 'all' | 'unread' | 'read';

export interface GetPaginatedNotificationsResult {
  success: boolean;
  notifications: NotificationDocument[];
  total: number;
  unreadCount: number;
  message?: string;
}

export async function getPaginatedNotifications(
  userId: string,
  limit: number = 25,
  offset: number = 0,
  filter: NotificationFilter = 'all',
): Promise<GetPaginatedNotificationsResult> {
  try {
    const { databases } = await adminAction();

    const queries = [
      Query.equal('user_id', userId),
      Query.orderDesc('$createdAt'),
      Query.limit(limit),
      Query.offset(offset),
    ];

    if (filter === 'unread') {
      queries.push(Query.equal('is_read', false));
    } else if (filter === 'read') {
      queries.push(Query.equal('is_read', true));
    }

    const result = await databases.listDocuments<NotificationDocument>(
      DATABASE_ID,
      COLLECTION_IDS.NOTIFICATIONS,
      queries,
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
      ],
    );

    return {
      success: true,
      notifications: result.documents,
      total: result.total,
      unreadCount: unreadResult.total,
    };
  } catch (error: unknown) {
    console.error('Failed to get paginated notifications:', error);
    return {
      success: false,
      notifications: [],
      total: 0,
      unreadCount: 0,
      message: error instanceof Error ? error.message : 'Failed to get notifications',
    };
  }
}
