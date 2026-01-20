"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileUploadZone } from "./file-upload-zone";
import { MediaPreview } from "./media-preview";
import { ProgressIndicator } from "./progress-indicator";
import { AnalysisResultDisplay } from "./analysis-result-display";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { submitClaimAction } from "@/appwrite/submitClaimAction";
import type { EnhancedAutoDamageAnalysis } from "@/lib/gemini/types";

export function PolicyAnalysisTab() {
  const router = useRouter();
  const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null);
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [policyFile, setPolicyFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [result, setResult] = useState<EnhancedAutoDamageAnalysis | null>(null);
  const [claimId, setClaimId] = useState<string | null>(null);
  const [claimNumber, setClaimNumber] = useState<string | null>(null);
  const [securityWarnings, setSecurityWarnings] = useState<string[]>([]);
  const [error, setError] = useState<string>("");

  const handleMediaFilesSelected = (selectedFiles: File[]) => {
    if (selectedFiles.length === 0) return;

    const firstFile = selectedFiles[0];
    const newMediaType = firstFile.type.startsWith('image/') ? 'image' : 'video';

    setMediaFiles(selectedFiles);
    setMediaType(newMediaType);
    setError("");
    setResult(null);
    setClaimId(null);
    setClaimNumber(null);
    setSecurityWarnings([]);
  };

  const handlePolicyFileSelected = (selectedFiles: File[]) => {
    if (selectedFiles.length === 0) return;
    setPolicyFile(selectedFiles[0]);
    setError("");
  };

  const handleRemoveMediaFile = (index: number) => {
    const newFiles = mediaFiles.filter((_, i) => i !== index);
    setMediaFiles(newFiles);
    if (newFiles.length === 0) {
      setMediaType(null);
    }
  };

  const handleAnalyze = async () => {
    if (mediaFiles.length === 0 || !policyFile) {
      setError("Please upload both media files and policy document");
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

      // Sort media files alphabetically for consistent processing order
      const filesArray = Array.from(mediaFiles);
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

      // Add policy file
      formData.append('policyFile', policyFile);

      // Step 3: Scanning for security threats
      setCurrentStep(3);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Longer for PDF scanning

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
      setResult(result.analysis as EnhancedAutoDamageAnalysis);
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

  const canAnalyze = mediaFiles.length > 0 && policyFile !== null && !isAnalyzing;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Enhanced Policy Analysis</h2>
        <p className="text-muted-foreground mt-1">
          Upload damage media and insurance policy for comprehensive claim assessment with fraud detection
        </p>
      </div>

      {/* Media Upload */}
      <FileUploadZone
        accept="image/*,video/*"
        multiple={true}
        maxFiles={5}
        onFilesSelected={handleMediaFilesSelected}
        disabled={isAnalyzing}
        label="1. Upload Damage Media"
        description="Images (up to 5) or Video (1) showing vehicle damage"
      />

      {/* Media Preview */}
      {mediaFiles.length > 0 && !isAnalyzing && !result && (
        <MediaPreview
          files={mediaFiles}
          onRemove={handleRemoveMediaFile}
          mediaType={mediaType!}
          showAngleSelector={mediaType === 'image'}
        />
      )}

      {/* Policy Upload */}
      <FileUploadZone
        accept="application/pdf"
        multiple={false}
        onFilesSelected={handlePolicyFileSelected}
        disabled={isAnalyzing}
        label="2. Upload Insurance Policy"
        description="Insurance policy document in PDF format"
      />

      {/* Policy Preview */}
      {policyFile && !isAnalyzing && !result && (
        <div className="border rounded-lg p-4 bg-card">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <svg className="h-10 w-10 text-red-600" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
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
              size="sm"
              onClick={() => setPolicyFile(null)}
            >
              Remove
            </Button>
          </div>
        </div>
      )}

      {/* Analyze Button */}
      {canAnalyze && !result && (
        <Button
          onClick={handleAnalyze}
          size="lg"
          className="w-full"
          disabled={!canAnalyze}
        >
          <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
          </svg>
          Analyze & Submit Claim with Policy
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
          riskLevel={
            result.vehicleVerification.verificationStatus === 'mismatched' ? 'high' :
            securityWarnings.length > 0 ? 'medium' : 'low'
          }
          claimId={claimId}
          claimNumber={claimNumber}
          uploadedFiles={mediaFiles}
          policyFile={policyFile}
          onReset={() => {
            setMediaFiles([]);
            setPolicyFile(null);
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
