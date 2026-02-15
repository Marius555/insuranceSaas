import { notFound, redirect } from 'next/navigation';
import { cn } from '@/lib/utils';
import { getSession } from '@/appwrite/getSession';
import { getReportById } from '@/appwrite/getReport';
import { getUserDocumentCached } from '@/lib/data/cached-queries';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CurrencyAmount } from '@/components/ui/currency-amount';
import { HugeiconsIcon } from '@hugeicons/react';
import { Image01Icon, File01Icon, AlertCircleIcon } from '@hugeicons/core-free-icons';
import { ReportActions } from './report-actions';
import { ReportFeedbackButton } from './report-feedback-button';
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
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { UserAvatarMenu } from "@/components/dashboardComponents/user-avatar-menu";
import Link from "next/link";

interface ReportPageProps {
  params: Promise<{ id: string }>;
}

export default async function ReportPage({ params }: ReportPageProps) {
  const { id } = await params;

  const session = await getSession();
  if (!session) {
    redirect(`/?auth=required&returnTo=/auth/reports/${id}`);
  }

  const reportResult = await getReportById(id);

  if (!reportResult.success || !reportResult.data) {
    notFound();
  }

  const { report, damageDetails: allDamageDetails, vehicleVerification, assessment, mediaFiles, policyFile } = reportResult.data;

  const visibleDamages = allDamageDetails.filter(d => !d.is_inferred);
  const inferredDamages = allDamageDetails.filter(d => d.is_inferred);

  const isOwner = report.user_id === session.id;
  const isPublic = report.is_public;

  if (!isOwner && !isPublic) {
    redirect('/?error=unauthorized');
  }

  // Fetch user document to check role for download permissions
  const userDoc = await getUserDocumentCached(session.id);
  const canDownloadFiles = userDoc?.role === 'insurance_adjuster' || userDoc?.role === 'admin';

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

  const getLikelihoodColor = (likelihood: string) => {
    switch (likelihood) {
      case 'high':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300';
      case 'low':
        return 'bg-muted text-muted-foreground';
      default:
        return 'bg-muted text-muted-foreground';
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
                    <Link href={`/auth/dashboard/${session.id}`}>Dashboard</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink asChild>
                    <Link href={`/auth/dashboard/${session.id}/reports`}>Reports</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>{report.claim_number}</BreadcrumbPage>
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
          {/* Report Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            {/* Report title - hidden on mobile, shown in breadcrumbs instead */}
            <h1 className="hidden sm:block text-xl sm:text-2xl font-bold text-foreground truncate min-w-0">
              {report.claim_number}
            </h1>

            <div className="flex items-center justify-end gap-2">
              {/* Action buttons */}
              <div className="flex items-center gap-2 flex-wrap">
                <ReportFeedbackButton reportId={report.$id} />

                {/* Download Buttons - Only shown to insurance adjusters and admins */}
                {canDownloadFiles && (
                  <>
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
                  </>
                )}

                <ReportActions
                  reportData={{
                    report: report as unknown as Record<string, unknown>,
                    damageDetails: allDamageDetails as unknown as Record<string, unknown>[],
                    vehicleVerification: vehicleVerification as unknown as Record<string, unknown> | null,
                    assessment: assessment as unknown as Record<string, unknown> | null,
                    reportNumber: report.claim_number,
                  }}
                />

                {report.claim_status && report.claim_status !== 'pending' && (
                  <Badge className={getStatusColor(report.claim_status)}>
                    {report.claim_status}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Total Loss Indicator */}
          {(() => {
            const repairCost = report.estimated_total_repair_cost || 0;
            const isTotalLoss = report.overall_severity === 'total_loss';
            // Estimate vehicle value from assessment data if available
            const coveredAmount = assessment?.covered_amount || 0;
            const totalEstimate = assessment?.total_repair_estimate || repairCost;
            // Total loss threshold: repair cost exceeds 70% of estimated vehicle value
            // Use covered_amount as proxy for vehicle value when available
            const vehicleValueEstimate = coveredAmount > totalEstimate ? coveredAmount * 1.3 : 0;
            const totalLossRatio = vehicleValueEstimate > 0 ? (totalEstimate / vehicleValueEstimate) * 100 : 0;
            const isNearTotalLoss = totalLossRatio >= 70 && !isTotalLoss;

            if (!isTotalLoss && !isNearTotalLoss) return null;

            return (
              <div className={cn(
                "rounded-lg border-2 p-4",
                isTotalLoss
                  ? "border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-950/40"
                  : "border-orange-300 bg-orange-50 dark:border-orange-800 dark:bg-orange-950/40"
              )}>
                <div className="flex items-start gap-3">
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0",
                    isTotalLoss
                      ? "bg-red-100 dark:bg-red-900/50"
                      : "bg-orange-100 dark:bg-orange-900/50"
                  )}>
                    <HugeiconsIcon icon={AlertCircleIcon} size={20} className={
                      isTotalLoss ? "text-red-600 dark:text-red-400" : "text-orange-600 dark:text-orange-400"
                    } />
                  </div>
                  <div>
                    <h3 className={cn(
                      "text-sm font-bold",
                      isTotalLoss
                        ? "text-red-900 dark:text-red-300"
                        : "text-orange-900 dark:text-orange-300"
                    )}>
                      {isTotalLoss ? "Total Loss Determination" : "Near Total Loss Warning"}
                    </h3>
                    <p className={cn(
                      "text-sm mt-1",
                      isTotalLoss
                        ? "text-red-700 dark:text-red-400"
                        : "text-orange-700 dark:text-orange-400"
                    )}>
                      {isTotalLoss
                        ? "The AI assessment has determined this vehicle is a total loss. Repair costs exceed the vehicle's value, making replacement more economical than repair."
                        : `Repair costs represent approximately ${totalLossRatio.toFixed(0)}% of the estimated vehicle value, approaching the typical total loss threshold (70-80%). A professional appraisal is recommended.`
                      }
                    </p>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Estimated Repair Cost Summary */}
          {report.estimated_total_repair_cost > 0 && !assessment && (
            <div className="bg-card rounded-lg border border-border overflow-hidden">
              <div className="bg-muted px-4 py-2 border-b border-border">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Estimated Repair Cost
                </h2>
              </div>
              <div className="px-4 py-4 flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total Estimated Cost</span>
                <CurrencyAmount
                  amount={report.estimated_total_repair_cost}
                  className="text-lg font-bold text-foreground"
                />
              </div>
              <div className="px-4 pb-3">
                <p className="text-xs text-muted-foreground">
                  This is an AI-generated estimate. Actual repair costs may vary. No insurance policy was provided for this report.
                </p>
              </div>
            </div>
          )}

          {/* Unified Table */}
          <div className="bg-card rounded-lg border border-border overflow-hidden">
            {/* Report Overview Section */}
            <div className="bg-muted px-4 py-2 border-b border-border flex items-center justify-between">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Report Overview
              </h2>
              <span className="text-sm text-muted-foreground">
                {new Date(report.analysis_timestamp).toLocaleDateString()}
              </span>
            </div>
            <div className="divide-y divide-border">
              <div className="flex justify-between items-center px-4 py-3">
                <span className="text-sm text-muted-foreground">Damage Type</span>
                <span className="text-sm font-medium text-foreground capitalize">{report.damage_type}</span>
              </div>
              <div className="flex justify-between items-center px-4 py-3">
                <span className="text-sm text-muted-foreground">Overall Severity</span>
                <Badge className={getSeverityColor(report.overall_severity)}>
                  {report.overall_severity}
                </Badge>
              </div>
              <div className="flex justify-between items-center px-4 py-3">
                <span className="text-sm text-muted-foreground">Confidence Score</span>
                <span className="text-sm font-medium text-foreground">
                  {(report.confidence_score * 100).toFixed(0)}%
                </span>
              </div>
              {report.investigation_needed && (
                <div className="px-4 py-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Investigation</span>
                    <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300">Required</Badge>
                  </div>
                  {report.investigation_reason && (
                    <p className="text-xs text-muted-foreground mt-2">{report.investigation_reason}</p>
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
                    <CurrencyAmount amount={assessment.total_repair_estimate} className="text-sm font-medium text-foreground" />
                  </div>
                  <div className="flex justify-between items-center px-4 py-3">
                    <span className="text-sm text-muted-foreground">Covered Amount</span>
                    <CurrencyAmount amount={assessment.covered_amount} className="text-sm font-medium text-foreground" />
                  </div>
                  <div className="flex justify-between items-center px-4 py-3">
                    <span className="text-sm text-muted-foreground">Deductible</span>
                    <CurrencyAmount amount={assessment.deductible} className="text-sm font-medium text-foreground" />
                  </div>
                  <div className="flex justify-between items-center px-4 py-3 bg-green-50 dark:bg-green-950/30">
                    <span className="text-sm font-semibold text-foreground">Estimated Payout</span>
                    <CurrencyAmount amount={assessment.estimated_payout} className="text-sm font-bold text-green-600 dark:text-green-400" />
                  </div>
                </div>
              </>
            )}

            {/* Limited Assessment Data Section */}
            {(report.confidence_score < 0.6 || report.vehicle_verification_status === 'insufficient_data') && (
              <>
                <div className="bg-muted px-4 py-2 border-y border-border">
                  <div className="flex items-center gap-2">
                    <HugeiconsIcon icon={AlertCircleIcon} size={16} className="text-muted-foreground flex-shrink-0" />
                    <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                      Limited Assessment Data
                    </h2>
                  </div>
                </div>
                <div className="divide-y divide-border">
                  <div className="px-4 py-3">
                    <p className="text-sm text-muted-foreground">
                      {report.confidence_reasoning || 'The analysis confidence is low due to insufficient or unclear data in the provided media. Results should be verified manually.'}
                    </p>
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

                {/* Mobile: Grouped by source */}
                <div className="md:hidden">
                  {/* From Media Section */}
                  <div className="bg-muted/30 px-4 py-2 border-b border-border">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      From Media
                    </span>
                  </div>
                  <div className="divide-y divide-border">
                    <div className="flex justify-between items-center px-4 py-2">
                      <span className="text-sm text-muted-foreground">License Plate</span>
                      <span className="text-sm font-medium text-foreground">{vehicleVerification.video_license_plate || '—'}</span>
                    </div>
                    <div className="flex justify-between items-center px-4 py-2">
                      <span className="text-sm text-muted-foreground">VIN</span>
                      <span className="text-sm font-medium text-foreground">{vehicleVerification.video_vin || '—'}</span>
                    </div>
                    <div className="flex justify-between items-center px-4 py-2">
                      <span className="text-sm text-muted-foreground">Make</span>
                      <span className="text-sm font-medium text-foreground">{vehicleVerification.video_make || '—'}</span>
                    </div>
                    <div className="flex justify-between items-center px-4 py-2">
                      <span className="text-sm text-muted-foreground">Model</span>
                      <span className="text-sm font-medium text-foreground">{vehicleVerification.video_model || '—'}</span>
                    </div>
                    <div className="flex justify-between items-center px-4 py-2">
                      <span className="text-sm text-muted-foreground">Year</span>
                      <span className="text-sm font-medium text-foreground">{vehicleVerification.video_year || '—'}</span>
                    </div>
                    <div className="flex justify-between items-center px-4 py-2">
                      <span className="text-sm text-muted-foreground">Color</span>
                      <span className="text-sm font-medium text-foreground">{vehicleVerification.video_color || '—'}</span>
                    </div>
                  </div>

                  {/* From Policy Section */}
                  <div className="bg-muted/30 px-4 py-2 border-y border-border mt-2">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      From Policy
                    </span>
                  </div>
                  <div className="divide-y divide-border">
                    <div className="flex justify-between items-center px-4 py-2">
                      <span className="text-sm text-muted-foreground">License Plate</span>
                      <span className="text-sm font-medium text-foreground">{vehicleVerification.policy_license_plate || '—'}</span>
                    </div>
                    <div className="flex justify-between items-center px-4 py-2">
                      <span className="text-sm text-muted-foreground">VIN</span>
                      <span className="text-sm font-medium text-foreground">{vehicleVerification.policy_vin || '—'}</span>
                    </div>
                    <div className="flex justify-between items-center px-4 py-2">
                      <span className="text-sm text-muted-foreground">Make</span>
                      <span className="text-sm font-medium text-foreground">{vehicleVerification.policy_make || '—'}</span>
                    </div>
                    <div className="flex justify-between items-center px-4 py-2">
                      <span className="text-sm text-muted-foreground">Model</span>
                      <span className="text-sm font-medium text-foreground">{vehicleVerification.policy_model || '—'}</span>
                    </div>
                    <div className="flex justify-between items-center px-4 py-2">
                      <span className="text-sm text-muted-foreground">Year</span>
                      <span className="text-sm font-medium text-foreground">{vehicleVerification.policy_year || '—'}</span>
                    </div>
                    <div className="flex justify-between items-center px-4 py-2">
                      <span className="text-sm text-muted-foreground">Color</span>
                      <span className="text-sm font-medium text-foreground">{vehicleVerification.policy_color || '—'}</span>
                    </div>
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
            {visibleDamages.length > 0 && (
              <>
                <div className="bg-muted px-4 py-2 border-y border-border">
                  <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    Damaged Parts
                  </h2>
                </div>
                <div className="divide-y divide-border">
                  {visibleDamages.map((detail) => (
                    <div key={detail.$id} className="px-4 py-3">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-foreground">{detail.part_name}</span>
                          {detail.estimated_repair_cost && (
                            <span className="text-sm font-semibold text-muted-foreground">— {detail.estimated_repair_cost}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5">
                          {detail.repair_or_replace && detail.repair_or_replace !== 'undetermined' && (
                            <Badge className={
                              detail.repair_or_replace === 'replace'
                                ? 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'
                                : detail.repair_or_replace === 'repair'
                                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300'
                                  : 'bg-muted text-muted-foreground'
                            }>
                              {detail.repair_or_replace}
                            </Badge>
                          )}
                          <Badge className={getSeverityColor(detail.severity)}>
                            {detail.severity}
                          </Badge>
                        </div>
                      </div>
                      {detail.description && (
                        <p className="text-sm text-muted-foreground mt-1">{detail.description}</p>
                      )}
                      {detail.repair_or_replace_reason && (
                        <p className="text-xs text-muted-foreground mt-1 italic">
                          {detail.repair_or_replace_reason}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Inferred Internal Damages Section */}
            {inferredDamages.length > 0 && (
              <>
                <div className="border-t border-dashed border-border" />
                <div className="bg-muted px-4 py-2 border-b border-border">
                  <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    Inferred Internal Damages
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Possible internal damage based on visible external damage. Not included in cost estimates.
                  </p>
                </div>
                <div className="divide-y divide-border">
                  {inferredDamages.map((detail) => (
                    <div key={detail.$id} className="px-4 py-3 bg-muted/10">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-foreground">{detail.part_name}</span>
                        {detail.inferred_likelihood && (
                          <Badge className={getLikelihoodColor(detail.inferred_likelihood)}>
                            {detail.inferred_likelihood}
                          </Badge>
                        )}
                      </div>
                      {detail.description && (
                        <p className="text-sm text-muted-foreground">{detail.description}</p>
                      )}
                      {detail.inferred_based_on && (
                        <p className="text-xs text-muted-foreground mt-1">Based on: {detail.inferred_based_on}</p>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
    </SidebarInset>
  );
}
