import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { PlusSignIcon, File01Icon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { NewsPostCard } from "@/components/news/news-post-card";
import type { NewsPostDocument } from "@/lib/types/appwrite";

interface NewsListingProps {
  posts: NewsPostDocument[];
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

export function NewsListing({ posts, isAdmin }: NewsListingProps) {
  const [heroPost, ...remainingPosts] = posts;

  return (
    <section className="max-w-7xl mx-auto px-4 py-16 md:py-24">
      <div className="flex items-end justify-between mb-12">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight">News</h1>
        {isAdmin && (
          <Link href="/news/create">
            <Button>
              <HugeiconsIcon icon={PlusSignIcon} className="size-4 mr-2" strokeWidth={2} />
              Create Post
            </Button>
          </Link>
        )}
      </div>

      {posts.length === 0 ? (
        <div className="text-center py-20">
          <HugeiconsIcon
            icon={File01Icon}
            className="size-12 text-muted-foreground mx-auto mb-4"
            strokeWidth={1.5}
          />
          <h2 className="text-lg font-medium mb-2">No posts yet</h2>
          <p className="text-muted-foreground">Check back later for news and updates.</p>
        </div>
      ) : (
        <>
          {/* Hero: Latest Post */}
          <Link href={`/news/${heroPost.$id}`} className="group block">
            <div className="grid md:grid-cols-2 gap-8 items-start">
              <div className="overflow-hidden rounded-2xl aspect-[16/10] bg-muted">
                {heroPost.cover_image_id ? (
                  <img
                    src={getCoverImageUrl(heroPost.cover_image_id)}
                    alt={heroPost.title}
                    className="size-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                  />
                ) : (
                  <div className="size-full bg-muted" />
                )}
              </div>
              <div>
                <time className="text-sm text-muted-foreground">
                  {heroPost.published_at
                    ? formatDate(heroPost.published_at)
                    : formatDate(heroPost.$createdAt)}
                </time>
                <h2 className="text-2xl md:text-3xl font-bold mt-2 tracking-tight transition-colors group-hover:text-primary">
                  {heroPost.title}
                </h2>
                <p className="text-base text-muted-foreground mt-4 line-clamp-3">
                  {heroPost.excerpt ||
                    heroPost.body.slice(0, 200) +
                      (heroPost.body.length > 200 ? "..." : "")}
                </p>
              </div>
            </div>
          </Link>

          {/* Remaining Posts Grid */}
          {remainingPosts.length > 0 && (
            <>
              <div className="border-t border-border my-12 md:my-16" />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-10">
                {remainingPosts.map((post) => (
                  <NewsPostCard key={post.$id} post={post} />
                ))}
              </div>
            </>
          )}
        </>
      )}
    </section>
  );
}
