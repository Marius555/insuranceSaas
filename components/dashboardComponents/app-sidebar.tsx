"use client"
import { HugeiconsIcon } from "@hugeicons/react"
import { usePathname } from "next/navigation"
import Link from "next/link"

import {
    Home01Icon,
    FileValidationIcon,
    SolidLine02Icon,
    Settings02Icon,
    User03Icon,
    Briefcase01Icon,
    UnfoldMoreIcon,
    CheckmarkBadge01Icon,
    Notification01Icon,
    CreditCardIcon,
    LogoutSquare01Icon,
    SparklesIcon,
} from "@hugeicons/core-free-icons"

import * as React from "react"
import { useMounted } from "@/hooks/use-mounted"

import { NavSecondary } from "./nav-secondary"
import { FeedbackModal } from "./feedback-modal"
import { LogoutAndRedirect } from "@/appwrite/logOut"
import { useUser } from "@/lib/context/user-context"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
  const { userId, email: userEmail, role: userRole, pricingPlan, evaluationTimes } = useUser()
  const mounted = useMounted()

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

  const headerButtonContent = (
    <>
      <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
        <HugeiconsIcon
          className="size-4"
          icon={userRole === 'insurance_adjuster' ? Briefcase01Icon : User03Icon}
        />
      </div>
      <div className="grid flex-1 text-left text-sm leading-tight">
        <span className="truncate font-medium">{userEmail || 'User'}</span>
        <span className="truncate text-xs">
          {pricingPlan.charAt(0).toUpperCase() + pricingPlan.slice(1)} · {evaluationTimes} evals remaining
        </span>
      </div>
      <HugeiconsIcon icon={UnfoldMoreIcon} className="ml-auto" />
    </>
  )

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            {mounted ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton
                    size="lg"
                    className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                  >
                    {headerButtonContent}
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
                  side={isMobile ? "bottom" : "right"}
                  align="start"
                  sideOffset={4}
                >
                  <DropdownMenuGroup>
                    <DropdownMenuItem asChild>
                      <Link href="/pricing">
                        <HugeiconsIcon icon={SparklesIcon} />
                        Upgrade to Pro
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    <DropdownMenuItem asChild>
                      <Link href={`/auth/dashboard/${userId}/settings/account`}>
                        <HugeiconsIcon icon={CheckmarkBadge01Icon} />
                        Account
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href={`/auth/dashboard/${userId}/settings/billing`}>
                        <HugeiconsIcon icon={CreditCardIcon} />
                        Billing
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href={`/auth/dashboard/${userId}/notifications`}>
                        <HugeiconsIcon icon={Notification01Icon} />
                        Notifications
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <form action={LogoutAndRedirect} className="w-full">
                      <button type="submit" className="flex w-full items-center gap-2 px-2 py-1.5 text-sm">
                        <HugeiconsIcon icon={LogoutSquare01Icon} />
                        Log out
                      </button>
                    </form>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <SidebarMenuButton
                size="lg"
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              >
                {headerButtonContent}
              </SidebarMenuButton>
            )}
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
