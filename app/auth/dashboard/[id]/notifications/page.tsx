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
  EmptyTitle,
} from "@/components/ui/empty";
import { Button } from "@/components/ui/button";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { UserAvatarMenu } from "@/components/dashboardComponents/user-avatar-menu";
import { NotificationsListClient } from "@/components/notifications/notifications-list-client";
import { getPaginatedNotifications } from "@/appwrite/getPaginatedNotifications";
import Link from "next/link";

export default async function NotificationsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: userId } = await params;

  let fetchError = false;

  const result = await getPaginatedNotifications(userId);

  if (!result.success) {
    fetchError = true;
  }

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
                <BreadcrumbPage>Notifications</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
        <div className="flex items-center gap-1 pr-4">
          <NotificationBell />
          <UserAvatarMenu />
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        {/* Error state */}
        {fetchError && (
          <Empty>
            <EmptyHeader className="flex flex-col gap-2">
              <EmptyTitle>Something went wrong</EmptyTitle>
              <EmptyDescription>
                We couldn&apos;t load your notifications. This is usually a temporary issue.
              </EmptyDescription>
            </EmptyHeader>
            <div className="mt-4">
              <Link href={`/auth/dashboard/${userId}/notifications`}>
                <Button variant="outline">Try again</Button>
              </Link>
            </div>
          </Empty>
        )}

        {/* Notifications list */}
        {!fetchError && (
          <NotificationsListClient
            userId={userId}
            initialNotifications={result.notifications}
            initialTotal={result.total}
            initialUnreadCount={result.unreadCount}
          />
        )}
      </div>
    </SidebarInset>
  );
}
