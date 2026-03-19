/**
 * Appwrite Data Cleanup Script
 *
 * WARNING: This is a DESTRUCTIVE, IRREVERSIBLE operation.
 * It will delete ALL documents from every collection and ALL files
 * from the storage bucket in your Appwrite project.
 *
 * Usage:
 *   npm run cleanup:appwrite
 *
 * You must type DELETE at the confirmation prompt to proceed.
 */

// Load environment variables first
import { config } from 'dotenv';
config();

import { Client, Databases, Storage, Query } from 'node-appwrite';
import * as readline from 'readline';

// Appwrite configuration
const ENDPOINT = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!;
const PROJECT_ID = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!;
const API_KEY = process.env.APPWRITE_API_KEY!;
const DATABASE_ID = process.env.DATABASE_ID!;

// Collection IDs
const COLLECTIONS: Record<string, string | undefined> = {
  USERS: process.env.USERS_COLLECTION_ID,
  INSURANCE_COMPANIES: process.env.INSURANCE_COMPANIES_COLLECTION_ID,
  REPORTS: process.env.CLAIMS_COLLECTION_ID,
  REPORT_DAMAGE_DETAILS: process.env.CLAIM_DAMAGE_DETAILS_COLLECTION_ID,
  REPORT_VEHICLE_VERIFICATION: process.env.CLAIM_VEHICLE_VERIFICATION_COLLECTION_ID,
  REPORT_ASSESSMENTS: process.env.CLAIM_ASSESSMENTS_COLLECTION_ID,
  REPORT_FRAUD_ASSESSMENTS: process.env.CLAIM_FRAUD_ASSESSMENTS_COLLECTION_ID,
  AUDIT_LOGS: process.env.AUDIT_LOGS_COLLECTION_ID,
  FEEDBACK: process.env.FEEDBACK_COLLECTION_ID,
  NOTIFICATIONS: process.env.NOTIFICATIONS_COLLECTION_ID,
  NEWS_POSTS: process.env.NEWS_POSTS_COLLECTION_ID,
};

// Storage bucket (typo preserved from Appwrite setup)
const STORAGE_BUCKET_ID = process.env.STORAGE_BUKET_ID!;

function validateEnv(): void {
  const missing: string[] = [];

  if (!ENDPOINT) missing.push('NEXT_PUBLIC_APPWRITE_ENDPOINT');
  if (!PROJECT_ID) missing.push('NEXT_PUBLIC_APPWRITE_PROJECT_ID');
  if (!API_KEY) missing.push('APPWRITE_API_KEY');
  if (!DATABASE_ID) missing.push('DATABASE_ID');
  if (!STORAGE_BUCKET_ID) missing.push('STORAGE_BUKET_ID');

  const requiredCollectionEnvVars = [
    ['USERS_COLLECTION_ID', COLLECTIONS.USERS],
    ['INSURANCE_COMPANIES_COLLECTION_ID', COLLECTIONS.INSURANCE_COMPANIES],
    ['CLAIMS_COLLECTION_ID', COLLECTIONS.REPORTS],
    ['CLAIM_DAMAGE_DETAILS_COLLECTION_ID', COLLECTIONS.REPORT_DAMAGE_DETAILS],
    ['CLAIM_VEHICLE_VERIFICATION_COLLECTION_ID', COLLECTIONS.REPORT_VEHICLE_VERIFICATION],
    ['CLAIM_ASSESSMENTS_COLLECTION_ID', COLLECTIONS.REPORT_ASSESSMENTS],
    ['CLAIM_FRAUD_ASSESSMENTS_COLLECTION_ID', COLLECTIONS.REPORT_FRAUD_ASSESSMENTS],
    ['AUDIT_LOGS_COLLECTION_ID', COLLECTIONS.AUDIT_LOGS],
    ['FEEDBACK_COLLECTION_ID', COLLECTIONS.FEEDBACK],
  ];

  for (const [name, value] of requiredCollectionEnvVars) {
    if (!value) missing.push(name);
  }

  if (missing.length > 0) {
    console.error('\n❌ Missing required environment variables:');
    missing.forEach(v => console.error(`   - ${v}`));
    console.error('\nEnsure your .env file is present and complete.\n');
    process.exit(1);
  }
}

async function prompt(question: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => {
    rl.question(question, answer => {
      rl.close();
      resolve(answer);
    });
  });
}

async function deleteAllDocuments(
  databases: Databases,
  collectionName: string,
  collectionId: string
): Promise<number> {
  let totalDeleted = 0;

  while (true) {
    const response = await databases.listDocuments(DATABASE_ID, collectionId, [
      Query.limit(100),
    ]);

    if (response.documents.length === 0) break;

    for (const doc of response.documents) {
      await databases.deleteDocument(DATABASE_ID, collectionId, doc.$id);
      totalDeleted++;
    }

    console.log(`  [${collectionName}] Deleted ${totalDeleted} documents so far...`);
  }

  return totalDeleted;
}

async function deleteAllFiles(storage: Storage): Promise<number> {
  let totalDeleted = 0;

  while (true) {
    const response = await storage.listFiles(STORAGE_BUCKET_ID, [Query.limit(100)]);

    if (response.files.length === 0) break;

    for (const file of response.files) {
      await storage.deleteFile(STORAGE_BUCKET_ID, file.$id);
      totalDeleted++;
    }

    console.log(`  [STORAGE] Deleted ${totalDeleted} files so far...`);
  }

  return totalDeleted;
}

async function main(): Promise<void> {
  console.log('\n' + '='.repeat(60));
  console.log('  APPWRITE DATA CLEANUP SCRIPT');
  console.log('='.repeat(60));

  validateEnv();

  console.log('\n⚠️  WARNING: This will PERMANENTLY DELETE all data from:');
  console.log('\n  Collections:');
  for (const [name] of Object.entries(COLLECTIONS)) {
    console.log(`    - ${name}`);
  }
  console.log('\n  Storage:');
  console.log(`    - Bucket: ${STORAGE_BUCKET_ID}`);
  console.log('\n  This operation is IRREVERSIBLE. All documents and files');
  console.log('  will be permanently deleted.\n');

  const answer = await prompt('  Type DELETE to confirm, or anything else to abort: ');

  if (answer.trim() !== 'DELETE') {
    console.log('\n  Aborted. No data was deleted.\n');
    process.exit(0);
  }

  console.log('\n  Confirmed. Starting cleanup...\n');

  const client = new Client()
    .setEndpoint(ENDPOINT)
    .setProject(PROJECT_ID)
    .setKey(API_KEY);

  const databases = new Databases(client);
  const storage = new Storage(client);

  let totalDocs = 0;
  let totalFiles = 0;

  // Delete all documents from each collection
  for (const [name, collectionId] of Object.entries(COLLECTIONS)) {
    if (!collectionId) {
      console.log(`  [${name}] Skipping — no collection ID configured.`);
      continue;
    }

    try {
      console.log(`  [${name}] Clearing...`);
      const count = await deleteAllDocuments(databases, name, collectionId);
      totalDocs += count;
      console.log(`  [${name}] ✓ Done — ${count} documents deleted.`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`  [${name}] ✗ Error: ${message}`);
    }
  }

  // Delete all files from storage bucket
  try {
    console.log('\n  [STORAGE] Clearing...');
    totalFiles = await deleteAllFiles(storage);
    console.log(`  [STORAGE] ✓ Done — ${totalFiles} files deleted.`);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`  [STORAGE] ✗ Error: ${message}`);
  }

  console.log('\n' + '='.repeat(60));
  console.log('  CLEANUP COMPLETE');
  console.log(`  Total documents deleted: ${totalDocs}`);
  console.log(`  Total files deleted:     ${totalFiles}`);
  console.log('='.repeat(60) + '\n');
}

main().catch(err => {
  console.error('\n❌ Unexpected error:', err);
  process.exit(1);
});
