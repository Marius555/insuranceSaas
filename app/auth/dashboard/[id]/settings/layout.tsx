"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Settings02Icon,
  Shield01Icon,
  CreditCardIcon,
  UserCircleIcon,
} from "@hugeicons/core-free-icons"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { NotificationBell } from "@/components/notifications/notification-bell"
import { useUser } from "@/lib/context/user-context"

const tabs = [
  { label: "General", href: "general", icon: Settings02Icon },
  { label: "Privacy", href: "privacy", icon: Shield01Icon },
  { label: "Billing", href: "billing", icon: CreditCardIcon },
  { label: "Account", href: "account", icon: UserCircleIcon },
]

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const { userId } = useUser()
  const basePath = `/auth/dashboard/${userId}/settings`

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
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href={`/auth/dashboard/${userId}`}>
                  Dashboard
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Settings</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
        <div className="pr-4">
          <NotificationBell />
        </div>
      </header>

      <div className="flex flex-1 flex-col p-4 pt-0">
        <div className="mx-auto w-full max-w-2xl">
          <nav className="mb-4 flex flex-wrap gap-1">
            {tabs.map((tab) => {
              const fullHref = `${basePath}/${tab.href}`
              const isActive = pathname === fullHref
              return (
                <Button
                  key={tab.href}
                  variant={isActive ? "secondary" : "ghost"}
                  size="sm"
                  asChild
                >
                  <Link href={fullHref}>
                    <HugeiconsIcon icon={tab.icon} />
                    {tab.label}
                  </Link>
                </Button>
              )
            })}
          </nav>
          <Card className="min-h-[480px]">
            {children}
          </Card>
        </div>
      </div>
    </SidebarInset>
  )
}
