"use client";

import { useMemo } from "react";
import { CurrencyAmount } from "@/components/ui/currency-amount";
import type { ReportDocument } from "@/lib/types/appwrite";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  File01Icon,
  CreditCardIcon,
  Shield01Icon,
  CheckmarkCircle02Icon,
} from "@hugeicons/core-free-icons";
import type { IconSvgElement } from "@hugeicons/react";

interface DashboardStatsProps {
  reports: ReportDocument[];
}

export function DashboardStats({ reports }: DashboardStatsProps) {
  const stats = useMemo(() => {
    const totalReports = reports.length;

    const totalCost = reports.reduce(
      (sum, r) => sum + (r.estimated_total_repair_cost || 0),
      0
    );

    const avgConfidence =
      reports.length > 0
        ? Math.round(
            (reports.reduce((sum, r) => sum + (r.confidence_score || 0), 0) /
              reports.length) *
              100
          )
        : null;

    const analyzed = reports.filter((r) => r.claim_status !== "pending");
    const approvedOrPartial = analyzed.filter(
      (r) => r.claim_status === "approved" || r.claim_status === "partial"
    );
    const approvalRate =
      analyzed.length > 0
        ? Math.round((approvedOrPartial.length / analyzed.length) * 100)
        : null;

    return { totalReports, totalCost, avgConfidence, approvalRate };
  }, [reports]);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <StatCard
        label="Total Reports"
        sublabel="All Claims"
        value={<span>{stats.totalReports}</span>}
        icon={File01Icon}
      />
      <StatCard
        label="Total Cost"
        sublabel="Estimated Repair"
        value={
          <CurrencyAmount
            amount={stats.totalCost}
            className="text-2xl font-bold"
          />
        }
        icon={CreditCardIcon}
      />
      <StatCard
        label="Avg Confidence"
        sublabel="AI Accuracy"
        value={
          <span>
            {stats.avgConfidence !== null ? `${stats.avgConfidence}%` : "—"}
          </span>
        }
        icon={Shield01Icon}
      />
      <StatCard
        label="Approval Rate"
        sublabel="Approved / Partial"
        value={
          <span>
            {stats.approvalRate !== null ? `${stats.approvalRate}%` : "—"}
          </span>
        }
        icon={CheckmarkCircle02Icon}
      />
    </div>
  );
}

function StatCard({
  label,
  sublabel,
  value,
  icon,
}: {
  label: string;
  sublabel: string;
  value: React.ReactNode;
  icon?: IconSvgElement;
}) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-start justify-between mb-2">
        <div className="text-2xl font-bold text-foreground">{value}</div>
        {icon && (
          <div className="size-8 rounded-md bg-primary/10 flex items-center justify-center text-primary shrink-0">
            <HugeiconsIcon icon={icon} className="size-4" />
          </div>
        )}
      </div>
      <div className="text-sm font-medium text-foreground">{label}</div>
      <div className="text-xs text-muted-foreground">{sublabel}</div>
    </div>
  );
}
