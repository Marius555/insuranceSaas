"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface RecordingControlsProps {
  isRecording: boolean;
  duration: number;
  maxDuration: number;
  onStart: () => void;
  onStop: () => void;
  onCancel: () => void;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

export function RecordingControls({
  isRecording,
  duration,
  maxDuration,
  onStart,
  onStop,
  onCancel,
}: RecordingControlsProps) {
  const progress = (duration / maxDuration) * 100;
  const remainingSeconds = maxDuration - duration;

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Timer display */}
      <div className="text-center">
        <div className="text-4xl font-mono font-bold tabular-nums">
          {formatTime(duration)}
          <span className="text-muted-foreground"> / {formatTime(maxDuration)}</span>
        </div>
        {isRecording && remainingSeconds <= 5 && (
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
            isRecording ? "bg-destructive" : "bg-primary"
          )}
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Controls */}
      <div className="flex items-center gap-4">
        {!isRecording ? (
          <>
            <Button
              variant="ghost"
              onClick={onCancel}
              className="px-6"
            >
              Cancel
            </Button>

            {/* Record button */}
            <button
              onClick={onStart}
              className={cn(
                "relative w-16 h-16 rounded-full",
                "bg-destructive hover:bg-destructive/90",
                "transition-all duration-200",
                "focus:outline-none focus:ring-4 focus:ring-destructive/30",
                "flex items-center justify-center"
              )}
              aria-label="Start recording"
            >
              {/* Inner circle */}
              <div className="w-12 h-12 rounded-full bg-destructive border-4 border-white/30" />
            </button>

            <div className="w-[56px]" /> {/* Spacer for alignment */}
          </>
        ) : (
          <>
            <Button
              variant="ghost"
              onClick={onCancel}
              className="px-6"
              disabled
            >
              Cancel
            </Button>

            {/* Stop button */}
            <button
              onClick={onStop}
              className={cn(
                "relative w-16 h-16 rounded-full",
                "bg-destructive hover:bg-destructive/90",
                "transition-all duration-200",
                "focus:outline-none focus:ring-4 focus:ring-destructive/30",
                "flex items-center justify-center",
                "animate-pulse"
              )}
              aria-label="Stop recording"
            >
              {/* Square stop icon */}
              <div className="w-6 h-6 rounded-sm bg-white" />
            </button>

            <Button
              variant="outline"
              onClick={onStop}
              className="px-6"
            >
              Stop
            </Button>
          </>
        )}
      </div>

      {/* Recording indicator */}
      {isRecording && (
        <div className="flex items-center gap-2 text-destructive">
          <div className="w-3 h-3 rounded-full bg-destructive animate-pulse" />
          <span className="text-sm font-medium">Recording...</span>
        </div>
      )}

      {!isRecording && (
        <p className="text-sm text-muted-foreground text-center">
          Tap the record button to start filming
        </p>
      )}
    </div>
  );
}
