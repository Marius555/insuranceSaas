"use server";

import { adminAction } from '@/appwrite/adminOrClient';
import { DATABASE_ID, COLLECTION_IDS } from '@/lib/env';
import { fetchFullReportData, type FullReportData } from '@/lib/types/appwrite';
import { getFileUrl, getFileDownloadUrl } from '@/appwrite/storage';

export interface MediaFile {
  fileId: string;
  url: string;
  downloadUrl: string;
}

export interface PolicyFile {
  fileId: string;
  url: string;
  downloadUrl: string;
}

export interface ReportWithFiles extends FullReportData {
  mediaFiles: MediaFile[];
  policyFile: PolicyFile | null;
}

/**
 * Fetch report data with generated file URLs
 *
 * @param reportId - Report document ID
 * @returns Report data with file URLs or error
 */
export async function getReportById(reportId: string): Promise<{
  success: boolean;
  data?: ReportWithFiles;
  message?: string;
}> {
  try {
    const { databases } = await adminAction();

    // Fetch full report data (report + damage details + verification + assessment)
    const fullReport = await fetchFullReportData(
      databases,
      DATABASE_ID,
      COLLECTION_IDS,
      reportId
    );

    // Generate media file URLs from file IDs
    const mediaFiles: MediaFile[] = await Promise.all(
      (fullReport.report.media_file_ids || []).map(async (fileId) => ({
        fileId,
        url: await getFileUrl(fileId),
        downloadUrl: await getFileDownloadUrl(fileId),
      }))
    );

    // Generate policy file URLs if policy exists
    let policyFile: PolicyFile | null = null;
    if (fullReport.report.policy_file_id) {
      policyFile = {
        fileId: fullReport.report.policy_file_id,
        url: await getFileUrl(fullReport.report.policy_file_id),
        downloadUrl: await getFileDownloadUrl(fullReport.report.policy_file_id),
      };
    }

    return {
      success: true,
      data: {
        ...fullReport,
        mediaFiles,
        policyFile,
      },
    };
  } catch (error: any) {
    console.error('Failed to fetch report:', error);

    // Handle specific error cases
    if (error.code === 404) {
      return {
        success: false,
        message: 'Report not found',
      };
    }

    return {
      success: false,
      message: error.message || 'Failed to fetch report data',
    };
  }
}
