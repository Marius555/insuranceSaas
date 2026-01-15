/**
 * Database Migration Script: Increase String Array Field Sizes to 1200
 *
 * This script updates Appwrite collection attributes to support larger
 * text content from Gemini AI analysis.
 *
 * IMPORTANT: This script requires admin access to your Appwrite project.
 *
 * Usage:
 *   npx ts-node scripts/migrate-field-sizes.ts
 *
 * What it does:
 * - Updates 7 string array attributes across 2 collections
 * - Changes size limits from 200-500 chars to 1200 chars
 * - Preserves all other attribute settings (required, array, etc.)
 */

// Load environment variables first
import { config } from 'dotenv';
config();

import { Client, Databases } from 'node-appwrite';

// Appwrite configuration - Read after config() to ensure env vars are loaded
const ENDPOINT = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!;
const PROJECT_ID = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!;
const API_KEY = process.env.APPWRITE_API_KEY!;
const DATABASE_ID = process.env.DATABASE_ID!;

// Collection IDs - Read from environment
const CLAIMS_COLLECTION_ID = process.env.CLAIMS_COLLECTION_ID!;
const CLAIM_ASSESSMENTS_COLLECTION_ID = process.env.CLAIM_ASSESSMENTS_COLLECTION_ID!;

// Validate environment variables
if (!ENDPOINT || !PROJECT_ID || !API_KEY || !DATABASE_ID || !CLAIMS_COLLECTION_ID || !CLAIM_ASSESSMENTS_COLLECTION_ID) {
  console.error('❌ Missing required environment variables:');
  console.error('   NEXT_PUBLIC_APPWRITE_ENDPOINT:', ENDPOINT ? '✓' : '✗');
  console.error('   NEXT_PUBLIC_APPWRITE_PROJECT_ID:', PROJECT_ID ? '✓' : '✗');
  console.error('   APPWRITE_API_KEY:', API_KEY ? '✓' : '✗');
  console.error('   DATABASE_ID:', DATABASE_ID ? '✓' : '✗');
  console.error('   CLAIMS_COLLECTION_ID:', CLAIMS_COLLECTION_ID ? '✓' : '✗');
  console.error('   CLAIM_ASSESSMENTS_COLLECTION_ID:', CLAIM_ASSESSMENTS_COLLECTION_ID ? '✓' : '✗');
  process.exit(1);
}

// Initialize Appwrite client
const client = new Client()
  .setEndpoint(ENDPOINT)
  .setProject(PROJECT_ID)
  .setKey(API_KEY);

const databases = new Databases(client);

// Migration configuration
const migrations = [
  {
    collection: 'claims',
    collectionId: CLAIMS_COLLECTION_ID,
    attributes: [
      { key: 'safety_concerns', size: 1200 },
      { key: 'recommended_actions', size: 1200 },
    ],
  },
  {
    collection: 'claim_assessments',
    collectionId: CLAIM_ASSESSMENTS_COLLECTION_ID,
    attributes: [
      { key: 'exclusions', size: 1200 },
      { key: 'relevant_policy_sections', size: 1200 },
      { key: 'covered_damages', size: 1200 },
      { key: 'excluded_damages', size: 1200 },
      { key: 'policy_references', size: 1200 },
    ],
  },
];

/**
 * Update a string array attribute size
 */
async function updateAttribute(
  collectionId: string,
  attributeKey: string,
  newSize: number
): Promise<void> {
  try {
    console.log(`   Updating ${attributeKey}...`);

    // Update attribute using Appwrite SDK
    // Signature: updateStringAttribute(databaseId, collectionId, key, required, xdefault, size?, newKey?)
    await databases.updateStringAttribute(
      DATABASE_ID,
      collectionId,
      attributeKey,
      false,        // required - these attributes are optional
      '',           // xdefault - empty string (SDK requires this parameter)
      newSize       // size - the new size we want
    );

    console.log(`   ✅ ${attributeKey} updated to size ${newSize}`);
  } catch (error: any) {
    console.error(`   ❌ Failed to update ${attributeKey}:`, error.message);
    throw error;
  }
}

/**
 * Run all migrations
 */
async function runMigrations(): Promise<void> {
  console.log('🚀 Starting database migration...\n');
  console.log(`Database: ${DATABASE_ID}`);
  console.log(`Endpoint: ${ENDPOINT}\n`);

  for (const migration of migrations) {
    console.log(`📋 Collection: ${migration.collection}`);

    for (const attr of migration.attributes) {
      await updateAttribute(
        migration.collectionId,
        attr.key,
        attr.size
      );

      // Add small delay between updates to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log('');
  }

  console.log('✅ Migration completed successfully!\n');
  console.log('Next steps:');
  console.log('1. Verify changes in Appwrite console');
  console.log('2. Test claim submission with long Gemini responses');
  console.log('3. Monitor logs for truncation warnings\n');
}

/**
 * Rollback migration (restore original sizes)
 */
async function rollbackMigrations(): Promise<void> {
  console.log('🔄 Rolling back migration...\n');

  const rollbackConfig = [
    {
      collection: 'claims',
      collectionId: CLAIMS_COLLECTION_ID,
      attributes: [
        { key: 'safety_concerns', size: 200 },
        { key: 'recommended_actions', size: 300 }, // Original schema value
      ],
    },
    {
      collection: 'claim_assessments',
      collectionId: CLAIM_ASSESSMENTS_COLLECTION_ID,
      attributes: [
        { key: 'exclusions', size: 500 },
        { key: 'relevant_policy_sections', size: 200 },
        { key: 'covered_damages', size: 300 },
        { key: 'excluded_damages', size: 300 },
        { key: 'policy_references', size: 200 },
      ],
    },
  ];

  for (const migration of rollbackConfig) {
    console.log(`📋 Collection: ${migration.collection}`);

    for (const attr of migration.attributes) {
      await updateAttribute(
        migration.collectionId,
        attr.key,
        attr.size
      );

      await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log('');
  }

  console.log('✅ Rollback completed!\n');
}

// Main execution
const args = process.argv.slice(2);
const isRollback = args.includes('--rollback');

if (isRollback) {
  rollbackMigrations().catch(error => {
    console.error('\n❌ Rollback failed:', error);
    process.exit(1);
  });
} else {
  runMigrations().catch(error => {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  });
}
