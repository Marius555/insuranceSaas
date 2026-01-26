"use client";

import { useState, useCallback } from "react";
import { FileUploadZone } from "@/components/gemini-analysis/file-upload-zone";
import { MediaPreview } from "@/components/gemini-analysis/media-preview";
import { ProgressIndicator } from "@/components/gemini-analysis/progress-indicator";
import { submitReportAction } from "@/appwrite/submitReportAction";
import { type PolicyInfo } from "@/appwrite/getUserPolicies";
import { usePolicies } from "@/lib/context/policy-context";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { getUserLocation } from "@/lib/utils/country-detection";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Pdf02Icon,
  Delete02Icon,
  ArrowLeft01Icon,
  Add01Icon,
  Tick02Icon,
  Upload04Icon,
} from "@hugeicons/core-free-icons";


interface PolicyAnalysisTabContentProps {
  onSuccess: (reportId: string) => void;
}

export function PolicyAnalysisTabContent({ onSuccess }: PolicyAnalysisTabContentProps) {
  const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null);
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);

  // Policy state - supports both existing (auto-filled) and new uploads
  const [existingPolicy, setExistingPolicy] = useState<PolicyInfo | null>(null);
  const [newPolicyFile, setNewPolicyFile] = useState<File | null>(null);
  const [showNewUpload, setShowNewUpload] = useState(false);

  // Use policies from context (pre-fetched server-side)
  const { policies: availablePolicies, isLoading: isLoadingPolicies, refreshPolicies } = usePolicies();

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState(false);

  // Determine the active policy (new upload takes precedence)
  const hasPolicy = newPolicyFile || existingPolicy;

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

  const handleNewPolicyFileSelected = (selectedFiles: File[]) => {
    if (selectedFiles[0]) {
      setNewPolicyFile(selectedFiles[0]);
      setExistingPolicy(null); // Clear existing when new is uploaded
      setShowNewUpload(false);
    }
  };

  const handleExistingPolicySelect = useCallback((policy: PolicyInfo) => {
    setExistingPolicy(policy);
    setNewPolicyFile(null); // Clear new upload when selecting existing
    setShowNewUpload(false);
  }, []);

  const handleUploadNewPolicy = () => {
    setShowNewUpload(true);
  };

  const handleCancelNewUpload = () => {
    setShowNewUpload(false);
  };

  const handleClearPolicy = () => {
    setExistingPolicy(null);
    setNewPolicyFile(null);
  };

  const handleAnalyze = async () => {
    if (mediaFiles.length === 0 || !hasPolicy) return;

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

      // Add policy - either new file or existing file ID
      if (newPolicyFile) {
        formData.append('policyFile', newPolicyFile);
      } else if (existingPolicy) {
        formData.append('existingPolicyFileId', existingPolicy.fileId);
      }

      // Add user's location for localized pricing
      const location = getUserLocation();
      formData.append('userCountry', location.country);
      formData.append('userCurrency', location.currency);
      formData.append('userCurrencySymbol', location.currencySymbol);

      await new Promise(resolve => setTimeout(resolve, 500));
      setCurrentStep(3);

      await new Promise(resolve => setTimeout(resolve, 500));
      setCurrentStep(4);

      const result = await submitReportAction(formData);

      if (result.success && result.reportId) {
        setCurrentStep(6);
        setSuccess(true);
        // Refresh policies cache if a new policy was uploaded
        if (newPolicyFile) {
          refreshPolicies();
        }
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

  const handleRemoveMediaFile = (index: number) => {
    const newFiles = mediaFiles.filter((_, i) => i !== index);
    setMediaFiles(newFiles);
    if (newFiles.length === 0) {
      setMediaType(null);
    }
  };

  const canAnalyze = mediaFiles.length > 0 && hasPolicy && !isAnalyzing && !success;

  // Render selected policy card
  const renderSelectedPolicy = (policy: PolicyInfo, isNew = false) => {
    const formattedSize = (policy.size / 1024 / 1024).toFixed(2);
    const formattedDate = new Date(policy.uploadedAt).toLocaleDateString();
    const hasMultiplePolicies = availablePolicies.length > 1;

    return (
      <div className="space-y-2">
        <label className="block text-sm font-medium">Insurance Policy</label>
        <div className="border rounded-lg p-4 bg-card min-h-[80px]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <HugeiconsIcon icon={Pdf02Icon} className="h-8 w-8 text-red-500 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="font-medium truncate">{policy.filename}</p>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm text-muted-foreground">
                    {formattedSize} MB
                  </span>
                  <Badge variant="secondary" className="text-xs">
                    {isNew ? "New Upload" : "Auto-filled"}
                  </Badge>
                  {!isNew && (
                    <span className="text-xs text-muted-foreground">
                      {formattedDate}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1 flex-shrink-0 ml-2">
              {!isNew && hasMultiplePolicies && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={isAnalyzing}
                      className="text-primary hover:text-primary/80"
                    >
                      Change
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-80">
                    <DropdownMenuLabel>Select Policy</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {availablePolicies.map((p) => {
                      const isSelected = existingPolicy?.fileId === p.fileId;
                      const pSize = (p.size / 1024 / 1024).toFixed(2);
                      const pDate = new Date(p.uploadedAt).toLocaleDateString();

                      return (
                        <DropdownMenuItem
                          key={p.fileId}
                          onClick={() => handleExistingPolicySelect(p)}
                          className="flex items-center gap-3 py-3"
                        >
                          <HugeiconsIcon
                            icon={Pdf02Icon}
                            className="h-5 w-5 text-red-500 flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate text-sm">{p.filename}</p>
                            <p className="text-xs text-muted-foreground">
                              {pSize} MB - {pDate}
                            </p>
                          </div>
                          {isSelected && (
                            <HugeiconsIcon
                              icon={Tick02Icon}
                              className="h-4 w-4 text-primary flex-shrink-0"
                            />
                          )}
                        </DropdownMenuItem>
                      );
                    })}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={handleUploadNewPolicy}
                      className="flex items-center gap-3 py-3 text-primary"
                    >
                      <HugeiconsIcon
                        icon={Upload04Icon}
                        className="h-5 w-5 flex-shrink-0"
                      />
                      <span className="font-medium">Upload New Policy</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="rounded-full"
                onClick={handleClearPolicy}
                disabled={isAnalyzing}
              >
                <HugeiconsIcon icon={Delete02Icon} className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render new policy file card
  const renderNewPolicyFile = () => {
    if (!newPolicyFile) return null;

    return (
      <div className="space-y-2">
        <label className="block text-sm font-medium">Insurance Policy</label>
        <div className="border rounded-lg p-4 bg-card min-h-[80px]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <HugeiconsIcon icon={Pdf02Icon} className="h-8 w-8 text-red-500" />
              <div>
                <p className="font-medium">{newPolicyFile.name}</p>
                <p className="text-sm text-muted-foreground">
                  {(newPolicyFile.size / 1024 / 1024).toFixed(2)} MB
                  <Badge variant="outline" className="ml-2">New Upload</Badge>
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="rounded-full"
              onClick={handleClearPolicy}
            >
              <HugeiconsIcon icon={Delete02Icon} className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {!isAnalyzing && !success && (
        <>
          {/* Media upload section */}
          <div className="space-y-2">
            <label className="block text-sm font-medium">Upload Images or Video</label>
            {mediaFiles.length === 0 ? (
              <FileUploadZone
                accept="image/*,video/*"
                maxSize={20 * 1024 * 1024}
                multiple={true}
                maxFiles={5}
                onFilesSelected={handleMediaFilesSelected}
                disabled={isAnalyzing}
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

          {/* Policy section */}
          <div className="space-y-4">
            {newPolicyFile ? (
              // Show new policy file if uploaded
              renderNewPolicyFile()
            ) : showNewUpload ? (
              // Show upload zone when user clicks "Upload New Policy"
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCancelNewUpload}
                  >
                    <HugeiconsIcon icon={ArrowLeft01Icon} className="h-4 w-4 mr-1" />
                    Back
                  </Button>
                  <span className="text-sm text-muted-foreground">Upload a new policy</span>
                </div>
                <FileUploadZone
                  accept="application/pdf"
                  maxSize={20 * 1024 * 1024}
                  multiple={false}
                  onFilesSelected={handleNewPolicyFileSelected}
                  disabled={isAnalyzing}
                  label="Upload Policy PDF"
                />
              </div>
            ) : existingPolicy ? (
              // Show existing policy with Change/Delete buttons
              renderSelectedPolicy(existingPolicy)
            ) : (
              // Show FileUploadZone with inline "+ Select from previous" link
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Upload Policy PDF</label>
                  {isLoadingPolicies ? (
                    <Skeleton className="h-5 w-32" />
                  ) : availablePolicies.length > 0 ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="text-sm text-primary hover:underline flex items-center gap-1">
                          Select from previous
                          <HugeiconsIcon icon={Add01Icon} className="h-3 w-3" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-80">
                        <DropdownMenuLabel>Previous Policies</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {availablePolicies.map((policy) => {
                          const formattedSize = (policy.size / 1024 / 1024).toFixed(2);
                          const formattedDate = new Date(policy.uploadedAt).toLocaleDateString();

                          return (
                            <DropdownMenuItem
                              key={policy.fileId}
                              onClick={() => handleExistingPolicySelect(policy)}
                              className="flex items-center gap-3 py-3"
                            >
                              <HugeiconsIcon
                                icon={Pdf02Icon}
                                className="h-5 w-5 text-red-500 flex-shrink-0"
                              />
                              <div className="flex-1 min-w-0">
                                <p className="font-medium truncate text-sm">{policy.filename}</p>
                                <p className="text-xs text-muted-foreground">
                                  {formattedSize} MB - {formattedDate}
                                </p>
                              </div>
                            </DropdownMenuItem>
                          );
                        })}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : null}
                </div>
                <FileUploadZone
                  accept="application/pdf"
                  maxSize={20 * 1024 * 1024}
                  multiple={false}
                  onFilesSelected={handleNewPolicyFileSelected}
                  disabled={isAnalyzing}
                />
              </div>
            )}
          </div>

          {canAnalyze && (
            <Button onClick={handleAnalyze} className="w-full" size="lg">
              Analyze Damage & Generate Report
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
            Report Generated Successfully!
          </div>
          <p className="text-muted-foreground">
            Redirecting to your report...
          </p>
        </div>
      )}
    </div>
  );
}
