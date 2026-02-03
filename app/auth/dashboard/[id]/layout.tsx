import { getSession } from "@/appwrite/getSession";
import { getUserDocument } from "@/appwrite/getUserDocument";
import { getUserPolicies } from "@/appwrite/getUserPolicies";
import { redirect } from "next/navigation";
import { UserProvider } from "@/lib/context/user-context";
import { PolicyProvider } from "@/lib/context/policy-context";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/dashboardComponents/app-sidebar";

interface DashboardLayoutProps {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}

export default async function DashboardLayout({ children, params }: DashboardLayoutProps) {
  const { id } = await params;

  // DEV ONLY: Skip protection when DISABLE_PROTECTION=true
  const disableProtection = process.env.DISABLE_PROTECTION === 'true';

  let session = null;
  if (!disableProtection) {
    // Validate session
    session = await getSession();
    if (!session || session.id !== id) {
      redirect("/?auth=required");
    }
  }

  // Get user document and policies in parallel
  const userId = disableProtection ? id : session!.id;
  const [userDoc, policiesResult] = await Promise.all([
    getUserDocument(userId),
    getUserPolicies(userId),
  ]);

  if (!disableProtection && (!userDoc || !userDoc.onboarding_completed)) {
    redirect("/");
  }

  // Prepare user data for context
  const userData = {
    userId,
    email: userDoc?.email || '',
    role: userDoc?.role || 'user',
  };

  const initialPolicies = policiesResult.success ? (policiesResult.policies || []) : [];

  return (
    <UserProvider userData={userData}>
      <PolicyProvider initialPolicies={initialPolicies}>
        <SidebarProvider>
          <AppSidebar />
          {children}
        </SidebarProvider>
      </PolicyProvider>
    </UserProvider>
  );
}
