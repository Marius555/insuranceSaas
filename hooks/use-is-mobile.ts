"use client";

import { useState, useEffect } from "react";

export function useIsMobile(breakpoint = 768) {
  // Always start false to match server render (prevents hydration mismatch)
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Now safe to check window - we're on the client after hydration
    const checkMobile = () => setIsMobile(window.innerWidth < breakpoint);
    checkMobile(); // Set initial value
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, [breakpoint]);

  return isMobile;
}
