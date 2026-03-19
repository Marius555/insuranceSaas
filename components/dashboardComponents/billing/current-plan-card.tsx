"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { SubscriptionData } from "@/lib/stripe/billingActions";

interface CurrentPlanCardProps {
  plan: "free" | "pro" | "max";
  subscription: SubscriptionData | null;
  actionPending: string | null;
  onCancel: () => void;
}

const planBadgeVariant: Record<string, "secondary" | "default" | "outline"> = {
  free: "secondary",
  pro: "default",
  max: "outline",
};

export function CurrentPlanCard({
  plan,
  subscription,
  actionPending,
  onCancel,
}: CurrentPlanCardProps) {
  const isCancelling = subscription?.cancelAtPeriodEnd ?? false;
  const periodEndDate = subscription
    ? new Date(subscription.currentPeriodEnd * 1000).toLocaleDateString()
    : null;

  return (
    <div className="rounded-lg border p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Current Plan</p>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant={planBadgeVariant[plan] ?? "secondary"} className="capitalize">
              {plan}
            </Badge>
          </div>
        </div>
        {subscription && !isCancelling && plan !== "free" && (
          <Button
            variant="outline"
            size="sm"
            onClick={onCancel}
            disabled={actionPending === "cancel"}
          >
            {actionPending === "cancel" ? "Cancelling..." : "Cancel Subscription"}
          </Button>
        )}
      </div>

      {periodEndDate && (
        <p className="text-sm text-muted-foreground">
          {isCancelling ? (
            <span className="text-muted-foreground">
              Cancels on <span className="font-medium">{periodEndDate}</span>
            </span>
          ) : (
            <>
              Renews on <span className="font-medium">{periodEndDate}</span>
            </>
          )}
        </p>
      )}
    </div>
  );
}
