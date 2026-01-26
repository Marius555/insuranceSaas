"use client";

import { useState } from "react";
import { FileUploadZone } from "@/components/gemini-analysis/file-upload-zone";
import { MediaPreview } from "@/components/gemini-analysis/media-preview";
import { ProgressIndicator } from "@/components/gemini-analysis/progress-indicator";
import { submitReportAction } from "@/appwrite/submitReportAction";
import { Button } from "@/components/ui/button";
import { getUserLocation } from "@/lib/utils/country-detection";

interface QuickAnalysisTabContentProps {
  onSuccess: (reportId: string) => void;
}

export function QuickAnalysisTabContent({ onSuccess }: QuickAnalysisTabContentProps) {
  const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState(false);

  const handleFilesSelected = (selectedFiles: File[]) => {
    if (selectedFiles.length === 0) {
      setMediaType(null);
      setFiles([]);
      return;
    }

    const firstFile = selectedFiles[0];
    const isVideo = firstFile.type.startsWith('video/');

    if (isVideo) {
      setMediaType('video');
      setFiles([selectedFiles[0]]); // Only first video
    } else {
      setMediaType('image');
      setFiles(selectedFiles.slice(0, 5)); // Max 5 images
    }
  };

  const handleAnalyze = async () => {
    if (files.length === 0) return;

    setIsAnalyzing(true);
    setError("");
    setCurrentStep(1);

    try {
      // Step 1: Validating
      await new Promise(resolve => setTimeout(resolve, 500));
      setCurrentStep(2);

      // Step 2: Uploading
      const formData = new FormData();
      const sortedFiles = [...files].sort((a, b) => {
        const nameCompare = a.name.localeCompare(b.name);
        if (nameCompare !== 0) return nameCompare;
        return a.size - b.size;
      });
      sortedFiles.forEach(file => formData.append('mediaFiles', file));

      // Add user's location for localized pricing
      const location = getUserLocation();
      formData.append('userCountry', location.country);
      formData.append('userCurrency', location.currency);
      formData.append('userCurrencySymbol', location.currencySymbol);

      await new Promise(resolve => setTimeout(resolve, 500));
      setCurrentStep(3);

      // Step 3: Security scanning
      await new Promise(resolve => setTimeout(resolve, 500));
      setCurrentStep(4);

      // Step 4: AI Analysis & Steps 5-6 (handled by server)
      const result = await submitReportAction(formData);

      if (result.success && result.reportId) {
        setCurrentStep(6);
        setSuccess(true);
        // Call immediately - no delay, let modal stay open during navigation
        onSuccess(result.reportId!);
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

  const handleRemoveFile = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index);
    setFiles(newFiles);
    if (newFiles.length === 0) {
      setMediaType(null);
    }
  };

  return (
    <div className="space-y-6">
      {!isAnalyzing && !success && (
        <>
          <div className="space-y-2">
            <label className="block text-sm font-medium">Upload Images or Video</label>
            {files.length === 0 ? (
              <FileUploadZone
                accept="image/*,video/*"
                maxSize={20 * 1024 * 1024}
                multiple={true}
                maxFiles={5}
                onFilesSelected={handleFilesSelected}
                disabled={isAnalyzing}
              />
            ) : (
              <MediaPreview
                files={files}
                onRemove={handleRemoveFile}
                mediaType={mediaType!}
                displayMode="compact"
              />
            )}
          </div>

          {files.length > 0 && (
            <Button onClick={handleAnalyze} className="w-full" size="lg">
              Analyze & Submit Report
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
            ✓ Report Submitted Successfully!
          </div>
          <p className="text-muted-foreground">
            Redirecting to your report...
          </p>
        </div>
      )}
    </div>
  );
}
