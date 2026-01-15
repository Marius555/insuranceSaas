"use client";

import { Button } from "@/components/ui/button";
import { formatFileSize } from "@/lib/utils/video-compression";
import { Tick02Icon, File01Icon, Cancel01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

interface RecordingPreviewProps {
  videoFile: File;
  videoUrl: string;
  duration: number;
  onSubmitQuick: () => void;
  onSubmitWithPolicy: () => void;
  onCancel: () => void;
  isCompressing?: boolean;
  wasCompressed?: boolean;
  isSubmitting?: boolean;
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function RecordingPreview({
  videoFile,
  videoUrl,
  duration,
  onSubmitQuick,
  onSubmitWithPolicy,
  onCancel,
  isCompressing = false,
  wasCompressed = false,
  isSubmitting = false,
}: RecordingPreviewProps) {
  const isOverSize = videoFile.size > 20 * 1024 * 1024;

  return (
    <div className="flex flex-col h-full">
      {/* Video preview */}
      <div className="flex-1 flex items-center justify-center bg-black rounded-lg overflow-hidden min-h-0">
        <video
          src={videoUrl}
          controls
          playsInline
          className="max-w-full max-h-full w-auto h-auto object-contain"
        />
      </div>

      {/* File info */}
      <div className="py-4 space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Duration</span>
          <span className="font-medium">{formatDuration(duration)}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">File size</span>
          <span className={`font-medium ${isOverSize ? "text-destructive" : ""}`}>
            {formatFileSize(videoFile.size)}
            {isOverSize && " (exceeds 20MB)"}
          </span>
        </div>

        {isCompressing && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span>Compressing video...</span>
          </div>
        )}

        {wasCompressed && !isCompressing && (
          <div className="flex items-center gap-2 text-sm text-green-600">
            <HugeiconsIcon icon={Tick02Icon} className="w-4 h-4" />
            <span>Video compressed successfully</span>
          </div>
        )}

        {isOverSize && !isCompressing && (
          <div className="flex items-center gap-2 text-sm text-destructive">
            <HugeiconsIcon icon={Cancel01Icon} className="w-4 h-4" />
            <span>Video is too large. Consider re-recording with shorter duration.</span>
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex flex-col gap-3 pt-2">
        <Button
          onClick={onSubmitQuick}
          disabled={isCompressing || isSubmitting || isOverSize}
          className="w-full"
          size="lg"
        >
          {isSubmitting ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              Submitting...
            </>
          ) : (
            "Submit for Analysis"
          )}
        </Button>

        <Button
          variant="outline"
          onClick={onSubmitWithPolicy}
          disabled={isCompressing || isSubmitting || isOverSize}
          className="w-full"
          size="lg"
        >
          <HugeiconsIcon icon={File01Icon} className="w-4 h-4 mr-2" />
          Add Policy & Submit
        </Button>

        <Button
          variant="ghost"
          onClick={onCancel}
          disabled={isSubmitting}
          className="w-full"
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}
