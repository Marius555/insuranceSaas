"use server";

import { adminAction } from '@/appwrite/adminOrClient';
import { STORAGE_BUCKET_ID } from '@/lib/env';
import { ID, Permission, Role } from 'node-appwrite';
import { InputFile } from 'node-appwrite/file';

/**
 * Storage Management Server Actions
 * Handle file uploads and deletions in Appwrite Storage
 */

export interface UploadFileResult {
  success: boolean;
  fileId?: string;
  url?: string;
  message?: string;
}

export interface UploadMultipleFilesResult {
  success: boolean;
  fileIds?: string[];
  message?: string;
}

/**
 * Upload a single file to Appwrite Storage
 *
 * @param file - File object or Buffer with metadata
 * @param bucketId - Storage bucket ID (defaults to STORAGE_BUCKET_ID)
 * @returns File ID and URL or error
 *
 * @example
 * const result = await uploadFile(file);
 * if (result.success) {
 *   console.log('File uploaded:', result.fileId);
 * }
 */
export async function uploadFile(
  file: File | { buffer: Buffer; filename: string; mimeType: string },
  bucketId: string = STORAGE_BUCKET_ID
): Promise<UploadFileResult> {
  try {
    const { storage } = await adminAction();

    // Convert File to Buffer if needed
    let buffer: Buffer;
    let filename: string;
    let mimeType: string;

    if (file instanceof File) {
      const arrayBuffer = await file.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
      filename = file.name;
      mimeType = file.type;
    } else {
      buffer = file.buffer;
      filename = file.filename;
      mimeType = file.mimeType;
    }

    // Create InputFile from buffer
    const inputFile = InputFile.fromBuffer(buffer, filename);

    // Upload file with public read permissions
    const uploadedFile = await storage.createFile(
      bucketId,
      ID.unique(),
      inputFile,
      [Permission.read(Role.any())] // Public read for claim evidence
    );

    // Generate file URL
    const fileUrl = `${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT}/storage/buckets/${bucketId}/files/${uploadedFile.$id}/view?project=${process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID}`;

    return {
      success: true,
      fileId: uploadedFile.$id,
      url: fileUrl,
    };
  } catch (error: any) {
    console.error('Failed to upload file:', error);

    // Handle common errors
    if (error.code === 413) {
      return {
        success: false,
        message: 'File too large. Maximum size is 50MB.',
      };
    }

    if (error.code === 400) {
      return {
        success: false,
        message: 'Invalid file type or corrupted file.',
      };
    }

    return {
      success: false,
      message: error.message || 'Failed to upload file',
    };
  }
}

/**
 * Upload multiple media files (images/videos) to storage
 * Validates file types and uploads in parallel
 *
 * @param files - Array of File objects or Buffers
 * @returns Array of file IDs or error
 *
 * @example
 * const result = await uploadMediaFiles([image1, image2, video]);
 * if (result.success) {
 *   console.log('Uploaded files:', result.fileIds);
 * }
 */
export async function uploadMediaFiles(
  files: File[] | Array<{ buffer: Buffer; filename: string; mimeType: string }>
): Promise<UploadMultipleFilesResult> {
  try {
    // Validate file types
    for (const file of files) {
      const mimeType = file instanceof File ? file.type : file.mimeType;

      if (!isValidMediaType(mimeType)) {
        return {
          success: false,
          message: `Invalid file type: ${mimeType}. Only images and videos are allowed.`,
        };
      }
    }

    // Upload all files in parallel
    const uploadPromises = files.map((file) => uploadFile(file));
    const results = await Promise.all(uploadPromises);

    // Check if all uploads succeeded
    const failedUploads = results.filter((r) => !r.success);
    if (failedUploads.length > 0) {
      // Cleanup successfully uploaded files
      const successfulFileIds = results
        .filter((r) => r.success && r.fileId)
        .map((r) => r.fileId!);

      await Promise.all(successfulFileIds.map((id) => deleteFile(id)));

      return {
        success: false,
        message: failedUploads[0].message || 'Failed to upload some files',
      };
    }

    // Extract file IDs
    const fileIds = results.map((r) => r.fileId!);

    return {
      success: true,
      fileIds,
    };
  } catch (error: any) {
    console.error('Failed to upload media files:', error);
    return {
      success: false,
      message: error.message || 'Failed to upload media files',
    };
  }
}

/**
 * Upload policy PDF file to storage
 * Validates that file is a PDF
 *
 * @param file - PDF File object or Buffer
 * @returns File ID or error
 *
 * @example
 * const result = await uploadPolicyFile(policyPDF);
 * if (result.success) {
 *   console.log('Policy uploaded:', result.fileId);
 * }
 */
export async function uploadPolicyFile(
  file: File | { buffer: Buffer; filename: string; mimeType: string }
): Promise<UploadFileResult> {
  try {
    // Validate file type
    const mimeType = file instanceof File ? file.type : file.mimeType;

    if (!isPDF(mimeType)) {
      return {
        success: false,
        message: 'Invalid file type. Only PDF files are allowed for policy documents.',
      };
    }

    // Upload the file
    return await uploadFile(file);
  } catch (error: any) {
    console.error('Failed to upload policy file:', error);
    return {
      success: false,
      message: error.message || 'Failed to upload policy file',
    };
  }
}

/**
 * Delete file from Appwrite Storage
 * Used for cleanup when operations fail
 *
 * @param fileId - The file ID to delete
 * @param bucketId - Storage bucket ID (defaults to STORAGE_BUCKET_ID)
 * @returns Success or error
 *
 * @example
 * await deleteFile('file123');
 */
export async function deleteFile(
  fileId: string,
  bucketId: string = STORAGE_BUCKET_ID
): Promise<{ success: boolean; message?: string }> {
  try {
    const { storage } = await adminAction();

    await storage.deleteFile(bucketId, fileId);

    return { success: true };
  } catch (error: any) {
    console.error('Failed to delete file:', error);
    return {
      success: false,
      message: error.message || 'Failed to delete file',
    };
  }
}

/**
 * Helper function to validate media file types
 * Accepts images (jpeg, png, webp) and videos (mp4, webm, quicktime)
 *
 * @param mimeType - File MIME type (handles codec suffixes like "video/webm;codecs=vp8")
 * @returns True if valid media type
 */
function isValidMediaType(mimeType: string): boolean {
  // Extract base MIME type (before semicolon for types like "video/webm;codecs=vp8")
  const baseMimeType = mimeType.toLowerCase().split(';')[0].trim();

  const validTypes = [
    // Images
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/heic',
    'image/heif',
    // Videos
    'video/mp4',
    'video/webm',
    'video/quicktime',
    'video/x-msvideo', // AVI
  ];

  return validTypes.includes(baseMimeType);
}

/**
 * Helper function to check if file is a PDF
 *
 * @param mimeType - File MIME type
 * @returns True if PDF
 */
function isPDF(mimeType: string): boolean {
  return mimeType.toLowerCase() === 'application/pdf';
}

/**
 * Get file download URL
 *
 * @param fileId - File ID
 * @param bucketId - Storage bucket ID (defaults to STORAGE_BUCKET_ID)
 * @returns File URL
 *
 * @example
 * const url = await getFileUrl('file123');
 */
export async function getFileUrl(
  fileId: string,
  bucketId: string = STORAGE_BUCKET_ID
): Promise<string> {
  return `${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT}/storage/buckets/${bucketId}/files/${fileId}/view?project=${process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID}`;
}

/**
 * Get file download link (forces download instead of view)
 *
 * @param fileId - File ID
 * @param bucketId - Storage bucket ID (defaults to STORAGE_BUCKET_ID)
 * @returns Download URL
 *
 * @example
 * const url = await getFileDownloadUrl('file123');
 */
export async function getFileDownloadUrl(
  fileId: string,
  bucketId: string = STORAGE_BUCKET_ID
): Promise<string> {
  return `${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT}/storage/buckets/${bucketId}/files/${fileId}/download?project=${process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID}`;
}
