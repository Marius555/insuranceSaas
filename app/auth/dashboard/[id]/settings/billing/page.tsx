"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/lib/context/user-context";
import {
  getBillingData,
  changePlan,
  cancelSubscription,
  type BillingDataResult,
  type InvoiceData,
} from "@/lib/stripe/billingActions";
import { createCheckoutSession } from "@/lib/stripe/createCheckoutSession";
import {
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CurrentPlanCard } from "@/components/dashboardComponents/billing/current-plan-card";
import { ChangePlanSection } from "@/components/dashboardComponents/billing/change-plan-section";
import { InvoiceList } from "@/components/dashboardComponents/billing/invoice-list";
import { InvoiceDetailDialog } from "@/components/dashboardComponents/billing/invoice-detail-dialog";
import { CancelConfirmDialog } from "@/components/dashboardComponents/billing/cancel-confirm-dialog";

export default function BillingSettingsPage() {
  const { userId, email, pricingPlan } = useUser();
  const router = useRouter();

  const [billingData, setBillingData] = useState<BillingDataResult | null>(null);
  const [actionPending, setActionPending] = useState<"change-plan" | "cancel" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceData | null>(null);
  const [changePlanTarget, setChangePlanTarget] = useState<"pro" | "max" | null>(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  const fetchBilling = async () => {
    const result = await getBillingData(userId);
    if (result.success) {
      setBillingData(result);
    } else {
      setError(result.message);
    }
  };

  useEffect(() => {
    fetchBilling();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const handleConfirmChangePlan = async () => {
    if (!changePlanTarget) return;
    setActionPending("change-plan");
    setError(null);
    const result = await changePlan(userId, changePlanTarget);
    if (result.success) {
      setChangePlanTarget(null);
      router.refresh();
      await fetchBilling();
    } else {
      setError(result.message ?? "Failed to switch plan.");
    }
    setActionPending(null);
  };

  const handleConfirmCancel = async () => {
    setActionPending("cancel");
    setError(null);
    const result = await cancelSubscription(userId);
    if (result.success) {
      setShowCancelDialog(false);
      setBillingData(prev =>
        prev?.subscription
          ? { ...prev, subscription: { ...prev.subscription, cancelAtPeriodEnd: true } }
          : prev
      );
      await fetchBilling();
    } else {
      setError(result.message ?? "Failed to cancel subscription.");
    }
    setActionPending(null);
  };

  const handleCheckout = async (plan: "pro" | "max") => {
    setActionPending("change-plan");
    setError(null);
    const result = await createCheckoutSession(userId, plan, email);
    if (result.success) {
      window.location.href = result.url;
    } else {
      setError(result.message);
      setActionPending(null);
    }
  };

  const periodEndDate = billingData?.subscription
    ? new Date(billingData.subscription.currentPeriodEnd * 1000).toLocaleDateString()
    : null;

  return (
    <div className="flex flex-col gap-6">
      <CardHeader>
        <CardTitle>Billing</CardTitle>
        <CardDescription>
          Manage your subscription plan and view invoice history
        </CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-6">
        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}

        {billingData === null ? (
          <div className="flex flex-col gap-4">
            <Skeleton className="h-20 w-full rounded-lg" />
            <Skeleton className="h-36 w-full rounded-lg" />
            <Skeleton className="h-32 w-full rounded-lg" />
          </div>
        ) : (
          <>
            <CurrentPlanCard
              plan={pricingPlan}
              subscription={billingData?.subscription ?? null}
              actionPending={actionPending}
              onCancel={() => setShowCancelDialog(true)}
            />

            <ChangePlanSection
              currentPlan={pricingPlan}
              changePlanTarget={changePlanTarget}
              actionPending={actionPending}
              onSelectTarget={setChangePlanTarget}
              onConfirmChange={handleConfirmChangePlan}
              onCancelDialog={() => setChangePlanTarget(null)}
              onCheckout={handleCheckout}
            />

            <InvoiceList
              invoices={billingData?.invoices ?? []}
              onSelect={setSelectedInvoice}
            />
          </>
        )}
      </CardContent>

      <InvoiceDetailDialog
        invoice={selectedInvoice}
        onClose={() => setSelectedInvoice(null)}
      />

      <CancelConfirmDialog
        open={showCancelDialog}
        periodEndDate={periodEndDate}
        isPending={actionPending === "cancel"}
        onConfirm={handleConfirmCancel}
        onClose={() => setShowCancelDialog(false)}
      />
    </div>
  );
}
