import { getSession } from "@/appwrite/getSession";
import { getUserDocument } from "@/appwrite/getUserDocument";
import { Header } from "@/components/navigation/header";
import { PricingSection } from "@/components/pricing/pricing-section";
import { Footer } from "@/components/landing/footer";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Pricing - VehicleClaim AI",
  description:
    "Choose the right plan for AI-powered vehicle damage assessment. Free, Pro, and Max tiers available.",
};

export default async function PricingPage() {
  const session = await getSession();

  let userDoc = null;
  if (session) {
    userDoc = await getUserDocument(session.id);
  }

  return (
    <div className="animate-page-enter">
      <Header session={session} userDoc={userDoc} />
      <main>
        <PricingSection session={session} userDoc={userDoc} />
      </main>
      <Footer />
    </div>
  );
}
