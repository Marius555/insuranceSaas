import { notFound, redirect } from 'next/navigation';
import { getSession } from '@/appwrite/getSession';
import { getReportById } from '@/appwrite/getReport';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CurrencyAmount } from '@/components/ui/currency-amount';
import { HugeiconsIcon } from '@hugeicons/react';
import { Image01Icon, File01Icon } from '@hugeicons/core-free-icons';
import { ReportActions } from './report-actions';
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

  const { report, damageDetails, vehicleVerification, assessment, mediaFiles, policyFile } = reportResult.data;

  const isOwner = report.user_id === session.id;
  const isPublic = report.is_public;

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
                  <BreadcrumbLink href={`/auth/dashboard/${session.id}/reports`}>
                    Reports
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>{report.claim_number}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          {/* Report Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold text-foreground truncate min-w-0">
                {report.claim_number}
              </h1>
              <span className="text-sm text-muted-foreground whitespace-nowrap flex-shrink-0">
                {new Date(report.analysis_timestamp).toLocaleDateString()}
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

              <ReportActions
                reportData={{
                  report: report as unknown as Record<string, unknown>,
                  damageDetails: damageDetails as unknown as Record<string, unknown>[],
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

          {/* Unified Table */}
          <div className="bg-card rounded-lg border border-border overflow-hidden">
            {/* Report Overview Section */}
            <div className="bg-muted px-4 py-2 border-b border-border">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Report Overview
              </h2>
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
  );
}
