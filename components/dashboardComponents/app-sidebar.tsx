"use client"
import { HugeiconsIcon } from "@hugeicons/react"
import { usePathname } from "next/navigation"
import Link from "next/link"

import {
    Home01Icon,
    FileValidationIcon,
    SolidLine02Icon,
    Settings02Icon,
    Notification01Icon,
} from "@hugeicons/core-free-icons"

import * as React from "react"

import { NavSecondary } from "./nav-secondary"
import { FeedbackModal } from "./feedback-modal"
import { useUser } from "@/lib/context/user-context"
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  const { isMobile, setOpenMobile } = useSidebar()
  const { userId, email: userEmail, pricingPlan, evaluationTimes } = useUser()

  const navItems = [
    {
      title: "Dashboard",
      url: `/auth/dashboard/${userId}`,
      icon: Home01Icon,
    },
    {
      title: "Reports",
      url: `/auth/dashboard/${userId}/reports`,
      icon: FileValidationIcon,
    },
    {
      title: "Notifications",
      url: `/auth/dashboard/${userId}/notifications`,
      icon: Notification01Icon,
    },
    {
      title: "Settings",
      url: `/auth/dashboard/${userId}/settings`,
      icon: Settings02Icon,
    },
  ]

  const navSecondary = [
    {
      title: "Support",
      url: "#",
      icon: () => <HugeiconsIcon icon={SolidLine02Icon} />,
    },
  ]

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              className="cursor-default hover:bg-transparent active:bg-transparent"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary font-semibold text-sm uppercase">
                {(userEmail || 'U').charAt(0)}
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{userEmail || 'User'}</span>
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="inline-flex items-center rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary leading-none">
                    {pricingPlan.charAt(0).toUpperCase() + pricingPlan.slice(1)}
                  </span>
                  <span className="text-muted-foreground">{evaluationTimes} left</span>
                </div>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive = pathname === item.url ||
                  (item.url.endsWith('/reports') && pathname?.startsWith(item.url)) ||
                  (item.url.endsWith('/settings') && pathname?.startsWith(item.url)) ||
                  (item.url.endsWith('/notifications') && pathname?.startsWith(item.url))
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive}>
                      <Link
                        href={item.url}
                        onClick={() => isMobile && setOpenMobile(false)}
                      >
                        <HugeiconsIcon icon={item.icon} />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarSeparator />
        <NavSecondary items={navSecondary}>
          <FeedbackModal />
        </NavSecondary>
      </SidebarContent>
    </Sidebar>
  )
}
