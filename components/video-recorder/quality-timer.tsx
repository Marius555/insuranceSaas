"use client";

import { cn } from "@/lib/utils";
import { HugeiconsIcon } from "@hugeicons/react";
import { CheckmarkCircle02Icon } from "@hugeicons/core-free-icons";

interface QualityTimerProps {
  qualitySeconds: number;
  threshold?: number; // Default 30 seconds
  isRecording: boolean;
  isMovingTooFast: boolean;
}

export function QualityTimer({
  qualitySeconds,
  threshold = 30,
  isRecording,
  isMovingTooFast,
}: QualityTimerProps) {
  if (!isRecording) return null;

  // Determine color based on quality seconds
  // Red (0-10s) -> Orange (10-20s) -> Yellow (20-30s) -> Green (30s+)
  const getColorClass = () => {
    if (qualitySeconds >= threshold) return "text-green-500";
    if (qualitySeconds >= 20) return "text-yellow-500";
    if (qualitySeconds >= 10) return "text-orange-500";
    return "text-red-500";
  };

  const getProgressColor = () => {
    if (qualitySeconds >= threshold) return "bg-green-500";
    if (qualitySeconds >= 20) return "bg-yellow-500";
    if (qualitySeconds >= 10) return "bg-orange-500";
    return "bg-red-500";
  };

  const progressPercentage = Math.min((qualitySeconds / threshold) * 100, 100);
  const hasReachedThreshold = qualitySeconds >= threshold;

  return (
    <div className="absolute bottom-20 left-4 right-4 z-10">
      <div className="bg-black/60 backdrop-blur-sm rounded-lg px-4 py-3">
        {/* Label row */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-white/80 text-xs font-medium">
              Quality footage
            </span>
            {isMovingTooFast && (
              <span className="text-red-400 text-xs animate-pulse">
                (paused)
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className={cn("text-sm font-bold", getColorClass())}>
              {qualitySeconds}s / {threshold}s
            </span>
            {hasReachedThreshold && (
              <HugeiconsIcon icon={CheckmarkCircle02Icon} className="w-4 h-4 text-green-500" />
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-2 bg-white/20 rounded-full overflow-hidden">
          <div
            className={cn(
              "h-full transition-all duration-300 ease-out rounded-full",
              getProgressColor()
            )}
            style={{ width: `${progressPercentage}%` }}
          />
        </div>

        {/* Status text */}
        <div className="mt-2 text-center">
          {hasReachedThreshold ? (
            <span className="text-green-400 text-xs font-medium">
              Optimal footage captured
            </span>
          ) : (
            <span className="text-white/60 text-xs">
              Hold steady for best results
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
