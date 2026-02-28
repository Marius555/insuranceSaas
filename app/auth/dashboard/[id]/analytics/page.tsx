import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { FileEmpty02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { getUserDocument } from "@/appwrite/getUserDocument";
import { getReportsCached } from "@/lib/data/cached-queries";
import { redirect } from "next/navigation";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { UserAvatarMenu } from "@/components/dashboardComponents/user-avatar-menu";
import Link from "next/link";
import { DashboardStats } from "@/components/dashboardComponents/dashboard-stats";
import { DashboardPlanUsage } from "@/components/dashboardComponents/dashboard-plan-usage";
import { DashboardRecentReports } from "@/components/dashboardComponents/dashboard-recent-reports";

export default async function AnalyticsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: userId } = await params;

  const [userDoc, reports] = await Promise.all([
    getUserDocument(userId),
    getReportsCached(userId),
  ]);

  if (userDoc?.role === "insurance_adjuster") {
    redirect(`/auth/dashboard/${userId}/reports`);
  }

  const total = reports.length;

  return (
    <SidebarInset>
      <header className="flex h-16 shrink-0 items-center gap-2">
        <div className="flex items-center gap-2 px-4 flex-1">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-2 data-[orientation=vertical]:h-4"
          />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink asChild>
                  <Link href={`/auth/dashboard/${userId}`}>Dashboard</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Analytics</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
        <div className="flex items-center gap-1 pr-4">
          <NotificationBell />
          <UserAvatarMenu />
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-6 p-4 pt-0">
        {total === 0 ? (
          <Empty>
            <EmptyHeader className="flex flex-col gap-2">
              <EmptyMedia variant="icon">
                <HugeiconsIcon icon={FileEmpty02Icon} />
              </EmptyMedia>
              <EmptyTitle>No Data Yet</EmptyTitle>
              <EmptyDescription>
                Submit your first damage report to see analytics here.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <>
            <DashboardStats reports={reports} />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <DashboardPlanUsage />
              <div className="lg:col-span-2">
                <DashboardRecentReports
                  reports={reports.slice(0, 5)}
                  userId={userId}
                />
              </div>
            </div>
          </>
        )}
      </div>
    </SidebarInset>
  );
}
