"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import type { ReportDamageDetailDocument } from "@/lib/types/appwrite";

interface InferredDamagesSectionProps {
  inferredDamages: ReportDamageDetailDocument[];
  getLikelihoodColor: Record<string, string>;
}

export function InferredDamagesSection({
  inferredDamages,
  getLikelihoodColor,
}: InferredDamagesSectionProps) {
  const [includeInTotal, setIncludeInTotal] = useState(false);

  // Parse cost ranges to compute a supplementary total
  const parsedCosts = inferredDamages
    .filter((d) => d.estimated_repair_cost)
    .map((d) => {
      const match = d.estimated_repair_cost!.match(
        /[\$£€]?([\d,]+(?:\.\d+)?)\s*[-–]\s*[\$£€]?([\d,]+(?:\.\d+)?)/
      );
      if (match) {
        const low = parseFloat(match[1].replace(/,/g, ""));
        const high = parseFloat(match[2].replace(/,/g, ""));
        return { low, high };
      }
      return null;
    })
    .filter(Boolean) as { low: number; high: number }[];

  const totalLow = parsedCosts.reduce((sum, c) => sum + c.low, 0);
  const totalHigh = parsedCosts.reduce((sum, c) => sum + c.high, 0);
  const hasEstimates = parsedCosts.length > 0;

  const formatCurrency = (amount: number) =>
    `$${amount.toLocaleString("en-US")}`;

  return (
    <>
      <div className="border-t border-dashed border-border" />
      <div className="bg-muted px-4 py-2 border-b border-border">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Inferred Internal Damages
          </h2>
          {hasEstimates && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                Include in total
              </span>
              <Switch
                size="sm"
                checked={includeInTotal}
                onCheckedChange={setIncludeInTotal}
              />
            </div>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">
          {includeInTotal
            ? "Estimated costs for possible internal damage are shown below."
            : "Possible internal damage based on visible external damage. Not included in cost estimates."}
        </p>
      </div>
      <div className="divide-y divide-border">
        {inferredDamages.map((detail) => (
          <div key={detail.$id} className="px-4 py-3 bg-muted/10">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-foreground capitalize">
                  {detail.part_name}
                </span>
                {detail.estimated_repair_cost && (
                  <span className="text-sm font-semibold text-muted-foreground">
                    {detail.estimated_repair_cost}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                {detail.repair_or_replace &&
                  detail.repair_or_replace !== "undetermined" && (
                    <span className="text-sm text-muted-foreground">
                      {detail.repair_or_replace}
                    </span>
                  )}
                {detail.inferred_likelihood && (
                  <Badge
                    className={
                      getLikelihoodColor[detail.inferred_likelihood] ||
                      "bg-muted text-muted-foreground"
                    }
                  >
                    {detail.inferred_likelihood}
                  </Badge>
                )}
              </div>
            </div>
            {detail.description && (
              <p className="text-sm text-muted-foreground">
                {detail.description}
              </p>
            )}
            {detail.inferred_based_on && (
              <p className="text-xs text-muted-foreground mt-1">
                Based on: {detail.inferred_based_on}
              </p>
            )}
          </div>
        ))}
      </div>
      {includeInTotal && hasEstimates && (
        <div className="px-4 py-3 bg-amber-50 dark:bg-amber-950/30 border-t border-amber-200 dark:border-amber-900">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-amber-900 dark:text-amber-300">
              Additional Inferred Cost Estimate
            </span>
            <span className="text-sm font-bold text-amber-900 dark:text-amber-300">
              {formatCurrency(totalLow)} &ndash; {formatCurrency(totalHigh)}
            </span>
          </div>
          <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
            These costs are estimates for possible hidden damage and may not
            apply. A physical inspection is recommended.
          </p>
        </div>
      )}
    </>
  );
}
