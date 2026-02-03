"use server";

import { getUserDocumentCached } from "@/lib/data/cached-queries";

/**
 * Get UserDocument from database by user ID
 * Returns null if document doesn't exist (user needs onboarding)
 */
export async function getUserDocument(userId: string) {
  return getUserDocumentCached(userId);
}
