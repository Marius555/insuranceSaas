import { getSession } from "@/appwrite/getSession";
import { redirect } from "next/navigation";
import { ClaimAnalysisPage } from "@/components/gemini-analysis/claim-analysis-page";

export const metadata = {
  title: "Claim Analysis | VehicleClaim AI",
  description: "AI-powered auto damage assessment and policy verification with fraud detection",
};

export default async function ClaimAnalysisRoute() {
  const session = await getSession();

  // Protect route - redirect to home page with auth modal if not authenticated
  if (!session) {
    redirect("/?auth=required&returnTo=/claim-analysis");
  }

  return <ClaimAnalysisPage />;
}
