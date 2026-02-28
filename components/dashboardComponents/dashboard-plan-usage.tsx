"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useUser } from "@/lib/context/user-context";
import { HugeiconsIcon } from "@hugeicons/react";
import { Tick02Icon } from "@hugeicons/core-free-icons";

const PLAN_BENEFITS: Record<string, string[]> = {
  free: [
    "1 AI analysis per day",
    "Basic damage assessment",
    "Video & image upload",
  ],
  pro: [
    "20 AI analyses per day",
    "Policy coverage matching",
    "Fraud detection",
    "Advanced damage breakdown",
  ],
  max: [
    "99 AI analyses per day",
    "All Pro features",
    "Priority processing",
    "Full claims history",
  ],
};

export function DashboardPlanUsage() {
  const { pricingPlan, evaluationTimes, evaluationLimit } = useUser();

  const used = evaluationLimit - evaluationTimes;
  const usedFraction = evaluationLimit > 0 ? used / evaluationLimit : 0;
  const remainingFraction = evaluationLimit > 0 ? evaluationTimes / evaluationLimit : 0;

  const barColor =
    remainingFraction >= 0.5
      ? "bg-green-500"
      : remainingFraction >= 0.2
        ? "bg-yellow-500"
        : "bg-red-500";

  const planLabel =
    pricingPlan.charAt(0).toUpperCase() + pricingPlan.slice(1);

  return (
    <div className="rounded-lg border bg-card p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-foreground">Plan Usage</span>
        <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
          {planLabel}
        </span>
      </div>

      <div>
        <p className="text-sm text-muted-foreground mb-1.5">
          <span className="font-medium text-foreground">{evaluationTimes}</span>
          {" of "}
          <span className="font-medium text-foreground">{evaluationLimit}</span>
          {" analyses remaining"}
        </p>
        <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${barColor}`}
            style={{ width: `${Math.round(usedFraction * 100)}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-1">Resets daily.</p>
      </div>

      {pricingPlan === "max" ? (
        <p className="text-xs text-muted-foreground">You&apos;re on the Max plan.</p>
      ) : (
        <Link href="/pricing">
          <Button variant="outline" size="sm" className="w-full">
            Upgrade Plan
          </Button>
        </Link>
      )}

      {(PLAN_BENEFITS[pricingPlan] ?? []).length > 0 && (
        <ul className="flex flex-col gap-1 mt-1">
          {(PLAN_BENEFITS[pricingPlan] ?? []).map((benefit) => (
            <li key={benefit} className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <HugeiconsIcon icon={Tick02Icon} className="size-3 text-primary shrink-0" />
              {benefit}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
