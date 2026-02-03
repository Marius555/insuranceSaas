"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileUploadZone } from "@/components/gemini-analysis/file-upload-zone";
import { type PolicyInfo } from "@/lib/types/appwrite";
import { usePolicies } from "@/lib/context/policy-context";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { formatFileSize } from "@/lib/utils/video-compression";
import {
  ArrowLeft01Icon,
  Video02Icon,
  File01Icon,
  Cancel01Icon,
  Pdf02Icon,
  Add01Icon,
  Tick02Icon,
  Upload04Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

// Union type for policy submission
export type PolicySubmission =
  | { type: 'file'; file: File }
  | { type: 'existing'; policy: PolicyInfo };

interface PolicyUploadStepProps {
  videoFile: File;
  onSubmit: (policy: PolicySubmission) => void;
  onBack: () => void;
  isSubmitting?: boolean;
}

export function PolicyUploadStep({
  videoFile,
  onSubmit,
  onBack,
  isSubmitting = false,
}: PolicyUploadStepProps) {
  // Policy state - supports both existing (auto-filled) and new uploads
  const [existingPolicy, setExistingPolicy] = useState<PolicyInfo | null>(null);
  const [newPolicyFile, setNewPolicyFile] = useState<File | null>(null);
  const [showNewUpload, setShowNewUpload] = useState(false);

  // Use policies from context (pre-fetched server-side)
  const { policies: availablePolicies, isLoading: isLoadingPolicies } = usePolicies();

  // Determine the active policy (new upload takes precedence)
  const hasPolicy = newPolicyFile || existingPolicy;

  const handleNewPolicySelected = (files: File[]) => {
    if (files.length > 0) {
      setNewPolicyFile(files[0]);
      setExistingPolicy(null);
      setShowNewUpload(false);
    }
  };

  const handleExistingPolicySelect = useCallback((policy: PolicyInfo) => {
    setExistingPolicy(policy);
    setNewPolicyFile(null);
    setShowNewUpload(false);
  }, []);

  const handleUploadNewPolicy = () => {
    setShowNewUpload(true);
  };

  const handleCancelNewUpload = () => {
    setShowNewUpload(false);
  };

  const handleClearPolicy = () => {
    setNewPolicyFile(null);
    setExistingPolicy(null);
  };

  const handleSubmit = () => {
    if (newPolicyFile) {
      onSubmit({ type: 'file', file: newPolicyFile });
    } else if (existingPolicy) {
      onSubmit({ type: 'existing', policy: existingPolicy });
    }
  };

  // Render selected policy card
  const renderSelectedPolicy = (policy: PolicyInfo) => {
    const formattedSize = (policy.size / 1024 / 1024).toFixed(2);
    const formattedDate = new Date(policy.uploadedAt).toLocaleDateString();
    const hasMultiplePolicies = availablePolicies.length > 1;

    return (
      <div className="space-y-2">
        <label className="block text-sm font-medium">Insurance Policy</label>
        <div className="flex items-center gap-3 p-3 border rounded-lg">
          <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
            <HugeiconsIcon icon={Pdf02Icon} className="w-5 h-5 text-green-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{policy.filename}</p>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-muted-foreground">{formattedSize} MB</span>
              <Badge variant="secondary" className="text-xs">Auto-filled</Badge>
              <span className="text-xs text-muted-foreground">{formattedDate}</span>
            </div>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            {hasMultiplePolicies && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={isSubmitting}
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
              size="icon"
              onClick={handleClearPolicy}
              disabled={isSubmitting}
            >
              <HugeiconsIcon icon={Cancel01Icon} className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    );
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

      {/* Policy section */}
      <div className="flex-1">
        {newPolicyFile ? (
          // Show new policy file if uploaded
          <div className="space-y-2">
            <label className="block text-sm font-medium">
              Insurance Policy
            </label>
            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <HugeiconsIcon icon={File01Icon} className="w-5 h-5 text-green-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{newPolicyFile.name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatFileSize(newPolicyFile.size)}
                  <Badge variant="outline" className="ml-2">New Upload</Badge>
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleClearPolicy}
                disabled={isSubmitting}
              >
                <HugeiconsIcon icon={Cancel01Icon} className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ) : showNewUpload ? (
          /* Show upload zone when user clicks "Upload New Policy" */
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCancelNewUpload}
                disabled={isSubmitting}
              >
                <HugeiconsIcon icon={ArrowLeft01Icon} className="w-4 h-4 mr-1" />
                Back
              </Button>
              <span className="text-sm text-muted-foreground">Upload a new policy</span>
            </div>
            <FileUploadZone
              accept="application/pdf"
              maxSize={50 * 1024 * 1024}
              multiple={false}
              onFilesSelected={handleNewPolicySelected}
              disabled={isSubmitting}
              label="Upload Insurance Policy"
              description="Upload your insurance policy document (PDF) for enhanced analysis with coverage verification"
            />
          </div>
        ) : existingPolicy ? (
          /* Show existing policy with Change/Delete buttons */
          renderSelectedPolicy(existingPolicy)
        ) : (
          /* Show FileUploadZone with inline "+ Select from previous" link */
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Upload Insurance Policy</label>
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
              maxSize={50 * 1024 * 1024}
              multiple={false}
              onFilesSelected={handleNewPolicySelected}
              disabled={isSubmitting}
              description="Upload your insurance policy document (PDF) for enhanced analysis with coverage verification"
            />
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
        disabled={!hasPolicy || isSubmitting}
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
