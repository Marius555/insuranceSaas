// Load environment variables first
import { config } from 'dotenv';
config();

import { adminAction } from '../appwrite/adminOrClient';
import { IndexType } from 'node-appwrite';
import type { Databases } from 'node-appwrite';
import * as fs from 'fs/promises';
import * as path from 'path';

// Type definitions for schema structure
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
 * Create a collection in Appwrite
 */
async function createCollection(
  databases: Databases,
  databaseId: string,
  collection: CollectionDefinition
): Promise<{ id: string; created: boolean }> {
  try {
    // Check if collection exists
    const existing = await databases.listCollections(databaseId);
    const found = existing.collections.find((c) => c.$id === collection.id);

    if (found) {
      console.log(`✓ Collection '${collection.id}' already exists`);
      return { id: collection.id, created: false };
    }

    // Create new collection
    await databases.createCollection(
      databaseId,
      collection.id,
      collection.name,
      collection.permissions,
      collection.documentSecurity ?? true
    );

    console.log(`✓ Created collection '${collection.id}'`);
    return { id: collection.id, created: true };
  } catch (error: any) {
    if (error.code === 409) {
      console.log(`✓ Collection '${collection.id}' already exists`);
      return { id: collection.id, created: false };
    }
    console.error(`✗ Failed to create collection '${collection.id}':`, error);
    throw error;
  }
}

/**
 * Create a single attribute based on type
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
 * Wait for attribute to become available
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

      // Wait 1 second before next check
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (error) {
      // Collection might not be ready yet
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  throw new Error(
    `Attribute ${attributeKey} did not become available after ${maxAttempts} attempts`
  );
}

/**
 * Create attributes for a collection
 */
async function createAttributes(
  databases: Databases,
  databaseId: string,
  collectionId: string,
  attributes: AttributeDefinition[]
): Promise<void> {
  for (const attr of attributes) {
    try {
      await createSingleAttribute(databases, databaseId, collectionId, attr);

      // Wait for attribute to be available
      await waitForAttributeAvailable(databases, databaseId, collectionId, attr.key);

      console.log(`  ✓ Created attribute '${attr.key}' (${attr.type})`);
    } catch (error: any) {
      // Check if attribute already exists
      if (error.code === 409) {
        console.log(`  → Attribute '${attr.key}' already exists`);
      } else if (error.code === 400 && error.type === 'attribute_limit_exceeded') {
        console.warn(`  ⚠ Attribute '${attr.key}' skipped: collection attribute limit reached`);
      } else {
        throw error;
      }
    }
  }
}

/**
 * Wait for index to become available
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
 * Create indexes for a collection
 */
async function createIndexes(
  databases: Databases,
  databaseId: string,
  collectionId: string,
  indexes: IndexDefinition[]
): Promise<void> {
  for (const index of indexes) {
    try {
      await databases.createIndex(
        databaseId,
        collectionId,
        index.key,
        index.type as IndexType,
        index.attributes,
        index.orders ?? []
      );

      // Wait for index to be available
      await waitForIndexAvailable(databases, databaseId, collectionId, index.key);

      console.log(`  ✓ Created index '${index.key}' (${index.type})`);
    } catch (error: any) {
      if (error.code === 409) {
        console.log(`  → Index '${index.key}' already exists`);
      } else {
        throw error;
      }
    }
  }
}

/**
 * Update .env file with collection IDs
 */
async function updateEnvFile(collectionIds: Record<string, string>): Promise<void> {
  const envPath = path.join(process.cwd(), '.env');
  let envContent = await fs.readFile(envPath, 'utf-8');

  // Update or add collection ID variables
  for (const [collectionName, collectionId] of Object.entries(collectionIds)) {
    const varName = `${collectionName.toUpperCase()}_COLLECTION_ID`;
    const regex = new RegExp(`^${varName}=.*$`, 'm');

    if (regex.test(envContent)) {
      // Update existing
      envContent = envContent.replace(regex, `${varName}=${collectionId}`);
    } else {
      // Add new
      envContent += `\n${varName}=${collectionId}`;
    }
  }

  await fs.writeFile(envPath, envContent, 'utf-8');
  console.log('\n✓ Updated .env file with collection IDs');
}

/**
 * Main function
 */
async function main() {
  console.log('========================================');
  console.log('Appwrite Schema Submission');
  console.log('========================================\n');

  try {
    // Load schema
    const schema = await loadSchema();
    console.log(`✓ Loaded schema version ${schema.version}\n`);

    // Initialize Appwrite admin client
    const { databases } = await adminAction();
    const databaseId = schema.database.id;

    const collectionIds: Record<string, string> = {};

    // Process each collection
    for (const collection of schema.collections) {
      console.log(`\nProcessing collection: ${collection.name}`);
      console.log('─'.repeat(50));

      // Create collection
      const { id } = await createCollection(databases, databaseId, collection);
      collectionIds[collection.id] = id;

      // Create attributes
      if (collection.attributes && collection.attributes.length > 0) {
        console.log(`Creating ${collection.attributes.length} attributes...`);
        await createAttributes(databases, databaseId, id, collection.attributes);
      }

      // Create indexes
      if (collection.indexes && collection.indexes.length > 0) {
        console.log(`Creating ${collection.indexes.length} indexes...`);
        await createIndexes(databases, databaseId, id, collection.indexes);
      }
    }

    // Update .env file
    await updateEnvFile(collectionIds);

    console.log('\n========================================');
    console.log('✓ Schema submission complete!');
    console.log('========================================\n');
  } catch (error) {
    console.error('\n✗ Schema submission failed:', error);
    process.exit(1);
  }
}

// Run the script
main();
