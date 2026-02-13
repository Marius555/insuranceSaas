"use server";

import { createFeedback, CreateFeedbackResult } from '@/appwrite/createFeedback';
import { clientAction } from '@/appwrite/adminOrClient';
import { isAppwriteClient } from '@/lib/types/appwrite';

export interface SubmitFeedbackInput {
  report_id?: string;
  category: 'bug_report' | 'feature_request' | 'general' | 'complaint';
  rating: number;
  feedback_text: string;
}

/**
 * Submit feedback from form data
 * Gets the current user session and creates feedback document
 *
 * @param input - Feedback form data
 * @returns Result indicating success or failure
 */
export async function submitFeedbackAction(input: SubmitFeedbackInput): Promise<CreateFeedbackResult> {
  try {
    // Get current user session
    const result = await clientAction();

    if (!isAppwriteClient(result)) {
      return { success: false, message: 'You must be logged in to submit feedback' };
    }

    // Get user ID from account
    const user = await result.account.get();

    // Create feedback document
    return await createFeedback({
      user_id: user.$id,
      ...(input.report_id ? { report_id: input.report_id } : {}),
      category: input.category,
      rating: input.rating,
      feedback_text: input.feedback_text,
    });
  } catch (error: any) {
    console.error('Failed to submit feedback:', error);
    return {
      success: false,
      message: error.message || 'Failed to submit feedback',
    };
  }
}
