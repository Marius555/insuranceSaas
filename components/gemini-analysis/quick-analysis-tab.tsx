"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileUploadZone } from "./file-upload-zone";
import { MediaPreview } from "./media-preview";
import { ProgressIndicator } from "./progress-indicator";
import { AnalysisResultDisplay } from "./analysis-result-display";
import { Button } from "@/components/ui/button";
import { submitClaimAction } from "@/app/claim-analysis/actions";
import type { EnhancedAutoDamageAnalysis } from "@/lib/gemini/types";

export function QuickAnalysisTab() {
  const router = useRouter();
  const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [result, setResult] = useState<EnhancedAutoDamageAnalysis | null>(null);
  const [claimId, setClaimId] = useState<string | null>(null);
  const [claimNumber, setClaimNumber] = useState<string | null>(null);
  const [securityWarnings, setSecurityWarnings] = useState<string[]>([]);
  const [error, setError] = useState<string>("");

  const handleFilesSelected = (selectedFiles: File[]) => {
    if (selectedFiles.length === 0) return;

    // Auto-detect media type from first file
    const firstFile = selectedFiles[0];
    const newMediaType = firstFile.type.startsWith('image/') ? 'image' : 'video';

    setFiles(selectedFiles);
    setMediaType(newMediaType);
    setError("");
    setResult(null);
    setClaimId(null);
    setClaimNumber(null);
    setSecurityWarnings([]);
  };

  const handleRemoveFile = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index);
    setFiles(newFiles);

    if (newFiles.length === 0) {
      setMediaType(null);
    }
  };

  const handleAnalyze = async () => {
    if (files.length === 0) {
      setError("Please upload at least one file");
      return;
    }

    setIsAnalyzing(true);
    setCurrentStep(1);
    setError("");
    setResult(null);
    setClaimId(null);
    setClaimNumber(null);
    setSecurityWarnings([]);

    try {
      // Step 1: Validating files
      setCurrentStep(1);
      await new Promise(resolve => setTimeout(resolve, 500));

      // Step 2: Uploading to storage
      setCurrentStep(2);
      await new Promise(resolve => setTimeout(resolve, 500));

      // Create FormData for server action
      const formData = new FormData();

      // Sort files alphabetically for consistent processing order
      const filesArray = Array.from(files);
      const sortedFiles = filesArray.sort((a, b) => {
        // Primary sort by filename
        const nameCompare = a.name.localeCompare(b.name);
        if (nameCompare !== 0) return nameCompare;

        // Secondary sort by size (for identical names)
        return a.size - b.size;
      });

      // Add media files in sorted order
      sortedFiles.forEach(file => {
        formData.append('mediaFiles', file);
      });

      // Step 3: Scanning for security threats
      setCurrentStep(3);
      await new Promise(resolve => setTimeout(resolve, 500));

      // Step 4: Analyzing with Gemini AI
      setCurrentStep(4);

      // Call server action (this does: upload + scan + analyze + save to DB)
      const result = await submitClaimAction(formData);

      if (!result.success) {
        // Handle specific error types
        if (result.retryAfter) {
          setError(`AI models at capacity. Please retry in ${result.retryAfter} seconds.`);
        } else {
          setError(result.message || 'Analysis failed. Please try again.');
        }
        setIsAnalyzing(false);
        return;
      }

      // Step 5: Saving to database (already done by server action)
      setCurrentStep(5);
      await new Promise(resolve => setTimeout(resolve, 500));

      // Step 6: Complete
      setCurrentStep(6);

      // Store results
      setResult(result.analysis!);
      setClaimId(result.claimId!);
      setClaimNumber(result.claimNumber!);

      if (result.warnings && result.warnings.length > 0) {
        setSecurityWarnings(result.warnings);
      }

      console.log(`✅ Claim created successfully: ${result.claimNumber}`);
    } catch (err) {
      console.error('Analysis error:', err);
      setError(err instanceof Error ? err.message : 'Analysis failed. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Quick Damage Analysis</h2>
        <p className="text-muted-foreground mt-1">
          Upload images or a video of vehicle damage for instant AI assessment
        </p>
      </div>

      {/* File Upload */}
      <FileUploadZone
        accept="image/*,video/*"
        multiple={true}
        maxFiles={5}
        onFilesSelected={handleFilesSelected}
        disabled={isAnalyzing}
        label="Upload Media Files"
        description="Images (JPG, PNG) or Video (MP4, MOV, AVI). Up to 5 images or 1 video."
      />

      {/* Media Preview */}
      {files.length > 0 && !isAnalyzing && !result && (
        <MediaPreview
          files={files}
          onRemove={handleRemoveFile}
          mediaType={mediaType!}
          showAngleSelector={mediaType === 'image'}
        />
      )}

      {/* Analyze Button */}
      {files.length > 0 && !isAnalyzing && !result && (
        <Button
          onClick={handleAnalyze}
          size="lg"
          className="w-full"
        >
          <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
          </svg>
          Analyze & Submit Claim
        </Button>
      )}

      {/* Progress Indicator */}
      {isAnalyzing && (
        <ProgressIndicator currentStep={currentStep} />
      )}

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-destructive/10 border border-destructive rounded-lg">
          <p className="text-sm text-destructive">
            <strong>Error:</strong> {error}
          </p>
        </div>
      )}

      {/* Results */}
      {result && claimId && claimNumber && (
        <AnalysisResultDisplay
          analysis={result}
          securityWarnings={securityWarnings}
          riskLevel={securityWarnings.length > 0 ? 'medium' : 'low'}
          claimId={claimId}
          claimNumber={claimNumber}
          uploadedFiles={files}
          onReset={() => {
            setFiles([]);
            setMediaType(null);
            setResult(null);
            setClaimId(null);
            setClaimNumber(null);
            setSecurityWarnings([]);
            setError("");
          }}
        />
      )}
    </div>
  );
}
