"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Tick02Icon,
  Cancel01Icon,
  SparklesIcon,
} from "@hugeicons/core-free-icons";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GoogleSignInModal } from "@/components/auth/google-signin-modal";
import { savePlanSelection } from "@/lib/utils/auth-redirect-storage";
import { PLAN_DAILY_LIMITS } from "@/lib/evaluation-limits";
import type { UserDocument } from "@/lib/types/appwrite";

interface PricingSectionProps {
  session?: { name: string; email: string; id: string } | null;
  userDoc?: UserDocument | null;
}

interface PlanFeature {
  text: string;
  included: boolean;
}

interface Plan {
  slug: string;
  name: string;
  price: number;
  period: string;
  description: string;
  features: PlanFeature[];
  highlighted: boolean;
}

const plans: Plan[] = [
  {
    slug: "free",
    name: "Free",
    price: 0,
    period: "forever",
    description: "Try AI damage assessment with basic features",
    features: [
      { text: `${PLAN_DAILY_LIMITS.free} evaluation${PLAN_DAILY_LIMITS.free === 1 ? '' : 's'} per day`, included: true },
      { text: "Photo analysis only", included: true },
      { text: "Basic severity assessment", included: true },
      { text: "Rough cost estimate", included: true },
      { text: "Policy analysis", included: false },
      { text: "Fraud detection", included: false },
      { text: "PDF export", included: false },
    ],
    highlighted: false,
  },
  {
    slug: "pro",
    name: "Pro",
    price: 29,
    period: "/mo",
    description: "Full-featured analysis for individual users",
    features: [
      { text: `${PLAN_DAILY_LIMITS.pro} evaluations per day`, included: true },
      { text: "Photo + Video analysis", included: true },
      { text: "Detailed per-part breakdown", included: true },
      { text: "Itemized cost estimates", included: true },
      { text: "Upload & match policy coverage", included: true },
      { text: "Basic fraud checks", included: true },
      { text: "PDF report export", included: true },
    ],
    highlighted: true,
  },
  {
    slug: "max",
    name: "Max",
    price: 79,
    period: "/mo",
    description: "Maximum capability for professionals & fleets",
    features: [
      { text: `${PLAN_DAILY_LIMITS.max} evaluations per day`, included: true },
      { text: "Photo + Video analysis", included: true },
      { text: "Detailed + hidden damage inference", included: true },
      { text: "Itemized + labor/parts split", included: true },
      { text: "Full coverage + exclusions + deductible calc", included: true },
      { text: "Advanced fraud detection (VIN, plate, damage age)", included: true },
      { text: "PDF export + dedicated support", included: true },
    ],
    highlighted: false,
  },
];

function setPendingPlanCookie(slug: string) {
  document.cookie = `pending_plan=${slug};path=/;max-age=600;SameSite=Lax`;
}

export function PricingSection({ session, userDoc }: PricingSectionProps) {
  const router = useRouter();
  const [showSignInModal, setShowSignInModal] = useState(false);

  const handleSelect = (slug: string) => {
    savePlanSelection(slug);

    if (session && userDoc) {
      router.push(`/auth/dashboard/${userDoc.$id}/buy_plan?plan=${slug}`);
    } else {
      // Set cookie for server-side redirect after OAuth
      setPendingPlanCookie(slug);
      setShowSignInModal(true);
    }
  };

  return (
    <section className="max-w-7xl mx-auto px-4 py-16 md:py-24">
      <div className="text-center mb-16 space-y-4">
        <h2 className="text-3xl md:text-4xl font-bold">
          Simple, transparent pricing
        </h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Choose the plan that fits your needs. Upgrade or downgrade anytime.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto items-stretch">
        {plans.map((plan) => (
          <Card
            key={plan.slug}
            className={`flex flex-col ${
              plan.highlighted
                ? "ring-2 ring-primary relative overflow-visible"
                : ""
            }`}
          >
            {plan.highlighted && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge>
                  <HugeiconsIcon icon={SparklesIcon} className="size-3" />
                  Most Popular
                </Badge>
              </div>
            )}

            <CardHeader className="space-y-3 pb-2">
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                {plan.name}
              </p>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold">
                  ${plan.price}
                </span>
                <span className="text-sm text-muted-foreground">
                  {plan.period}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                {plan.description}
              </p>
            </CardHeader>

            <CardContent className="space-y-3">
              {plan.features.map((feature, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <HugeiconsIcon
                    icon={feature.included ? Tick02Icon : Cancel01Icon}
                    className={`size-4 mt-0.5 shrink-0 ${
                      feature.included
                        ? "text-primary"
                        : "text-muted-foreground/40"
                    }`}
                    strokeWidth={2}
                  />
                  <span
                    className={`text-sm ${
                      feature.included
                        ? "text-foreground"
                        : "text-muted-foreground/40"
                    }`}
                  >
                    {feature.text}
                  </span>
                </div>
              ))}
            </CardContent>

            <CardFooter className="mt-auto">
              <Button
                onClick={() => handleSelect(plan.slug)}
                variant={plan.highlighted ? "default" : "outline"}
                className="w-full"
              >
                {plan.price === 0 ? "Get Started" : `Select ${plan.name}`}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      <GoogleSignInModal
        isOpen={showSignInModal}
        onClose={() => setShowSignInModal(false)}
      />
    </section>
  );
}
