"use client";

import { useState, useRef, useCallback, useEffect } from "react";

export type PermissionState = "prompt" | "granted" | "denied" | "unavailable";

interface UseCameraOptions {
  preferBackCamera?: boolean;
  videoConstraints?: MediaTrackConstraints;
}

export interface CameraSettings {
  resolution: string;
  width: number;
  height: number;
  frameRate: number;
  focusMode: string;
}

interface UseCameraReturn {
  stream: MediaStream | null;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  error: string | null;
  permissionState: PermissionState;
  isLoading: boolean;
  cameraSettings: CameraSettings | null;
  requestPermission: () => Promise<boolean>;
  stopCamera: () => void;
}

// Forensic quality constraints for 1080p capture
const defaultConstraints: MediaTrackConstraints = {
  facingMode: { ideal: "environment" },
  width: { ideal: 1920, min: 1280 },
  height: { ideal: 1080, min: 720 },
  frameRate: { ideal: 30, max: 30 },
};

// Advanced constraints with continuous autofocus (if supported)
const advancedConstraints: MediaTrackConstraints = {
  ...defaultConstraints,
  // @ts-expect-error - focusMode is not in the standard type definitions but is supported by many browsers
  focusMode: { ideal: "continuous" },
};

// Helper to extract camera settings from stream
function extractCameraSettings(mediaStream: MediaStream): CameraSettings {
  const videoTrack = mediaStream.getVideoTracks()[0];
  const settings = videoTrack?.getSettings() ?? {};

  const width = settings.width ?? 0;
  const height = settings.height ?? 0;
  const frameRate = settings.frameRate ?? 30;
  // @ts-expect-error - focusMode is not in standard type definitions
  const focusMode = settings.focusMode ?? "unknown";

  // Determine resolution label
  let resolution = "unknown";
  if (width >= 1920 && height >= 1080) {
    resolution = "1080p (Full HD)";
  } else if (width >= 1280 && height >= 720) {
    resolution = "720p (HD)";
  } else if (width > 0 && height > 0) {
    resolution = `${width}x${height}`;
  }

  return { resolution, width, height, frameRate, focusMode };
}

export function useCamera(options: UseCameraOptions = {}): UseCameraReturn {
  const { preferBackCamera = true, videoConstraints } = options;

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [permissionState, setPermissionState] =
    useState<PermissionState>("prompt");
  const [isLoading, setIsLoading] = useState(false);
  const [cameraSettings, setCameraSettings] = useState<CameraSettings | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, [stream]);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    // Check if we're in a secure context (HTTPS or localhost)
    // Camera access requires HTTPS on mobile
    if (typeof window !== 'undefined' && !window.isSecureContext) {
      setPermissionState("unavailable");
      setError("Camera requires HTTPS. Please access the site via HTTPS or localhost.");
      return false;
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setPermissionState("unavailable");
      setError("Camera access is not supported in this browser.");
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      const facingMode = preferBackCamera ? { ideal: "environment" } : { ideal: "user" };

      // Try advanced constraints first (with continuous autofocus)
      const advancedVideoConstraints = videoConstraints || {
        ...advancedConstraints,
        facingMode,
      };

      let mediaStream: MediaStream;

      try {
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: advancedVideoConstraints,
          audio: true,
        });
      } catch {
        // Fall back to default constraints without advanced features
        const defaultVideoConstraints = videoConstraints || {
          ...defaultConstraints,
          facingMode,
        };
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: defaultVideoConstraints,
          audio: true,
        });
      }

      setStream(mediaStream);
      setPermissionState("granted");
      setCameraSettings(extractCameraSettings(mediaStream));

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.muted = true;
        await videoRef.current.play().catch(() => {
          // Autoplay may be blocked, ignore error as user will interact
        });
      }

      setIsLoading(false);
      return true;
    } catch (err) {
      setIsLoading(false);

      if (err instanceof Error) {
        if (
          err.name === "NotAllowedError" ||
          err.name === "PermissionDeniedError"
        ) {
          setPermissionState("denied");
          setError(
            "Camera access was denied. Please enable camera permissions in your browser settings."
          );
        } else if (
          err.name === "NotFoundError" ||
          err.name === "DevicesNotFoundError"
        ) {
          setPermissionState("unavailable");
          setError("No camera found on this device.");
        } else if (
          err.name === "NotReadableError" ||
          err.name === "TrackStartError"
        ) {
          setError(
            "Camera is already in use by another application. Please close other apps using the camera."
          );
        } else if (err.name === "OverconstrainedError") {
          // Try again with less strict constraints
          try {
            const fallbackStream = await navigator.mediaDevices.getUserMedia({
              video: true,
              audio: true,
            });
            setStream(fallbackStream);
            setPermissionState("granted");
            setCameraSettings(extractCameraSettings(fallbackStream));

            if (videoRef.current) {
              videoRef.current.srcObject = fallbackStream;
              videoRef.current.muted = true;
              await videoRef.current.play().catch(() => {});
            }
            return true;
          } catch {
            setError("Could not access camera with the requested settings.");
          }
        } else {
          setError(`Camera error: ${err.message}`);
        }
      } else {
        setError("An unknown error occurred while accessing the camera.");
      }

      return false;
    }
  }, [preferBackCamera, videoConstraints]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [stream]);

  return {
    stream,
    videoRef,
    error,
    permissionState,
    isLoading,
    cameraSettings,
    requestPermission,
    stopCamera,
  };
}
