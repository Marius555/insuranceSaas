"use client"

import * as React from "react"
import { Drawer as DrawerPrimitive } from "vaul"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { HugeiconsIcon } from "@hugeicons/react"
import { Cancel01Icon } from "@hugeicons/core-free-icons"

type DrawerDirection = "top" | "bottom" | "left" | "right"

function Drawer({
  shouldScaleBackground = true,
  direction = "bottom",
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Root> & {
  direction?: DrawerDirection
}) {
  return (
    <DrawerPrimitive.Root
      shouldScaleBackground={shouldScaleBackground}
      direction={direction}
      {...props}
    />
  )
}

function DrawerTrigger(props: React.ComponentProps<typeof DrawerPrimitive.Trigger>) {
  return <DrawerPrimitive.Trigger data-slot="drawer-trigger" {...props} />
}

function DrawerPortal(props: React.ComponentProps<typeof DrawerPrimitive.Portal>) {
  return <DrawerPrimitive.Portal {...props} />
}

function DrawerClose(props: React.ComponentProps<typeof DrawerPrimitive.Close>) {
  return <DrawerPrimitive.Close data-slot="drawer-close" {...props} />
}

function DrawerOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Overlay>) {
  return (
    <DrawerPrimitive.Overlay
      data-slot="drawer-overlay"
      className={cn(
        "fixed inset-0 z-50 bg-black/40",
        className
      )}
      {...props}
    />
  )
}

function DrawerContent({
  className,
  children,
  showHandle = true,
  showCloseButton = true,
  direction = "bottom",
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Content> & {
  showHandle?: boolean
  showCloseButton?: boolean
  direction?: DrawerDirection
}) {
  const isHorizontal = direction === "left" || direction === "right"

  return (
    <DrawerPortal>
      <DrawerOverlay />
      <DrawerPrimitive.Content
        data-slot="drawer-content"
        className={cn(
          "fixed z-50 flex flex-col bg-background",
          direction === "bottom" && "inset-x-0 bottom-0 mt-24 rounded-t-2xl border-t",
          direction === "top" && "inset-x-0 top-0 mb-24 rounded-b-2xl border-b",
          direction === "left" && "inset-y-0 left-0 h-full w-[18rem] rounded-r-2xl border-r",
          direction === "right" && "inset-y-0 right-0 h-full w-[18rem] rounded-l-2xl border-l",
          className
        )}
        {...props}
      >
        {showHandle && !isHorizontal && (
          <div className="mx-auto mt-4 h-1.5 w-12 shrink-0 rounded-full bg-muted" />
        )}
        {children}
        {showCloseButton && (
          <DrawerPrimitive.Close asChild>
            <Button variant="ghost" className="absolute top-4 right-4" size="icon-sm">
              <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} />
              <span className="sr-only">Close</span>
            </Button>
          </DrawerPrimitive.Close>
        )}
      </DrawerPrimitive.Content>
    </DrawerPortal>
  )
}

function DrawerHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="drawer-header"
      className={cn("gap-1.5 p-4 flex flex-col", className)}
      {...props}
    />
  )
}

function DrawerFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="drawer-footer"
      className={cn("gap-2 p-4 mt-auto flex flex-col", className)}
      {...props}
    />
  )
}

function DrawerTitle({
  className,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Title>) {
  return (
    <DrawerPrimitive.Title
      data-slot="drawer-title"
      className={cn("text-foreground font-medium", className)}
      {...props}
    />
  )
}

function DrawerDescription({
  className,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Description>) {
  return (
    <DrawerPrimitive.Description
      data-slot="drawer-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  )
}

export {
  Drawer,
  DrawerTrigger,
  DrawerPortal,
  DrawerClose,
  DrawerOverlay,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription,
}
