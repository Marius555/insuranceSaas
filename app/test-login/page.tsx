import { getSession } from "@/appwrite/getSession";
import { getUserDocument } from "@/appwrite/getUserDocument";
import { redirect } from "next/navigation";
import { Header } from "@/components/navigation/header";
import { TestLoginForm } from "@/components/auth/test-login-form";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Test Login - VehicleClaim AI",
  description: "Sign in with email and password for testing purposes.",
};

export default async function TestLoginPage() {
  const session = await getSession();

  // If already logged in, redirect appropriately
  if (session) {
    const userDoc = await getUserDocument(session.id);
    if (userDoc && userDoc.onboarding_completed) {
      redirect(`/auth/dashboard/${session.id}`);
    }
    // User is logged in but needs onboarding
    redirect("/");
  }

  return (
    <div className="animate-page-enter">
      <Header session={null} userDoc={null} />
      <main className="container mx-auto px-4 py-16">
        <TestLoginForm />
      </main>
    </div>
  );
}
