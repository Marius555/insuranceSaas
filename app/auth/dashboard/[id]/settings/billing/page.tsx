"use client"

import { HugeiconsIcon } from "@hugeicons/react"
import { CreditCardIcon } from "@hugeicons/core-free-icons"
import {
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"

export default function BillingSettingsPage() {
  return (
    <>
      <CardHeader>
        <CardTitle>Billing</CardTitle>
        <CardDescription>
          Manage your subscription and payment methods
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Empty>
          <EmptyHeader className="flex flex-col gap-2">
            <EmptyMedia variant="icon">
              <HugeiconsIcon icon={CreditCardIcon} />
            </EmptyMedia>
            <EmptyTitle>Coming Soon</EmptyTitle>
            <EmptyDescription>
              Billing and subscription management features are currently under
              development. Stay tuned for updates.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </CardContent>
    </>
  )
}
