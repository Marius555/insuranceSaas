"use client";

import { useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { GUIDED_CAPTURE_STEPS } from "./guided-capture-overlay";

interface PhotoOnlyCaptureOverlayProps {
  phase: 'damage' | 'sides';
  currentStepIndex: number;      // used only in sides phase
  phasePhotos: number;           // photos taken in current phase only
  phaseMaxPhotos: number;
  isCapturing: boolean;
  onCapture: () => Promise<boolean>;
  onSkip: () => void;            // both phases: jump to preview/submit
  onNext: () => void;            // damage: → sides phase | sides: next step
  onFinish: () => void;          // sides last step Done → preview/submit
  onCancel: () => void;          // damage phase only, before first photo: back to mode-select
  lastThumbnailUrl?: string;
  stepPhotoCount: number;        // photos at current step (sides phase)
}

export function PhotoOnlyCaptureOverlay({
  phase,
  currentStepIndex,
  phasePhotos,
  phaseMaxPhotos,
  isCapturing,
  onCapture,
  onSkip,
  onNext,
  onFinish,
  onCancel,
  lastThumbnailUrl,
  stepPhotoCount,
}: PhotoOnlyCaptureOverlayProps) {
  const [showFlash, setShowFlash] = useState(false);

  const atPhaseLimit = phasePhotos >= phaseMaxPhotos;
  const isLastStep = currentStepIndex === GUIDED_CAPTURE_STEPS.length - 1;

  const handleCapture = useCallback(async () => {
    if (atPhaseLimit) return;
    setShowFlash(true);
    setTimeout(() => setShowFlash(false), 200);
    await onCapture();
  }, [onCapture, atPhaseLimit]);

  return (
    <>
      {/* Flash animation */}
      {showFlash && (
        <div className="absolute inset-0 bg-white z-30 animate-[flash_200ms_ease-out]" />
      )}

      {/* Step indicator pills — sides phase only, top right */}
      {phase === 'sides' && (
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
      )}

      {/* Thumbnail preview - top left */}
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

      {/* Photo counter badge - top left corner */}
      <div className="absolute top-4 left-4 z-10">
        <div className="bg-black/60 backdrop-blur-sm rounded-full px-2.5 py-1">
          <span className="text-white text-xs font-semibold">{phasePhotos} / {phaseMaxPhotos}</span>
        </div>
      </div>

      {/* Bottom controls */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 w-[95%] max-w-md">
        <div className="bg-black/70 backdrop-blur-sm rounded-xl px-4 py-3">
          {/* Instruction */}
          <p className="text-white text-sm font-semibold text-center mb-3">
            {phase === 'damage'
              ? "Capture photos of the damaged areas"
              : GUIDED_CAPTURE_STEPS[currentStepIndex]?.instruction ?? ""}
          </p>

          {atPhaseLimit && (
            <p className="text-amber-400 text-xs font-medium text-center mb-3">
              {phase === 'damage'
                ? "Damage photos complete — tap Next or Skip"
                : "Photos complete — tap Done or Skip"}
            </p>
          )}

          {/* Controls row */}
          <div className="flex items-center justify-between gap-3">
            {/* Left: Skip (damage ≥1 photo or sides: always); Cancel (damage: 0 photos) */}
            {phase === 'sides' || phasePhotos >= 1 ? (
              <button
                onClick={onSkip}
                className="text-white/80 text-sm font-medium px-5 py-3 rounded-full min-w-[80px] bg-white/15 hover:bg-white/25 active:scale-95 transition-all"
              >
                Skip
              </button>
            ) : (
              <button
                onClick={onCancel}
                className="text-white/80 text-sm font-medium px-5 py-3 rounded-full min-w-[80px] bg-white/15 hover:bg-white/25 active:scale-95 transition-all"
              >
                Cancel
              </button>
            )}

            {/* Center: Shutter */}
            <button
              onClick={handleCapture}
              disabled={isCapturing || atPhaseLimit}
              className={cn(
                "w-16 h-16 rounded-full border-4 border-white flex items-center justify-center transition-all flex-shrink-0",
                isCapturing || atPhaseLimit
                  ? "opacity-50"
                  : "hover:scale-105 active:scale-95"
              )}
              aria-label="Take photo"
            >
              <div
                className={cn(
                  "w-12 h-12 rounded-full transition-colors",
                  isCapturing || atPhaseLimit ? "bg-white/50" : "bg-white"
                )}
              />
            </button>

            {/* Right button */}
            {phase === 'damage' ? (
              phasePhotos >= 1 ? (
                <button
                  onClick={onNext}
                  className="text-white text-sm font-semibold px-5 py-3 rounded-full min-w-[80px] bg-primary hover:bg-primary/90 active:scale-95 transition-all"
                >
                  Next
                </button>
              ) : (
                <div className="min-w-[80px]" />
              )
            ) : (
              /* sides phase */
              stepPhotoCount >= 1 ? (
                <button
                  onClick={(isLastStep || atPhaseLimit) ? onFinish : onNext}
                  className="text-white text-sm font-semibold px-5 py-3 rounded-full min-w-[80px] bg-primary hover:bg-primary/90 active:scale-95 transition-all"
                >
                  {(isLastStep || atPhaseLimit) ? "Done" : "Next"}
                </button>
              ) : (
                <div className="min-w-[80px]" />
              )
            )}
          </div>
        </div>
      </div>
    </>
  );
}
