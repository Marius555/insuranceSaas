"use client"

import { Suspense, useEffect, useRef, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { HugeiconsIcon } from "@hugeicons/react"
import { CreditCardIcon, Tick02Icon } from "@hugeicons/core-free-icons"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
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
import { useUser } from "@/lib/context/user-context"
import { updateUserPlan } from "@/appwrite/updateUserPlan"

const VALID_PLANS = ["free", "pro", "max"]

function BuyPlanContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const plan = searchParams.get("plan")
  const { userId } = useUser()
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const didSave = useRef(false)

  const isValid = plan && VALID_PLANS.includes(plan)
  const planLabel = plan
    ? plan.charAt(0).toUpperCase() + plan.slice(1)
    : null

  useEffect(() => {
    if (!isValid || didSave.current) return
    didSave.current = true

    updateUserPlan(userId, plan).then((result) => {
      if (result.success) {
        setSaved(true)
        router.refresh()
      } else {
        setError(result.message || "Failed to update plan")
      }
    })
  }, [isValid, plan, userId])

  return (
    <>
      <CardHeader>
        <CardTitle>
          {planLabel ? `${planLabel} Plan` : "Select a Plan"}
        </CardTitle>
        <CardDescription>
          {saved
            ? `Your plan has been updated to ${planLabel}`
            : error
              ? error
              : planLabel
                ? `You selected the ${planLabel} plan`
                : "Choose a plan to get started"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Empty>
          <EmptyHeader className="flex flex-col gap-2">
            <EmptyMedia variant="icon">
              <HugeiconsIcon icon={saved ? Tick02Icon : CreditCardIcon} />
            </EmptyMedia>
            <EmptyTitle>{saved ? "Plan Updated" : "Coming Soon"}</EmptyTitle>
            <EmptyDescription>
              {saved
                ? `You are now on the ${planLabel} plan. Payment processing is not yet available — your plan has been saved for when billing launches.`
                : `Payment processing for the ${planLabel || "selected"} plan is currently under development. Stay tuned for updates.`}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </CardContent>
    </>
  )
}

export default function BuyPlanPage() {
  return (
    <SidebarInset>
      <header className="flex h-16 shrink-0 items-center gap-2">
        <div className="flex items-center gap-2 px-4 flex-1">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-2 data-[orientation=vertical]:h-4"
          />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage>Buy Plan</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <Suspense>
          <BuyPlanContent />
        </Suspense>
      </div>
    </SidebarInset>
  )
}
