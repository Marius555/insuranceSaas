"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft01Icon, Delete02Icon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { deleteNewsPost } from "@/appwrite/deleteNewsPost";
import type { NewsPostDocument } from "@/lib/types/appwrite";

interface NewsPostDetailProps {
  post: NewsPostDocument;
  isAdmin?: boolean;
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function getCoverImageUrl(coverImageId: string): string {
  return `${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT}/storage/buckets/${process.env.NEXT_PUBLIC_APPWRITE_STORAGE_BUCKET_ID}/files/${coverImageId}/view?project=${process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID}`;
}

export function NewsPostDetail({ post, isAdmin }: NewsPostDetailProps) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this post?")) return;

    setDeleting(true);
    const result = await deleteNewsPost(post.$id);
    if (result.success) {
      router.push("/news");
    } else {
      alert(result.message || "Failed to delete post");
      setDeleting(false);
    }
  };

  return (
    <article className="max-w-4xl mx-auto px-4 py-16 md:py-24">
      <div className="flex items-center justify-between mb-10">
        <Link
          href="/news"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} className="size-4" strokeWidth={2} />
          Back to News
        </Link>
        {isAdmin && (
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            disabled={deleting}
          >
            <HugeiconsIcon icon={Delete02Icon} className="size-4 mr-2" strokeWidth={2} />
            {deleting ? "Deleting..." : "Delete"}
          </Button>
        )}
      </div>

      <time className="text-sm text-muted-foreground">
        {post.published_at ? formatDate(post.published_at) : formatDate(post.$createdAt)}
      </time>

      <h1 className="text-3xl md:text-5xl font-bold tracking-tight mt-2 mb-8">
        {post.title}
      </h1>

      {post.cover_image_id && (
        <img
          src={getCoverImageUrl(post.cover_image_id)}
          alt={post.title}
          className="w-full rounded-2xl object-cover aspect-[16/9] mb-10"
        />
      )}

      <div className="prose prose-neutral dark:prose-invert max-w-none whitespace-pre-wrap text-foreground text-base leading-7">
        {post.body}
      </div>
    </article>
  );
}
