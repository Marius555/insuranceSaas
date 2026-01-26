"use client";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
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
import { ReportUploadModal } from "@/components/dashboardComponents/report-upload-modal";
import { FilmVideoButton } from "@/components/dashboardComponents/film-video-button";
import { useUser } from "@/lib/context/user-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function UserDashboard() {
  const { userId, role } = useUser();
  const router = useRouter();

  // Insurance adjusters should go to their reports page directly
  useEffect(() => {
    if (role === 'insurance_adjuster') {
      router.replace(`/auth/dashboard/${userId}/reports`);
    }
  }, [role, userId, router]);

  // Show nothing while redirecting insurance adjusters
  if (role === 'insurance_adjuster') {
    return null;
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
              <BreadcrumbItem>
                <BreadcrumbPage>Dashboard</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <Empty>
          <EmptyHeader className="flex flex-col gap-2">
            <EmptyMedia variant="icon">
              <HugeiconsIcon icon={FileEmpty02Icon} />
            </EmptyMedia>
            <EmptyTitle>Submit a New Report</EmptyTitle>
            <EmptyDescription>
              Record a video or upload media to submit a new damage report. Our AI will analyze the damage automatically.
            </EmptyDescription>
          </EmptyHeader>
          <div className="mt-4 flex gap-2">
            <FilmVideoButton />
            <ReportUploadModal>
              <Button variant="secondary">
                <HugeiconsIcon icon={AttachmentIcon} /> Upload video
              </Button>
            </ReportUploadModal>
          </div>
        </Empty>
      </div>
    </SidebarInset>
  );
}
