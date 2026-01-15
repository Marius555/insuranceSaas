"use client";

import { useState, useRef, useCallback, useEffect } from "react";

interface UseVideoRecorderOptions {
  maxDurationSeconds?: number;
  stream: MediaStream | null;
  onMaxDurationReached?: () => void;
}

interface UseVideoRecorderReturn {
  isRecording: boolean;
  duration: number;
  recordedBlob: Blob | null;
  recordedFile: File | null;
  recordedUrl: string | null;
  error: string | null;
  mimeType: string;
  isSupported: boolean;
  startRecording: () => void;
  stopRecording: () => void;
  resetRecording: () => void;
}

function getSupportedMimeType(): string {
  if (typeof window === "undefined" || !window.MediaRecorder) {
    return "video/webm";
  }

  // Check for iOS Safari
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

  // Priority order based on browser support and compression efficiency
  const types = isIOS
    ? [
        "video/mp4;codecs=h264,aac",
        "video/mp4",
        "video/webm;codecs=vp8,opus",
        "video/webm",
      ]
    : [
        "video/webm;codecs=vp9,opus",
        "video/webm;codecs=vp8,opus",
        "video/webm;codecs=vp9",
        "video/webm;codecs=vp8",
        "video/webm",
        "video/mp4;codecs=h264,aac",
        "video/mp4",
      ];

  for (const type of types) {
    if (MediaRecorder.isTypeSupported(type)) {
      return type;
    }
  }

  return "video/webm";
}

function getVideoBitsPerSecond(): number {
  // Target ~1.5 Mbps for video to keep 20 second video under 20MB
  // 20MB = 160Mbit, 160Mbit / 20s = 8Mbps total
  // Account for audio (~128kbps) and overhead, aim for ~6Mbps video
  // But be conservative for compression: 1.5Mbps
  return 1_500_000;
}

export function useVideoRecorder(
  options: UseVideoRecorderOptions
): UseVideoRecorderReturn {
  const { maxDurationSeconds = 20, stream, onMaxDurationReached } = options;

  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordedFile, setRecordedFile] = useState<File | null>(null);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState(() => getSupportedMimeType());

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);

  const isSupported =
    typeof window !== "undefined" && !!window.MediaRecorder && !!stream;

  const cleanup = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (recordedUrl) {
      URL.revokeObjectURL(recordedUrl);
    }
  }, [recordedUrl]);

  const resetRecording = useCallback(() => {
    cleanup();
    setIsRecording(false);
    setDuration(0);
    setRecordedBlob(null);
    setRecordedFile(null);
    setRecordedUrl(null);
    setError(null);
    chunksRef.current = [];
    mediaRecorderRef.current = null;
  }, [cleanup]);

  const stopRecording = useCallback(() => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsRecording(false);
  }, []);

  const startRecording = useCallback(() => {
    if (!stream) {
      setError("No camera stream available");
      return;
    }

    if (!window.MediaRecorder) {
      setError("Video recording is not supported in this browser");
      return;
    }

    // Reset previous recording
    if (recordedUrl) {
      URL.revokeObjectURL(recordedUrl);
    }
    setRecordedBlob(null);
    setRecordedFile(null);
    setRecordedUrl(null);
    setError(null);
    chunksRef.current = [];

    const supportedMimeType = getSupportedMimeType();
    setMimeType(supportedMimeType);

    try {
      const recorder = new MediaRecorder(stream, {
        mimeType: supportedMimeType,
        videoBitsPerSecond: getVideoBitsPerSecond(),
        audioBitsPerSecond: 128_000,
      });

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: supportedMimeType });
        const url = URL.createObjectURL(blob);

        // Determine file extension based on mime type
        const extension = supportedMimeType.includes("mp4") ? "mp4" : "webm";
        const filename = `claim-video-${Date.now()}.${extension}`;

        const file = new File([blob], filename, { type: supportedMimeType });

        setRecordedBlob(blob);
        setRecordedFile(file);
        setRecordedUrl(url);
      };

      recorder.onerror = (event) => {
        console.error("MediaRecorder error:", event);
        setError("Recording error occurred");
        stopRecording();
      };

      mediaRecorderRef.current = recorder;
      recorder.start(1000); // Collect data every second

      setIsRecording(true);
      setDuration(0);
      startTimeRef.current = Date.now();

      // Start timer
      timerRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        setDuration(elapsed);

        if (elapsed >= maxDurationSeconds) {
          stopRecording();
          onMaxDurationReached?.();
        }
      }, 100);
    } catch (err) {
      console.error("Failed to start recording:", err);
      setError(
        err instanceof Error ? err.message : "Failed to start recording"
      );
    }
  }, [stream, maxDurationSeconds, onMaxDurationReached, stopRecording, recordedUrl]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state !== "inactive"
      ) {
        mediaRecorderRef.current.stop();
      }
    };
  }, [cleanup]);

  return {
    isRecording,
    duration,
    recordedBlob,
    recordedFile,
    recordedUrl,
    error,
    mimeType,
    isSupported,
    startRecording,
    stopRecording,
    resetRecording,
  };
}
