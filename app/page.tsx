import { getSession } from "@/appwrite/getSession";
import { getUserDocument } from "@/appwrite/getUserDocument";
import { redirect } from "next/navigation";
import { Header } from "@/components/navigation/header";
import { HeroWithUpload } from "@/components/landing/hero-with-upload";
import { Features } from "@/components/landing/features";
import { HowItWorks } from "@/components/landing/how-it-works";
import { Stats } from "@/components/landing/stats";
import { Footer } from "@/components/landing/footer";
import { OnboardingWrapper } from "@/components/auth/onboarding-wrapper";


// CRITICAL: Force dynamic rendering to prevent caching
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata = {
  title: "VehicleClaim AI - AI-Powered Vehicle Damage Assessment",
  description:
    "Process insurance claims in minutes with AI video analysis. Instant damage assessment, cost estimation, fraud detection.",
};

export default async function LandingPage() {
  const session = await getSession();

  // Check if user needs onboarding
  let needsOnboarding = false;
  let userDoc = null;
  if (session) {
    userDoc = await getUserDocument(session.id);
    needsOnboarding = !userDoc || !userDoc.onboarding_completed;
  }

  // Redirect returning users who have completed onboarding to their dashboard
  if (session && userDoc && userDoc.onboarding_completed) {
    redirect(`/auth/dashboard/${session.id}`);
  }

  return (
    <>
      <OnboardingWrapper
        session={session}
        needsOnboarding={needsOnboarding}
      />

      <Header session={session} userDoc={userDoc} />
      <main>
        <HeroWithUpload session={session} />
        <Features />
        <HowItWorks />
        <Stats />
      </main>
      <Footer />
    </>
  );
}