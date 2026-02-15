"use client";

import { useState, useCallback } from "react";
import { cn } from "@/lib/utils";

export interface CaptureStep {
  label: string;
  instruction: string;
}

export const GUIDED_CAPTURE_STEPS: CaptureStep[] = [
  {
    label: "Front",
    instruction: "Position camera at the FRONT of the vehicle",
  },
  {
    label: "Right Side",
    instruction: "Move to the RIGHT SIDE of the vehicle",
  },
  {
    label: "Rear",
    instruction: "Show the REAR of the vehicle",
  },
  {
    label: "Left Side",
    instruction: "Move to the LEFT SIDE of the vehicle",
  },
  {
    label: "Damage Close-up",
    instruction: "Move closer to each damaged area",
  },
];

interface GuidedCaptureOverlayProps {
  isActive: boolean;
  currentStepIndex: number;
  isCapturing: boolean;
  onCapture: () => Promise<boolean>;
  onAutoAdvance: () => void;
  onFinish: () => void;
  lastThumbnailUrl?: string;
  stepPhotoCount: number;
}

export function GuidedCaptureOverlay({
  isActive,
  currentStepIndex,
  isCapturing,
  onCapture,
  onAutoAdvance,
  onFinish,
  lastThumbnailUrl,
  stepPhotoCount,
}: GuidedCaptureOverlayProps) {
  const [showFlash, setShowFlash] = useState(false);

  const currentStep = GUIDED_CAPTURE_STEPS[currentStepIndex];
  const isLastStep = currentStepIndex === GUIDED_CAPTURE_STEPS.length - 1;
  const lastStepDone = isLastStep && stepPhotoCount > 0;

  const handleCapture = useCallback(async () => {
    setShowFlash(true);
    setTimeout(() => setShowFlash(false), 200);
    const ok = await onCapture();
    // Auto-advance for non-last steps; last step shows "Done" button instead
    if (ok && !isLastStep) {
      setTimeout(() => {
        onAutoAdvance();
      }, 500);
    }
  }, [onCapture, isLastStep, onAutoAdvance]);

  if (!isActive) return null;

  return (
    <>
      {/* Flash animation on capture */}
      {showFlash && (
        <div className="absolute inset-0 bg-white z-30 animate-[flash_200ms_ease-out]" />
      )}

      {/* Step indicator pills - top right */}
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-1.5">
        {GUIDED_CAPTURE_STEPS.map((step, idx) => (
          <div
            key={step.label}
            className={cn(
              "flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-medium transition-all duration-300",
              idx === currentStepIndex
                ? "bg-primary text-primary-foreground scale-105"
                : idx < currentStepIndex
                  ? "bg-green-500/80 text-white"
                  : "bg-black/40 text-white/60"
            )}
          >
            <span className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] bg-white/20">
              {idx < currentStepIndex ? "✓" : idx + 1}
            </span>
            <span className="hidden sm:inline">{step.label}</span>
          </div>
        ))}
      </div>

      {/* Thumbnail preview - top left (after capture) */}
      {lastThumbnailUrl && (
        <div className="absolute top-4 left-14 z-10">
          <div className="w-16 h-12 rounded-lg overflow-hidden border-2 border-white/80 shadow-lg">
            <img
              src={lastThumbnailUrl}
              alt="Last capture"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      )}

      {/* Bottom controls - instruction + shutter */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 w-[95%] max-w-md">
        <div className="bg-black/70 backdrop-blur-sm rounded-xl px-4 py-3">
          {/* Instruction */}
          <p className="text-white text-sm font-semibold text-center mb-3">
            {currentStep.instruction}
          </p>

          {/* Shutter button or Done button */}
          <div className="flex items-center justify-center gap-4">
            {lastStepDone ? (
              <button
                onClick={onFinish}
                className="px-6 py-3 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors"
              >
                Done
              </button>
            ) : (
              <button
                onClick={handleCapture}
                disabled={isCapturing}
                className={cn(
                  "w-16 h-16 rounded-full border-4 border-white flex items-center justify-center transition-all",
                  isCapturing
                    ? "opacity-50"
                    : "hover:scale-105 active:scale-95"
                )}
              >
                <div
                  className={cn(
                    "w-12 h-12 rounded-full transition-colors",
                    isCapturing ? "bg-white/50" : "bg-white"
                  )}
                />
              </button>
            )}
          </div>

          {/* Step counter */}
          <p className="text-white/50 text-xs mt-2 text-center">
            Step {currentStepIndex + 1} of {GUIDED_CAPTURE_STEPS.length}
          </p>
        </div>
      </div>
    </>
  );
}
