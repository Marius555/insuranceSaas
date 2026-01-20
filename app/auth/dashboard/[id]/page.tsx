import { AppSidebar } from "@/components/dashboardComponents/app-sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
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
import { getSession } from "@/appwrite/getSession";
import { getUserDocument } from "@/appwrite/getUserDocument";
import { redirect } from "next/navigation";
import { ClaimUploadModal } from "@/components/dashboardComponents/claim-upload-modal";
import { FilmVideoButton } from "@/components/dashboardComponents/film-video-button";

export default async function UserDashboard({ params }: { params: Promise<{ id: string }> }) {
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

  // Get user document (use id from URL when protection disabled)
  const userId = disableProtection ? id : session!.id;
  const userDoc = await getUserDocument(userId);

  if (!disableProtection && (!userDoc || !userDoc.onboarding_completed)) {
    redirect("/");
  }

  // Insurance adjusters should go to their claims page directly
  if (userDoc?.role === 'insurance_adjuster') {
    redirect(`/auth/dashboard/${userId}/claims`);
  }

  return (
    <SidebarProvider>
      <AppSidebar userId={userId} userEmail={userDoc?.email} userRole={userDoc?.role} />
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
              <EmptyTitle>Submit a New Claim</EmptyTitle>
              <EmptyDescription>
                Record a video or upload media to submit a new insurance claim. Our AI will analyze the damage automatically.
              </EmptyDescription>
            </EmptyHeader>
            <div className="mt-4 flex gap-2">
              <FilmVideoButton userId={userId} />
              <ClaimUploadModal userId={userId}>
                <Button variant="secondary">
                  <HugeiconsIcon icon={AttachmentIcon} /> Upload video
                </Button>
              </ClaimUploadModal>
            </div>
          </Empty>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
