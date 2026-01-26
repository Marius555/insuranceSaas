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

import { NavSecondary } from "./nav-secondary"
import { FeedbackModal } from "./feedback-modal"
import { LogoutAndRedirect } from "@/appwrite/logOut"
import { useUser } from "@/lib/context/user-context"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
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
  const { userId, email: userEmail, role: userRole } = useUser()

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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                    <HugeiconsIcon
                      className="size-4"
                      icon={userRole === 'insurance_adjuster' ? Briefcase01Icon : User03Icon}
                    />
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">{userEmail || 'User'}</span>
                    <span className="truncate text-xs">
                      {userRole === 'insurance_adjuster' ? 'Insurance Company' : 'User'}
                    </span>
                  </div>
                  <HugeiconsIcon icon={UnfoldMoreIcon} className="ml-auto" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
                side={isMobile ? "bottom" : "right"}
                align="start"
                sideOffset={4}
              >
                <DropdownMenuLabel className="p-0 font-normal">
                  <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                    <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                      <HugeiconsIcon
                        className="size-4"
                        icon={userRole === 'insurance_adjuster' ? Briefcase01Icon : User03Icon}
                      />
                    </div>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-medium">{userEmail || 'User'}</span>
                      <span className="truncate text-xs">
                        {userRole === 'insurance_adjuster' ? 'Insurance Company' : 'User'}
                      </span>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem>
                    <HugeiconsIcon icon={SparklesIcon} />
                    Upgrade to Pro
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem>
                    <HugeiconsIcon icon={CheckmarkBadge01Icon} />
                    Account
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <HugeiconsIcon icon={CreditCardIcon} />
                    Billing
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <HugeiconsIcon icon={Notification01Icon} />
                    Notifications
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
                  (item.url.endsWith('/reports') && pathname?.startsWith(item.url))
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
