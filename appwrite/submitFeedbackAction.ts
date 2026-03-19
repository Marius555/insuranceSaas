"use server";

import { cookies } from 'next/headers';
import { decryptData } from '@/utils/decrypt';
import { createFeedback, CreateFeedbackResult } from '@/appwrite/createFeedback';

export interface SubmitFeedbackInput {
  report_id?: string;
  category: 'bug_report' | 'feature_request' | 'general' | 'complaint';
  rating: number;
  feedback_text: string;
}

export async function submitFeedbackAction(input: SubmitFeedbackInput): Promise<CreateFeedbackResult> {
  try {
    // Get user ID from localSession JWT (same source as dashboard auth)
    const cookieStore = await cookies();
    const localSession = cookieStore.get('localSession');

    if (!localSession?.value) {
      return { success: false, message: 'You must be logged in to submit feedback' };
    }

    let userId: string | undefined;
    try {
      const decodedJwt = decodeURIComponent(localSession.value);
      const payload = await decryptData(decodedJwt, true);
      userId = payload.userId as string;
    } catch {
      try {
        const payload = await decryptData(localSession.value, true);
        userId = payload.userId as string;
      } catch {
        return { success: false, message: 'You must be logged in to submit feedback' };
      }
    }

    if (!userId) {
      return { success: false, message: 'You must be logged in to submit feedback' };
    }

    return await createFeedback({
      user_id: userId,
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
