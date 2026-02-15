"use client"

import Link from "next/link"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  User03Icon,
  Briefcase01Icon,
  SparklesIcon,
  CheckmarkBadge01Icon,
  Notification01Icon,
  CreditCardIcon,
  LogoutSquare01Icon,
} from "@hugeicons/core-free-icons"

import { useMounted } from "@/hooks/use-mounted"
import { useUser } from "@/lib/context/user-context"
import { LogoutAndRedirect } from "@/appwrite/logOut"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function UserAvatarMenu() {
  const { userId, role: userRole } = useUser()
  const mounted = useMounted()

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon">
        <HugeiconsIcon
          icon={userRole === "insurance_adjuster" ? Briefcase01Icon : User03Icon}
          className="size-5"
        />
        <span className="sr-only">User menu</span>
      </Button>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <HugeiconsIcon
            icon={userRole === "insurance_adjuster" ? Briefcase01Icon : User03Icon}
            className="size-5"
          />
          <span className="sr-only">User menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="min-w-56 rounded-lg"
        align="end"
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
  )
}
