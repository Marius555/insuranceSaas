"use server";

import { adminAction } from '@/appwrite/adminOrClient';
import { DATABASE_ID, COLLECTION_IDS } from '@/lib/env';
import { ID, Permission, Role } from 'node-appwrite';
import type { NotificationDocument } from '@/lib/types/appwrite';

export interface CreateNotificationInput {
  user_id: string;
  title: string;
  message: string;
  type: 'report_completed' | 'report_updated' | 'system' | 'info';
  link?: string;
  report_id?: string;
}

export async function createNotification(input: CreateNotificationInput): Promise<{ success: boolean; message?: string }> {
  try {
    const { databases } = await adminAction();

    await databases.createDocument<NotificationDocument>(
      DATABASE_ID,
      COLLECTION_IDS.NOTIFICATIONS,
      ID.unique(),
      {
        user_id: input.user_id,
        title: input.title,
        message: input.message,
        type: input.type,
        is_read: false,
        ...(input.link ? { link: input.link } : {}),
        ...(input.report_id ? { report_id: input.report_id } : {}),
      },
      [
        Permission.read(Role.user(input.user_id)),
        Permission.update(Role.user(input.user_id)),
      ]
    );

    return { success: true };
  } catch (error: any) {
    console.error('Failed to create notification:', error);
    return { success: false, message: error.message || 'Failed to create notification' };
  }
}
