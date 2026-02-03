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
      {/* Video preview - full width with negative margin to span edge-to-edge */}
      <div className="flex-1 flex items-center justify-center bg-black overflow-hidden min-h-0 -mx-4 sm:-mx-6 mt-1">
        <video
          src={videoUrl}
          controls
          playsInline
          className="w-full h-full max-h-full object-contain"
        />
      </div>

      {/* File info - compact single row */}
      <div className="flex items-center justify-between text-sm py-3">
        <div className="flex items-center gap-4">
          <span className="text-muted-foreground">
            {formatDuration(duration)} · {formatFileSize(videoFile.size)}
          </span>
          {wasCompressed && !isCompressing && (
            <span className="flex items-center gap-1 text-green-600">
              <HugeiconsIcon icon={Tick02Icon} className="w-3.5 h-3.5" />
              Compressed
            </span>
          )}
        </div>
        {isOverSize && <span className="text-destructive text-xs">Too large</span>}
      </div>

      {isCompressing && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground pb-3">
          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span>Compressing video...</span>
        </div>
      )}

      {isOverSize && !isCompressing && (
        <div className="flex items-center gap-2 text-sm text-destructive pb-3">
          <HugeiconsIcon icon={Cancel01Icon} className="w-4 h-4" />
          <span>Video is too large. Consider re-recording with shorter duration.</span>
        </div>
      )}

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
