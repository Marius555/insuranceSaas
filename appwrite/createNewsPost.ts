"use server";

import { adminAction } from '@/appwrite/adminOrClient';
import { DATABASE_ID, COLLECTION_IDS } from '@/lib/env';
import { ID, Permission, Role } from 'node-appwrite';
import type { NewsPostDocument } from '@/lib/types/appwrite';

export interface CreateNewsPostInput {
  author_id: string;
  title: string;
  body: string;
  excerpt?: string;
  cover_image_id?: string;
  is_published: boolean;
  published_at?: string;
}

export interface CreateNewsPostResult {
  success: boolean;
  data?: NewsPostDocument;
  message?: string;
}

export async function createNewsPost(input: CreateNewsPostInput): Promise<CreateNewsPostResult> {
  try {
    const { databases } = await adminAction();

    const post = await databases.createDocument<NewsPostDocument>(
      DATABASE_ID,
      COLLECTION_IDS.NEWS_POSTS,
      ID.unique(),
      {
        author_id: input.author_id,
        title: input.title,
        body: input.body,
        ...(input.excerpt ? { excerpt: input.excerpt } : {}),
        ...(input.cover_image_id ? { cover_image_id: input.cover_image_id } : {}),
        is_published: input.is_published,
        ...(input.published_at ? { published_at: input.published_at } : {}),
      },
      [
        Permission.read(Role.any()),
      ]
    );

    return { success: true, data: post };
  } catch (error: any) {
    console.error('Failed to create news post:', error);
    return {
      success: false,
      message: error.message || 'Failed to create news post',
    };
  }
}
