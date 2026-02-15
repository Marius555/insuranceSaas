"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { CurrencyAmount } from "@/components/ui/currency-amount";
import type { ReportDocument } from "@/lib/types/appwrite";

interface ClaimsHistorySummaryProps {
  reports: ReportDocument[];
}

export function ClaimsHistorySummary({ reports }: ClaimsHistorySummaryProps) {
  // Capture current time in state to satisfy React purity rules
  const [mountTime] = useState(() => Date.now());

  const stats = useMemo(() => {
    if (reports.length === 0) return null;

    const totalCost = reports.reduce(
      (sum, r) => sum + (r.estimated_total_repair_cost || 0),
      0
    );
    const avgCost = totalCost / reports.length;

    const severityCounts = { minor: 0, moderate: 0, severe: 0, total_loss: 0 };
    const typeCounts: Record<string, number> = {};
    let totalLossCount = 0;

    for (const r of reports) {
      const sev = r.overall_severity as keyof typeof severityCounts;
      if (sev in severityCounts) severityCounts[sev]++;
      if (sev === "total_loss") totalLossCount++;

      typeCounts[r.damage_type] = (typeCounts[r.damage_type] || 0) + 1;
    }

    const mostCommonType = Object.entries(typeCounts).sort(
      (a, b) => b[1] - a[1]
    )[0];

    // Recent trend: compare last 3 months to prior 3 months
    const now = mountTime;
    const threeMonthsAgo = now - 90 * 24 * 60 * 60 * 1000;
    const sixMonthsAgo = now - 180 * 24 * 60 * 60 * 1000;
    const recentReports = reports.filter(
      (r) => new Date(r.analysis_timestamp).getTime() > threeMonthsAgo
    );
    const priorReports = reports.filter((r) => {
      const t = new Date(r.analysis_timestamp).getTime();
      return t > sixMonthsAgo && t <= threeMonthsAgo;
    });

    let trend: "up" | "down" | "stable" = "stable";
    if (recentReports.length > priorReports.length * 1.2) trend = "up";
    else if (recentReports.length < priorReports.length * 0.8) trend = "down";

    return {
      totalReports: reports.length,
      totalCost,
      avgCost,
      severityCounts,
      totalLossCount,
      mostCommonType: mostCommonType?.[0] || "unknown",
      trend,
      recentCount: recentReports.length,
    };
  }, [reports, mountTime]);

  if (!stats || reports.length < 2) return null;

  return (
    <div className="bg-card rounded-lg border border-border p-4">
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
        Claims History Overview
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div>
          <p className="text-2xl font-bold text-foreground">{stats.totalReports}</p>
          <p className="text-xs text-muted-foreground">Total Claims</p>
        </div>
        <div>
          <CurrencyAmount
            amount={stats.totalCost}
            className="text-2xl font-bold text-foreground"
          />
          <p className="text-xs text-muted-foreground">Total Repair Cost</p>
        </div>
        <div>
          <CurrencyAmount
            amount={stats.avgCost}
            className="text-2xl font-bold text-foreground"
          />
          <p className="text-xs text-muted-foreground">Avg Cost per Claim</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-foreground capitalize">
            {stats.mostCommonType.replace("_", " ")}
          </p>
          <p className="text-xs text-muted-foreground">Most Common Type</p>
        </div>
      </div>

      {/* Severity breakdown */}
      <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-border">
        {stats.severityCounts.minor > 0 && (
          <Badge className="bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300">
            {stats.severityCounts.minor} Minor
          </Badge>
        )}
        {stats.severityCounts.moderate > 0 && (
          <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300">
            {stats.severityCounts.moderate} Moderate
          </Badge>
        )}
        {stats.severityCounts.severe > 0 && (
          <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300">
            {stats.severityCounts.severe} Severe
          </Badge>
        )}
        {stats.totalLossCount > 0 && (
          <Badge className="bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300">
            {stats.totalLossCount} Total Loss
          </Badge>
        )}
        <span className="text-xs text-muted-foreground self-center ml-2">
          {stats.trend === "up"
            ? "Trending up — more claims recently"
            : stats.trend === "down"
              ? "Trending down — fewer claims recently"
              : "Stable claim frequency"}
        </span>
      </div>
    </div>
  );
}
