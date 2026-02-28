"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface RecordingControlsProps {
  isRecording: boolean;
  isPaused?: boolean;
  duration: number;
  maxDuration?: number;
  onStart: () => void;
  onStop: () => void;
  onPause?: () => void;
  onResume?: () => void;
  onCancel: () => void;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

export function RecordingControls({
  isRecording,
  isPaused = false,
  duration,
  maxDuration,
  onStart,
  onStop,
  onPause,
  onResume,
  onCancel,
}: RecordingControlsProps) {
  const progress = maxDuration ? (duration / maxDuration) * 100 : 0;
  const remainingSeconds = maxDuration ? maxDuration - duration : Infinity;

  // Disable cancel during the transition between stop and preview
  // (recording stopped but video is still being processed)
  const isStopProcessing = !isRecording && !isPaused && duration > 0;

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Timer display */}
      <div className="text-center">
        <div className="text-4xl font-mono font-bold tabular-nums">
          {formatTime(duration)}
          {maxDuration && (
            <span className="text-muted-foreground"> / {formatTime(maxDuration)}</span>
          )}
        </div>
        {isRecording && !isPaused && maxDuration && remainingSeconds <= 5 && (
          <p className="text-sm text-destructive mt-1 animate-pulse">
            {remainingSeconds} seconds remaining
          </p>
        )}
      </div>

      {/* Progress bar */}
      <div className="w-full max-w-xs h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={cn(
            "h-full transition-all duration-100",
            isPaused ? "bg-amber-500" : isRecording ? "bg-destructive" : "bg-primary"
          )}
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Controls */}
      <div className="flex items-center gap-4">
        {/* Cancel — always rendered */}
        <Button
          variant="ghost"
          onClick={onCancel}
          className="px-6"
          disabled={(isRecording && !isPaused) || isStopProcessing}
        >
          Cancel
        </Button>

        {/* Center button — same 64×64 size in all states */}
        {!isRecording && !isPaused ? (
          <button
            onClick={onStart}
            className={cn(
              "relative w-16 h-16 rounded-full bg-primary hover:bg-primary/90",
              "transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-primary/30",
              "flex items-center justify-center"
            )}
            aria-label="Start recording"
          >
            <div className="w-12 h-12 rounded-full bg-primary border-4 border-white" />
          </button>
        ) : isPaused ? (
          <button
            onClick={onResume}
            className={cn(
              "relative w-16 h-16 rounded-full bg-primary hover:bg-primary/90",
              "transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-primary/30",
              "flex items-center justify-center"
            )}
            aria-label="Resume recording"
          >
            <div className="w-0 h-0 border-t-[10px] border-t-transparent border-b-[10px] border-b-transparent border-l-[16px] border-l-white ml-1" />
          </button>
        ) : (
          <button
            onClick={onPause}
            className={cn(
              "relative w-16 h-16 rounded-full bg-primary hover:bg-primary/90",
              "transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-primary/30",
              "flex items-center justify-center animate-pulse"
            )}
            aria-label="Pause recording"
          >
            <div className="flex gap-1.5">
              <div className="w-2 h-6 rounded-sm bg-white" />
              <div className="w-2 h-6 rounded-sm bg-white" />
            </div>
          </button>
        )}

        {/* Finish — always in layout; invisible when not paused */}
        <Button
          variant="outline"
          onClick={onStop}
          className={cn("px-6", !isPaused && "invisible pointer-events-none")}
        >
          Finish
        </Button>
      </div>

      {!isRecording && !isPaused && (
        <p className="text-sm text-muted-foreground text-center">
          Tap the record button to start filming
        </p>
      )}
    </div>
  );
}
