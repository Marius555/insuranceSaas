"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft01Icon } from "@hugeicons/core-free-icons";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { submitNewsPostAction } from "@/appwrite/submitNewsPostAction";

export function NewsPostForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [isPublished, setIsPublished] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverImage(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim() || !body.trim()) {
      setError("Title and body are required.");
      return;
    }

    setSubmitting(true);

    let coverImageBase64: string | undefined;
    let coverImageName: string | undefined;

    if (coverImage) {
      coverImageBase64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(coverImage);
      });
      coverImageName = coverImage.name;
    }

    const result = await submitNewsPostAction({
      title: title.trim(),
      body: body.trim(),
      ...(excerpt.trim() ? { excerpt: excerpt.trim() } : {}),
      ...(coverImageBase64 ? { cover_image_base64: coverImageBase64, cover_image_name: coverImageName } : {}),
      is_published: isPublished,
    });

    if (result.success) {
      router.push("/news");
    } else {
      setError(result.message || "Failed to create post");
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-16 md:py-24">
      <Link
        href="/news"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
      >
        <HugeiconsIcon icon={ArrowLeft01Icon} className="size-4" strokeWidth={2} />
        Back to News
      </Link>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Create News Post</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Post title"
                maxLength={255}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="body">Body</Label>
              <Textarea
                id="body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Write your post content..."
                rows={12}
                maxLength={10000}
                required
              />
              <p className="text-xs text-muted-foreground text-right">
                {body.length}/10000
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="excerpt">Excerpt (optional)</Label>
              <Textarea
                id="excerpt"
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                placeholder="Short summary for the card view..."
                rows={3}
                maxLength={500}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cover-image">Cover Image (optional)</Label>
              <Input
                id="cover-image"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
              />
            </div>

            <div className="flex items-center gap-3">
              <Switch
                id="publish"
                checked={isPublished}
                onCheckedChange={setIsPublished}
              />
              <Label htmlFor="publish">Publish immediately</Label>
            </div>

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}

            <Button type="submit" disabled={submitting} className="w-full">
              {submitting ? "Creating..." : "Create Post"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
