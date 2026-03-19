"use client";

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { Cancel01Icon } from "@hugeicons/core-free-icons";

interface CancelConfirmDialogProps {
  open: boolean;
  periodEndDate: string | null;
  isPending: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export function CancelConfirmDialog({
  open,
  periodEndDate,
  isPending,
  onConfirm,
  onClose,
}: CancelConfirmDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={(o) => { if (!o && !isPending) onClose(); }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex flex-row w-full justify-between items-center">
            <AlertDialogTitle>Cancel Subscription</AlertDialogTitle>
            <AlertDialogCancel variant="ghost" disabled={isPending}>
              <HugeiconsIcon icon={Cancel01Icon} className="hover:cursor-pointer" />
            </AlertDialogCancel>
          </div>
          <AlertDialogDescription>
            Your subscription will remain active until the end of the current billing period
            {periodEndDate ? ` on ${periodEndDate}` : ""}. After that, your account will
            revert to the free plan. You can resubscribe at any time.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col items-stretch sm:flex-row sm:items-center">
          <div className="flex gap-2 sm:ml-auto">
            <AlertDialogCancel disabled={isPending}>Keep Subscription</AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={onConfirm}
              disabled={isPending}
            >
              {isPending ? "Cancelling..." : "Cancel Subscription"}
            </Button>
          </div>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
