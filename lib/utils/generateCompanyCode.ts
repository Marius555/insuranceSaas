import { adminAction } from '@/appwrite/adminOrClient';
import { DATABASE_ID, COLLECTION_IDS } from '@/lib/env';
import { Query } from 'node-appwrite';

/**
 * Generate a unique 8-character company code
 * Format: XXXX-NNNN (4 letters + 4 numbers)
 * Example: ACME-1234, GEIC-9876
 */
export async function generateUniqueCompanyCode(): Promise<string> {
  const { databases } = await adminAction();

  let attempts = 0;
  const maxAttempts = 10;

  while (attempts < maxAttempts) {
    // Generate random code: 4 uppercase letters + 4 digits
    const letters = generateRandomLetters(4);
    const numbers = generateRandomNumbers(4);
    const code = `${letters}-${numbers}`;

    // Check if code already exists
    const existing = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_IDS.INSURANCE_COMPANIES,
      [Query.equal('company_code', code), Query.limit(1)]
    );

    if (existing.documents.length === 0) {
      return code; // Unique code found
    }

    attempts++;
  }

  // Fallback: timestamp-based code
  const timestamp = Date.now().toString().slice(-4);
  const letters = generateRandomLetters(4);
  return `${letters}-${timestamp}`;
}

function generateRandomLetters(length: number): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // Exclude I, O to avoid confusion
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function generateRandomNumbers(length: number): string {
  let result = '';
  for (let i = 0; i < length; i++) {
    result += Math.floor(Math.random() * 10).toString();
  }
  return result;
}
