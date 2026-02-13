"use server";

import { adminAction } from '@/appwrite/adminOrClient';
import { DATABASE_ID, COLLECTION_IDS } from '@/lib/env';
import { ID, Permission, Role } from 'node-appwrite';
import type { FeedbackDocument } from '@/lib/types/appwrite';

export interface CreateFeedbackInput {
  user_id: string;
  report_id?: string;
  category: 'bug_report' | 'feature_request' | 'general' | 'complaint';
  rating: number;
  feedback_text: string;
}

export interface CreateFeedbackResult {
  success: boolean;
  data?: FeedbackDocument;
  message?: string;
}

/**
 * Create a feedback document in Appwrite
 *
 * @param input - Feedback data to create
 * @returns Created feedback document or error
 */
export async function createFeedback(input: CreateFeedbackInput): Promise<CreateFeedbackResult> {
  try {
    const { databases } = await adminAction();

    const feedback = await databases.createDocument<FeedbackDocument>(
      DATABASE_ID,
      COLLECTION_IDS.FEEDBACK,
      ID.unique(),
      {
        user_id: input.user_id,
        ...(input.report_id ? { report_id: input.report_id } : {}),
        category: input.category,
        rating: input.rating,
        feedback_text: input.feedback_text,
        status: 'pending_review',
      },
      [
        Permission.read(Role.user(input.user_id)),
        Permission.update(Role.user(input.user_id)),
      ]
    );

    return { success: true, data: feedback };
  } catch (error: any) {
    console.error('Failed to create feedback:', error);
    return {
      success: false,
      message: error.message || 'Failed to submit feedback',
    };
  }
}
