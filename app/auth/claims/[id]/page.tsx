import { notFound, redirect } from 'next/navigation';
import { getSession } from '@/appwrite/getSession';
import { getClaimById } from '@/appwrite/getClaim';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { HugeiconsIcon } from '@hugeicons/react';
import { Image01Icon, File01Icon } from '@hugeicons/core-free-icons';
import { ClaimActions } from './claim-actions';
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

interface ClaimPageProps {
  params: Promise<{ id: string }>;
}

export default async function ClaimPage({ params }: ClaimPageProps) {
  const { id } = await params;

  const session = await getSession();
  if (!session) {
    redirect(`/?auth=required&returnTo=/auth/claims/${id}`);
  }

  const claimResult = await getClaimById(id);

  if (!claimResult.success || !claimResult.data) {
    notFound();
  }

  const { claim, damageDetails, vehicleVerification, assessment, mediaFiles, policyFile } = claimResult.data;

  const isOwner = claim.user_id === session.id;
  const isPublic = claim.is_public;

  if (!isOwner && !isPublic) {
    redirect('/?error=unauthorized');
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300';
      case 'denied':
        return 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300';
      case 'partial':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300';
      case 'needs_investigation':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300';
      default:
        return 'bg-muted text-foreground';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'minor':
        return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300';
      case 'moderate':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300';
      case 'severe':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300';
      case 'total_loss':
        return 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300';
      default:
        return 'bg-muted text-foreground';
    }
  };

  const getVerificationColor = (status: string) => {
    switch (status) {
      case 'matched':
        return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300';
      case 'mismatched':
        return 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300';
      default:
        return 'bg-muted text-foreground';
    }
  };

  const formatStatus = (status: string) => {
    return status.replace(/_/g, ' ').replace(/^\w/, c => c.toUpperCase());
  };

  return (
    <SidebarProvider>
      <AppSidebar userId={session.id} />
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
                  <BreadcrumbLink href={`/auth/dashboard/${session.id}`}>
                    Dashboard
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href={`/auth/dashboard/${session.id}/claims`}>
                    Claims
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>{claim.claim_number}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          {/* Claim Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <h1 className="text-xl sm:text-2xl font-bold text-foreground">{claim.claim_number}</h1>
              <span className="text-sm text-muted-foreground">
                {new Date(claim.analysis_timestamp).toLocaleDateString()}
              </span>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Download Buttons */}
              {mediaFiles.length > 0 && (
                <div className="flex items-center gap-1">
                  {mediaFiles.map((file, index) => (
                    <a
                      key={file.fileId}
                      href={file.downloadUrl}
                      download
                      title={`Download media ${index + 1}`}
                    >
                      <Button variant="outline" size="sm" className="h-9 w-9 p-0">
                        <HugeiconsIcon icon={Image01Icon} size={16} />
                        <span className="sr-only">Download media {index + 1}</span>
                      </Button>
                    </a>
                  ))}
                </div>
              )}

              {policyFile && (
                <a href={policyFile.downloadUrl} download title="Download policy">
                  <Button variant="outline" size="sm" className="h-9 w-9 p-0">
                    <HugeiconsIcon icon={File01Icon} size={16} />
                    <span className="sr-only">Download policy</span>
                  </Button>
                </a>
              )}

              <ClaimActions
                claimData={{
                  claim: claim as unknown as Record<string, unknown>,
                  damageDetails: damageDetails as unknown as Record<string, unknown>[],
                  vehicleVerification: vehicleVerification as unknown as Record<string, unknown> | null,
                  assessment: assessment as unknown as Record<string, unknown> | null,
                  claimNumber: claim.claim_number,
                }}
              />

              {claim.claim_status && claim.claim_status !== 'pending' && (
                <Badge className={getStatusColor(claim.claim_status)}>
                  {claim.claim_status}
                </Badge>
              )}
            </div>
          </div>

          {/* Unified Table */}
          <div className="bg-card rounded-lg border border-border overflow-hidden">
            {/* Claim Overview Section */}
            <div className="bg-muted px-4 py-2 border-b border-border">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Claim Overview
              </h2>
            </div>
            <div className="divide-y divide-border">
              <div className="flex justify-between items-center px-4 py-3">
                <span className="text-sm text-muted-foreground">Damage Type</span>
                <span className="text-sm font-medium text-foreground capitalize">{claim.damage_type}</span>
              </div>
              <div className="flex justify-between items-center px-4 py-3">
                <span className="text-sm text-muted-foreground">Overall Severity</span>
                <Badge className={getSeverityColor(claim.overall_severity)}>
                  {claim.overall_severity}
                </Badge>
              </div>
              <div className="flex justify-between items-center px-4 py-3">
                <span className="text-sm text-muted-foreground">Confidence Score</span>
                <span className="text-sm font-medium text-foreground">
                  {(claim.confidence_score * 100).toFixed(0)}%
                </span>
              </div>
              {claim.investigation_needed && (
                <div className="px-4 py-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Investigation</span>
                    <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300">Required</Badge>
                  </div>
                  {claim.investigation_reason && (
                    <p className="text-xs text-muted-foreground mt-2">{claim.investigation_reason}</p>
                  )}
                </div>
              )}
            </div>

            {/* Financial Summary Section */}
            {assessment && (
              <>
                <div className="bg-muted px-4 py-2 border-y border-border">
                  <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    Financial Summary
                  </h2>
                </div>
                <div className="divide-y divide-border">
                  <div className="flex justify-between items-center px-4 py-3">
                    <span className="text-sm text-muted-foreground">Total Estimate</span>
                    <span className="text-sm font-medium text-foreground">
                      ${assessment.total_repair_estimate.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center px-4 py-3">
                    <span className="text-sm text-muted-foreground">Covered Amount</span>
                    <span className="text-sm font-medium text-foreground">
                      ${assessment.covered_amount.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center px-4 py-3">
                    <span className="text-sm text-muted-foreground">Deductible</span>
                    <span className="text-sm font-medium text-foreground">
                      ${assessment.deductible.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center px-4 py-3 bg-green-50 dark:bg-green-950/30">
                    <span className="text-sm font-semibold text-foreground">Estimated Payout</span>
                    <span className="text-sm font-bold text-green-600 dark:text-green-400">
                      ${assessment.estimated_payout.toLocaleString()}
                    </span>
                  </div>
                </div>
              </>
            )}

            {/* Vehicle Verification Section */}
            {vehicleVerification && (
              <>
                <div className="bg-muted px-4 py-2 border-y border-border">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                      Vehicle Verification
                    </h2>
                    <Badge className={getVerificationColor(vehicleVerification.verification_status)}>
                      {formatStatus(vehicleVerification.verification_status)}
                    </Badge>
                  </div>
                </div>

                {/* Desktop: 3-column layout */}
                <div className="hidden md:block">
                  <table className="w-full">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase">Field</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase">From Media</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase">From Policy</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      <tr>
                        <td className="px-4 py-2 text-sm text-muted-foreground">License Plate</td>
                        <td className="px-4 py-2 text-sm font-medium text-foreground">{vehicleVerification.video_license_plate || '—'}</td>
                        <td className="px-4 py-2 text-sm font-medium text-foreground">{vehicleVerification.policy_license_plate || '—'}</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2 text-sm text-muted-foreground">VIN</td>
                        <td className="px-4 py-2 text-sm font-medium text-foreground">{vehicleVerification.video_vin || '—'}</td>
                        <td className="px-4 py-2 text-sm font-medium text-foreground">{vehicleVerification.policy_vin || '—'}</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2 text-sm text-muted-foreground">Make</td>
                        <td className="px-4 py-2 text-sm font-medium text-foreground">{vehicleVerification.video_make || '—'}</td>
                        <td className="px-4 py-2 text-sm font-medium text-foreground">{vehicleVerification.policy_make || '—'}</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2 text-sm text-muted-foreground">Model</td>
                        <td className="px-4 py-2 text-sm font-medium text-foreground">{vehicleVerification.video_model || '—'}</td>
                        <td className="px-4 py-2 text-sm font-medium text-foreground">{vehicleVerification.policy_model || '—'}</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2 text-sm text-muted-foreground">Year</td>
                        <td className="px-4 py-2 text-sm font-medium text-foreground">{vehicleVerification.video_year || '—'}</td>
                        <td className="px-4 py-2 text-sm font-medium text-foreground">{vehicleVerification.policy_year || '—'}</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2 text-sm text-muted-foreground">Color</td>
                        <td className="px-4 py-2 text-sm font-medium text-foreground">{vehicleVerification.video_color || '—'}</td>
                        <td className="px-4 py-2 text-sm font-medium text-foreground">{vehicleVerification.policy_color || '—'}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Mobile: Stacked layout */}
                <div className="md:hidden divide-y divide-border">
                  <div className="flex justify-between items-center px-4 py-2">
                    <span className="text-sm text-muted-foreground">License Plate (Media)</span>
                    <span className="text-sm font-medium text-foreground">{vehicleVerification.video_license_plate || '—'}</span>
                  </div>
                  <div className="flex justify-between items-center px-4 py-2">
                    <span className="text-sm text-muted-foreground">License Plate (Policy)</span>
                    <span className="text-sm font-medium text-foreground">{vehicleVerification.policy_license_plate || '—'}</span>
                  </div>
                  <div className="flex justify-between items-center px-4 py-2">
                    <span className="text-sm text-muted-foreground">VIN (Media)</span>
                    <span className="text-sm font-medium text-foreground">{vehicleVerification.video_vin || '—'}</span>
                  </div>
                  <div className="flex justify-between items-center px-4 py-2">
                    <span className="text-sm text-muted-foreground">VIN (Policy)</span>
                    <span className="text-sm font-medium text-foreground">{vehicleVerification.policy_vin || '—'}</span>
                  </div>
                  <div className="flex justify-between items-center px-4 py-2">
                    <span className="text-sm text-muted-foreground">Make (Media)</span>
                    <span className="text-sm font-medium text-foreground">{vehicleVerification.video_make || '—'}</span>
                  </div>
                  <div className="flex justify-between items-center px-4 py-2">
                    <span className="text-sm text-muted-foreground">Make (Policy)</span>
                    <span className="text-sm font-medium text-foreground">{vehicleVerification.policy_make || '—'}</span>
                  </div>
                  <div className="flex justify-between items-center px-4 py-2">
                    <span className="text-sm text-muted-foreground">Model (Media)</span>
                    <span className="text-sm font-medium text-foreground">{vehicleVerification.video_model || '—'}</span>
                  </div>
                  <div className="flex justify-between items-center px-4 py-2">
                    <span className="text-sm text-muted-foreground">Model (Policy)</span>
                    <span className="text-sm font-medium text-foreground">{vehicleVerification.policy_model || '—'}</span>
                  </div>
                  <div className="flex justify-between items-center px-4 py-2">
                    <span className="text-sm text-muted-foreground">Year (Media)</span>
                    <span className="text-sm font-medium text-foreground">{vehicleVerification.video_year || '—'}</span>
                  </div>
                  <div className="flex justify-between items-center px-4 py-2">
                    <span className="text-sm text-muted-foreground">Year (Policy)</span>
                    <span className="text-sm font-medium text-foreground">{vehicleVerification.policy_year || '—'}</span>
                  </div>
                  <div className="flex justify-between items-center px-4 py-2">
                    <span className="text-sm text-muted-foreground">Color (Media)</span>
                    <span className="text-sm font-medium text-foreground">{vehicleVerification.video_color || '—'}</span>
                  </div>
                  <div className="flex justify-between items-center px-4 py-2">
                    <span className="text-sm text-muted-foreground">Color (Policy)</span>
                    <span className="text-sm font-medium text-foreground">{vehicleVerification.policy_color || '—'}</span>
                  </div>
                </div>

                {/* Mismatches Warning */}
                {vehicleVerification.mismatches && vehicleVerification.mismatches.length > 0 && (
                  <div className="px-4 py-3 bg-red-50 dark:bg-red-950/30 border-t border-red-200 dark:border-red-900">
                    <p className="text-sm font-semibold text-red-900 dark:text-red-300 mb-1">Mismatches Detected:</p>
                    <ul className="text-sm text-red-700 dark:text-red-400 list-disc list-inside">
                      {vehicleVerification.mismatches.split(', ').map((mismatch: string, idx: number) => (
                        <li key={idx}>{mismatch}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Notes */}
                {vehicleVerification.notes && (
                  <div className="px-4 py-3 bg-muted/50 border-t border-border">
                    <p className="text-sm text-muted-foreground">{vehicleVerification.notes}</p>
                  </div>
                )}
              </>
            )}

            {/* Damaged Parts Section */}
            {damageDetails.length > 0 && (
              <>
                <div className="bg-muted px-4 py-2 border-y border-border">
                  <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    Damaged Parts
                  </h2>
                </div>
                <div className="divide-y divide-border">
                  {damageDetails.map((detail) => (
                    <div key={detail.$id} className="px-4 py-3">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-foreground">{detail.part_name}</span>
                          {detail.estimated_repair_cost && (
                            <span className="text-sm text-muted-foreground">({detail.estimated_repair_cost})</span>
                          )}
                        </div>
                        <Badge className={getSeverityColor(detail.severity)}>
                          {detail.severity}
                        </Badge>
                      </div>
                      {detail.description && (
                        <p className="text-sm text-muted-foreground">{detail.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
