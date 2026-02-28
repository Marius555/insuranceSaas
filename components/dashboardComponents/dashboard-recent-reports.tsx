"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { CurrencyAmount } from "@/components/ui/currency-amount";
import type { ReportDocument } from "@/lib/types/appwrite";

interface DashboardRecentReportsProps {
  reports: ReportDocument[];
  userId: string;
}

function getRelativeTime(dateStr: string): string {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "1 day ago";
  if (diffDays < 30) return `${diffDays} days ago`;
  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths === 1) return "1 month ago";
  return `${diffMonths} months ago`;
}

const statusVariants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  approved: "default",
  analyzed: "default",
  pending: "secondary",
  denied: "destructive",
  partial: "outline",
  needs_investigation: "outline",
};

export function DashboardRecentReports({ reports, userId }: DashboardRecentReportsProps) {
  return (
    <div className="rounded-lg border bg-card p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-foreground">Recent Reports</span>
        <Link
          href={`/auth/dashboard/${userId}/reports`}
          className="text-xs text-primary hover:underline"
        >
          View all →
        </Link>
      </div>

      {reports.length === 0 ? (
        <p className="text-sm text-muted-foreground py-2">No reports yet.</p>
      ) : (
        <div className="divide-y divide-border -mx-4">
          {reports.map((report) => (
            <Link
              key={report.$id}
              href={`/auth/reports/${report.$id}`}
              className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/50 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium truncate">
                    {report.claim_number}
                  </span>
                  {report.claim_status !== "pending" && (
                    <Badge
                      variant={statusVariants[report.claim_status] ?? "secondary"}
                      className="text-xs shrink-0"
                    >
                      {report.claim_status.replace("_", " ")}
                    </Badge>
                  )}
                </div>
                <span className="text-xs text-muted-foreground capitalize">
                  {report.damage_type.replace("_", " ")}
                </span>
              </div>
              <div className="text-right shrink-0">
                <CurrencyAmount
                  amount={report.estimated_total_repair_cost}
                  className="text-sm font-medium"
                />
                <div className="text-xs text-muted-foreground">
                  {getRelativeTime(report.analysis_timestamp)}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
