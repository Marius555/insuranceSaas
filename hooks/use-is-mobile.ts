"use client";

import { useState, useEffect } from "react";

export function useIsMobile(breakpoint = 768) {
  // Always start false to match server render (prevents hydration mismatch)
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Now safe to check window - we're on the client after hydration
    const checkMobile = () => {
      const isNarrow = window.innerWidth < breakpoint;
      const isTouch = window.matchMedia("(pointer: coarse)").matches;
      setIsMobile(isNarrow || isTouch);
    };
    checkMobile(); // Set initial value
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, [breakpoint]);

  return isMobile;
}
