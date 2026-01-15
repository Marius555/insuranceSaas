"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileUploadZone } from "@/components/gemini-analysis/file-upload-zone";
import { formatFileSize } from "@/lib/utils/video-compression";
import { ArrowLeft01Icon, Video02Icon, File01Icon, Cancel01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

interface PolicyUploadStepProps {
  videoFile: File;
  onSubmit: (policyFile: File) => void;
  onBack: () => void;
  isSubmitting?: boolean;
}

export function PolicyUploadStep({
  videoFile,
  onSubmit,
  onBack,
  isSubmitting = false,
}: PolicyUploadStepProps) {
  const [policyFile, setPolicyFile] = useState<File | null>(null);

  const handlePolicySelected = (files: File[]) => {
    if (files.length > 0) {
      setPolicyFile(files[0]);
    }
  };

  const handleRemovePolicy = () => {
    setPolicyFile(null);
  };

  const handleSubmit = () => {
    if (policyFile) {
      onSubmit(policyFile);
    }
  };

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          disabled={isSubmitting}
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} className="w-4 h-4" />
        </Button>
        <h3 className="text-lg font-semibold">Add Insurance Policy</h3>
      </div>

      {/* Video file info */}
      <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <HugeiconsIcon icon={Video02Icon} className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{videoFile.name}</p>
          <p className="text-xs text-muted-foreground">
            {formatFileSize(videoFile.size)}
          </p>
        </div>
      </div>

      {/* Policy upload */}
      <div className="flex-1">
        {!policyFile ? (
          <FileUploadZone
            accept="application/pdf"
            maxSize={50 * 1024 * 1024}
            multiple={false}
            onFilesSelected={handlePolicySelected}
            disabled={isSubmitting}
            label="Upload Insurance Policy"
            description="Upload your insurance policy document (PDF) for enhanced analysis with coverage verification"
          />
        ) : (
          <div className="space-y-2">
            <label className="block text-sm font-medium">
              Insurance Policy
            </label>
            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <HugeiconsIcon icon={File01Icon} className="w-5 h-5 text-green-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{policyFile.name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatFileSize(policyFile.size)}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleRemovePolicy}
                disabled={isSubmitting}
              >
                <HugeiconsIcon icon={Cancel01Icon} className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Info text */}
      <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
        <p className="font-medium mb-1">Enhanced Analysis includes:</p>
        <ul className="list-disc list-inside space-y-1 text-xs">
          <li>Vehicle verification against policy</li>
          <li>Coverage limit verification</li>
          <li>Deductible calculation</li>
          <li>Estimated payout calculation</li>
        </ul>
      </div>

      {/* Submit button */}
      <Button
        onClick={handleSubmit}
        disabled={!policyFile || isSubmitting}
        className="w-full"
        size="lg"
      >
        {isSubmitting ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
            Submitting...
          </>
        ) : (
          "Submit with Policy"
        )}
      </Button>
    </div>
  );
}
