"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useCamera } from "@/hooks/use-camera";
import { useVideoRecorder } from "@/hooks/use-video-recorder";
import { RecordingControls } from "./recording-controls";
import { RecordingPreview } from "./recording-preview";
import { PolicyUploadStep } from "./policy-upload-step";
import { ProgressIndicator } from "@/components/gemini-analysis/progress-indicator";
import {
  compressVideoIfNeeded,
  needsCompression,
} from "@/lib/utils/video-compression";
import { submitClaimAction } from "@/appwrite/submitClaimAction";
import { Camera02Icon, CameraOff02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

type ModalState =
  | "permission-prompt"
  | "permission-denied"
  | "ready"
  | "recording"
  | "compressing"
  | "preview"
  | "policy-step"
  | "uploading";

interface VideoRecorderModalProps {
  userId: string;
  children: React.ReactNode;
  onSuccess?: (claimId: string) => void;
}

const MAX_DURATION_SECONDS = 20;

export function VideoRecorderModal({
  children,
  onSuccess,
}: VideoRecorderModalProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [modalState, setModalState] = useState<ModalState>("permission-prompt");
  const [processedFile, setProcessedFile] = useState<File | null>(null);
  const [wasCompressed, setWasCompressed] = useState(false);
  const [uploadStep, setUploadStep] = useState(1);
  const [error, setError] = useState<string | null>(null);

  const {
    stream,
    videoRef,
    error: cameraError,
    permissionState,
    isLoading: cameraLoading,
    requestPermission,
    stopCamera,
  } = useCamera({ preferBackCamera: true });

  const {
    isRecording,
    duration,
    recordedFile,
    recordedUrl,
    error: recorderError,
    startRecording,
    stopRecording,
    resetRecording,
  } = useVideoRecorder({
    stream,
    maxDurationSeconds: MAX_DURATION_SECONDS,
    onMaxDurationReached: () => {
      // Recording auto-stopped, transition to processing
    },
  });

  // Handle permission state changes
  useEffect(() => {
    if (permissionState === "denied") {
      setModalState("permission-denied");
    } else if (permissionState === "granted" && stream) {
      setModalState("ready");
    }
  }, [permissionState, stream]);

  // Connect stream to video element when ready
  useEffect(() => {
    if ((modalState === "ready" || modalState === "recording") && stream && videoRef.current) {
      videoRef.current.srcObject = stream;
      videoRef.current.muted = true;
      videoRef.current.play().catch(() => {
        // Autoplay may be blocked
      });
    }
  }, [modalState, stream, videoRef]);

  // Handle recording stop - process video
  useEffect(() => {
    if (!isRecording && recordedFile && modalState === "recording") {
      processRecordedVideo(recordedFile);
    }
  }, [isRecording, recordedFile, modalState]);

  const processRecordedVideo = async (file: File) => {
    if (needsCompression(file)) {
      setModalState("compressing");
      const result = await compressVideoIfNeeded(file);
      setProcessedFile(result.file);
      setWasCompressed(result.wasCompressed);
      if (!result.success && result.message) {
        setError(result.message);
      }
    } else {
      setProcessedFile(file);
      setWasCompressed(false);
    }
    setModalState("preview");
  };

  const handleOpenChange = useCallback(
    (isOpen: boolean) => {
      setOpen(isOpen);
      if (!isOpen) {
        // Cleanup on close
        stopCamera();
        resetRecording();
        setModalState("permission-prompt");
        setProcessedFile(null);
        setWasCompressed(false);
        setUploadStep(1);
        setError(null);
      }
    },
    [stopCamera, resetRecording]
  );

  const handleRequestPermission = async () => {
    const granted = await requestPermission();
    if (granted) {
      setModalState("ready");
    }
  };

  const handleStartRecording = () => {
    setError(null);
    startRecording();
    setModalState("recording");
  };

  const handleStopRecording = () => {
    stopRecording();
    // State transition handled in useEffect above
  };

  const handleCancel = () => {
    if (modalState === "preview" || modalState === "policy-step") {
      // Go back to ready state
      resetRecording();
      setProcessedFile(null);
      setWasCompressed(false);
      setError(null);
      setModalState("ready");
    } else {
      // Close modal
      handleOpenChange(false);
    }
  };

  const handleSubmitQuick = async () => {
    if (!processedFile) return;

    setModalState("uploading");
    setUploadStep(1);

    try {
      const formData = new FormData();
      formData.append("mediaFiles", processedFile);

      // Simulate progress steps
      setUploadStep(2); // Uploading
      await new Promise((r) => setTimeout(r, 500));

      setUploadStep(3); // Scanning
      await new Promise((r) => setTimeout(r, 300));

      setUploadStep(4); // Analyzing
      const result = await submitClaimAction(formData);

      if (result.success && result.claimId) {
        setUploadStep(5); // Saving
        await new Promise((r) => setTimeout(r, 300));

        setUploadStep(6); // Complete
        await new Promise((r) => setTimeout(r, 500));

        onSuccess?.(result.claimId);
        handleOpenChange(false);
        router.push(`/auth/claims/${result.claimId}`);
      } else {
        setError(result.message || "Failed to submit claim");
        setModalState("preview");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submission failed");
      setModalState("preview");
    }
  };

  const handleGoToPolicyStep = () => {
    setModalState("policy-step");
  };

  const handleSubmitWithPolicy = async (policyFile: File) => {
    if (!processedFile) return;

    setModalState("uploading");
    setUploadStep(1);

    try {
      const formData = new FormData();
      formData.append("mediaFiles", processedFile);
      formData.append("policyFile", policyFile);

      setUploadStep(2);
      await new Promise((r) => setTimeout(r, 500));

      setUploadStep(3);
      await new Promise((r) => setTimeout(r, 300));

      setUploadStep(4);
      const result = await submitClaimAction(formData);

      if (result.success && result.claimId) {
        setUploadStep(5);
        await new Promise((r) => setTimeout(r, 300));

        setUploadStep(6);
        await new Promise((r) => setTimeout(r, 500));

        onSuccess?.(result.claimId);
        handleOpenChange(false);
        router.push(`/auth/claims/${result.claimId}`);
      } else {
        setError(result.message || "Failed to submit claim");
        setModalState("policy-step");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submission failed");
      setModalState("policy-step");
    }
  };

  const handleBackFromPolicy = () => {
    setModalState("preview");
  };

  const displayError = error || cameraError || recorderError;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>

      <DialogContent className="max-w-2xl h-[85vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 py-4 border-b flex-shrink-0">
          <DialogTitle>
            {modalState === "permission-prompt" && "Camera Access"}
            {modalState === "permission-denied" && "Camera Access Denied"}
            {(modalState === "ready" || modalState === "recording") &&
              "Record Video"}
            {modalState === "compressing" && "Processing Video"}
            {modalState === "preview" && "Preview Recording"}
            {modalState === "policy-step" && "Add Insurance Policy"}
            {modalState === "uploading" && "Submitting Claim"}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex flex-col p-6 overflow-y-auto min-h-0">
          {/* Permission Prompt */}
          {modalState === "permission-prompt" && (
            <div className="flex flex-col items-center justify-center h-full gap-6 text-center">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                <HugeiconsIcon icon={Camera02Icon} className="w-10 h-10 text-primary" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">
                  Camera Access Required
                </h3>
                <p className="text-sm text-muted-foreground max-w-sm">
                  To record video of vehicle damage, we need access to your
                  camera. Your video will be securely uploaded for AI analysis.
                </p>
              </div>
              {cameraError && (
                <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-lg max-w-sm">
                  {cameraError}
                </div>
              )}
              <Button
                onClick={handleRequestPermission}
                disabled={cameraLoading}
                size="lg"
              >
                {cameraLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Requesting Access...
                  </>
                ) : (
                  "Allow Camera Access"
                )}
              </Button>
            </div>
          )}

          {/* Permission Denied */}
          {modalState === "permission-denied" && (
            <div className="flex flex-col items-center justify-center h-full gap-6 text-center">
              <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center">
                <HugeiconsIcon icon={CameraOff02Icon} className="w-10 h-10 text-destructive" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Camera Access Denied</h3>
                <p className="text-sm text-muted-foreground max-w-sm">
                  Camera access was denied. Please enable camera permissions in
                  your browser settings and try again.
                </p>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => handleOpenChange(false)}>
                  Cancel
                </Button>
                <Button onClick={handleRequestPermission}>Try Again</Button>
              </div>
            </div>
          )}

          {/* Ready / Recording */}
          {(modalState === "ready" || modalState === "recording") && (
            <div className="flex flex-col h-full gap-4">
              {/* Video preview */}
              <div className="flex-1 flex items-center justify-center bg-black rounded-lg overflow-hidden relative min-h-0">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                {isRecording && (
                  <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/60 px-3 py-1.5 rounded-full">
                    <div className="w-3 h-3 rounded-full bg-destructive animate-pulse" />
                    <span className="text-white text-sm font-medium">REC</span>
                  </div>
                )}
              </div>

              {/* Controls */}
              <RecordingControls
                isRecording={isRecording}
                duration={duration}
                maxDuration={MAX_DURATION_SECONDS}
                onStart={handleStartRecording}
                onStop={handleStopRecording}
                onCancel={handleCancel}
              />
            </div>
          )}

          {/* Compressing */}
          {modalState === "compressing" && (
            <div className="flex flex-col items-center justify-center h-full gap-6 text-center">
              <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Compressing Video</h3>
                <p className="text-sm text-muted-foreground">
                  Optimizing video size for faster upload...
                </p>
              </div>
            </div>
          )}

          {/* Preview */}
          {modalState === "preview" && processedFile && recordedUrl && (
            <>
              {displayError && (
                <div className="mb-4 p-3 bg-destructive/10 text-destructive text-sm rounded-lg">
                  {displayError}
                </div>
              )}
              <RecordingPreview
                videoFile={processedFile}
                videoUrl={recordedUrl}
                duration={duration}
                onSubmitQuick={handleSubmitQuick}
                onSubmitWithPolicy={handleGoToPolicyStep}
                onCancel={handleCancel}
                wasCompressed={wasCompressed}
              />
            </>
          )}

          {/* Policy Upload Step */}
          {modalState === "policy-step" && processedFile && (
            <>
              {displayError && (
                <div className="mb-4 p-3 bg-destructive/10 text-destructive text-sm rounded-lg">
                  {displayError}
                </div>
              )}
              <PolicyUploadStep
                videoFile={processedFile}
                onSubmit={handleSubmitWithPolicy}
                onBack={handleBackFromPolicy}
              />
            </>
          )}

          {/* Uploading */}
          {modalState === "uploading" && (
            <div className="flex flex-col items-center justify-center h-full">
              <ProgressIndicator currentStep={uploadStep} />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
