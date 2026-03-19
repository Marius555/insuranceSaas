"use client";

import { useState } from "react";
import { deleteUserAccount } from "@/appwrite/deleteUserAccount";
import { Button } from "@/components/ui/button";
import {
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { FieldTitle, FieldGroup } from "@/components/ui/field";
import { HugeiconsIcon } from "@hugeicons/react";
import { Cancel01Icon, Delete02Icon } from "@hugeicons/core-free-icons";

export default function AccountSettingsPage() {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDeleteAccount = async () => {
    setError(null);
    setIsPending(true);
    try {
      const result = await deleteUserAccount();
      if (result.success) {
        window.location.href = "/";
      } else {
        setError(result.message ?? "Failed to delete account.");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <CardHeader>
        <CardTitle>Account</CardTitle>
        <CardDescription>
          Manage your account security and preferences
        </CardDescription>
      </CardHeader>
      <CardContent>
        <FieldGroup>
          <div className="rounded-lg border border-destructive/50 p-4">
            <FieldTitle className="text-destructive">Danger Zone</FieldTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Permanently delete your account and all associated data. This
              action cannot be undone.
            </p>
            <AlertDialog open={isOpen} onOpenChange={(open) => { if (!isPending) setIsOpen(open); }}>
              <AlertDialogTrigger asChild>
                <Button
                  variant="destructive"
                  className="mt-4 w-full"
                  disabled={isPending}
                  onClick={() => setIsOpen(true)}
                >
                  {isPending ? "Deleting..." : "Delete Account"}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <div className="flex flex-row w-full justify-between items-center">
                    <AlertDialogTitle>Delete Account</AlertDialogTitle>
                    <AlertDialogCancel variant="ghost" disabled={isPending}>
                      <HugeiconsIcon
                        icon={Cancel01Icon}
                        className="hover:cursor-pointer"
                      />
                    </AlertDialogCancel>
                  </div>
                  <AlertDialogDescription>
                    This will permanently delete your account and all associated
                    data including reports and settings. This action cannot be
                    undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="flex-col items-stretch sm:flex-row sm:items-center">
                  {error && (
                    <p className="text-sm text-destructive flex-1">{error}</p>
                  )}
                  <div className="flex gap-2 sm:ml-auto">
                    <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
                    <Button
                      variant="destructive"
                      onClick={handleDeleteAccount}
                      disabled={isPending}
                    >
                      {isPending ? (
                        <>Deleting...</>
                      ) : (
                        <>
                          Delete Account
                          <HugeiconsIcon icon={Delete02Icon} />
                        </>
                      )}
                    </Button>
                  </div>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </FieldGroup>
      </CardContent>
    </div>
  );
}
