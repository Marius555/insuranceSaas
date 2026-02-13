import { getSession } from "@/appwrite/getSession";
import { getUserDocument } from "@/appwrite/getUserDocument";
import { redirect } from "next/navigation";
import { UserProvider } from "@/lib/context/user-context";
import { NotificationProvider } from "@/lib/context/notification-context";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/dashboardComponents/app-sidebar";
import { getNotificationsCached } from "@/lib/data/cached-queries";
import { getPlanLimit } from "@/lib/evaluation-limits";

interface ReportsLayoutProps {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}

export default async function ReportsLayout({ children, params }: ReportsLayoutProps) {
  const { id } = await params;

  const session = await getSession();
  if (!session) {
    redirect(`/?auth=required&returnTo=/auth/reports/${id}`);
  }

  const [userDoc, notificationsData] = await Promise.all([
    getUserDocument(session.id),
    getNotificationsCached(session.id),
  ]);

  const userData = {
    userId: session.id,
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
      return userDoc?.evaluation_times ?? limit;
    })(),
    evaluationLimit: getPlanLimit(userDoc?.pricing_plan || 'free'),
  };

  return (
    <UserProvider userData={userData}>
      <NotificationProvider
        userId={session.id}
        initialNotifications={notificationsData.notifications}
        initialUnreadCount={notificationsData.unreadCount}
      >
        <SidebarProvider>
          <AppSidebar />
          {children}
        </SidebarProvider>
      </NotificationProvider>
    </UserProvider>
  );
}
