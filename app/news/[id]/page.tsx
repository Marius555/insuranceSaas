import { notFound } from "next/navigation";
import { getSession } from "@/appwrite/getSession";
import { getUserDocument } from "@/appwrite/getUserDocument";
import { getNewsPostCached } from "@/lib/data/cached-queries";
import { Header } from "@/components/navigation/header";
import { NewsPostDetail } from "@/components/news/news-post-detail";
import { Footer } from "@/components/landing/footer";
import type { NewsPostDocument } from "@/lib/types/appwrite";

export const dynamic = "force-dynamic";

// TODO: Remove example posts once real data exists in Appwrite
const EXAMPLE_POSTS: Record<string, NewsPostDocument> = {
  "example-1": {
    $id: "example-1",
    $collectionId: "",
    $databaseId: "",
    $createdAt: "2026-02-09T10:00:00.000Z",
    $updatedAt: "2026-02-09T10:00:00.000Z",
    $permissions: [],
    $sequence: 0,
    author_id: "admin",
    title: "Introducing VehicleClaim AI 2.0 — Faster, Smarter Assessments",
    body: "We're excited to announce VehicleClaim AI 2.0, our biggest update yet. This release brings significant improvements to our AI-powered damage assessment pipeline.\n\nKey highlights:\n\n• 3x faster video analysis with our upgraded Gemini integration\n• Improved fraud detection that catches pre-existing damage with 94% accuracy\n• New side-by-side policy comparison view for adjusters\n• Mobile-optimized recording with real-time quality feedback\n\nThese improvements mean faster claim processing, more accurate estimates, and a better experience for everyone involved in the claims process.\n\nWe've also revamped the dashboard with a cleaner interface and added bulk report exports for insurance companies. The new analytics tab gives adjusters at-a-glance insights into claim trends across their portfolio.\n\nUpgrade to a Pro or Max plan to unlock the full power of VehicleClaim AI 2.0.",
    excerpt: "Our biggest update yet brings 3x faster analysis, improved fraud detection, and a revamped dashboard experience.",
    is_published: true,
    published_at: "2026-02-09T10:00:00.000Z",
  },
  "example-2": {
    $id: "example-2",
    $collectionId: "",
    $databaseId: "",
    $createdAt: "2026-01-28T14:30:00.000Z",
    $updatedAt: "2026-01-28T14:30:00.000Z",
    $permissions: [],
    $sequence: 0,
    author_id: "admin",
    title: "How AI Is Transforming the Insurance Claims Process",
    body: "The insurance industry is undergoing a fundamental shift. What once took days of manual inspection and paperwork can now be completed in minutes with AI-powered tools.\n\nAt VehicleClaim AI, we've seen firsthand how artificial intelligence is reshaping the way claims are filed, assessed, and resolved. Here's what we've learned from processing thousands of claims.\n\nSpeed matters — but accuracy matters more. Our AI models don't just work fast; they cross-reference damage patterns against millions of data points to deliver repair cost estimates within 5% of actual shop quotes.\n\nFraud detection has entered a new era. By analyzing rust patterns, paint oxidation, and damage age indicators, AI can flag suspicious claims before they reach an adjuster's desk.\n\nThe human element isn't going away. AI handles the heavy lifting of initial assessment, freeing adjusters to focus on complex cases that truly need human judgment.\n\nWe believe the future of insurance is a partnership between AI efficiency and human expertise.",
    excerpt: "From days of manual inspection to minutes with AI — here's what we've learned from processing thousands of vehicle claims.",
    is_published: true,
    published_at: "2026-01-28T14:30:00.000Z",
  },
  "example-3": {
    $id: "example-3",
    $collectionId: "",
    $databaseId: "",
    $createdAt: "2026-01-15T09:00:00.000Z",
    $updatedAt: "2026-01-15T09:00:00.000Z",
    $permissions: [],
    $sequence: 0,
    author_id: "admin",
    title: "New Pricing Plans — A Free Tier for Everyone",
    body: "We believe everyone should have access to quality vehicle damage assessment tools. That's why we're launching a free tier alongside our updated Pro and Max plans.\n\nFree Plan:\n• 1 AI assessment per day\n• Video and image analysis\n• Basic damage report with cost estimates\n\nPro Plan ($19/mo):\n• 20 assessments per day\n• Policy document analysis\n• Priority AI model access\n• PDF report exports\n\nMax Plan ($49/mo):\n• 99 assessments per day\n• All Pro features\n• Dedicated support\n• API access for integrations\n\nExisting users on legacy plans have been automatically migrated to the closest matching tier at no additional cost. Check your dashboard to see your updated plan details.\n\nQuestions? Reach out through the feedback form in your dashboard.",
    excerpt: "Introducing our new Free, Pro, and Max plans — quality AI damage assessment tools accessible to everyone.",
    is_published: true,
    published_at: "2026-01-15T09:00:00.000Z",
  },
};

async function getPost(id: string): Promise<NewsPostDocument | null> {
  const dbPost = await getNewsPostCached(id);
  if (dbPost) return dbPost;
  return EXAMPLE_POSTS[id] ?? null;
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const post = await getPost(id);

  if (!post) {
    return { title: "Post Not Found - VehicleClaim AI" };
  }

  return {
    title: `${post.title} - VehicleClaim AI`,
    description: post.excerpt || post.body.slice(0, 160),
  };
}

export default async function NewsPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const post = await getPost(id);

  if (!post) {
    notFound();
  }

  const session = await getSession();

  let userDoc = null;
  if (session) {
    userDoc = await getUserDocument(session.id);
  }

  const isAdmin = userDoc?.role === "admin";

  return (
    <div className="animate-page-enter">
      <Header session={session} userDoc={userDoc} />
      <main>
        <NewsPostDetail post={post} isAdmin={isAdmin} />
      </main>
      <Footer />
    </div>
  );
}
