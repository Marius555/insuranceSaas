"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { HugeiconsIcon } from "@hugeicons/react";
import { Alert02Icon } from "@hugeicons/core-free-icons";

interface SpeedAlertProps {
  isMovingTooFast: boolean;
  isRecording: boolean;
}

export function SpeedAlert({ isMovingTooFast, isRecording }: SpeedAlertProps) {
  const shouldShow = isMovingTooFast && isRecording;
  const lastVibratedRef = useRef(0);

  // Haptic feedback when alert appears
  useEffect(() => {
    if (shouldShow && typeof navigator !== "undefined" && navigator.vibrate) {
      const now = Date.now();
      // Throttle vibration to prevent continuous buzzing (min 500ms between)
      if (now - lastVibratedRef.current > 500) {
        navigator.vibrate(100); // Short 100ms vibration
        lastVibratedRef.current = now;
      }
    }
  }, [shouldShow]);

  return (
    <div
      className={cn(
        "absolute top-4 left-1/2 -translate-x-1/2 z-10",
        "bg-destructive text-destructive-foreground",
        "px-4 py-2 rounded-full shadow-lg",
        "flex items-center gap-2",
        "transition-all duration-300 ease-out",
        shouldShow
          ? "opacity-100 translate-y-0"
          : "opacity-0 -translate-y-4 pointer-events-none"
      )}
    >
      <HugeiconsIcon icon={Alert02Icon} className="w-4 h-4 animate-pulse" />
      <span className="text-sm font-semibold">SLOW DOWN</span>
    </div>
  );
}
