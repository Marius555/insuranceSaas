import Link from "next/link";
import type { NewsPostDocument } from "@/lib/types/appwrite";

interface NewsPostCardProps {
  post: NewsPostDocument;
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

export function NewsPostCard({ post }: NewsPostCardProps) {
  const excerpt =
    post.excerpt || post.body.slice(0, 150) + (post.body.length > 150 ? "..." : "");

  return (
    <Link href={`/news/${post.$id}`} className="group">
      <div className="overflow-hidden rounded-xl aspect-[16/9] bg-muted">
        {post.cover_image_id ? (
          <img
            src={getCoverImageUrl(post.cover_image_id)}
            alt={post.title}
            className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="size-full bg-muted" />
        )}
      </div>
      <div className="pt-4">
        <time className="text-sm text-muted-foreground">
          {post.published_at ? formatDate(post.published_at) : formatDate(post.$createdAt)}
        </time>
        <h3 className="text-lg font-semibold mt-1 line-clamp-2 transition-colors group-hover:text-primary">
          {post.title}
        </h3>
        <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{excerpt}</p>
      </div>
    </Link>
  );
}
