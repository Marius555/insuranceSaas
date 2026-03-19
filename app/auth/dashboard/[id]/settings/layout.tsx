"use client"

import { useState } from "react"
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
import { UserAvatarMenu } from "@/components/dashboardComponents/user-avatar-menu"
import { useUser } from "@/lib/context/user-context"

import GeneralSettingsPage from "./general/page"
import PrivacySettingsPage from "./privacy/page"
import BillingSettingsPage from "./billing/page"
import AccountSettingsPage from "./account/page"

const tabs = [
  { label: "General", href: "general", icon: Settings02Icon },
  { label: "Privacy", href: "privacy", icon: Shield01Icon },
  { label: "Billing", href: "billing", icon: CreditCardIcon },
  { label: "Account", href: "account", icon: UserCircleIcon },
]

const TAB_CONTENT: Record<string, React.ReactNode> = {
  general: <GeneralSettingsPage />,
  privacy: <PrivacySettingsPage />,
  billing: <BillingSettingsPage />,
  account: <AccountSettingsPage />,
}

export default function SettingsLayout({
  children: _children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const { userId } = useUser()
  const [activeTab, setActiveTab] = useState(() => {
    const segment = pathname.split("/").pop() || "general"
    return tabs.some((t) => t.href === segment) ? segment : "general"
  })

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
                <BreadcrumbLink asChild>
                  <Link href={`/auth/dashboard/${userId}`}>Dashboard</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Settings</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
        <div className="flex items-center gap-1 pr-4">
          <NotificationBell />
          <UserAvatarMenu />
        </div>
      </header>

      <div className="flex flex-1 flex-col p-4 pt-0">
        <div className="mx-auto w-full max-w-2xl">
          <nav className="mb-4 grid grid-cols-4 gap-1">
            {tabs.map((tab) => (
              <Button
                key={tab.href}
                variant={activeTab === tab.href ? "secondary" : "ghost"}
                size="sm"
                className="w-full justify-center"
                onClick={() => setActiveTab(tab.href)}
              >
                <HugeiconsIcon icon={tab.icon} />
                {tab.label}
              </Button>
            ))}
          </nav>
          <Card className="min-h-[480px]">
            {tabs.map((tab) => (
              <div
                key={tab.href}
                className={tab.href === activeTab ? "animate-state-fade-in" : "hidden"}
              >
                {TAB_CONTENT[tab.href]}
              </div>
            ))}
          </Card>
        </div>
      </div>
    </SidebarInset>
  )
}
