"use client";

import { useState, useCallback, useEffect, useRef, startTransition } from "react";
import { useRouter } from "next/navigation";
import NoSleep from "nosleep.js";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { useIsMobile } from "@/hooks/use-is-mobile";
import { Button } from "@/components/ui/button";
import { useCamera } from "@/hooks/use-camera";
import { useVideoRecorder } from "@/hooks/use-video-recorder";
import { useMotionDetection } from "@/hooks/use-motion-detection";
import { useMounted } from "@/hooks/use-mounted";
import { RecordingControls } from "./recording-controls";
import { RecordingPreview } from "./recording-preview";
import { PolicyUploadStep, type PolicySubmission } from "./policy-upload-step";
import { SpeedAlert } from "./speed-alert";
import { ProgressIndicator } from "@/components/gemini-analysis/progress-indicator";
import {
  compressVideoIfNeeded,
  needsCompression,
} from "@/lib/utils/video-compression";
import { submitReportAction } from "@/appwrite/submitReportAction";
import { Camera02Icon, CameraOff02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { getCountryFromTimezone } from "@/lib/utils/country-detection";
import { useUser } from "@/lib/context/user-context";
import { toast } from "sonner";

type ModalState =
  | "permission-prompt"
  | "permission-denied"
  | "ready"
  | "recording"
  | "processing" // After stop, before preview - bridges the async gap
  | "compressing"
  | "preview"
  | "policy-step"
  | "uploading";

interface VideoRecorderModalProps {
  children: React.ReactNode;
  onSuccess?: (reportId: string) => void;
}

const MAX_DURATION_SECONDS = 45;

export function VideoRecorderModal({
  children,
  onSuccess,
}: VideoRecorderModalProps) {
  const router = useRouter();
  const isMobile = useIsMobile();
  const mounted = useMounted();
  const { evaluationTimes } = useUser();
  const limitReached = evaluationTimes <= 0;
  const [open, setOpen] = useState(false);
  const [modalState, setModalState] = useState<ModalState>("permission-prompt");

  // Lock modal type once when modal opens - use state to properly participate in render
  const [lockedIsMobile, setLockedIsMobile] = useState<boolean | null>(null);
  // NoSleep to prevent browser idle/throttling during preview/policy states
  const noSleepRef = useRef<NoSleep | null>(null);
  const [processedFile, setProcessedFile] = useState<File | null>(null);
  const [wasCompressed, setWasCompressed] = useState(false);
  const [uploadStep, setUploadStep] = useState(1);
  const [qualitySeconds, setQualitySeconds] = useState(0);

  // Track last duration for quality seconds calculation
  const lastDurationRef = useRef(0);

  const {
    stream,
    videoRef,
    error: cameraError,
    permissionState,
    isLoading: cameraLoading,
    cameraSettings,
    requestPermission,
    stopCamera,
  } = useCamera({ preferBackCamera: true });

  // Motion detection for quality tracking
  const {
    isMovingTooFast,
    requestPermission: requestMotionPermission,
  } = useMotionDetection({ enabled: modalState === "recording" });

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

  // Lock modal type ONCE when modal opens - prevents Dialog/Sheet switching mid-process
  useEffect(() => {
    startTransition(() => {
      if (open && lockedIsMobile === null) {
        setLockedIsMobile(isMobile);
      } else if (!open) {
        setLockedIsMobile(null);
      }
    });
  }, [open, isMobile, lockedIsMobile]);

  // Use locked value when modal is open to prevent layout switching
  const useSheetLayout = open
    ? (lockedIsMobile ?? isMobile)
    : isMobile;

  // Sync modal state with external camera permission state from browser API
  useEffect(() => {
    startTransition(() => {
      if (permissionState === "denied") {
        setModalState("permission-denied");
      } else if (permissionState === "granted" && stream) {
        setModalState("ready");
      }
    });
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

  // Process recorded video - compress if needed and prepare for preview
  const processRecordedVideo = useCallback(async (file: File) => {
    if (needsCompression(file)) {
      setModalState("compressing");
      const result = await compressVideoIfNeeded(file);
      setProcessedFile(result.file);
      setWasCompressed(result.wasCompressed);
      if (!result.success && result.message) {
        toast.error(result.message);
      }
    } else {
      setProcessedFile(file);
      setWasCompressed(false);
    }
    stopCamera(); // Stop camera to free resources in preview mode

    setModalState("preview");
  }, [stopCamera]);

  // Handle recording stop - process video
  useEffect(() => {
    if (!isRecording && recordedFile && modalState === "recording") {
      startTransition(() => {
        setModalState("processing");
      });
      queueMicrotask(() => processRecordedVideo(recordedFile));
    }
  }, [isRecording, recordedFile, modalState, processRecordedVideo]);

  // Track quality seconds (only counts when not moving too fast)
  useEffect(() => {
    if (isRecording && duration > lastDurationRef.current) {
      const elapsed = duration - lastDurationRef.current;
      if (!isMovingTooFast) {
        setQualitySeconds((prev) => prev + elapsed);
      }
    }
    lastDurationRef.current = duration;
  }, [isRecording, duration, isMovingTooFast]);


  // NoSleep: prevent mobile browser from going idle/throttling during all active modal states
  // Uses the "NoSleep" pattern (silent video playback) which is more reliable than Wake Lock alone
  // This prevents mobile browsers from suspending, garbage collecting, or triggering revalidation
  useEffect(() => {
    // Enable NoSleep for all active states to prevent mobile browser throttling
    const shouldEnableNoSleep =
      modalState === "ready" ||
      modalState === "recording" ||
      modalState === "processing" ||
      modalState === "compressing" ||
      modalState === "preview" ||
      modalState === "policy-step";

    const enableNoSleep = () => {
      if (!noSleepRef.current) {
        noSleepRef.current = new NoSleep();
      }
      // Enable must be called on a user gesture, but since we get here from recording
      // which required user interaction, we should be good
      noSleepRef.current.enable().catch((err) => {
        console.log('NoSleep enable failed:', err);
      });
    };

    const disableNoSleep = () => {
      if (noSleepRef.current) {
        noSleepRef.current.disable();
      }
    };

    // Re-enable NoSleep when page becomes visible (handles tab switching)
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && shouldEnableNoSleep) {
        enableNoSleep();
      }
    };

    if (shouldEnableNoSleep) {
      enableNoSleep();
      document.addEventListener("visibilitychange", handleVisibilityChange);
    } else {
      disableNoSleep();
    }

    return () => {
      disableNoSleep();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [modalState]);

  // Check if modal is in an active state that shouldn't be interrupted
  // Includes preview/policy-step because user has recorded video they want to keep
  const isActiveState =
    modalState === "recording" ||
    modalState === "processing" ||
    modalState === "compressing" ||
    modalState === "preview" ||
    modalState === "policy-step" ||
    modalState === "uploading" ||
    cameraLoading;

  // Use ref to avoid stale closure in handleOpenChange
  const isActiveStateRef = useRef(false);
  useEffect(() => {
    isActiveStateRef.current = isActiveState;
  }, [isActiveState]);

  const handleOpenChange = useCallback(
    (isOpen: boolean) => {
      // Prevent closing during recording, compressing, uploading, or camera loading
      // Use ref to get current value and avoid stale closure
      if (!isOpen && isActiveStateRef.current) {
        return;
      }

      setOpen(isOpen);
      if (!isOpen) {
        // Cleanup on close
        stopCamera();
        resetRecording();
        setModalState("permission-prompt");
        setProcessedFile(null);
        setWasCompressed(false);
        setUploadStep(1);
        setQualitySeconds(0);
        lastDurationRef.current = 0;
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

  const handleStartRecording = async () => {
    // Reset quality tracking when recording starts (moved from useEffect to avoid setState in effect)
    setQualitySeconds(0);
    lastDurationRef.current = 0;
    // Request motion permission for iOS
    await requestMotionPermission();
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
      setQualitySeconds(0);
      lastDurationRef.current = 0;
      setModalState("ready");
    } else {
      // Close modal
      handleOpenChange(false);
    }
  };

  const handleSubmitQuick = async () => {
    if (!processedFile) {
      console.error('[VideoRecorder] No processed file to submit');
      return;
    }
    if (limitReached) {
      toast.warning("Daily evaluation limit reached. Upgrade your plan for more evaluations.");
      return;
    }

    console.log('[VideoRecorder] Starting submission:', {
      fileName: processedFile.name,
      fileSize: processedFile.size,
      fileType: processedFile.type,
    });

    // Verify file is readable before submission (mobile browsers can have issues)
    try {
      const testBuffer = await processedFile.slice(0, 1024).arrayBuffer();
      if (!testBuffer || testBuffer.byteLength === 0) {
        console.error('[VideoRecorder] File appears empty or corrupt');
        toast.error("Video file appears to be empty or corrupt. Please record again.");
        return;
      }
      console.log('[VideoRecorder] File verification passed');
    } catch (e) {
      console.error('[VideoRecorder] Unable to read file:', e);
      toast.error("Unable to read video file. Please record again.");
      return;
    }

    setModalState("uploading");
    setUploadStep(1);

    try {
      const formData = new FormData();
      formData.append("mediaFiles", processedFile);

      // Add user's country for localized pricing
      const userCountry = getCountryFromTimezone();
      formData.append('userCountry', userCountry);

      // Add video quality metadata for Gemini analysis
      if (cameraSettings) {
        formData.append('videoQualityMetadata', JSON.stringify({
          resolution: cameraSettings.resolution,
          bitrate: '8 Mbps',
          focusMode: cameraSettings.focusMode,
          duration: duration,
          qualitySeconds: qualitySeconds,
        }));
      }

      // Simulate progress steps
      setUploadStep(2); // Uploading
      await new Promise((r) => setTimeout(r, 500));

      setUploadStep(3); // Scanning
      await new Promise((r) => setTimeout(r, 300));

      setUploadStep(4); // Analyzing
      console.log('[VideoRecorder] Calling submitReportAction...');
      const result = await submitReportAction(formData);
      console.log('[VideoRecorder] Submission result:', result);

      if (result.success && result.reportId) {
        setUploadStep(5); // Saving
        await new Promise((r) => setTimeout(r, 300));

        setUploadStep(6); // Complete
        await new Promise((r) => setTimeout(r, 500));

        onSuccess?.(result.reportId);
        // Navigate first - use replace for more reliable navigation
        // The page change will unmount the modal
        router.replace(`/auth/reports/${result.reportId}`);
      } else {
        console.error('[VideoRecorder] Submission failed:', result.message);
        toast.error(result.message || "Failed to submit report");
        setModalState("preview");
      }
    } catch (err) {
      console.error('[VideoRecorder] Submission error:', err);
      toast.error(err instanceof Error ? err.message : "Submission failed");
      setModalState("preview");
    }
  };

  const handleGoToPolicyStep = () => {
    if (limitReached) {
      toast.warning("Daily evaluation limit reached. Upgrade your plan for more evaluations.");
      return;
    }
    setModalState("policy-step");
  };

  const handleSubmitWithPolicy = async (policySubmission: PolicySubmission) => {
    if (!processedFile) {
      console.error('[VideoRecorder] No processed file to submit');
      return;
    }

    const isNewFile = policySubmission.type === 'file';
    console.log('[VideoRecorder] Starting submission with policy:', {
      videoFileName: processedFile.name,
      videoFileSize: processedFile.size,
      policyType: policySubmission.type,
      ...(isNewFile
        ? { policyFileName: policySubmission.file.name, policyFileSize: policySubmission.file.size }
        : { existingPolicyId: policySubmission.policy.fileId }),
    });

    // Verify video file is readable
    try {
      const testBuffer = await processedFile.slice(0, 1024).arrayBuffer();
      if (!testBuffer || testBuffer.byteLength === 0) {
        console.error('[VideoRecorder] Video file appears empty or corrupt');
        toast.error("Video file appears to be empty or corrupt. Please record again.");
        return;
      }
      console.log('[VideoRecorder] Video file verification passed');
    } catch (e) {
      console.error('[VideoRecorder] Unable to read video file:', e);
      toast.error("Unable to read video file. Please record again.");
      return;
    }

    setModalState("uploading");
    setUploadStep(1);

    try {
      const formData = new FormData();
      formData.append("mediaFiles", processedFile);

      // Add policy - either new file or existing file ID
      if (policySubmission.type === 'file') {
        formData.append("policyFile", policySubmission.file);
      } else {
        formData.append("existingPolicyFileId", policySubmission.policy.fileId);
      }

      // Add user's country for localized pricing
      const userCountry = getCountryFromTimezone();
      formData.append('userCountry', userCountry);

      // Add video quality metadata for Gemini analysis
      if (cameraSettings) {
        formData.append('videoQualityMetadata', JSON.stringify({
          resolution: cameraSettings.resolution,
          bitrate: '8 Mbps',
          focusMode: cameraSettings.focusMode,
          duration: duration,
          qualitySeconds: qualitySeconds,
        }));
      }

      setUploadStep(2);
      await new Promise((r) => setTimeout(r, 500));

      setUploadStep(3);
      await new Promise((r) => setTimeout(r, 300));

      setUploadStep(4);
      console.log('[VideoRecorder] Calling submitReportAction with policy...');
      const result = await submitReportAction(formData);
      console.log('[VideoRecorder] Submission result:', result);

      if (result.success && result.reportId) {
        setUploadStep(5);
        await new Promise((r) => setTimeout(r, 300));

        setUploadStep(6);
        await new Promise((r) => setTimeout(r, 500));

        onSuccess?.(result.reportId);
        // Navigate first - use replace for more reliable navigation
        // The page change will unmount the modal
        router.replace(`/auth/reports/${result.reportId}`);
      } else {
        console.error('[VideoRecorder] Submission failed:', result.message);
        toast.error(result.message || "Failed to submit report");
        setModalState("policy-step");
      }
    } catch (err) {
      console.error('[VideoRecorder] Submission error:', err);
      toast.error(err instanceof Error ? err.message : "Submission failed");
      setModalState("policy-step");
    }
  };

  const handleBackFromPolicy = () => {
    setModalState("preview");
  };

  const displayError = cameraError || recorderError;

  // Get title based on modal state
  const getModalTitle = () => {
    if (modalState === "permission-prompt") return "Camera Access";
    if (modalState === "permission-denied") return "Camera Access Denied";
    if (modalState === "ready" || modalState === "recording") return "Record Video";
    if (modalState === "processing") return "Processing...";
    if (modalState === "compressing") return "Processing Video";
    if (modalState === "preview") return "Preview Recording";
    if (modalState === "policy-step") return "Add Insurance Policy";
    if (modalState === "uploading") return "Submitting Report";
    return "Camera";
  };

  // Shared modal body content
  const modalBody = (
    <div className="flex-1 flex flex-col p-4 sm:p-6 overflow-y-auto min-h-0">
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
              <div className="flex-1 flex items-center justify-center bg-black rounded-lg overflow-hidden relative min-h-0 -mx-4 sm:mx-0 sm:rounded-lg">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />

                {/* Recording indicator */}
                {isRecording && (
                  <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/60 px-3 py-1.5 rounded-full z-20">
                    <div className="w-3 h-3 rounded-full bg-destructive animate-pulse" />
                    <span className="text-white text-sm font-medium">REC</span>
                  </div>
                )}

                {/* Speed alert overlay */}
                <SpeedAlert isMovingTooFast={isMovingTooFast} isRecording={isRecording} />
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

          {/* Processing (after recording stop, before preview) */}
          {modalState === "processing" && (
            <div className="flex flex-col items-center justify-center h-full gap-6 text-center">
              <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Processing Recording</h3>
                <p className="text-sm text-muted-foreground">
                  Preparing your video...
                </p>
              </div>
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
  );

  // SSR: render only the trigger button without Dialog/Drawer wrapper to avoid hydration mismatch
  if (!mounted) {
    return <>{children}</>;
  }

  // Mobile: Use Drawer (native-feeling bottom drawer with spring physics)
  // Use locked value to prevent switching between Dialog/Drawer during recording
  if (useSheetLayout) {
    return (
      <Drawer
        open={open}
        onOpenChange={handleOpenChange}
        dismissible={!isActiveState}
        shouldScaleBackground={false}
      >
        <DrawerTrigger asChild>{children}</DrawerTrigger>
        <DrawerContent
          className="h-[90vh] flex flex-col p-0 gap-0"
          showCloseButton={!isActiveState}
          showHandle={!isActiveState}
          onInteractOutside={(e) => {
            if (isActiveStateRef.current) e.preventDefault();
          }}
          onEscapeKeyDown={(e) => {
            if (isActiveStateRef.current) e.preventDefault();
          }}
          onPointerDownOutside={(e) => {
            if (isActiveStateRef.current) e.preventDefault();
          }}
        >
          <DrawerHeader className="px-6 py-4 border-b flex-shrink-0">
            <DrawerTitle>{getModalTitle()}</DrawerTitle>
          </DrawerHeader>
          {modalBody}
        </DrawerContent>
      </Drawer>
    );
  }

  // Desktop: Use Dialog (centered modal)
  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent
        className="max-w-2xl h-[85vh] flex flex-col p-0 gap-0 *:data-[slot=dialog-close]:top-4.5"
        showCloseButton={!isActiveState}
        onInteractOutside={(e) => {
          if (isActiveStateRef.current) e.preventDefault();
        }}
        onEscapeKeyDown={(e) => {
          if (isActiveStateRef.current) e.preventDefault();
        }}
        onPointerDownOutside={(e) => {
          if (isActiveStateRef.current) e.preventDefault();
        }}
      >
        <DialogHeader className="px-3 py-3 border-b shrink-0 flex flex-row items-center justify-between">
          <DialogTitle>{getModalTitle()}</DialogTitle>
          
        </DialogHeader>
        {modalBody}
      </DialogContent>
    </Dialog>
  );
}
