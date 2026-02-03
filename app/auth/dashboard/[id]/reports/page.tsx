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
import { Button } from "@/components/ui/button";
import { FileEmpty02Icon, AttachmentIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { getUserDocument } from "@/appwrite/getUserDocument";
import { getReportsCached } from "@/lib/data/cached-queries";
import type { ReportDocument } from "@/lib/types/appwrite";
import { ReportUploadModal } from "@/components/dashboardComponents/report-upload-modal";
import { ReportsTable } from "@/components/dashboardComponents/reports-table";
import { FilmVideoButton } from "@/components/dashboardComponents/film-video-button";
import Link from "next/link";

export default async function ReportsListPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: userId } = await params;

  let isRegularUser = true;
  let fetchError = false;

  let reports: ReportDocument[];
  try {
    const userDoc = await getUserDocument(userId);
    isRegularUser = userDoc?.role === 'user' || !userDoc;

    reports = await getReportsCached(
      userId,
      userDoc?.role,
      userDoc?.insurance_company_id,
    );
  } catch (error) {
    console.error('Failed to fetch reports:', error);
    reports = [];
    fetchError = true;
  }

  return (
    <SidebarInset>
      <header className="flex h-16 shrink-0 items-center gap-2">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-2 data-[orientation=vertical]:h-4"
          />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href={`/auth/dashboard/${userId}`}>
                  Dashboard
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Reports</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        {/* Error state */}
        {fetchError && (
          <Empty>
            <EmptyHeader className="flex flex-col gap-2">
              <EmptyTitle>Something went wrong</EmptyTitle>
              <EmptyDescription>
                We couldn&apos;t load your reports. This is usually a temporary issue.
              </EmptyDescription>
            </EmptyHeader>
            <div className="mt-4">
              <Link href={`/auth/dashboard/${userId}/reports`}>
                <Button variant="outline">Try again</Button>
              </Link>
            </div>
          </Empty>
        )}

        {/* Upload buttons - only for regular users */}
        {!fetchError && isRegularUser && (
          <div className="flex gap-2">
            <FilmVideoButton />
            <ReportUploadModal>
              <Button variant="secondary">
                <HugeiconsIcon icon={AttachmentIcon} /> Upload video
              </Button>
            </ReportUploadModal>
          </div>
        )}

        {/* Empty state - when no reports */}
        {!fetchError && reports.length === 0 && (
          <Empty>
            <EmptyHeader className="flex flex-col gap-2">
              <EmptyMedia variant="icon">
                <HugeiconsIcon icon={FileEmpty02Icon} />
              </EmptyMedia>
              <EmptyTitle>No Reports Yet</EmptyTitle>
              <EmptyDescription>
                {isRegularUser
                  ? "No reports submitted. Click \"Upload video\" above to submit your first damage report."
                  : "No reports assigned to your company yet."
                }
              </EmptyDescription>
            </EmptyHeader>
            {isRegularUser && (
              <div className="mt-4">
                <Link href={`/auth/dashboard/${userId}`}>
                  <Button variant="outline">
                    Back to Dashboard
                  </Button>
                </Link>
              </div>
            )}
          </Empty>
        )}

        {/* Reports table - show when reports exist */}
        {!fetchError && reports.length > 0 && (
          <ReportsTable reports={reports} />
        )}
      </div>
    </SidebarInset>
  );
}
