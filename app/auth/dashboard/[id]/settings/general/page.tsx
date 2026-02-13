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
import { Input } from "@/components/ui/input"
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
  FieldTitle,
  FieldGroup,
  FieldSeparator,
} from "@/components/ui/field"

export default function GeneralSettingsPage() {
  const user = useUser()

  const [phone, setPhone] = useState(user.phone)
  const [emailNotifications, setEmailNotifications] = useState(user.emailNotifications)
  const [pushNotifications, setPushNotifications] = useState(user.pushNotifications)
  const [language, setLanguage] = useState(user.language)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    startTransition(async () => {
      const result = await submitUserSettingsAction({
        phone: phone || undefined,
        email_notifications: emailNotifications,
        push_notifications: pushNotifications,
        language,
      })

      if (!result.success) {
        setError(result.message || "Failed to save settings")
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <CardHeader>
        <CardTitle>General</CardTitle>
        <CardDescription>Manage your profile and preferences</CardDescription>
      </CardHeader>
      <CardContent>
        <FieldGroup>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field>
              <FieldLabel>Email</FieldLabel>
              <Input type="email" value={user.email} disabled />
            </Field>
            <Field>
              <FieldLabel>Phone</FieldLabel>
              <Input
                type="tel"
                placeholder="+1 (555) 000-0000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </Field>
          </div>
          <FieldSeparator />
          <FieldTitle>Notification Preferences</FieldTitle>
          <Field orientation="horizontal">
            <FieldLabel>Email Notifications</FieldLabel>
            <FieldDescription>
              Receive email updates about your reports
            </FieldDescription>
            <Switch
              checked={emailNotifications}
              onCheckedChange={setEmailNotifications}
            />
          </Field>
          <Field orientation="horizontal">
            <FieldLabel>Push Notifications</FieldLabel>
            <FieldDescription>
              Receive push notifications in your browser
            </FieldDescription>
            <Switch
              checked={pushNotifications}
              onCheckedChange={setPushNotifications}
            />
          </Field>
          <FieldSeparator />
          <Field>
            <FieldLabel>Language</FieldLabel>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
              </SelectContent>
            </Select>
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
