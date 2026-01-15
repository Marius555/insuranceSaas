export interface CompressionResult {
  success: boolean;
  originalSize: number;
  compressedSize: number;
  file: File | null;
  wasCompressed: boolean;
  message?: string;
}

const MAX_SIZE_BYTES = 20 * 1024 * 1024; // 20MB

/**
 * Check if video file needs compression (exceeds 20MB)
 */
export function needsCompression(file: File): boolean {
  return file.size > MAX_SIZE_BYTES;
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Compress video if it exceeds the max size.
 *
 * Note: Browser-based video compression is limited. This function uses
 * canvas-based re-encoding which may not work perfectly in all browsers.
 * The primary strategy should be recording at appropriate bitrate settings.
 */
export async function compressVideoIfNeeded(
  file: File,
  maxSizeMB: number = 20
): Promise<CompressionResult> {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;

  // If file is already small enough, return as-is
  if (file.size <= maxSizeBytes) {
    return {
      success: true,
      originalSize: file.size,
      compressedSize: file.size,
      file: file,
      wasCompressed: false,
    };
  }

  // Calculate target bitrate for compression
  // We'll try to re-encode at a lower bitrate using canvas + MediaRecorder
  try {
    const compressedFile = await reencodeVideo(file, maxSizeBytes);

    return {
      success: true,
      originalSize: file.size,
      compressedSize: compressedFile.size,
      file: compressedFile,
      wasCompressed: true,
      message: compressedFile.size <= maxSizeBytes
        ? "Video compressed successfully"
        : "Video compressed but still exceeds target size",
    };
  } catch (error) {
    console.error("Compression failed:", error);

    // Return original file if compression fails
    return {
      success: false,
      originalSize: file.size,
      compressedSize: file.size,
      file: file,
      wasCompressed: false,
      message: error instanceof Error
        ? `Compression failed: ${error.message}. Consider re-recording at a shorter duration.`
        : "Compression failed. Consider re-recording at a shorter duration.",
    };
  }
}

/**
 * Re-encode video at lower bitrate using canvas and MediaRecorder
 */
async function reencodeVideo(file: File, targetSizeBytes: number): Promise<File> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      reject(new Error("Could not get canvas context"));
      return;
    }

    video.muted = true;
    video.playsInline = true;

    const chunks: Blob[] = [];
    let mediaRecorder: MediaRecorder | null = null;

    video.onloadedmetadata = () => {
      // Set canvas size (reduce resolution if file is very large)
      const scaleFactor = file.size > targetSizeBytes * 2 ? 0.5 : 0.75;
      canvas.width = Math.floor(video.videoWidth * scaleFactor);
      canvas.height = Math.floor(video.videoHeight * scaleFactor);

      // Calculate target bitrate
      const durationSeconds = video.duration || 20;
      const targetBitsPerSecond = Math.floor((targetSizeBytes * 8) / durationSeconds * 0.8);
      const videoBitsPerSecond = Math.min(targetBitsPerSecond, 1_000_000); // Cap at 1Mbps

      // Get stream from canvas
      const canvasStream = canvas.captureStream(30);

      // Try to get audio from original video
      try {
        const audioContext = new AudioContext();
        const source = audioContext.createMediaElementSource(video);
        const destination = audioContext.createMediaStreamDestination();
        source.connect(destination);
        source.connect(audioContext.destination);

        destination.stream.getAudioTracks().forEach(track => {
          canvasStream.addTrack(track);
        });
      } catch {
        // Audio may not be available, continue without it
      }

      // Determine supported mime type
      const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp8")
        ? "video/webm;codecs=vp8"
        : MediaRecorder.isTypeSupported("video/webm")
          ? "video/webm"
          : "video/mp4";

      try {
        mediaRecorder = new MediaRecorder(canvasStream, {
          mimeType,
          videoBitsPerSecond,
          audioBitsPerSecond: 64_000,
        });
      } catch {
        mediaRecorder = new MediaRecorder(canvasStream);
      }

      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: mimeType });
        const extension = mimeType.includes("mp4") ? "mp4" : "webm";
        const compressedFile = new File(
          [blob],
          file.name.replace(/\.[^.]+$/, `-compressed.${extension}`),
          { type: mimeType }
        );
        resolve(compressedFile);
      };

      mediaRecorder.onerror = () => {
        reject(new Error("MediaRecorder error during compression"));
      };

      // Start recording
      mediaRecorder.start();

      // Draw frames to canvas
      const drawFrame = () => {
        if (video.ended || video.paused) {
          if (mediaRecorder && mediaRecorder.state === "recording") {
            mediaRecorder.stop();
          }
          return;
        }

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        requestAnimationFrame(drawFrame);
      };

      video.onended = () => {
        if (mediaRecorder && mediaRecorder.state === "recording") {
          mediaRecorder.stop();
        }
      };

      video.play().then(() => {
        drawFrame();
      }).catch(reject);
    };

    video.onerror = () => {
      reject(new Error("Failed to load video for compression"));
    };

    // Load video from file
    video.src = URL.createObjectURL(file);
    video.load();
  });
}

/**
 * Get recommended MediaRecorder constraints for keeping video under target size
 */
export function getRecommendedRecordingConstraints(
  targetSizeMB: number,
  maxDurationSeconds: number
): {
  videoBitsPerSecond: number;
  audioBitsPerSecond: number;
} {
  const targetBits = targetSizeMB * 1024 * 1024 * 8;
  const audioBitsPerSecond = 128_000;
  const audioBitsTotal = audioBitsPerSecond * maxDurationSeconds;
  const videoBitsTotal = targetBits - audioBitsTotal;
  const videoBitsPerSecond = Math.floor((videoBitsTotal / maxDurationSeconds) * 0.9);

  return {
    videoBitsPerSecond: Math.min(Math.max(videoBitsPerSecond, 500_000), 2_500_000),
    audioBitsPerSecond,
  };
}
