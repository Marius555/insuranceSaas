"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/lib/context/user-context";
import { getPlanSelection, clearPlanSelection } from "@/lib/utils/auth-redirect-storage";

export function PlanRedirectCheck() {
  const router = useRouter();
  const { userId } = useUser();

  useEffect(() => {
    const plan = getPlanSelection();
    if (plan) {
      clearPlanSelection();
      router.push(`/auth/dashboard/${userId}/buy_plan?plan=${plan}`);
    }
  }, [router, userId]);

  return null;
}
