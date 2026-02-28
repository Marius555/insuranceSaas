"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface ProgressStep {
  id: number;
  label: string;
  description: string;
}

interface ProgressIndicatorProps {
  currentStep: number; // 1-6
  steps?: ProgressStep[];
}

const defaultSteps: ProgressStep[] = [
  { id: 1, label: "Validating", description: "Checking file requirements" },
  { id: 2, label: "Uploading", description: "Uploading to secure storage" },
  { id: 3, label: "Scanning", description: "Security scan in progress" },
  { id: 4, label: "Analyzing", description: "AI damage assessment" },
  { id: 5, label: "Saving", description: "Saving claim to database" },
  { id: 6, label: "Complete", description: "Claim created successfully" },
];

const analyzingMessages = [
  "Analyzing vehicle damage...",
  "Identifying affected components...",
  "Estimating repair costs...",
  "Detecting fraud indicators...",
  "Reviewing damage patterns...",
  "Checking coverage eligibility...",
  "Generating claim assessment...",
];

function CheckIcon() {
  return (
    <svg
      className="w-6 h-6"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={3}
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4.5 12.75l6 6 9-13.5"
      />
    </svg>
  );
}

export function ProgressIndicator({
  currentStep,
  steps = defaultSteps,
}: ProgressIndicatorProps) {
  const [msgIdx, setMsgIdx] = useState(0);
  const [msgVisible, setMsgVisible] = useState(true);

  useEffect(() => {
    if (currentStep !== 4) return;
    const interval = setInterval(() => {
      setMsgVisible(false);
      setTimeout(() => {
        setMsgIdx((i) => (i + 1) % analyzingMessages.length);
        setMsgVisible(true);
      }, 250);
    }, 3500);
    return () => clearInterval(interval);
  }, [currentStep]);

  // 8 slots: [null (phantom-left), step1..step6, null (phantom-right)]
  const slots: (ProgressStep | null)[] = [null, ...steps, null];

  // Translate strip so current step is centered:
  // slot index of current step = currentStep (0=phantom, 1=step1, ...)
  // Each slot is 1/8 of strip width; 3 slots visible (window = 3/8 of strip).
  // To center slot at index `currentStep`, shift by -(currentStep - 1) slots.
  const translatePercent = -((currentStep - 1) * (100 / 8));

  const activeStep = steps[currentStep - 1];
  const subtext =
    currentStep === 4
      ? analyzingMessages[msgIdx]
      : (activeStep?.description ?? "");

  return (
    <div className="w-full flex flex-col items-center gap-4 py-3 select-none h-full justify-center">
      {/* Carousel container — 3 slots visible */}
      <div className="relative w-full max-w-[280px] mx-auto">
        {/* Magnifying glass glow — outside overflow-hidden so it's never clipped */}
        <div className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-center z-0">
          <div className="w-24 h-24 rounded-full border-4 border-primary bg-transparent" />
        </div>

        {/* Inner wrapper clips only the sliding strip */}
        <div className="overflow-hidden relative z-10 h-[88px]">
        {/* Sliding strip — 8 slots, strip width = 8/3 × 100% */}
        <div
          className="flex items-center"
          style={{
            width: `${(8 / 3) * 100}%`,
            transform: `translateX(${translatePercent}%)`,
            transition: "transform 450ms cubic-bezier(0.22, 1, 0.36, 1)",
          }}
        >
          {slots.map((step, i) => {
            const isPhantom = step === null;
            const isComplete = !isPhantom && step.id < currentStep;
            const isCurrent = !isPhantom && step.id === currentStep;
            const isPending = !isPhantom && step.id > currentStep;

            return (
              <div
                key={i}
                className="flex flex-col items-center justify-center py-3"
                style={{ width: `${100 / 8}%` }}
              >
                {!isPhantom && (
                  <>
                    {/* Step circle */}
                    <div
                      className={cn(
                        "rounded-full border-2 flex items-center justify-center z-10 relative",
                        "transition-all duration-[450ms]",
                        isCurrent &&
                          "w-16 h-16 border-primary bg-primary text-primary-foreground opacity-100 animate-pulse",
                        isComplete &&
                          "w-12 h-12 border-primary bg-primary text-primary-foreground opacity-40",
                        isPending &&
                          "w-12 h-12 border-border bg-background text-muted-foreground opacity-40"
                      )}
                    >
                      {isComplete && <CheckIcon />}
                      {(isCurrent || isPending) && (
                        <span className="text-base font-semibold">{step.id}</span>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
        </div>
      </div>

      {/* Title + rotating subtext */}
      <div className="flex flex-col items-center gap-0.5">
        <p className="text-sm font-semibold text-foreground">
          {activeStep?.label}
        </p>
        <p
          className={cn(
            "text-sm text-muted-foreground text-center min-h-[1.25rem]",
            "transition-opacity duration-200",
            currentStep === 4 ? (msgVisible ? "opacity-100" : "opacity-0") : "opacity-100"
          )}
        >
          {subtext}
        </p>
      </div>
    </div>
  );
}
