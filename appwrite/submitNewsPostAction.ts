"use server";

import { createNewsPost, CreateNewsPostResult } from '@/appwrite/createNewsPost';
import { clientAction, adminAction } from '@/appwrite/adminOrClient';
import { isAppwriteClient } from '@/lib/types/appwrite';
import { getUserDocumentCached } from '@/lib/data/cached-queries';
import { STORAGE_BUCKET_ID } from '@/lib/env';
import { ID } from 'node-appwrite';
import { InputFile } from 'node-appwrite/file';
import { revalidateTag } from 'next/cache';

export interface SubmitNewsPostInput {
  title: string;
  body: string;
  excerpt?: string;
  cover_image_base64?: string;
  cover_image_name?: string;
  is_published: boolean;
}

export async function submitNewsPostAction(input: SubmitNewsPostInput): Promise<CreateNewsPostResult> {
  try {
    const result = await clientAction();

    if (!isAppwriteClient(result)) {
      return { success: false, message: 'You must be logged in to create a post' };
    }

    const user = await result.account.get();
    const userDoc = await getUserDocumentCached(user.$id);

    if (!userDoc || userDoc.role !== 'admin') {
      return { success: false, message: 'Only admins can create news posts' };
    }

    let coverImageId: string | undefined;

    if (input.cover_image_base64 && input.cover_image_name) {
      const { storage } = await adminAction();
      const base64Data = input.cover_image_base64.replace(/^data:image\/\w+;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');
      const file = await storage.createFile(
        STORAGE_BUCKET_ID,
        ID.unique(),
        InputFile.fromBuffer(buffer, input.cover_image_name),
      );
      coverImageId = file.$id;
    }

    const createResult = await createNewsPost({
      author_id: user.$id,
      title: input.title,
      body: input.body,
      ...(input.excerpt ? { excerpt: input.excerpt } : {}),
      ...(coverImageId ? { cover_image_id: coverImageId } : {}),
      is_published: input.is_published,
      ...(input.is_published ? { published_at: new Date().toISOString() } : {}),
    });

    revalidateTag('news-posts', { expire: 0 });

    return createResult;
  } catch (error: any) {
    console.error('Failed to submit news post:', error);
    return {
      success: false,
      message: error.message || 'Failed to submit news post',
    };
  }
}
