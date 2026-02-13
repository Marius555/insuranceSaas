import { getSession } from "@/appwrite/getSession";
import { getUserDocument } from "@/appwrite/getUserDocument";
import { getUserPolicies } from "@/appwrite/getUserPolicies";
import { redirect } from "next/navigation";
import { UserProvider } from "@/lib/context/user-context";
import { PolicyProvider } from "@/lib/context/policy-context";
import { NotificationProvider } from "@/lib/context/notification-context";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/dashboardComponents/app-sidebar";
import { PlanRedirectCheck } from "@/components/pricing/plan-redirect-check";
import { getNotificationsCached } from "@/lib/data/cached-queries";
import { getPlanLimit } from "@/lib/evaluation-limits";

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

  // Get user document, policies, and notifications in parallel
  const userId = disableProtection ? id : session!.id;
  const [userDoc, policiesResult, notificationsData] = await Promise.all([
    getUserDocument(userId),
    getUserPolicies(userId),
    getNotificationsCached(userId),
  ]);

  if (!disableProtection && (!userDoc || !userDoc.onboarding_completed)) {
    redirect("/");
  }

  // Prepare user data for context
  const userData = {
    userId,
    email: userDoc?.email || '',
    role: userDoc?.role || 'user',
    phone: userDoc?.phone || '',
    emailNotifications: userDoc?.email_notifications ?? true,
    pushNotifications: userDoc?.push_notifications ?? false,
    language: userDoc?.language || 'en',
    profileVisibility: (userDoc?.profile_visibility || 'private') as 'public' | 'private',
    dataSharing: userDoc?.data_sharing ?? false,
    analyticsEnabled: userDoc?.analytics_enabled ?? true,
    activityStatus: userDoc?.activity_status ?? true,
    pricingPlan: (userDoc?.pricing_plan || 'free') as 'free' | 'pro' | 'max',
    evaluationTimes: (() => {
      const plan = userDoc?.pricing_plan || 'free';
      const limit = getPlanLimit(plan);
      const today = new Date().toISOString().slice(0, 10);
      if (userDoc?.evaluation_reset_date !== today) return limit;
      return Math.min(userDoc?.evaluation_times ?? limit, limit);
    })(),
    evaluationLimit: getPlanLimit(userDoc?.pricing_plan || 'free'),
  };

  const initialPolicies = policiesResult.success ? (policiesResult.policies || []) : [];

  return (
    <UserProvider userData={userData}>
      <PolicyProvider initialPolicies={initialPolicies}>
        <NotificationProvider
          userId={userId}
          initialNotifications={notificationsData.notifications}
          initialUnreadCount={notificationsData.unreadCount}
        >
          <SidebarProvider>
            <AppSidebar />
            <PlanRedirectCheck />
            {children}
          </SidebarProvider>
        </NotificationProvider>
      </PolicyProvider>
    </UserProvider>
  );
}
