"use client"

import { useState, useTransition } from "react"
import { useUser } from "@/lib/context/user-context"
import { submitUserSettingsAction } from "@/appwrite/submitUserSettingsAction"
import { Button } from "@/components/ui/button"
import {
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Field,
  FieldLabel,
  FieldDescription,
  FieldGroup,
  FieldSeparator,
} from "@/components/ui/field"

export default function PrivacySettingsPage() {
  const user = useUser()

  const [profileVisibility, setProfileVisibility] = useState<"public" | "private">(user.profileVisibility)
  const [dataSharing, setDataSharing] = useState(user.dataSharing)
  const [analyticsEnabled, setAnalyticsEnabled] = useState(user.analyticsEnabled)
  const [activityStatus, setActivityStatus] = useState(user.activityStatus)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    startTransition(async () => {
      const result = await submitUserSettingsAction({
        profile_visibility: profileVisibility,
        data_sharing: dataSharing,
        analytics_enabled: analyticsEnabled,
        activity_status: activityStatus,
      })

      if (!result.success) {
        setError(result.message || "Failed to save settings")
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <CardHeader>
        <CardTitle>Privacy</CardTitle>
        <CardDescription>
          Control your data and visibility preferences
        </CardDescription>
      </CardHeader>
      <CardContent>
        <FieldGroup>
          <Field>
            <FieldLabel>Profile Visibility</FieldLabel>
            <FieldDescription>
              Choose who can see your profile information
            </FieldDescription>
            <Select value={profileVisibility} onValueChange={(v) => setProfileVisibility(v as "public" | "private")}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select visibility" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="public">Public</SelectItem>
                <SelectItem value="private">Private</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <FieldSeparator />
          <Field orientation="horizontal">
            <FieldLabel>Data Sharing</FieldLabel>
            <FieldDescription>
              Allow sharing report data with insurance partners
            </FieldDescription>
            <Switch
              checked={dataSharing}
              onCheckedChange={setDataSharing}
            />
          </Field>
          <Field orientation="horizontal">
            <FieldLabel>Analytics</FieldLabel>
            <FieldDescription>
              Help improve the platform by sharing usage data
            </FieldDescription>
            <Switch
              checked={analyticsEnabled}
              onCheckedChange={setAnalyticsEnabled}
            />
          </Field>
          <Field orientation="horizontal">
            <FieldLabel>Activity Status</FieldLabel>
            <FieldDescription>
              Show when you are active on the platform
            </FieldDescription>
            <Switch
              checked={activityStatus}
              onCheckedChange={setActivityStatus}
            />
          </Field>
        </FieldGroup>
      </CardContent>
      <CardFooter className="flex flex-col items-stretch gap-3">
        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending && (
            <svg className="size-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          )}
          Save Changes
        </Button>
        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}
      </CardFooter>
    </form>
  )
}
