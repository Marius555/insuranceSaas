"use client"

import * as React from "react"
import Link from "next/link"
import { HugeiconsIcon } from "@hugeicons/react"
import { SolidLine02Icon, MailIcon, SmartPhone01Icon, Location01Icon } from "@hugeicons/core-free-icons"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  DrawerFooter,
} from "@/components/ui/drawer"
import { Button } from "@/components/ui/button"
import {
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { useIsMobile } from "@/hooks/use-is-mobile"
import { COMPANY } from "@/lib/company"

export function SupportModal() {
  const [mounted, setMounted] = React.useState(false)
  const [open, setOpen] = React.useState(false)
  const isMobile = useIsMobile()

  React.useEffect(() => {
    setMounted(true)
  }, [])

  const trigger = (
    <SidebarMenuButton size="sm">
      <HugeiconsIcon icon={SolidLine02Icon} />
      <span>Support</span>
    </SidebarMenuButton>
  )

  if (!mounted) {
    return (
      <SidebarMenuItem>
        {trigger}
      </SidebarMenuItem>
    )
  }

  const content = (
    <div className="grid gap-4 px-4 pb-4">
      <div className="grid gap-3">
        <div className="flex items-start gap-3">
          <div className="size-8 rounded-md bg-primary/10 flex items-center justify-center text-primary shrink-0 mt-0.5">
            <HugeiconsIcon icon={MailIcon} className="size-4" />
          </div>
          <div>
            <p className="text-sm font-medium">General Inquiries</p>
            <a href={`mailto:${COMPANY.email}`} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              {COMPANY.email}
            </a>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="size-8 rounded-md bg-primary/10 flex items-center justify-center text-primary shrink-0 mt-0.5">
            <HugeiconsIcon icon={MailIcon} className="size-4" />
          </div>
          <div>
            <p className="text-sm font-medium">Support</p>
            <a href={`mailto:${COMPANY.supportEmail}`} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              {COMPANY.supportEmail}
            </a>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="size-8 rounded-md bg-primary/10 flex items-center justify-center text-primary shrink-0 mt-0.5">
            <HugeiconsIcon icon={SmartPhone01Icon} className="size-4" />
          </div>
          <div>
            <p className="text-sm font-medium">Phone</p>
            <a href={`tel:${COMPANY.phone}`} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              {COMPANY.phone}
            </a>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="size-8 rounded-md bg-primary/10 flex items-center justify-center text-primary shrink-0 mt-0.5">
            <HugeiconsIcon icon={Location01Icon} className="size-4" />
          </div>
          <div>
            <p className="text-sm font-medium">Address</p>
            <p className="text-sm text-muted-foreground">{COMPANY.address}</p>
          </div>
        </div>
      </div>

      <Button variant="outline" size="sm" asChild>
        <Link href="/contact">View full contact page</Link>
      </Button>
    </div>
  )

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={setOpen}>
        <SidebarMenuItem>
          <DrawerTrigger asChild>
            {trigger}
          </DrawerTrigger>
        </SidebarMenuItem>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Support</DrawerTitle>
          </DrawerHeader>
          {content}
          <DrawerFooter />
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <SidebarMenuItem>
        <DialogTrigger asChild>
          {trigger}
        </DialogTrigger>
      </SidebarMenuItem>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Support</DialogTitle>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  )
}
