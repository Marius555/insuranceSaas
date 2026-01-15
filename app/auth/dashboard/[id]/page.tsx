import { AppSidebar } from "@/components/dashboardComponents/app-sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  Empty,
  EmptyContent,
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
import { adminAction } from "@/appwrite/adminOrClient";
import { DATABASE_ID, COLLECTION_IDS } from "@/lib/env";
import { Query } from "node-appwrite";
import type { ClaimDocument } from "@/lib/types/appwrite";
import { ClaimUploadModal } from "@/components/dashboardComponents/claim-upload-modal";
import { ClaimsTable } from "@/components/dashboardComponents/claims-table";
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

  // Fetch claims based on role
  const { databases } = await adminAction();
  let claimsResult;

  if (userDoc?.role === 'insurance_adjuster' && userDoc.insurance_company_id) {
    // Insurance company: show claims assigned to their company
    claimsResult = await databases.listDocuments<ClaimDocument>(
      DATABASE_ID,
      COLLECTION_IDS.CLAIMS,
      [
        Query.equal('insurance_company_id', userDoc.insurance_company_id),
        Query.orderDesc('$createdAt'),
        Query.limit(50)
      ]
    );
  } else {
    // Regular user: show their own claims
    claimsResult = await databases.listDocuments<ClaimDocument>(
      DATABASE_ID,
      COLLECTION_IDS.CLAIMS,
      [
        Query.equal('user_id', userId),
        Query.orderDesc('$createdAt'),
        Query.limit(50)
      ]
    );
  }

  const claims = claimsResult.documents;

  return (
    <SidebarProvider>
      <AppSidebar />
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
                  <BreadcrumbLink href={`/auth/dashboard/${id}`}>
                    Dashboard
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>Claims</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          {/* Upload buttons - only for regular users (or when protection disabled) */}
          {(disableProtection || userDoc?.role === 'user') && (
            <div className="flex gap-2">
              <FilmVideoButton userId={userId} />
              <ClaimUploadModal userId={userId}>
                <Button variant="secondary">
                  <HugeiconsIcon icon={AttachmentIcon} /> Upload video
                </Button>
              </ClaimUploadModal>
            </div>
          )}

          {/* Empty state - only for users with no claims */}
          {(disableProtection || userDoc?.role === 'user') && claims.length === 0 && (
            <Empty>
              <EmptyHeader className="flex flex-col gap-2">
                <EmptyMedia variant="icon">
                  <HugeiconsIcon icon={FileEmpty02Icon} />
                </EmptyMedia>
                <EmptyTitle>No Claims Yet</EmptyTitle>
                <EmptyDescription>
                  No claims submitted. Click &quot;Upload video&quot; above to submit your first claim.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}

          {/* Claims table - show when claims exist */}
          {claims.length > 0 && (
            <ClaimsTable claims={claims} />
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
