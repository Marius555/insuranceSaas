"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

export default function PricingTemplate({
  children,
}: {
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    requestAnimationFrame(() => {
      el.classList.add("animate-page-enter-active");
    });
    return () => {
      el.classList.remove("animate-page-enter-active");
    };
  }, [pathname]);

  return (
    <div ref={ref} className="animate-page-enter flex-1 min-w-0 flex flex-col">
      {children}
    </div>
  );
}
