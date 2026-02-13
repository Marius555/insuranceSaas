import { redirect } from "next/navigation";
import { getSession } from "@/appwrite/getSession";
import { getUserDocument } from "@/appwrite/getUserDocument";
import { Header } from "@/components/navigation/header";
import { NewsPostForm } from "@/components/news/news-post-form";
import { Footer } from "@/components/landing/footer";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Create News Post - VehicleClaim AI",
  description: "Create a new news post.",
};

export default async function CreateNewsPostPage() {
  const session = await getSession();

  if (!session) {
    redirect("/news");
  }

  const userDoc = await getUserDocument(session.id);

  if (!userDoc || userDoc.role !== "admin") {
    redirect("/news");
  }

  return (
    <div className="animate-page-enter">
      <Header session={session} userDoc={userDoc} />
      <main>
        <NewsPostForm />
      </main>
      <Footer />
    </div>
  );
}
