// Load environment variables first
import { config } from 'dotenv';
config();

import { adminAction } from '../appwrite/adminOrClient';
import { IndexType } from 'node-appwrite';
import type { Databases } from 'node-appwrite';
import * as fs from 'fs/promises';
import * as path from 'path';

// Import types from submit-schema (shared)
interface SchemaDefinition {
  version: string;
  database: {
    id: string;
    name: string;
  };
  collections: CollectionDefinition[];
}

interface CollectionDefinition {
  id: string;
  name: string;
  documentSecurity: boolean;
  permissions: string[];
  attributes: AttributeDefinition[];
  indexes: IndexDefinition[];
}

interface AttributeDefinition {
  key: string;
  type: 'string' | 'email' | 'url' | 'integer' | 'float' | 'boolean' | 'datetime' | 'enum';
  size?: number;
  required: boolean;
  default?: any;
  array?: boolean;
  min?: number;
  max?: number;
  elements?: string[];
}

interface IndexDefinition {
  key: string;
  type: 'key' | 'unique' | 'fulltext';
  attributes: string[];
  orders?: string[];
}

interface SchemaDiff {
  missingCollections: CollectionDefinition[];
  missingAttributes: Map<string, AttributeDefinition[]>;
  missingIndexes: Map<string, IndexDefinition[]>;
  typeMismatches: Array<{
    collection: string;
    attribute: string;
    expected: string;
    actual: string;
  }>;
  extraCollections: string[];
  extraAttributes: Map<string, string[]>;
}

/**
 * Load and interpolate schema file
 */
async function loadSchema(): Promise<SchemaDefinition> {
  const schemaPath = path.join(process.cwd(), 'schema', 'database.schema.json');
  const schemaContent = await fs.readFile(schemaPath, 'utf-8');

  // Replace environment variable placeholders
  const interpolated = schemaContent.replace(
    /\$\{(\w+)\}/g,
    (match, varName) => process.env[varName] || match
  );

  return JSON.parse(interpolated);
}

/**
 * Compare schema with actual Appwrite database
 */
async function compareSchema(
  databases: Databases,
  databaseId: string,
  schemaCollections: CollectionDefinition[]
): Promise<SchemaDiff> {
  const diff: SchemaDiff = {
    missingCollections: [],
    missingAttributes: new Map(),
    missingIndexes: new Map(),
    typeMismatches: [],
    extraCollections: [],
    extraAttributes: new Map(),
  };

  // Fetch all existing collections
  const existingCollections = await databases.listCollections(databaseId);
  const existingMap = new Map(existingCollections.collections.map((c) => [c.$id, c]));

  // Check for missing collections
  for (const schemaCol of schemaCollections) {
    if (!existingMap.has(schemaCol.id)) {
      diff.missingCollections.push(schemaCol);
      continue;
    }

    // Collection exists - check attributes
    const existingCol = existingMap.get(schemaCol.id)!;
    const existingAttrMap = new Map(existingCol.attributes.map((a: any) => [a.key, a]));

    const missingAttrs: AttributeDefinition[] = [];

    for (const schemaAttr of schemaCol.attributes || []) {
      const existingAttr = existingAttrMap.get(schemaAttr.key);

      if (!existingAttr) {
        missingAttrs.push(schemaAttr);
      } else {
        // Check type match
        if (existingAttr.type !== schemaAttr.type) {
          diff.typeMismatches.push({
            collection: schemaCol.id,
            attribute: schemaAttr.key,
            expected: schemaAttr.type,
            actual: existingAttr.type,
          });
        }
      }
    }

    if (missingAttrs.length > 0) {
      diff.missingAttributes.set(schemaCol.id, missingAttrs);
    }

    // Check for extra attributes
    const schemaAttrKeys = new Set((schemaCol.attributes || []).map((a) => a.key));
    const extraAttrs = existingCol.attributes
      .filter((a: any) => !schemaAttrKeys.has(a.key))
      .map((a: any) => a.key);

    if (extraAttrs.length > 0) {
      diff.extraAttributes.set(schemaCol.id, extraAttrs);
    }

    // Check indexes
    const existingIdxMap = new Map(existingCol.indexes.map((i: any) => [i.key, i]));

    const missingIdxs: IndexDefinition[] = [];
    for (const schemaIdx of schemaCol.indexes || []) {
      if (!existingIdxMap.has(schemaIdx.key)) {
        missingIdxs.push(schemaIdx);
      }
    }

    if (missingIdxs.length > 0) {
      diff.missingIndexes.set(schemaCol.id, missingIdxs);
    }
  }

  // Check for extra collections
  const schemaColIds = new Set(schemaCollections.map((c) => c.id));
  diff.extraCollections = existingCollections.collections
    .filter((c) => !schemaColIds.has(c.$id))
    .map((c) => c.$id);

  return diff;
}

/**
 * Create a single attribute based on type (copied from submit-schema)
 */
async function createSingleAttribute(
  databases: Databases,
  databaseId: string,
  collectionId: string,
  attr: AttributeDefinition
): Promise<void> {
  const { key, type, required = false } = attr;

  switch (type) {
    case 'string':
      await databases.createStringAttribute(
        databaseId,
        collectionId,
        key,
        attr.size || 255,
        required,
        attr.default,
        attr.array ?? false
      );
      break;

    case 'email':
      await databases.createEmailAttribute(
        databaseId,
        collectionId,
        key,
        required,
        attr.default,
        attr.array ?? false
      );
      break;

    case 'url':
      await databases.createUrlAttribute(
        databaseId,
        collectionId,
        key,
        required,
        attr.default,
        attr.array ?? false
      );
      break;

    case 'integer':
      await databases.createIntegerAttribute(
        databaseId,
        collectionId,
        key,
        required,
        attr.min,
        attr.max,
        attr.default,
        attr.array ?? false
      );
      break;

    case 'float':
      await databases.createFloatAttribute(
        databaseId,
        collectionId,
        key,
        required,
        attr.min,
        attr.max,
        attr.default,
        attr.array ?? false
      );
      break;

    case 'boolean':
      await databases.createBooleanAttribute(
        databaseId,
        collectionId,
        key,
        required,
        attr.default,
        attr.array ?? false
      );
      break;

    case 'datetime':
      await databases.createDatetimeAttribute(
        databaseId,
        collectionId,
        key,
        required,
        attr.default,
        attr.array ?? false
      );
      break;

    case 'enum':
      await databases.createEnumAttribute(
        databaseId,
        collectionId,
        key,
        attr.elements || [],
        required,
        attr.default,
        attr.array ?? false
      );
      break;

    default:
      throw new Error(`Unsupported attribute type: ${type}`);
  }
}

/**
 * Wait for attribute to become available (copied from submit-schema)
 */
async function waitForAttributeAvailable(
  databases: Databases,
  databaseId: string,
  collectionId: string,
  attributeKey: string,
  maxAttempts = 30
): Promise<void> {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const collection = await databases.getCollection(databaseId, collectionId);
      const attr = collection.attributes.find((a: any) => a.key === attributeKey);

      if (attr && attr.status === 'available') {
        return;
      }

      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (error) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  throw new Error(
    `Attribute ${attributeKey} did not become available after ${maxAttempts} attempts`
  );
}

/**
 * Wait for index to become available (copied from submit-schema)
 */
async function waitForIndexAvailable(
  databases: Databases,
  databaseId: string,
  collectionId: string,
  indexKey: string,
  maxAttempts = 30
): Promise<void> {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const collection = await databases.getCollection(databaseId, collectionId);
      const idx = collection.indexes.find((i: any) => i.key === indexKey);

      if (idx && idx.status === 'available') {
        return;
      }

      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (error) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  throw new Error(`Index ${indexKey} did not become available after ${maxAttempts} attempts`);
}

/**
 * Create a collection (copied from submit-schema)
 */
async function createCollection(
  databases: Databases,
  databaseId: string,
  collection: CollectionDefinition
): Promise<void> {
  await databases.createCollection(
    databaseId,
    collection.id,
    collection.name,
    collection.permissions,
    collection.documentSecurity ?? true
  );
}

/**
 * Apply schema differences (safe mode - only create, never delete)
 */
async function applySchemaDiff(
  databases: Databases,
  databaseId: string,
  diff: SchemaDiff,
  schemaCollections: CollectionDefinition[],
  dryRun = false
): Promise<void> {
  if (dryRun) {
    console.log('\n[DRY RUN MODE - No changes will be applied]\n');
  }

  let changeCount = 0;

  // Create missing collections
  for (const collection of diff.missingCollections) {
    if (!dryRun) {
      await createCollection(databases, databaseId, collection);

      // Create all attributes
      for (const attr of collection.attributes || []) {
        await createSingleAttribute(databases, databaseId, collection.id, attr);
        await waitForAttributeAvailable(databases, databaseId, collection.id, attr.key);
      }

      // Create all indexes
      for (const idx of collection.indexes || []) {
        await databases.createIndex(
          databaseId,
          collection.id,
          idx.key,
          idx.type as IndexType,
          idx.attributes,
          idx.orders ?? []
        );
        await waitForIndexAvailable(databases, databaseId, collection.id, idx.key);
      }
    }
    console.log(
      `${dryRun ? '[PLAN]' : '✓'} ${dryRun ? 'Would create' : 'Created'} collection: ${collection.id}`
    );
    changeCount++;
  }

  // Create missing attributes
  for (const [collectionId, attributes] of diff.missingAttributes.entries()) {
    for (const attr of attributes) {
      if (!dryRun) {
        await createSingleAttribute(databases, databaseId, collectionId, attr);
        await waitForAttributeAvailable(databases, databaseId, collectionId, attr.key);
      }
      console.log(
        `${dryRun ? '[PLAN]' : '✓'} ${dryRun ? 'Would create' : 'Created'} attribute: ${collectionId}.${attr.key}`
      );
      changeCount++;
    }
  }

  // Create missing indexes
  for (const [collectionId, indexes] of diff.missingIndexes.entries()) {
    for (const idx of indexes) {
      if (!dryRun) {
        await databases.createIndex(
          databaseId,
          collectionId,
          idx.key,
          idx.type as IndexType,
          idx.attributes,
          idx.orders ?? []
        );
        await waitForIndexAvailable(databases, databaseId, collectionId, idx.key);
      }
      console.log(
        `${dryRun ? '[PLAN]' : '✓'} ${dryRun ? 'Would create' : 'Created'} index: ${collectionId}.${idx.key}`
      );
      changeCount++;
    }
  }

  console.log(`\nTotal changes: ${changeCount}`);
}

/**
 * Generate diff report
 */
function generateDiffReport(diff: SchemaDiff): string {
  let report = '\n========================================\n';
  report += 'Schema Synchronization Report\n';
  report += '========================================\n\n';

  // Missing collections
  if (diff.missingCollections.length > 0) {
    report += `🆕 MISSING COLLECTIONS (${diff.missingCollections.length}):\n`;
    diff.missingCollections.forEach((c) => {
      report += `   - ${c.id} (${c.attributes?.length || 0} attributes)\n`;
    });
    report += '\n';
  }

  // Missing attributes
  if (diff.missingAttributes.size > 0) {
    report += `📝 MISSING ATTRIBUTES:\n`;
    diff.missingAttributes.forEach((attrs, collId) => {
      report += `   ${collId}:\n`;
      attrs.forEach((a) => {
        report += `      - ${a.key} (${a.type})\n`;
      });
    });
    report += '\n';
  }

  // Missing indexes
  if (diff.missingIndexes.size > 0) {
    report += `🔍 MISSING INDEXES:\n`;
    diff.missingIndexes.forEach((indexes, collId) => {
      report += `   ${collId}:\n`;
      indexes.forEach((i) => {
        report += `      - ${i.key} (${i.type})\n`;
      });
    });
    report += '\n';
  }

  // Type mismatches
  if (diff.typeMismatches.length > 0) {
    report += `⚠️  TYPE MISMATCHES (${diff.typeMismatches.length}):\n`;
    diff.typeMismatches.forEach((m) => {
      report += `   - ${m.collection}.${m.attribute}: expected ${m.expected}, found ${m.actual}\n`;
    });
    report += '\n';
  }

  // Extra collections
  if (diff.extraCollections.length > 0) {
    report += `ℹ️  EXTRA COLLECTIONS (not in schema):\n`;
    diff.extraCollections.forEach((c) => {
      report += `   - ${c}\n`;
    });
    report += '\n';
  }

  // Extra attributes
  if (diff.extraAttributes.size > 0) {
    report += `ℹ️  EXTRA ATTRIBUTES (not in schema):\n`;
    diff.extraAttributes.forEach((attrs, collId) => {
      report += `   ${collId}: ${attrs.join(', ')}\n`;
    });
    report += '\n';
  }

  // Summary
  const totalIssues =
    diff.missingCollections.length +
    Array.from(diff.missingAttributes.values()).reduce((sum, arr) => sum + arr.length, 0) +
    Array.from(diff.missingIndexes.values()).reduce((sum, arr) => sum + arr.length, 0) +
    diff.typeMismatches.length;

  if (totalIssues === 0) {
    report += '✅ Schema is in sync! No changes needed.\n';
  } else {
    report += `📊 Total changes needed: ${totalIssues}\n`;
  }

  report += '========================================\n';

  return report;
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');

  console.log('========================================');
  console.log('Appwrite Schema Synchronization');
  console.log('========================================\n');

  try {
    // Load schema
    const schema = await loadSchema();
    console.log(`✓ Loaded schema version ${schema.version}\n`);

    // Initialize Appwrite
    const { databases } = await adminAction();
    const databaseId = schema.database.id;

    // Compare schema
    console.log('Analyzing differences...\n');
    const diff = await compareSchema(databases, databaseId, schema.collections);

    // Generate report
    const report = generateDiffReport(diff);
    console.log(report);

    // Apply changes if not dry run and changes exist
    const hasChanges =
      diff.missingCollections.length > 0 ||
      diff.missingAttributes.size > 0 ||
      diff.missingIndexes.size > 0;

    if (hasChanges) {
      if (dryRun) {
        console.log('\n💡 Run without --dry-run to apply these changes');
      } else {
        console.log('\nApplying changes...\n');
        await applySchemaDiff(databases, databaseId, diff, schema.collections, false);
        console.log('\n✓ Synchronization complete!');
      }
    }

    // Warn about type mismatches
    if (diff.typeMismatches.length > 0) {
      console.log('\n⚠️  WARNING: Type mismatches cannot be auto-fixed.');
      console.log('   You must manually drop and recreate these attributes.');
    }
  } catch (error) {
    console.error('\n✗ Synchronization failed:', error);
    process.exit(1);
  }
}

main();
