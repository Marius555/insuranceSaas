/**
 * File Conversion Utilities
 * Helper functions for converting files to base64 and checking file types
 */

export interface Base64File {
  base64: string;
  mimeType: string;
  filename: string;
}

/**
 * Convert File object to base64 string
 * Works in both browser and Node.js environments
 *
 * @param file - File object to convert
 * @returns Base64 encoded file with metadata
 *
 * @example
 * const result = await convertFileToBase64(imageFile);
 * console.log(result.base64); // "iVBORw0KGgoAAAANS..."
 * console.log(result.mimeType); // "image/jpeg"
 */
export async function convertFileToBase64(file: File): Promise<Base64File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const base64String = reader.result as string;
      // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
      const base64 = base64String.split(',')[1];

      resolve({
        base64,
        mimeType: file.type,
        filename: file.name,
      });
    };

    reader.onerror = (error) => {
      reject(new Error(`Failed to convert file to base64: ${error}`));
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Convert File object to base64 string (server-side version using Buffer)
 * Use this in server actions/API routes
 *
 * @param file - File object to convert
 * @returns Base64 encoded file with metadata
 *
 * @example
 * const result = await convertFileToBase64Server(file);
 */
export async function convertFileToBase64Server(
  file: File
): Promise<Base64File> {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const base64 = buffer.toString('base64');

  return {
    base64,
    mimeType: file.type,
    filename: file.name,
  };
}

/**
 * Convert Buffer to base64 string
 * Useful when working with uploaded files in server actions
 *
 * @param buffer - Buffer to convert
 * @param mimeType - MIME type of the file
 * @param filename - Original filename
 * @returns Base64 encoded file with metadata
 *
 * @example
 * const result = convertBufferToBase64(buffer, 'image/jpeg', 'photo.jpg');
 */
export function convertBufferToBase64(
  buffer: Buffer,
  mimeType: string,
  filename: string
): Base64File {
  return {
    base64: buffer.toString('base64'),
    mimeType,
    filename,
  };
}

/**
 * Convert multiple File objects to base64 strings
 * Processes files in parallel for better performance
 *
 * @param files - Array of File objects
 * @returns Array of base64 encoded files with metadata
 *
 * @example
 * const results = await convertFilesToBase64([image1, image2, video]);
 * console.log(results[0].base64);
 */
export async function convertFilesToBase64(
  files: File[]
): Promise<Base64File[]> {
  return Promise.all(files.map((file) => convertFileToBase64(file)));
}

/**
 * Convert multiple File objects to base64 strings (server-side version)
 *
 * @param files - Array of File objects
 * @returns Array of base64 encoded files with metadata
 */
export async function convertFilesToBase64Server(
  files: File[]
): Promise<Base64File[]> {
  return Promise.all(files.map((file) => convertFileToBase64Server(file)));
}

/**
 * Check if file is a video based on MIME type
 *
 * @param file - File object or object with mimeType property
 * @returns True if file is a video
 *
 * @example
 * if (isVideo(file)) {
 *   console.log('This is a video file');
 * }
 */
export function isVideo(file: { mimeType: string } | File): boolean {
  const mimeType = file instanceof File ? file.type : file.mimeType;
  return mimeType.toLowerCase().startsWith('video/');
}

/**
 * Check if file is an image based on MIME type
 *
 * @param file - File object or object with mimeType property
 * @returns True if file is an image
 *
 * @example
 * if (isImage(file)) {
 *   console.log('This is an image file');
 * }
 */
export function isImage(file: { mimeType: string } | File): boolean {
  const mimeType = file instanceof File ? file.type : file.mimeType;
  return mimeType.toLowerCase().startsWith('image/');
}

/**
 * Check if file is a PDF based on MIME type
 *
 * @param file - File object or object with mimeType property
 * @returns True if file is a PDF
 *
 * @example
 * if (isPDF(file)) {
 *   console.log('This is a PDF file');
 * }
 */
export function isPDF(file: { mimeType: string } | File): boolean {
  const mimeType = file instanceof File ? file.type : file.mimeType;
  return mimeType.toLowerCase() === 'application/pdf';
}

/**
 * Get file extension from filename
 *
 * @param filename - Filename to extract extension from
 * @returns File extension without the dot, or empty string if none
 *
 * @example
 * getFileExtension('photo.jpg') // "jpg"
 * getFileExtension('document.pdf') // "pdf"
 */
export function getFileExtension(filename: string): string {
  const parts = filename.split('.');
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
}

/**
 * Validate file size
 *
 * @param file - File object
 * @param maxSizeMB - Maximum file size in megabytes
 * @returns True if file size is within limit
 *
 * @example
 * if (!isValidFileSize(file, 50)) {
 *   console.error('File too large. Maximum size is 50MB');
 * }
 */
export function isValidFileSize(file: File, maxSizeMB: number): boolean {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return file.size <= maxSizeBytes;
}

/**
 * Format file size to human-readable string
 *
 * @param bytes - File size in bytes
 * @returns Formatted file size (e.g., "2.5 MB")
 *
 * @example
 * formatFileSize(2621440) // "2.5 MB"
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Detect file type category
 *
 * @param file - File object or object with mimeType property
 * @returns File type category ('image', 'video', 'pdf', 'unknown')
 *
 * @example
 * const type = detectFileType(file);
 * if (type === 'image') {
 *   // Handle image
 * }
 */
export function detectFileType(
  file: { mimeType: string } | File
): 'image' | 'video' | 'pdf' | 'unknown' {
  if (isImage(file)) return 'image';
  if (isVideo(file)) return 'video';
  if (isPDF(file)) return 'pdf';
  return 'unknown';
}

/**
 * Group files by type
 *
 * @param files - Array of files to group
 * @returns Object with files grouped by type
 *
 * @example
 * const grouped = groupFilesByType(files);
 * console.log(grouped.images); // [image1, image2]
 * console.log(grouped.videos); // [video1]
 * console.log(grouped.pdfs); // [pdf1]
 */
export function groupFilesByType(files: File[]): {
  images: File[];
  videos: File[];
  pdfs: File[];
  unknown: File[];
} {
  return files.reduce(
    (acc, file) => {
      const type = detectFileType(file);
      switch (type) {
        case 'image':
          acc.images.push(file);
          break;
        case 'video':
          acc.videos.push(file);
          break;
        case 'pdf':
          acc.pdfs.push(file);
          break;
        default:
          acc.unknown.push(file);
      }
      return acc;
    },
    { images: [] as File[], videos: [] as File[], pdfs: [] as File[], unknown: [] as File[] }
  );
}
