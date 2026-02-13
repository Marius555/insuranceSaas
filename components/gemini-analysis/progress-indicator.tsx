"use client";

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
  { id: 3, label: "Scanning", description: "Security threat detection" },
  { id: 4, label: "Analyzing", description: "AI damage assessment" },
  { id: 5, label: "Saving", description: "Saving claim to database" },
  { id: 6, label: "Complete", description: "Claim created successfully" },
];

export function ProgressIndicator({
  currentStep,
  steps = defaultSteps,
}: ProgressIndicatorProps) {
  return (
    <div className="w-full flex justify-center py-3">
      {/* Vertical Stepper */}
      <div className="relative w-full max-w-md">
        {steps.map((step, index) => {
          const isComplete = step.id < currentStep;
          const isCurrent = step.id === currentStep;
          const isPending = step.id > currentStep;
          const isLast = index === steps.length - 1;

          return (
            <div key={step.id} className="relative pb-5 last:pb-0">
              {/* Vertical Line */}
              {!isLast && (
                <div className="absolute left-4 top-8 bottom-0 w-0.5 bg-border">
                  <div
                    className={cn(
                      "w-full bg-primary transition-all duration-500",
                      isComplete ? "h-full" : "h-0"
                    )}
                  />
                </div>
              )}

              {/* Step Row */}
              <div className="relative flex items-start gap-4">
                {/* Step Circle */}
                <div
                  className={cn(
                    "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-300 bg-background z-10",
                    isComplete && "border-primary bg-primary text-primary-foreground",
                    isCurrent && "border-primary bg-background text-primary animate-pulse",
                    isPending && "border-border text-muted-foreground"
                  )}
                >
                  {isComplete ? (
                    <svg
                      className="w-4 h-4"
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
                  ) : (
                    <span className="text-sm font-semibold">{step.id}</span>
                  )}
                </div>

                {/* Step Content */}
                <div className="flex-1 pt-1">
                  <p
                    className={cn(
                      "text-sm font-medium transition-colors",
                      (isComplete || isCurrent) && "text-foreground",
                      isPending && "text-muted-foreground"
                    )}
                  >
                    {step.label}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {step.description}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
