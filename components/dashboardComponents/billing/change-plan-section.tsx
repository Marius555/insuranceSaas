"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { HugeiconsIcon } from "@hugeicons/react";
import { Cancel01Icon } from "@hugeicons/core-free-icons";

interface ChangePlanSectionProps {
  currentPlan: "free" | "pro" | "max";
  changePlanTarget: "pro" | "max" | null;
  actionPending: string | null;
  onSelectTarget: (plan: "pro" | "max") => void;
  onConfirmChange: () => void;
  onCancelDialog: () => void;
  onCheckout: (plan: "pro" | "max") => void;
}

const PLAN_DETAILS = {
  pro: {
    label: "Pro",
    price: "$19/mo",
    features: ["50 evaluations/month", "Policy analysis", "Priority support"],
  },
  max: {
    label: "Max",
    price: "$49/mo",
    features: ["Unlimited evaluations", "Advanced fraud detection", "Dedicated support"],
  },
} as const;

export function ChangePlanSection({
  currentPlan,
  changePlanTarget,
  actionPending,
  onSelectTarget,
  onConfirmChange,
  onCancelDialog,
  onCheckout,
}: ChangePlanSectionProps) {
  const isPaid = currentPlan === "pro" || currentPlan === "max";

  return (
    <>
      <div>
        <p className="text-sm font-medium mb-3">Switch Plan</p>
        <div className="grid grid-cols-2 gap-3">
          {(["pro", "max"] as const).map((plan) => {
            const details = PLAN_DETAILS[plan];
            const isCurrent = currentPlan === plan;

            return (
              <div
                key={plan}
                className={`rounded-lg border p-3 flex flex-col gap-2 ${
                  isCurrent ? "border-primary bg-primary/5" : "border-border"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">{details.label}</span>
                  {isCurrent && (
                    <Badge variant="secondary" className="text-xs">
                      Current
                    </Badge>
                  )}
                </div>
                <p className="text-sm font-medium">{details.price}</p>
                <ul className="text-xs text-muted-foreground space-y-1">
                  {details.features.map((f) => (
                    <li key={f}>• {f}</li>
                  ))}
                </ul>
                <Button
                  variant={isCurrent ? "secondary" : "default"}
                  size="sm"
                  className="mt-1 w-full"
                  disabled={isCurrent || actionPending === "change-plan"}
                  onClick={() => {
                    if (isPaid) {
                      onSelectTarget(plan);
                    } else {
                      onCheckout(plan);
                    }
                  }}
                >
                  {isCurrent
                    ? "Current Plan"
                    : actionPending === "change-plan" && changePlanTarget === plan
                    ? "Switching..."
                    : isPaid
                    ? `Switch to ${details.label}`
                    : `Upgrade to ${details.label}`}
                </Button>
              </div>
            );
          })}
        </div>
      </div>

      <AlertDialog open={changePlanTarget !== null} onOpenChange={(open) => { if (!open) onCancelDialog(); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex flex-row w-full justify-between items-center">
              <AlertDialogTitle>
                Switch to {changePlanTarget ? PLAN_DETAILS[changePlanTarget].label : ""} Plan
              </AlertDialogTitle>
              <AlertDialogCancel variant="ghost" disabled={actionPending === "change-plan"}>
                <HugeiconsIcon icon={Cancel01Icon} className="hover:cursor-pointer" />
              </AlertDialogCancel>
            </div>
            <AlertDialogDescription>
              Your plan will be switched immediately. A prorated charge or credit will be applied
              to your next invoice to account for the difference in price.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionPending === "change-plan"}>Cancel</AlertDialogCancel>
            <Button
              onClick={onConfirmChange}
              disabled={actionPending === "change-plan"}
            >
              {actionPending === "change-plan" ? "Switching..." : "Confirm Switch"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
