"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface UseMotionDetectionOptions {
  threshold?: number; // m/s^2, default 15
  smoothingFactor?: number; // EMA smoothing, 0-1, default 0.3
  enabled?: boolean;
}

interface UseMotionDetectionReturn {
  isMovingTooFast: boolean;
  currentAcceleration: number;
  isSupported: boolean;
  permissionState: "prompt" | "granted" | "denied" | "unavailable";
  requestPermission: () => Promise<boolean>;
}

export function useMotionDetection(
  options: UseMotionDetectionOptions = {}
): UseMotionDetectionReturn {
  const { threshold = 15, smoothingFactor = 0.3, enabled = true } = options;

  const [isMovingTooFast, setIsMovingTooFast] = useState(false);
  const [currentAcceleration, setCurrentAcceleration] = useState(0);
  const [isSupported, setIsSupported] = useState(false);
  const [permissionState, setPermissionState] = useState<
    "prompt" | "granted" | "denied" | "unavailable"
  >("prompt");

  const smoothedAccelerationRef = useRef(0);
  const listenerAddedRef = useRef(false);

  // Check if DeviceMotionEvent is supported
  useEffect(() => {
    if (typeof window !== "undefined" && "DeviceMotionEvent" in window) {
      setIsSupported(true);

      // Check if permission API exists (iOS 13+)
      if (
        typeof (DeviceMotionEvent as any).requestPermission === "function"
      ) {
        setPermissionState("prompt");
      } else {
        // No permission needed (Android, older iOS)
        setPermissionState("granted");
      }
    } else {
      setIsSupported(false);
      setPermissionState("unavailable");
    }
  }, []);

  const handleMotion = useCallback(
    (event: DeviceMotionEvent) => {
      if (!enabled) return;

      const { accelerationIncludingGravity } = event;

      if (!accelerationIncludingGravity) return;

      const { x, y, z } = accelerationIncludingGravity;

      // Calculate magnitude of acceleration vector
      // Subtract ~9.8 for gravity when using accelerationIncludingGravity
      const rawMagnitude = Math.sqrt(
        (x ?? 0) ** 2 + (y ?? 0) ** 2 + (z ?? 0) ** 2
      );

      // Use acceleration without gravity if available, otherwise subtract gravity estimate
      const magnitude = event.acceleration
        ? Math.sqrt(
            (event.acceleration.x ?? 0) ** 2 +
              (event.acceleration.y ?? 0) ** 2 +
              (event.acceleration.z ?? 0) ** 2
          )
        : Math.abs(rawMagnitude - 9.8);

      // Apply exponential moving average (EMA) smoothing to prevent flickering
      smoothedAccelerationRef.current =
        smoothingFactor * magnitude +
        (1 - smoothingFactor) * smoothedAccelerationRef.current;

      const smoothedMagnitude = smoothedAccelerationRef.current;

      setCurrentAcceleration(smoothedMagnitude);
      setIsMovingTooFast(smoothedMagnitude > threshold);
    },
    [enabled, threshold, smoothingFactor]
  );

  // Request permission for iOS 13+
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      return false;
    }

    // Check if permission API exists (iOS 13+)
    if (typeof (DeviceMotionEvent as any).requestPermission === "function") {
      try {
        const response = await (DeviceMotionEvent as any).requestPermission();

        if (response === "granted") {
          setPermissionState("granted");
          return true;
        } else {
          setPermissionState("denied");
          return false;
        }
      } catch {
        setPermissionState("denied");
        return false;
      }
    }

    // No permission needed
    setPermissionState("granted");
    return true;
  }, [isSupported]);

  // Add/remove motion event listener
  useEffect(() => {
    if (!isSupported || permissionState !== "granted" || !enabled) {
      return;
    }

    if (listenerAddedRef.current) {
      return;
    }

    window.addEventListener("devicemotion", handleMotion);
    listenerAddedRef.current = true;

    return () => {
      window.removeEventListener("devicemotion", handleMotion);
      listenerAddedRef.current = false;
    };
  }, [isSupported, permissionState, enabled, handleMotion]);

  // Reset state when disabled
  useEffect(() => {
    if (!enabled) {
      setIsMovingTooFast(false);
      setCurrentAcceleration(0);
      smoothedAccelerationRef.current = 0;
    }
  }, [enabled]);

  return {
    isMovingTooFast,
    currentAcceleration,
    isSupported,
    permissionState,
    requestPermission,
  };
}
