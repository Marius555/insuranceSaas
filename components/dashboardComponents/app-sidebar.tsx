"use client"
import { HugeiconsIcon } from "@hugeicons/react"
import { usePathname } from "next/navigation"
import Link from "next/link"

import {
    Home01Icon,
    FileValidationIcon,
    SolidLine02Icon,
    SentIcon,
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
import { LogoutAndRedirect } from "@/appwrite/logOut"
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

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  userId?: string;
  userEmail?: string;
  userRole?: 'user' | 'admin' | 'insurance_adjuster';
}

export function AppSidebar({ userId, userEmail, userRole, ...props }: AppSidebarProps) {
  const pathname = usePathname()
  const { isMobile } = useSidebar()

  // Extract userId from pathname if not provided as prop
  const extractedUserId = userId || pathname?.match(/\/auth\/dashboard\/([^/]+)/)?.[1] || ''

  const navItems = [
    {
      title: "Dashboard",
      url: `/auth/dashboard/${extractedUserId}`,
      icon: Home01Icon,
    },
    {
      title: "Claims",
      url: `/auth/dashboard/${extractedUserId}/claims`,
      icon: FileValidationIcon,
    },
    {
      title: "Settings",
      url: `/auth/dashboard/${extractedUserId}/settings`,
      icon: Settings02Icon,
    },
  ]

  const navSecondary = [
    {
      title: "Support",
      url: "#",
      icon: () => <HugeiconsIcon icon={SolidLine02Icon} />,
    },
    {
      title: "Feedback",
      url: "#",
      icon: () => <HugeiconsIcon icon={SentIcon} />,
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
                  (item.url.endsWith('/claims') && pathname?.startsWith(item.url))
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive}>
                      <Link href={item.url}>
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
        <NavSecondary items={navSecondary} />
      </SidebarContent>
    </Sidebar>
  )
}
