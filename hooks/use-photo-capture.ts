"use client";

import { useState, useCallback, useRef } from "react";

interface CapturedPhoto {
  file: File;
  thumbnailUrl: string;
  stepLabel: string;
}

interface UsePhotoCaptureReturn {
  photos: CapturedPhoto[];
  capturePhoto: (stream: MediaStream, stepLabel: string) => Promise<boolean>;
  clearPhotos: () => void;
  isCapturing: boolean;
}

/**
 * Hook to capture still frames from a MediaStream.
 * Uses ImageCapture API where available (Chrome, Edge),
 * falls back to canvas frame capture for Safari/Firefox.
 */
export function usePhotoCapture(): UsePhotoCaptureReturn {
  const [photos, setPhotos] = useState<CapturedPhoto[]>([]);
  const [isCapturing, setIsCapturing] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const capturePhoto = useCallback(
    async (stream: MediaStream, stepLabel: string): Promise<boolean> => {
      setIsCapturing(true);
      try {
        const videoTrack = stream.getVideoTracks()[0];
        if (!videoTrack) return false;

        let blob: Blob;

        // Try ImageCapture API first (Chrome, Edge)
        if (typeof ImageCapture !== "undefined") {
          try {
            const imageCapture = new ImageCapture(videoTrack);
            blob = await imageCapture.takePhoto();
          } catch {
            // Fall back to canvas method
            blob = await captureFromCanvas(stream);
          }
        } else {
          // Safari/Firefox fallback
          blob = await captureFromCanvas(stream);
        }

        const filename = `${stepLabel.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}.jpg`;
        const file = new File([blob], filename, { type: "image/jpeg" });
        const thumbnailUrl = URL.createObjectURL(blob);

        setPhotos((prev) => [
          ...prev,
          { file, thumbnailUrl, stepLabel },
        ]);

        return true;
      } catch (err) {
        console.error("[usePhotoCapture] Failed to capture:", err);
        return false;
      } finally {
        setIsCapturing(false);
      }
    },
    []
  );

  const captureFromCanvas = useCallback(
    async (stream: MediaStream): Promise<Blob> => {
      return new Promise((resolve, reject) => {
        const video = document.createElement("video");
        video.srcObject = stream;
        video.muted = true;
        video.playsInline = true;

        video.onloadeddata = () => {
          if (!canvasRef.current) {
            canvasRef.current = document.createElement("canvas");
          }
          const canvas = canvasRef.current;
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            reject(new Error("Cannot get canvas context"));
            return;
          }
          ctx.drawImage(video, 0, 0);
          canvas.toBlob(
            (b) => {
              video.srcObject = null;
              if (b) resolve(b);
              else reject(new Error("Canvas toBlob failed"));
            },
            "image/jpeg",
            0.9
          );
        };

        video.onerror = () => {
          reject(new Error("Video element error"));
        };

        video.play().catch(reject);
      });
    },
    []
  );

  const clearPhotos = useCallback(() => {
    setPhotos((prev) => {
      prev.forEach((p) => URL.revokeObjectURL(p.thumbnailUrl));
      return [];
    });
  }, []);

  return { photos, capturePhoto, clearPhotos, isCapturing };
}
