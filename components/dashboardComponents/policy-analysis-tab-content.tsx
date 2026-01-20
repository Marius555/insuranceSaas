"use client";

import { useState } from "react";
import { FileUploadZone } from "@/components/gemini-analysis/file-upload-zone";
import { MediaPreview } from "@/components/gemini-analysis/media-preview";
import { ProgressIndicator } from "@/components/gemini-analysis/progress-indicator";
import { submitClaimAction } from "@/appwrite/submitClaimAction";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { HugeiconsIcon,  } from "@hugeicons/react";
import { Pdf02Icon } from "@hugeicons/core-free-icons";
import { Delete02Icon } from "@hugeicons/core-free-icons";


interface PolicyAnalysisTabContentProps {
  onSuccess: (claimId: string) => void;
}

export function PolicyAnalysisTabContent({ onSuccess }: PolicyAnalysisTabContentProps) {
  const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null);
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [policyFile, setPolicyFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState(false);

  const handleMediaFilesSelected = (selectedFiles: File[]) => {
    if (selectedFiles.length === 0) {
      setMediaType(null);
      setMediaFiles([]);
      return;
    }

    const firstFile = selectedFiles[0];
    const isVideo = firstFile.type.startsWith('video/');

    if (isVideo) {
      setMediaType('video');
      setMediaFiles([selectedFiles[0]]);
    } else {
      setMediaType('image');
      setMediaFiles(selectedFiles.slice(0, 5));
    }
  };

  const handlePolicyFileSelected = (selectedFiles: File[]) => {
    setPolicyFile(selectedFiles[0] || null);
  };

  const handleAnalyze = async () => {
    if (mediaFiles.length === 0 || !policyFile) return;

    setIsAnalyzing(true);
    setError("");
    setCurrentStep(1);

    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      setCurrentStep(2);

      const formData = new FormData();
      const sortedFiles = [...mediaFiles].sort((a, b) => {
        const nameCompare = a.name.localeCompare(b.name);
        if (nameCompare !== 0) return nameCompare;
        return a.size - b.size;
      });
      sortedFiles.forEach(file => formData.append('mediaFiles', file));
      formData.append('policyFile', policyFile);

      await new Promise(resolve => setTimeout(resolve, 500));
      setCurrentStep(3);

      await new Promise(resolve => setTimeout(resolve, 500));
      setCurrentStep(4);

      const result = await submitClaimAction(formData);

      if (result.success && result.claimId) {
        setCurrentStep(6);
        setSuccess(true);
        // Call immediately - no delay, let modal stay open during navigation
        onSuccess(result.claimId!);
      } else {
        setError(result.message || "Analysis failed. Please try again.");
        setIsAnalyzing(false);
      }
    } catch (err) {
      console.error("Upload error:", err);
      setError("An unexpected error occurred. Please try again.");
      setIsAnalyzing(false);
    }
  };

  const handleRemoveMediaFile = (index: number) => {
    const newFiles = mediaFiles.filter((_, i) => i !== index);
    setMediaFiles(newFiles);
    if (newFiles.length === 0) {
      setMediaType(null);
    }
  };

  const canAnalyze = mediaFiles.length > 0 && policyFile && !isAnalyzing && !success;

  return (
    <div className="space-y-6">
      {!isAnalyzing && !success && (
        <>
          <div className="space-y-4">
            {mediaFiles.length === 0 ? (
              <FileUploadZone
                accept="image/*,video/*"
                maxSize={20 * 1024 * 1024}
                multiple={true}
                maxFiles={5}
                onFilesSelected={handleMediaFilesSelected}
                disabled={isAnalyzing}
                label="Upload Images or Video"
              />
            ) : (
              <MediaPreview
                files={mediaFiles}
                onRemove={handleRemoveMediaFile}
                mediaType={mediaType!}
                displayMode="compact"
              />
            )}
          </div>

          <div className="space-y-4">
            {!policyFile ? (
              <FileUploadZone
                accept="application/pdf"
                maxSize={20 * 1024 * 1024}
                multiple={false}
                onFilesSelected={handlePolicyFileSelected}
                disabled={isAnalyzing}
                label="Upload Policy PDF"
              />
            ) : (
              <div className="border rounded-lg p-4 bg-card">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <HugeiconsIcon icon={Pdf02Icon} className="h-8 w-8 text-red-500" />
                    <div>
                      <p className="font-medium">{policyFile.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {(policyFile.size / 1024 / 1024).toFixed(2)} MB
                        <Badge variant="outline" className="ml-2">PDF</Badge>
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm" className="rounded-full "
                    onClick={() => setPolicyFile(null)}
                  >
                    <HugeiconsIcon icon={Delete02Icon} color="red"  />
                  </Button>
                </div>
              </div>
            )}
          </div>

          {canAnalyze && (
            <Button onClick={handleAnalyze} className="w-full" size="lg">
              Analyze with Policy & Submit Claim
            </Button>
          )}
        </>
      )}

      {isAnalyzing && (
        <ProgressIndicator currentStep={currentStep} />
      )}

      {error && (
        <div className="rounded-lg bg-destructive/10 border border-destructive p-4 text-destructive">
          {error}
        </div>
      )}

      {success && (
        <div className="text-center py-12">
          <div className="text-green-600 text-xl font-semibold mb-2">
            ✓ Claim Submitted Successfully!
          </div>
          <p className="text-muted-foreground">
            Redirecting to your claim...
          </p>
        </div>
      )}
    </div>
  );
}
