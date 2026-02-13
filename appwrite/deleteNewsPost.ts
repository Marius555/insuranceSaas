"use server";

import { clientAction, adminAction } from '@/appwrite/adminOrClient';
import { isAppwriteClient } from '@/lib/types/appwrite';
import { getUserDocumentCached } from '@/lib/data/cached-queries';
import { DATABASE_ID, COLLECTION_IDS } from '@/lib/env';
import { revalidateTag } from 'next/cache';

export interface DeleteNewsPostResult {
  success: boolean;
  message?: string;
}

export async function deleteNewsPost(postId: string): Promise<DeleteNewsPostResult> {
  try {
    const result = await clientAction();

    if (!isAppwriteClient(result)) {
      return { success: false, message: 'You must be logged in' };
    }

    const user = await result.account.get();
    const userDoc = await getUserDocumentCached(user.$id);

    if (!userDoc || userDoc.role !== 'admin') {
      return { success: false, message: 'Only admins can delete news posts' };
    }

    const { databases } = await adminAction();
    await databases.deleteDocument(DATABASE_ID, COLLECTION_IDS.NEWS_POSTS, postId);

    revalidateTag('news-posts', { expire: 0 });

    return { success: true };
  } catch (error: any) {
    console.error('Failed to delete news post:', error);
    return {
      success: false,
      message: error.message || 'Failed to delete news post',
    };
  }
}
