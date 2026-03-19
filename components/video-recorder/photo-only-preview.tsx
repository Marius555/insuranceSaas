"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Skeleton } from "@/components/ui/skeleton";
import { Tick02Icon, File01Icon, Cancel01Icon, Pdf02Icon, ArrowLeft01Icon, ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { cn } from "@/lib/utils";
import { usePolicies } from "@/lib/context/policy-context";
import { type PolicySubmission } from "@/components/video-recorder/policy-upload-step";
import { FileUploadZone } from "@/components/gemini-analysis/file-upload-zone";

interface CapturedPhoto {
  file: File;
  thumbnailUrl: string;
  stepLabel: string;
}

interface PhotoOnlyPreviewProps {
  capturedPhotos: CapturedPhoto[];
  onSubmitQuick: () => void;
  onSubmitWithPolicy: (policy: PolicySubmission) => void;
  onRemovePhoto: (index: number) => void;
}

export function PhotoOnlyPreview({
  capturedPhotos,
  onSubmitQuick,
  onSubmitWithPolicy,
  onRemovePhoto,
}: PhotoOnlyPreviewProps) {
  const [submissionOpen, setSubmissionOpen] = useState(false);
  const [policyPickerOpen, setPolicyPickerOpen] = useState(false);
  const [photoToRemove, setPhotoToRemove] = useState<number | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxPhotoIndex, setLightboxPhotoIndex] = useState(0);
  const [selectedPolicy, setSelectedPolicy] = useState<PolicySubmission | null>(null);
  const touchStartXRef = useRef<number | null>(null);
  const { policies: savedPolicies, isLoading: isLoadingPolicies } = usePolicies();

  return (
    <div className="flex flex-col h-full">
      {/* Fullscreen photo lightbox */}
      {lightboxOpen && capturedPhotos.length > 0 && (
        <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
          <button
            className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 transition-colors flex items-center justify-center"
            onClick={() => setLightboxOpen(false)}
          >
            <HugeiconsIcon icon={Cancel01Icon} className="w-5 h-5 text-white" />
          </button>

          <div
            className="relative w-full h-full flex items-center justify-center"
            onTouchStart={(e) => { touchStartXRef.current = e.touches[0].clientX; }}
            onTouchEnd={(e) => {
              if (touchStartXRef.current === null) return;
              const delta = e.changedTouches[0].clientX - touchStartXRef.current;
              touchStartXRef.current = null;
              if (Math.abs(delta) < 50) return;
              if (delta < 0 && lightboxPhotoIndex < capturedPhotos.length - 1) {
                setLightboxPhotoIndex((i) => i + 1);
              } else if (delta > 0 && lightboxPhotoIndex > 0) {
                setLightboxPhotoIndex((i) => i - 1);
              }
            }}
          >
            <img
              src={capturedPhotos[lightboxPhotoIndex]?.thumbnailUrl}
              alt={capturedPhotos[lightboxPhotoIndex]?.stepLabel}
              className="max-w-full max-h-full object-contain"
            />
            {lightboxPhotoIndex > 0 && (
              <button
                className="absolute left-4 w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 transition-colors flex items-center justify-center"
                onClick={() => setLightboxPhotoIndex((i) => i - 1)}
              >
                <HugeiconsIcon icon={ArrowLeft01Icon} className="w-5 h-5 text-white" />
              </button>
            )}
            {lightboxPhotoIndex < capturedPhotos.length - 1 && (
              <button
                className="absolute right-4 w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 transition-colors flex items-center justify-center"
                onClick={() => setLightboxPhotoIndex((i) => i + 1)}
              >
                <HugeiconsIcon icon={ArrowRight01Icon} className="w-5 h-5 text-white" />
              </button>
            )}
            <div className="absolute bottom-8 left-0 right-0 flex flex-col items-center gap-1">
              <span className="text-white text-sm font-medium">
                {capturedPhotos[lightboxPhotoIndex]?.stepLabel}
              </span>
              <span className="text-white/60 text-xs">
                {lightboxPhotoIndex + 1} / {capturedPhotos.length}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Photo grid */}
      <div className="pb-3">
        <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
          {capturedPhotos.length} {capturedPhotos.length === 1 ? "photo" : "photos"} captured
        </p>
        <div className="flex gap-2 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {capturedPhotos.map((photo, index) => (
            <div key={index} className="relative shrink-0 w-24">
              <button
                className="relative w-24 h-24 rounded-lg overflow-hidden block"
                onClick={() => {
                  setLightboxPhotoIndex(index);
                  setLightboxOpen(true);
                }}
              >
                <img
                  src={photo.thumbnailUrl}
                  alt={photo.stepLabel}
                  className="w-full h-full object-cover"
                />
              </button>
              <p className="text-xs text-muted-foreground text-center mt-1 truncate">
                {photo.stepLabel}
              </p>
              <button
                className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 hover:bg-black/80 transition-colors flex items-center justify-center"
                onClick={(e) => {
                  e.stopPropagation();
                  setPhotoToRemove(index);
                }}
              >
                <HugeiconsIcon icon={Cancel01Icon} className="w-3 h-3 text-white" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Submit button */}
      <div className="flex flex-col gap-3 pt-2">
        <Button
          onClick={() => setSubmissionOpen(true)}
          disabled={capturedPhotos.length === 0}
          className="w-full rounded-full py-6"
          size="lg"
        >
          Submit for Analysis
        </Button>
      </div>

      {/* Delete photo confirmation drawer */}
      <Drawer open={photoToRemove !== null} onOpenChange={(v) => { if (!v) setPhotoToRemove(null); }}>
        <DrawerContent>
          <DrawerHeader className="text-center pb-2">
            <DrawerTitle>Remove Photo?</DrawerTitle>
            <p className="text-sm text-muted-foreground">
              {photoToRemove !== null && capturedPhotos[photoToRemove]
                ? `Remove "${capturedPhotos[photoToRemove].stepLabel}" photo?`
                : "Remove this photo?"}
            </p>
          </DrawerHeader>
          <div className="flex flex-col gap-3 px-4 pb-8 pt-2">
            <Button
              variant="destructive"
              size="lg"
              className="w-full rounded-full h-14"
              onClick={() => {
                if (photoToRemove !== null) {
                  onRemovePhoto(photoToRemove);
                  setPhotoToRemove(null);
                }
              }}
            >
              Remove Photo
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="w-full rounded-full h-14"
              onClick={() => setPhotoToRemove(null)}
            >
              Cancel
            </Button>
          </div>
        </DrawerContent>
      </Drawer>

      {/* Submission options drawer */}
      <Drawer open={submissionOpen} onOpenChange={setSubmissionOpen}>
        <DrawerContent>
          <DrawerHeader className="text-center pb-2">
            <DrawerTitle>Ready to Submit?</DrawerTitle>
            <p className="text-sm text-muted-foreground">Choose how to submit your photos</p>
          </DrawerHeader>
          <div className="flex flex-col gap-3 px-4 pb-8 pt-2">
            <Button
              size="lg"
              className="w-full rounded-full h-14"
              onClick={() => {
                setSubmissionOpen(false);
                setPolicyPickerOpen(true);
              }}
            >
              <HugeiconsIcon icon={File01Icon} className="w-5 h-5 mr-2" />
              Add Insurance Policy
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="w-full rounded-full h-14"
              onClick={() => {
                setSubmissionOpen(false);
                onSubmitQuick();
              }}
            >
              Continue without Policy
            </Button>
          </div>
        </DrawerContent>
      </Drawer>

      {/* Policy picker drawer */}
      <Drawer
        open={policyPickerOpen}
        onOpenChange={(v) => {
          setPolicyPickerOpen(v);
          if (!v) setSelectedPolicy(null);
        }}
      >
        <DrawerContent showCloseButton={false}>
          <DrawerHeader className="pb-2">
            <div className="flex items-center justify-between">
              <DrawerTitle>Add Insurance Policy</DrawerTitle>
              <Button
                variant="ghost"
                size="icon"
                className="-mr-2"
                onClick={() => {
                  setPolicyPickerOpen(false);
                  setSelectedPolicy(null);
                }}
              >
                <HugeiconsIcon icon={Cancel01Icon} className="w-5 h-5" />
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Upload your policy for enhanced coverage analysis
            </p>
          </DrawerHeader>

          <div className="flex flex-col gap-4 px-4 pb-8 pt-2">
            {isLoadingPolicies && <Skeleton className="h-14 w-full rounded-xl" />}
            {!isLoadingPolicies && savedPolicies.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Saved Policies</p>
                {savedPolicies.map((policy) => (
                  <button
                    key={policy.fileId}
                    onClick={() => setSelectedPolicy({ type: "existing", policy })}
                    className={cn(
                      "w-full flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-colors",
                      selectedPolicy?.type === "existing" &&
                        selectedPolicy.policy.fileId === policy.fileId
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary"
                    )}
                  >
                    <HugeiconsIcon icon={Pdf02Icon} className="w-5 h-5 text-red-500 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{policy.filename}</p>
                      <p className="text-xs text-muted-foreground">
                        {(policy.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    {selectedPolicy?.type === "existing" &&
                      selectedPolicy.policy.fileId === policy.fileId && (
                        <HugeiconsIcon icon={Tick02Icon} className="w-4 h-4 text-primary shrink-0" />
                      )}
                  </button>
                ))}
              </div>
            )}

            <div className="space-y-2">
              {savedPolicies.length > 0 && (
                <p className="text-sm font-medium text-muted-foreground">Upload New</p>
              )}
              <FileUploadZone
                accept="application/pdf"
                maxSize={50 * 1024 * 1024}
                multiple={false}
                onFilesSelected={(files) => {
                  if (files[0]) setSelectedPolicy({ type: "file", file: files[0] });
                }}
              />
              {selectedPolicy?.type === "file" && (
                <div className="flex items-center gap-2 p-2 bg-primary/5 rounded-lg">
                  <HugeiconsIcon icon={File01Icon} className="w-4 h-4 text-primary shrink-0" />
                  <span className="text-sm truncate flex-1">{selectedPolicy.file.name}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0"
                    onClick={() => setSelectedPolicy(null)}
                  >
                    <HugeiconsIcon icon={Cancel01Icon} className="w-3.5 h-3.5" />
                  </Button>
                </div>
              )}
            </div>

            <Button
              size="lg"
              className="w-full rounded-full h-14"
              disabled={!selectedPolicy}
              onClick={() => {
                if (selectedPolicy) {
                  setPolicyPickerOpen(false);
                  onSubmitWithPolicy(selectedPolicy);
                }
              }}
            >
              Submit with Policy
            </Button>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
