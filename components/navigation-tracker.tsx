"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { usePathname } from "next/navigation";

export function NavigationTracker() {
  const pathname = usePathname();
  const isFirstRender = useRef(true);

  // One-time setup: event listeners + initial state
  useEffect(() => {
    const html = document.documentElement;

    // Initial load is always external
    html.dataset.navType = "external";
    html.dataset.navDirection = "forward";

    function handleClick(e: MouseEvent) {
      const anchor = (e.target as HTMLElement).closest("a");
      if (!anchor) return;
      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("http") || href.startsWith("mailto:")) return;
      // Skip page transition for settings tab navigation
      if (anchor.hasAttribute("data-settings-tab")) return;
      // Stage intent — no CSS effect
      html.dataset.navPending = "forward";
    }

    function handlePopState() {
      html.dataset.navPending = "backward";
    }

    function handleAnimationEnd(e: AnimationEvent) {
      if (e.animationName === "slide-in-forward" || e.animationName === "slide-in-backward") {
        html.dataset.navType = "external";
      }
    }

    document.addEventListener("click", handleClick, true);
    window.addEventListener("popstate", handlePopState);
    document.addEventListener("animationend", handleAnimationEnd);

    return () => {
      document.removeEventListener("click", handleClick, true);
      window.removeEventListener("popstate", handlePopState);
      document.removeEventListener("animationend", handleAnimationEnd);
    };
  }, []);

  // Apply staged nav type AFTER React commits new route (before paint)
  useLayoutEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const html = document.documentElement;
    const pending = html.dataset.navPending;

    if (pending) {
      html.dataset.navType = "internal";
      html.dataset.navDirection = pending;
      delete html.dataset.navPending;
    }
  }, [pathname]);

  return null;
}
