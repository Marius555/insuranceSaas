"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { deleteUserAccount } from "@/appwrite/deleteUserAccount"
import { Button } from "@/components/ui/button"
import {
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  FieldTitle,
  FieldGroup,
} from "@/components/ui/field"

export default function AccountSettingsPage() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const handleDeleteAccount = () => {
    setError(null)
    startTransition(async () => {
      const result = await deleteUserAccount()
      if (result.success) {
        router.push("/")
      } else {
        setError(result.message)
      }
    })
  }

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
            {error && (
              <p className="mt-2 text-sm text-destructive">{error}</p>
            )}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="mt-4 w-full" disabled={isPending}>
                  {isPending ? "Deleting..." : "Delete Account"}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Account</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete your account and all associated
                    data including reports and settings. This action cannot be
                    undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    variant="destructive"
                    onClick={handleDeleteAccount}
                    disabled={isPending}
                  >
                    {isPending ? "Deleting..." : "Delete Account"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </FieldGroup>
      </CardContent>
    </div>
  )
}
