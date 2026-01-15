"use client";

import { useState, useRef, useCallback, useEffect } from "react";

export type PermissionState = "prompt" | "granted" | "denied" | "unavailable";

interface UseCameraOptions {
  preferBackCamera?: boolean;
  videoConstraints?: MediaTrackConstraints;
}

interface UseCameraReturn {
  stream: MediaStream | null;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  error: string | null;
  permissionState: PermissionState;
  isLoading: boolean;
  requestPermission: () => Promise<boolean>;
  stopCamera: () => void;
}

const defaultConstraints: MediaTrackConstraints = {
  facingMode: { ideal: "environment" },
  width: { ideal: 1280 },
  height: { ideal: 720 },
  frameRate: { ideal: 30, max: 30 },
};

export function useCamera(options: UseCameraOptions = {}): UseCameraReturn {
  const { preferBackCamera = true, videoConstraints } = options;

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [permissionState, setPermissionState] =
    useState<PermissionState>("prompt");
  const [isLoading, setIsLoading] = useState(false);

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
      const constraints: MediaStreamConstraints = {
        video: videoConstraints || {
          ...defaultConstraints,
          facingMode: preferBackCamera
            ? { ideal: "environment" }
            : { ideal: "user" },
        },
        audio: true,
      };

      const mediaStream =
        await navigator.mediaDevices.getUserMedia(constraints);

      setStream(mediaStream);
      setPermissionState("granted");

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
    requestPermission,
    stopCamera,
  };
}
