# Appwrite SDK (node-appwrite) - Comprehensive Guide

> **Skill Created:** January 2025
> **SDK Version:** node-appwrite v21.0.0 (Updated December 2025)
> **Purpose:** Complete reference for Appwrite server-side operations in Next.js with TypeScript
> **TypeScript:** Fully type-safe patterns with proper error handling

---

## Table of Contents

1. [TypeScript Best Practices](#typescript-best-practices) ⭐ **NEW**
2. [Overview & Project Context](#overview--project-context)
3. [Installation & Setup](#installation--setup)
4. [Authentication Methods](#authentication-methods)
5. [Database Operations](#database-operations)
6. [Query Helper Methods](#query-helper-methods)
7. [Bulk Operations](#bulk-operations)
8. [Authentication & Users](#authentication--users)
9. [File Storage](#file-storage)
10. [Realtime & Webhooks](#realtime--webhooks)
11. [Serverless Functions](#serverless-functions)
12. [Error Handling](#error-handling)
13. [Security Best Practices](#security-best-practices)
14. [Performance Optimization](#performance-optimization)
15. [Next.js Integration Patterns](#nextjs-integration-patterns)
16. [Common Patterns for Your Project](#common-patterns-for-your-project)
17. [Quick Reference](#quick-reference)

---

## TypeScript Best Practices

### Error Handling with AppwriteException

**Always use AppwriteException for proper error typing:**

```typescript
import { AppwriteException } from 'node-appwrite';

try {
  await operation();
} catch (error: unknown) {
  if (error instanceof AppwriteException) {
    console.log(error.code);    // HTTP status code (number)
    console.log(error.type);    // Error type (string) - e.g., 'user_invalid_credentials'
    console.log(error.message); // Error message (string)
    console.log(error.response); // Full response data
  } else if (error instanceof Error) {
    console.log(error.message);
  }
}
```

**Common Error Types:**
- `user_already_exists` - Email already registered
- `user_invalid_credentials` - Wrong email/password
- `document_not_found` - Document doesn't exist
- `general_rate_limit_exceeded` - Too many requests
- `general_unauthorized_scope` - Permission denied

### Document Type Safety

**Extend Models.Document for type-safe collection access:**

```typescript
import { Models } from 'node-appwrite';

// Define document interface
interface UserDocument extends Models.Document {
  full_name: string;
  email: string;
  role: 'facility_admin' | 'specialist' | 'patient';
  onboarding_completed: boolean;
  facility_id?: string;
}

// Use in database operations
const user = await databases.getDocument<UserDocument>(
  databaseId,
  usersCollectionId,
  userId
);

// TypeScript now knows all properties
console.log(user.full_name); // ✅ Type-safe
console.log(user.$id);       // ✅ From Models.Document
console.log(user.$createdAt); // ✅ From Models.Document
```

**All document types should extend `Models.Document` to get:**
- `$id` - Document ID
- `$createdAt` - Creation timestamp
- `$updatedAt` - Last update timestamp
- `$permissions` - Document permissions
- `$collectionId` - Collection ID
- `$databaseId` - Database ID

### Client Action Type Guards

**Always check clientAction results before using:**

```typescript
import { clientAction } from '@/appwrite/adminOrClient';
import { isAppwriteClient } from '@/lib/types/appwrite';

const result = await clientAction();

// Use type guard before accessing properties
if (!isAppwriteClient(result)) {
  return {
    success: false,
    message: result.message,
  };
}

// Now TypeScript knows result has account, databases, storage
const { account, databases } = result;
const user = await account.get();
```

**Why this is needed:**
- `clientAction()` returns `AppwriteClient | ErrorResult`
- Without the type guard, TypeScript can't know which one it is
- Type guard narrows the type and enables safe property access

### Server Action Pattern

**Standard pattern for all server actions:**

```typescript
"use server";

import { adminAction } from '@/appwrite/adminOrClient';
import { handleAppwriteError } from '@/lib/utils/error-handler';

export async function serverAction(data: InputType) {
  try {
    const { databases } = await adminAction();

    const result = await databases.createDocument(
      databaseId,
      collectionId,
      ID.unique(),
      data
    );

    return { success: true, data: result };
  } catch (error: unknown) {
    return handleAppwriteError(error);
  }
}
```

**Key points:**
- Always use `"use server"` directive
- Catch errors with `error: unknown` (not `error: any`)
- Use centralized `handleAppwriteError()` for consistent messages
- Return `{ success: boolean, message: string }` format
- Never throw errors to client (breaks React Server Components)

### Database Attribute Defaults

**Use `undefined` (not `null`) for nullable integer attributes:**

```typescript
// ❌ Wrong - TypeScript error
await databases.createIntegerAttribute(
  dbId, collId, "max_uses",
  false, // not required
  undefined, // min
  undefined, // max
  null, // ERROR: Type 'null' is not assignable to 'number | undefined'
  false // not array
);

// ✅ Correct
await databases.createIntegerAttribute(
  dbId, collId, "max_uses",
  false, // not required
  undefined, // min
  undefined, // max
  undefined, // For nullable fields, use undefined (not null)
  false // not array
);
```

### Centralized Error Handling

**Use the error handler utility for consistent Lithuanian messages:**

```typescript
import { handleAppwriteError } from '@/lib/utils/error-handler';
import { AppwriteException } from 'node-appwrite';

try {
  await operation();
} catch (error: unknown) {
  return handleAppwriteError(error);
}
```

**The error handler:**
- Checks `instanceof AppwriteException`
- Maps error types to Lithuanian messages
- Logs errors for debugging
- Returns consistent `{ success: false, message }` format

**For authentication-specific errors:**
```typescript
import { handleAuthError } from '@/lib/utils/error-handler';

try {
  await account.createEmailPasswordSession(email, password);
} catch (error: unknown) {
  return handleAuthError(error);
}
```

### Type-Safe Document Operations

```typescript
import type { FacilityDocument } from '@/lib/types/appwrite';

// Create with type safety
const facility = await databases.createDocument<FacilityDocument>(
  databaseId,
  facilitiesCollectionId,
  ID.unique(),
  {
    name: "Reabilitacijos centras",
    facility_type: "rehabilitation_center",
    admin_id: userId,
    code: generateCode(),
  }
);

// Update with type safety
await databases.updateDocument<FacilityDocument>(
  databaseId,
  facilitiesCollectionId,
  facilityId,
  {
    name: "Updated Name",
  }
);

// List with type safety
const { documents } = await databases.listDocuments<FacilityDocument>(
  databaseId,
  facilitiesCollectionId,
  [Query.equal('admin_id', userId)]
);
```

### Nullable Field Handling

**Use nullish coalescing for proper null/undefined checks:**

```typescript
// ❌ Wrong - only checks null
const reachedLimit = maxUses !== null && newUseCount >= maxUses;

// ✅ Correct - checks both null and undefined
const reachedLimit = maxUses != null && newUseCount >= maxUses;
```

### View Transitions API

**Avoid custom type declarations - use runtime checks:**

```typescript
// ❌ Wrong - conflicts with built-in DOM types
declare global {
  interface Document {
    startViewTransition?: (callback: () => void) => ViewTransition;
  }
}

// ✅ Correct - runtime check with type assertion
if ('startViewTransition' in document) {
  const transition = (document as any).startViewTransition(async () => {
    router.push(href);
  });
}

---

## Overview & Project Context

### What is Appwrite?

Appwrite is an **open-source Backend-as-a-Service (BaaS)** platform that provides:
- 🔐 **Authentication** - User accounts, sessions, OAuth
- 💾 **Database** - Document-based NoSQL with relationships
- 📁 **Storage** - File uploads with transformations
- ⚡ **Functions** - Serverless compute
- 🔔 **Realtime** - WebSocket subscriptions (client-side)
- 🪝 **Webhooks** - Server-to-server event notifications

### Your Project Status

**Installed Version:** `node-appwrite@20.3.0`

**Environment Variables:**
```bash
NEXT_PUBLIC_APPWRITE_PROJECT_ID="your_project_id"
NEXT_PUBLIC_APPWRITE_PROJECT_NAME="news_analytics"
NEXT_PUBLIC_APPWRITE_ENDPOINT="https://cloud.appwrite.io/v1"
APPWRITE_API_KEY="your_admin_api_key"
APPWRITE_DATABASE_ID="news_analytics_db"
ENCRYPTION_KEY="your_jwt_encryption_key"
```

**Current Architecture:**
```
appwrite/
├── adminOrClient.jsx      # Client initialization (admin vs user)
├── createUser.jsx         # Server action: user registration
├── loginUser.jsx          # Server action: authentication
├── logOut.jsx             # Server action: session cleanup
├── getSession.jsx         # Session retrieval helper
├── database.js            # Database helpers (existing)
├── articleOperations.js   # Article CRUD operations (new)
└── collections.js         # Schema definitions (new)
```

**Database Structure (8 Collections):**
1. `articles` - News article metadata
2. `article_analyses` - AI analysis results
3. `market_impacts` - Market-specific scores (-10 to +10)
4. `asset_mentions` - Specific stock/crypto tracking
5. `entities` - Key people/organizations (Fed, Powell, etc.)
6. `entity_mentions` - Entity-article relationships
7. `market_snapshots` - Time-series aggregated data
8. `user_preferences` - User settings and watchlists

### Key Features of Your Implementation

**✅ Secure Pattern:** Separate admin and client actions
**✅ Cookie-Based Sessions:** HTTP-only, secure, sameSite
**✅ JWT Encryption:** Using JOSE library for session tokens
**✅ Sanitized Errors:** Never expose internal details to users
**✅ Server Actions:** Next.js 14+ server-side operations

---

## Installation & Setup

### Install Package

```bash
npm install node-appwrite
```

**Requirements:**
- Node.js 14+ (18+ recommended)
- Appwrite Server 1.8.x or higher
- Next.js 13+ (for server actions)

### Basic Initialization

```javascript
import { Client, Account, Databases, Storage } from 'node-appwrite';

const client = new Client()
  .setEndpoint('https://cloud.appwrite.io/v1') // Your API Endpoint
  .setProject('PROJECT_ID')                    // Your project ID
  .setKey('API_KEY');                          // Your secret API Key

const account = new Account(client);
const databases = new Databases(client);
const storage = new Storage(client);
```

### Your Project Pattern (Best Practice ⭐)

**File:** `appwrite/adminOrClient.jsx`

```javascript
import { Client, Account, Databases } from "node-appwrite";
import { cookies } from "next/headers";

const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
const apiKey = process.env.APPWRITE_API_KEY;

/**
 * Admin Client - Full access with API key
 * Use for: User creation, system operations, bypassing permissions
 */
export async function adminAction() {
  const client = new Client()
    .setEndpoint(endpoint)
    .setProject(projectId)
    .setKey(apiKey);

  return {
    account: new Account(client),
    databases: new Databases(client)
  };
}

/**
 * User Client - Session-based, respects permissions
 * Use for: User-specific data, authenticated operations
 */
export async function clientAction() {
  const cookieStore = await cookies();
  const session = cookieStore.get("appSession");

  if (!session) {
    throw new Error("No session found");
  }

  const client = new Client()
    .setEndpoint(endpoint)
    .setProject(projectId)
    .setSession(session.value);

  return {
    account: new Account(client),
    databases: new Databases(client)
  };
}

/**
 * Convenience helper for admin database operations
 */
export function adminClient() {
  const client = new Client()
    .setEndpoint(endpoint)
    .setProject(projectId)
    .setKey(apiKey);

  return {
    databases: new Databases(client),
    account: new Account(client)
  };
}
```

**Why This Pattern? 🔒**
- **Security:** Fresh client per request, no shared state
- **Flexibility:** Easy to switch between admin and user context
- **Clean:** Simple to use throughout your application
- **Safe:** Prevents session leakage between requests

---

## Authentication Methods

### API Key Authentication (Admin)

```javascript
const client = new Client()
  .setEndpoint('https://cloud.appwrite.io/v1')
  .setProject('PROJECT_ID')
  .setKey('API_KEY');  // Admin access - bypasses all permissions
```

**When to Use:**
- ✅ User creation (users can't create themselves)
- ✅ System operations (cleanup, migrations)
- ✅ Admin dashboards
- ✅ Server-side batch operations

**⚠️ Never:**
- ❌ Send API key to client
- ❌ Commit to version control
- ❌ Share between requests (create fresh client each time)

### Session Authentication (User)

```javascript
const client = new Client()
  .setEndpoint('https://cloud.appwrite.io/v1')
  .setProject('PROJECT_ID')
  .setSession(sessionSecret);  // User-scoped access
```

**When to Use:**
- ✅ User-specific data operations
- ✅ Profile management
- ✅ User preferences
- ✅ Authenticated API routes

### JWT Authentication

```javascript
const client = new Client()
  .setEndpoint('https://cloud.appwrite.io/v1')
  .setProject('PROJECT_ID')
  .setJWT(jwtToken);  // Custom token authentication
```

**When to Use:**
- ✅ Third-party integrations
- ✅ Custom authentication flows
- ✅ Mobile app authentication

---

## Database Operations

### Creating Documents

```javascript
import { ID } from 'node-appwrite';

const document = await databases.createDocument(
  'DATABASE_ID',
  'COLLECTION_ID',
  ID.unique(),  // Auto-generate unique ID
  {
    // Document data
    title: 'Breaking News',
    score: 7.5,
    publishedAt: new Date().toISOString(),
    tags: ['crypto', 'bitcoin']
  },
  [
    // Permissions (optional)
    Permission.read(Role.any()),
    Permission.write(Role.user('USER_ID'))
  ]
);

console.log(document.$id);  // Document ID
console.log(document.$createdAt);  // Auto-generated timestamp
```

**Custom IDs:**
```javascript
// Use specific ID instead of auto-generated
await databases.createDocument(
  'DATABASE_ID',
  'COLLECTION_ID',
  'custom-article-id-123',  // Your custom ID
  { ... }
);
```

**Document Structure:**
```javascript
{
  $id: 'unique-doc-id',
  $collectionId: 'collection-id',
  $databaseId: 'database-id',
  $createdAt: '2025-01-15T10:30:00.000+00:00',
  $updatedAt: '2025-01-15T10:30:00.000+00:00',
  $permissions: ['read("any")'],
  // Your custom attributes
  title: 'Article Title',
  score: 7.5
}
```

### Reading Documents

**Get Single Document:**
```javascript
const document = await databases.getDocument(
  'DATABASE_ID',
  'COLLECTION_ID',
  'DOCUMENT_ID'
);
```

**List Documents:**
```javascript
const documents = await databases.listDocuments(
  'DATABASE_ID',
  'COLLECTION_ID',
  [
    // Optional queries
    Query.equal('status', 'published'),
    Query.limit(25),
    Query.offset(0)
  ]
);

console.log(documents.total);      // Total count
console.log(documents.documents);  // Array of documents
```

### Updating Documents

```javascript
const updated = await databases.updateDocument(
  'DATABASE_ID',
  'COLLECTION_ID',
  'DOCUMENT_ID',
  {
    // Only fields you want to update
    status: 'archived',
    updatedAt: new Date().toISOString()
  }
);
```

**Partial Updates:**
- Only specified fields are updated
- Other fields remain unchanged
- `$updatedAt` automatically updated by Appwrite

### Deleting Documents

```javascript
await databases.deleteDocument(
  'DATABASE_ID',
  'COLLECTION_ID',
  'DOCUMENT_ID'
);
```

**Cascade Deletes:**
- Configure in collection relationships
- Can automatically delete related documents
- Or set to `setNull` to preserve but unlink

---

## Query Helper Methods

### Import Query Class

```javascript
import { Query } from 'node-appwrite';
```

### Equality Queries

```javascript
// Equal
Query.equal('status', 'active')
Query.equal('tags', ['crypto', 'bitcoin'])  // Array contains any

// Not equal
Query.notEqual('type', 'draft')
Query.notEqual('tags', 'spam')

// Is null / Is not null
Query.isNull('deletedAt')
Query.isNotNull('publishedAt')
```

### Comparison Queries

```javascript
// Greater than
Query.greaterThan('score', 5)
Query.greaterThan('publishedAt', '2025-01-01T00:00:00.000Z')

// Greater than or equal
Query.greaterThanEqual('score', 5)

// Less than
Query.lessThan('price', 100)

// Less than or equal
Query.lessThanEqual('views', 1000)

// Between (inclusive)
Query.between('score', 5, 10)
Query.between('publishedAt', '2025-01-01', '2025-01-31')
```

### Text Search Queries

```javascript
// Contains (case-sensitive)
Query.contains('title', 'Bitcoin')

// Starts with
Query.startsWith('name', 'John')

// Ends with
Query.endsWith('email', '@gmail.com')

// Full-text search (requires fulltext index)
Query.search('content', 'inflation rates economy')
```

### Array Queries

```javascript
// Contains (array attribute contains value)
Query.contains('tags', 'crypto')

// Contains OR (any of these values)
Query.or([
  Query.equal('market', 'crypto'),
  Query.equal('market', 'stocks')
])
```

### Logical Operators

```javascript
// OR - Match any condition
Query.or([
  Query.equal('status', 'published'),
  Query.equal('status', 'featured')
])

// AND - Combine multiple queries (default behavior)
[
  Query.equal('market', 'crypto'),
  Query.greaterThan('score', 5)
]
// Both conditions must match
```

### Sorting

```javascript
// Ascending order
Query.orderAsc('title')
Query.orderAsc('publishedAt')

// Descending order ⭐ Most common
Query.orderDesc('createdAt')
Query.orderDesc('score')

// Multiple sort fields
[
  Query.orderDesc('score'),
  Query.orderAsc('title')
]
```

### Pagination

**Offset Pagination (Simple):**
```javascript
// Page 1
Query.limit(25)
Query.offset(0)

// Page 2
Query.limit(25)
Query.offset(25)

// Page 3
Query.limit(25)
Query.offset(50)
```

**Cursor Pagination (Better Performance):**
```javascript
// First page
const page1 = await databases.listDocuments(
  DATABASE_ID,
  COLLECTION_ID,
  [
    Query.orderDesc('createdAt'),
    Query.limit(25)
  ]
);

// Next page
const page2 = await databases.listDocuments(
  DATABASE_ID,
  COLLECTION_ID,
  [
    Query.orderDesc('createdAt'),
    Query.cursorAfter(page1.documents[page1.documents.length - 1].$id),
    Query.limit(25)
  ]
);

// Previous page
const prevPage = await databases.listDocuments(
  DATABASE_ID,
  COLLECTION_ID,
  [
    Query.orderDesc('createdAt'),
    Query.cursorBefore(currentFirstDocumentId),
    Query.limit(25)
  ]
);
```

**Cursor vs Offset:**
| Feature | Offset | Cursor |
|---------|--------|--------|
| Performance | Slower on large datasets | Fast, consistent |
| Use case | Small datasets | Large datasets |
| Complexity | Simple | Slightly more complex |
| Recommendation | < 1000 docs | > 1000 docs ⭐ |

### Select Specific Attributes

```javascript
// Only return specific fields
Query.select(['title', 'score', 'publishedAt'])

// Reduces bandwidth and improves performance
```

### Complex Query Example (Your Project)

```javascript
// Get top crypto articles from last 24 hours
const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

const topArticles = await databases.listDocuments(
  DATABASE_ID,
  COLLECTIONS.MARKET_IMPACTS,
  [
    Query.equal('marketType', 'crypto'),
    Query.greaterThan('createdAt', twentyFourHoursAgo),
    Query.greaterThanEqual('impactScore', 5),
    Query.orderDesc('impactScore'),
    Query.limit(10)
  ]
);
```

---

## Bulk Operations

**⚠️ Server-Side Only** - Not available in client SDK

### Create Multiple Documents

```javascript
import { ID } from 'node-appwrite';

const result = await databases.createDocuments(
  DATABASE_ID,
  COLLECTION_ID,
  [
    { $id: ID.unique(), title: 'Article 1', score: 5 },
    { $id: ID.unique(), title: 'Article 2', score: 7 },
    { $id: ID.unique(), title: 'Article 3', score: 9 }
  ]
);

console.log(result);  // Array of created documents
```

**Features:**
- ⚡ Much faster than individual creates
- 🔒 Atomic operation (all succeed or all fail)
- 📊 Can create up to 100 documents at once

### Update Multiple Documents

```javascript
const result = await databases.updateDocuments(
  DATABASE_ID,
  COLLECTION_ID,
  [
    { $id: 'doc-1', status: 'archived' },
    { $id: 'doc-2', status: 'archived' },
    { $id: 'doc-3', status: 'archived' }
  ]
);
```

### Upsert Documents (Create or Update)

```javascript
const result = await databases.upsertDocuments(
  DATABASE_ID,
  COLLECTION_ID,
  [
    { $id: 'fixed-id-1', name: 'Item 1', count: 10 },
    { $id: 'fixed-id-2', name: 'Item 2', count: 20 }
  ]
);
```

**Use Cases:**
- Syncing data from external APIs
- Batch imports
- Data migrations
- Updating analytics snapshots

**Example for Your Project:**
```javascript
// Batch save market snapshots for multiple markets
export async function saveMarketSnapshots(snapshots) {
  const databases = adminClient().databases;

  const documents = snapshots.map(snapshot => ({
    $id: ID.unique(),
    timestamp: snapshot.timestamp,
    cryptoAvg: snapshot.crypto.average,
    cryptoCount: snapshot.crypto.count,
    stocksAvg: snapshot.stocks.average,
    stocksCount: snapshot.stocks.count,
    forexAvg: snapshot.forex.average,
    forexCount: snapshot.forex.count,
    commoditiesAvg: snapshot.commodities.average,
    commoditiesCount: snapshot.commodities.count
  }));

  return await databases.createDocuments(
    DATABASE_ID,
    COLLECTIONS.MARKET_SNAPSHOTS,
    documents
  );
}
```

---

## Authentication & Users

### Creating User Accounts

**Admin Method (Bypasses Permissions):**
```javascript
import { ID } from 'node-appwrite';

const { account } = await adminAction();

const user = await account.create(
  ID.unique(),
  'user@example.com',
  'securePassword123',
  'Display Name'  // Optional
);

console.log(user.$id);  // User ID
```

**Create with Session Immediately:**
```javascript
const { account } = await adminAction();

// 1. Create user
await account.create(
  ID.unique(),
  'user@example.com',
  'password123',
  'John Doe'
);

// 2. Create session
const session = await account.createEmailPasswordSession(
  'user@example.com',
  'password123'
);

// 3. Store session cookie
const cookieStore = await cookies();
cookieStore.set('appSession', session.secret, {
  path: '/',
  httpOnly: true,
  sameSite: 'strict',
  secure: process.env.NODE_ENV === 'production',
  expires: new Date(session.expire)
});
```

### Your Project Pattern (createUser.jsx)

```javascript
"use server";

import { ID } from "node-appwrite";
import { adminAction } from "./adminOrClient";
import { cookies } from "next/headers";
import { encrypt } from "@/utils/encrypt";

export async function createUser(data) {
  const { email, password, name } = data;

  // Validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { success: false, message: "Invalid email format" };
  }

  if (password.length < 8) {
    return { success: false, message: "Password must be at least 8 characters" };
  }

  try {
    const { account } = await adminAction();

    // Create user
    await account.create(ID.unique(), email, password, name);

    // Create session
    const session = await account.createEmailPasswordSession(email, password);

    // Encrypt session
    const encryptedSession = await encrypt(session.secret);

    // Set cookies
    const cookieStore = await cookies();

    cookieStore.set("appSession", session.secret, {
      path: "/",
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === 'production',
      expires: new Date(session.expire)
    });

    cookieStore.set("localSession", encryptedSession, {
      path: "/",
      httpOnly: false,  // Accessible to client
      sameSite: "strict",
      secure: process.env.NODE_ENV === 'production',
      expires: new Date(session.expire)
    });

    return {
      success: true,
      userId: session.userId,
      message: "Account created successfully"
    };

  } catch (error) {
    // Sanitize errors
    if (error.code === 409) {
      return { success: false, message: "Email already registered" };
    }
    return { success: false, message: "Failed to create account" };
  }
}
```

### Login (Email/Password)

```javascript
const { account } = await adminAction();

const session = await account.createEmailPasswordSession(
  'user@example.com',
  'password123'
);

// Session object
{
  $id: 'session-id',
  $createdAt: '2025-01-15T10:00:00.000+00:00',
  userId: 'user-id',
  expire: '2025-01-22T10:00:00.000+00:00',
  secret: 'session-secret-token',
  provider: 'email',
  current: true
}
```

### Get Current User

```javascript
const { account } = await clientAction();  // Uses session cookie

const user = await account.get();

// User object
{
  $id: 'user-id',
  email: 'user@example.com',
  name: 'John Doe',
  registration: '2025-01-15T10:00:00.000+00:00',
  status: true,
  emailVerification: false,
  phoneVerification: false
}
```

### Logout

```javascript
const { account } = await clientAction();

// Delete current session
await account.deleteSession('current');

// Or delete all sessions
await account.deleteSessions();

// Clear cookies
const cookieStore = await cookies();
cookieStore.delete('appSession');
cookieStore.delete('localSession');
```

### Email Verification

```javascript
// Send verification email
await account.createVerification('https://example.com/verify');

// User clicks link with userId and secret in URL
// Verify email
await account.updateVerification(userId, secret);
```

### Password Reset

```javascript
// Request password reset
await account.createRecovery(
  'user@example.com',
  'https://example.com/reset-password'
);

// User clicks link, gets userId and secret
// Complete password reset
await account.updateRecovery(
  userId,
  secret,
  'newPassword123'
);
```

### OAuth Providers

```javascript
// Initiate OAuth flow
const redirectUrl = await account.createOAuth2Token(
  'google',  // Provider: google, facebook, github, etc.
  'https://example.com/oauth/callback',
  'https://example.com/oauth/failure'
);

// Redirect user to redirectUrl
// User authorizes, returns to callback with userId and secret
```

**Supported Providers:**
- Google, Facebook, GitHub, Microsoft, Apple
- Discord, Twitch, Spotify, LinkedIn
- 30+ providers total

### Teams

```javascript
import { Teams, ID } from 'node-appwrite';

const teams = new Teams(client);

// Create team
const team = await teams.create(
  ID.unique(),
  'Development Team'
);

// Add member
await teams.createMembership(
  team.$id,
  ['admin', 'developer'],  // Roles
  'member@example.com'
);
```

### Permissions & Roles

```javascript
import { Permission, Role } from 'node-appwrite';

// Public read access
Permission.read(Role.any())

// All authenticated users
Permission.read(Role.users())

// Specific user
Permission.write(Role.user('USER_ID'))

// Team members
Permission.read(Role.team('TEAM_ID'))

// Team with specific roles
Permission.write(Role.team('TEAM_ID', ['admin', 'moderator']))

// Multiple permissions
[
  Permission.read(Role.any()),
  Permission.write(Role.user('USER_ID')),
  Permission.delete(Role.team('TEAM_ID', ['admin']))
]
```

---

## File Storage

### Uploading Files (Server-Side)

```javascript
import { Storage, ID, InputFile } from 'node-appwrite';

const storage = new Storage(client);

// From file path
const file = InputFile.fromPath(
  '/path/to/file.jpg',
  'filename.jpg'
);

const result = await storage.createFile(
  'BUCKET_ID',
  ID.unique(),
  file,
  [Permission.read(Role.any())]  // Optional permissions
);

console.log(result.$id);  // File ID
```

**From Buffer:**
```javascript
const file = InputFile.fromBuffer(
  buffer,
  'filename.jpg'
);
```

**From Stream:**
```javascript
const file = InputFile.fromStream(
  stream,
  'filename.jpg',
  size
);
```

### Uploading Files (Client-Side - Browser)

```javascript
// In browser with client SDK
const file = document.getElementById('fileInput').files[0];

const result = await storage.createFile(
  'BUCKET_ID',
  ID.unique(),
  file
);
```

### Downloading Files

```javascript
const result = await storage.getFileDownload('BUCKET_ID', 'FILE_ID');
// Returns Buffer that can be written to disk or sent as response
```

### File Preview (Images)

```javascript
const url = storage.getFilePreview(
  'BUCKET_ID',
  'FILE_ID',
  400,      // width
  300,      // height
  'center', // gravity (top, bottom, center, etc.)
  80,       // quality (0-100)
  0,        // borderWidth
  '',       // borderColor
  0,        // borderRadius
  0,        // opacity (0-100)
  0,        // rotation (-360 to 360)
  '',       // background color
  'jpg'     // output format (jpg, png, gif, webp)
);

// Use URL in <img> tag
<img src={url} alt="Preview" />
```

**Common Transformations:**
```javascript
// Square thumbnail
storage.getFilePreview(bucketId, fileId, 200, 200, 'center')

// Circular profile image
storage.getFilePreview(bucketId, fileId, 100, 100, 'center', 100, 0, '', 50)

// Banner with specific dimensions
storage.getFilePreview(bucketId, fileId, 1200, 400, 'center')
```

### File View (Direct Link)

```javascript
const url = storage.getFileView('BUCKET_ID', 'FILE_ID');
// Returns full-size file, no transformations
```

### Delete File

```javascript
await storage.deleteFile('BUCKET_ID', 'FILE_ID');
```

### List Files

```javascript
const files = await storage.listFiles(
  'BUCKET_ID',
  [
    Query.equal('mimeType', 'image/jpeg'),
    Query.greaterThan('sizeOriginal', 1000000), // > 1MB
    Query.limit(25)
  ]
);
```

---

## Realtime & Webhooks

### Realtime (Client-Side Only)

**⚠️ Server SDK does NOT support realtime subscriptions**

**Client SDK Example:**
```javascript
// In browser with client SDK (appwrite)
import { Client } from 'appwrite';

const client = new Client()
  .setEndpoint('https://cloud.appwrite.io/v1')
  .setProject('PROJECT_ID');

// Subscribe to all document changes in a collection
client.subscribe(
  'databases.DATABASE_ID.collections.COLLECTION_ID.documents',
  response => {
    console.log('Document changed:', response);
  }
);

// Subscribe to specific document
client.subscribe(
  'databases.DATABASE_ID.collections.COLLECTION_ID.documents.DOCUMENT_ID',
  response => {
    console.log('Specific document updated:', response);
  }
);
```

**Events:**
- `*.create` - Document created
- `*.update` - Document updated
- `*.delete` - Document deleted

### Webhooks (Server-Side Alternative)

**Setup in Appwrite Console:**
1. Go to Project Settings → Webhooks
2. Create new webhook
3. Enter your endpoint URL
4. Select events to monitor

**Webhook Payload:**
```javascript
{
  event: 'databases.DATABASE_ID.collections.COLLECTION_ID.documents.*.create',
  timestamp: 1642000000,
  payload: {
    $id: 'document-id',
    $collectionId: 'collection-id',
    // ... document data
  }
}
```

**Handling Webhooks in Next.js:**
```javascript
// app/api/webhooks/appwrite/route.js
export async function POST(request) {
  const payload = await request.json();

  // Verify webhook signature
  const signature = request.headers.get('x-appwrite-webhook-signature');

  // Process event
  if (payload.event.includes('create')) {
    // Handle document creation
    console.log('New document:', payload.payload);
  }

  return Response.json({ success: true });
}
```

---

## Serverless Functions

### Triggering Functions

```javascript
import { Functions, ID } from 'node-appwrite';

const functions = new Functions(client);

const execution = await functions.createExecution(
  'FUNCTION_ID',
  JSON.stringify({ article: articleData }),  // Payload
  false  // async: false = wait for response
);

console.log(execution.status);   // 'completed', 'failed', etc.
console.log(execution.response); // Function return value
```

**Async Execution:**
```javascript
const execution = await functions.createExecution(
  'FUNCTION_ID',
  JSON.stringify({ data: 'payload' }),
  true  // async: true = don't wait
);

// Check status later
const status = await functions.getExecution('FUNCTION_ID', execution.$id);
```

### Environment Variables in Functions

**Dynamic API Keys (Recommended):**
```javascript
// Automatically generated per execution
const apiKey = process.env.APPWRITE_FUNCTION_API_KEY;

// Create admin client in function
const client = new Client()
  .setEndpoint(process.env.APPWRITE_FUNCTION_API_ENDPOINT)
  .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
  .setKey(apiKey);
```

**Custom Variables:**
- Set in Appwrite Console → Functions → Settings → Variables
- Accessed via `process.env.VAR_NAME`

---

## Error Handling

### AppwriteException Class

```javascript
import { AppwriteException } from 'node-appwrite';

try {
  const user = await account.create(...);
} catch (error) {
  if (error instanceof AppwriteException) {
    console.log(error.code);      // HTTP status code (400, 404, 409, etc.)
    console.log(error.type);      // Error type identifier
    console.log(error.message);   // Human-readable message
    console.log(error.response);  // Full API response
  }
}
```

### Common Error Types

```javascript
try {
  await account.create(...);
} catch (error) {
  if (error instanceof AppwriteException) {
    switch (error.type) {
      case 'user_already_exists':
        return { success: false, message: 'Email already registered' };

      case 'user_invalid_credentials':
        return { success: false, message: 'Invalid email or password' };

      case 'user_not_found':
        return { success: false, message: 'User not found' };

      case 'document_not_found':
        return { success: false, message: 'Document not found' };

      case 'collection_not_found':
        return { success: false, message: 'Collection not found' };

      case 'general_rate_limit_exceeded':
        return { success: false, message: 'Too many requests, please try again later' };

      default:
        return { success: false, message: 'An error occurred' };
    }
  }
}
```

### Error Handling Best Practices

**1. Always Check Error Type:**
```javascript
// ❌ BAD - Checking message
if (error.message.includes('already exists')) { }

// ✅ GOOD - Checking type
if (error.type === 'user_already_exists') { }
```

**2. Sanitize Errors for Users:**
```javascript
// ❌ BAD - Exposing internal details
catch (error) {
  return { error: error.message };  // Might expose sensitive info
}

// ✅ GOOD - Sanitized messages
catch (error) {
  console.error('[Server Error]:', error);  // Log full error
  return { error: 'Failed to create account. Please try again.' };
}
```

**3. Log Full Errors Server-Side:**
```javascript
try {
  await operation();
} catch (error) {
  // Detailed logging
  console.error('Operation failed:', {
    type: error.type,
    code: error.code,
    message: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString()
  });

  // Simple response to client
  return { success: false, message: 'Operation failed' };
}
```

---

## Security Best Practices

### 1. Never Share Client Instances

```javascript
// ❌ BAD - Security vulnerability
const client = new Client().setKey(API_KEY);

export function getAccount() {
  return new Account(client);  // Shared state!
}

// ✅ GOOD - Fresh instance per request
export async function adminAction() {
  const client = new Client()
    .setEndpoint(...)
    .setProject(...)
    .setKey(...);

  return { account: new Account(client) };
}
```

**Why?**
- Prevents session leakage between requests
- Avoids race conditions
- Better memory management

### 2. Cookie Security

```javascript
const cookieStore = await cookies();

cookieStore.set('appSession', session.secret, {
  httpOnly: true,      // Prevents XSS (JavaScript can't access)
  secure: true,        // HTTPS only in production
  sameSite: 'strict',  // CSRF protection
  path: '/',
  expires: new Date(session.expire)
});
```

**Cookie Flags Explained:**
- **httpOnly**: Prevents client-side JavaScript from reading cookie
- **secure**: Cookie only sent over HTTPS
- **sameSite**: Prevents cross-site request forgery (CSRF)
  - `strict`: Never sent cross-site
  - `lax`: Sent on top-level navigation
  - `none`: Always sent (requires `secure: true`)

### 3. API Key Management

```javascript
// ❌ BAD - Hardcoded
const client = new Client().setKey('d1efb...project-key');

// ✅ GOOD - Environment variable
const client = new Client().setKey(process.env.APPWRITE_API_KEY);
```

**Best Practices:**
- Store in `.env` (never commit)
- Use different keys for dev/staging/production
- Rotate keys periodically (every 3-6 months)
- Limit scopes to minimum required
- Consider dynamic keys for functions

### 4. Input Validation

```javascript
export async function createArticle(data) {
  // Validate before database operation
  if (!data.title || data.title.length > 500) {
    return { success: false, message: 'Invalid title' };
  }

  if (data.score < -10 || data.score > 10) {
    return { success: false, message: 'Score must be between -10 and 10' };
  }

  // Sanitize HTML if needed
  const sanitizedContent = sanitizeHtml(data.content);

  // Proceed with creation
  await databases.createDocument(...);
}
```

### 5. Permission Design

```javascript
// ❌ BAD - Too permissive
Permission.write(Role.any())  // Anyone can modify!

// ✅ GOOD - Specific permissions
[
  Permission.read(Role.any()),           // Public read
  Permission.write(Role.user(userId)),   // Only owner can write
  Permission.delete(Role.team(teamId, ['admin']))  // Only admins can delete
]
```

### 6. Rate Limiting Awareness

**Admin API Keys:**
- ✅ Bypass rate limits
- Use for batch operations
- Server-side only

**User Sessions:**
- ⚠️ Subject to rate limits
- ~60 requests per minute per IP
- Implement exponential backoff

```javascript
async function retryableOperation(operation, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      if (error.type === 'general_rate_limit_exceeded') {
        if (i === maxRetries - 1) throw error;
        await new Promise(r => setTimeout(r, 2 ** i * 1000));
      } else {
        throw error;
      }
    }
  }
}
```

---

## Performance Optimization

### 1. Database Query Optimization

**Create Indexes:**
```javascript
// In Appwrite Console or via API
// Index on frequently queried fields
{
  key: 'idx_market_score',
  type: 'key',
  attributes: ['marketType', 'impactScore'],
  orders: ['ASC', 'DESC']
}
```

**Query Best Practices:**
```javascript
// ❌ BAD - No indexes, no limit
const articles = await databases.listDocuments(
  DATABASE_ID,
  COLLECTION_ID
);

// ✅ GOOD - Indexed queries, pagination
const articles = await databases.listDocuments(
  DATABASE_ID,
  COLLECTION_ID,
  [
    Query.equal('marketType', 'crypto'),  // Indexed
    Query.greaterThan('createdAt', cutoff),  // Indexed
    Query.orderDesc('impactScore'),  // Indexed
    Query.limit(25)  // Pagination
  ]
);
```

**Select Only Needed Fields:**
```javascript
// ❌ BAD - Fetch everything
const articles = await databases.listDocuments(...);

// ✅ GOOD - Only needed fields
const articles = await databases.listDocuments(
  DATABASE_ID,
  COLLECTION_ID,
  [
    Query.select(['$id', 'title', 'score', 'createdAt'])
  ]
);
```

### 2. Cursor vs Offset Pagination

**Use Cursor for Large Datasets:**
```javascript
// Offset slows down on later pages
// Page 1000: Must skip 25,000 records first

// ✅ Cursor is consistent speed
const page = await databases.listDocuments(
  DATABASE_ID,
  COLLECTION_ID,
  [
    Query.cursorAfter(lastDocumentId),
    Query.limit(25)
  ]
);
```

### 3. Caching Strategies

**In-Memory Cache:**
```javascript
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function getCachedArticle(articleId) {
  const cached = cache.get(articleId);

  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  const article = await databases.getDocument(
    DATABASE_ID,
    COLLECTION_ID,
    articleId
  );

  cache.set(articleId, { data: article, timestamp: Date.now() });
  return article;
}
```

**Market Snapshot Aggregation:**
```javascript
// Instead of querying individual documents repeatedly
// Create periodic snapshots for time-series data

export async function createMarketSnapshot() {
  const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();

  const impacts = await databases.listDocuments(
    DATABASE_ID,
    COLLECTIONS.MARKET_IMPACTS,
    [Query.greaterThan('createdAt', fifteenMinutesAgo)]
  );

  // Aggregate by market
  const aggregated = aggregateByMarket(impacts.documents);

  // Save snapshot
  return await databases.createDocument(
    DATABASE_ID,
    COLLECTIONS.MARKET_SNAPSHOTS,
    ID.unique(),
    { timestamp: new Date().toISOString(), ...aggregated }
  );
}
```

### 4. Bulk Operations

```javascript
// ❌ BAD - 100 individual creates
for (const article of articles) {
  await databases.createDocument(...);
}

// ✅ GOOD - Single bulk operation
await databases.createDocuments(
  DATABASE_ID,
  COLLECTION_ID,
  articles.map(a => ({ $id: ID.unique(), ...a }))
);
```

### 5. Parallel Operations

```javascript
// ❌ BAD - Sequential
const article = await databases.getDocument(...);
const analysis = await databases.getDocument(...);
const impacts = await databases.listDocuments(...);

// ✅ GOOD - Parallel
const [article, analysis, impacts] = await Promise.all([
  databases.getDocument(...),
  databases.getDocument(...),
  databases.listDocuments(...)
]);
```

---

## Next.js Integration Patterns

### Server Actions (Your Current Pattern ⭐)

**File Structure:**
```
appwrite/
├── adminOrClient.jsx       # Client initialization
├── createUser.jsx          # Server action
├── loginUser.jsx           # Server action
├── logOut.jsx              # Server action
├── getSession.jsx          # Helper
└── articleOperations.js    # Database operations
```

**Server Action Example:**
```javascript
"use server";

import { adminAction } from "./adminOrClient";
import { ID } from "node-appwrite";

export async function saveArticle(articleData) {
  try {
    const { databases } = await adminAction();

    const article = await databases.createDocument(
      process.env.APPWRITE_DATABASE_ID,
      'articles',
      ID.unique(),
      {
        title: articleData.title,
        content: articleData.content,
        score: articleData.score,
        createdAt: new Date().toISOString()
      }
    );

    return { success: true, articleId: article.$id };
  } catch (error) {
    console.error('Failed to save article:', error);
    return { success: false, message: 'Failed to save article' };
  }
}
```

**Usage in Component:**
```javascript
"use client";

import { saveArticle } from "@/appwrite/articleOperations";

export default function ArticleForm() {
  async function handleSubmit(formData) {
    const result = await saveArticle({
      title: formData.get('title'),
      content: formData.get('content'),
      score: Number(formData.get('score'))
    });

    if (result.success) {
      console.log('Article saved:', result.articleId);
    }
  }

  return (
    <form action={handleSubmit}>
      {/* form fields */}
    </form>
  );
}
```

### API Routes Pattern

```javascript
// app/api/articles/route.js
import { adminClient } from '@/appwrite/adminOrClient';
import { Query } from 'node-appwrite';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const market = searchParams.get('market') || 'crypto';
    const limit = Number(searchParams.get('limit')) || 20;

    const { databases } = adminClient();

    const articles = await databases.listDocuments(
      process.env.APPWRITE_DATABASE_ID,
      'articles',
      [
        Query.equal('marketType', market),
        Query.orderDesc('createdAt'),
        Query.limit(limit)
      ]
    );

    return Response.json({
      success: true,
      articles: articles.documents,
      total: articles.total
    });

  } catch (error) {
    console.error('API Error:', error);
    return Response.json(
      { success: false, error: 'Failed to fetch articles' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const data = await request.json();

    // Validate
    if (!data.title || !data.content) {
      return Response.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const { databases } = adminClient();

    const article = await databases.createDocument(
      process.env.APPWRITE_DATABASE_ID,
      'articles',
      ID.unique(),
      data
    );

    return Response.json({ success: true, article });

  } catch (error) {
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
```

### Protected Routes

```javascript
// middleware.js
import { NextResponse } from 'next/server';

export async function middleware(request) {
  const session = request.cookies.get('appSession');

  if (!session) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/profile/:path*']
};
```

### Session Validation

```javascript
// app/dashboard/[id]/page.jsx
import { clientAction } from '@/appwrite/adminOrClient';
import { redirect } from 'next/navigation';

export default async function DashboardPage({ params }) {
  let user;

  try {
    const { account } = await clientAction();
    user = await account.get();
  } catch (error) {
    redirect('/login');
  }

  // Verify user matches URL parameter
  if (user.$id !== params.id) {
    redirect('/unauthorized');
  }

  return <Dashboard user={user} />;
}
```

---

## Common Patterns for Your Project

### Pattern 1: Get or Create Article

```javascript
import { ID, Query } from "node-appwrite";
import { adminClient } from "./adminOrClient";

export async function getOrCreateArticle(articleData) {
  const databases = adminClient().databases;
  const DATABASE_ID = process.env.APPWRITE_DATABASE_ID;

  try {
    // Try to find existing by URL
    const existing = await databases.listDocuments(
      DATABASE_ID,
      'articles',
      [Query.equal('url', articleData.url), Query.limit(1)]
    );

    if (existing.documents.length > 0) {
      return existing.documents[0];
    }

    // Create new article
    return await databases.createDocument(
      DATABASE_ID,
      'articles',
      ID.unique(),
      {
        articleId: articleData.article_id || ID.unique(),
        title: articleData.title,
        description: articleData.description,
        url: articleData.url,
        source: articleData.source_id,
        publishedAt: articleData.pubDate,
        fetchedAt: new Date().toISOString()
      }
    );

  } catch (error) {
    console.error('Error in getOrCreateArticle:', error);
    throw error;
  }
}
```

### Pattern 2: Save Complete Analysis (Multi-Collection)

```javascript
export async function saveCompleteAnalysis(article, analysisResult) {
  const databases = adminClient().databases;
  const DATABASE_ID = process.env.APPWRITE_DATABASE_ID;

  try {
    // 1. Get or create article
    const articleDoc = await getOrCreateArticle(article);

    // 2. Save analysis
    const analysis = await databases.createDocument(
      DATABASE_ID,
      'article_analyses',
      ID.unique(),
      {
        articleId: articleDoc.articleId,
        overallSentiment: analysisResult.sentiment?.overall || 'neutral',
        confidenceLevel: analysisResult.marketImpact.crypto.confidence,
        summary: JSON.stringify(analysisResult),
        analyzedAt: new Date().toISOString()
      }
    );

    // 3. Save market impacts in parallel
    const marketImpacts = ['crypto', 'stocks', 'forex', 'commodities'].map(market => {
      const impact = analysisResult.marketImpact[market];
      return databases.createDocument(
        DATABASE_ID,
        'market_impacts',
        ID.unique(),
        {
          articleId: articleDoc.articleId,
          marketType: market,
          impactScore: impact.score,
          confidence: impact.confidence,
          reasoning: impact.reasoning,
          createdAt: new Date().toISOString()
        }
      );
    });

    await Promise.all(marketImpacts);

    return {
      success: true,
      articleId: articleDoc.$id,
      analysisId: analysis.$id
    };

  } catch (error) {
    console.error('Error saving complete analysis:', error);
    return { success: false, error: error.message };
  }
}
```

### Pattern 3: Get Top Impactful Articles

```javascript
export async function getTopImpactfulArticles(options = {}) {
  const { limit = 10, minScore = 5, timeRange = null } = options;
  const databases = adminClient().databases;
  const DATABASE_ID = process.env.APPWRITE_DATABASE_ID;

  try {
    const queries = [
      Query.greaterThanEqual('impactScore', minScore),
      Query.orderDesc('impactScore'),
      Query.limit(limit * 4)  // Get more to deduplicate
    ];

    if (timeRange) {
      queries.push(Query.greaterThan('createdAt', timeRange));
    }

    const impacts = await databases.listDocuments(
      DATABASE_ID,
      'market_impacts',
      queries
    );

    // Get unique articles by highest impact
    const articleMap = new Map();
    for (const impact of impacts.documents) {
      if (!articleMap.has(impact.articleId)) {
        articleMap.set(impact.articleId, impact);
      } else {
        const existing = articleMap.get(impact.articleId);
        if (Math.abs(impact.impactScore) > Math.abs(existing.impactScore)) {
          articleMap.set(impact.articleId, impact);
        }
      }
    }

    const topImpacts = Array.from(articleMap.values())
      .sort((a, b) => Math.abs(b.impactScore) - Math.abs(a.impactScore))
      .slice(0, limit);

    // Fetch article details in parallel
    const articles = await Promise.all(
      topImpacts.map(impact =>
        databases.listDocuments(
          DATABASE_ID,
          'articles',
          [Query.equal('articleId', impact.articleId), Query.limit(1)]
        ).then(res => res.documents[0])
      )
    );

    return {
      success: true,
      articles: articles.filter(Boolean).map((article, i) => ({
        ...article,
        topImpact: topImpacts[i]
      }))
    };

  } catch (error) {
    console.error('Error fetching top articles:', error);
    return { success: false, error: error.message, articles: [] };
  }
}
```

### Pattern 4: Market Snapshot Aggregation

```javascript
export async function createMarketSnapshot() {
  const databases = adminClient().databases;
  const DATABASE_ID = process.env.APPWRITE_DATABASE_ID;

  try {
    // Get impacts from last 15 minutes
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();

    const impacts = await databases.listDocuments(
      DATABASE_ID,
      'market_impacts',
      [
        Query.greaterThan('createdAt', fifteenMinutesAgo),
        Query.limit(1000)
      ]
    );

    // Aggregate by market
    const marketStats = {
      crypto: [],
      stocks: [],
      forex: [],
      commodities: []
    };

    for (const impact of impacts.documents) {
      if (marketStats[impact.marketType]) {
        marketStats[impact.marketType].push(impact.impactScore);
      }
    }

    // Calculate averages
    const calcAvg = (scores) => scores.length > 0
      ? scores.reduce((a, b) => a + b, 0) / scores.length
      : 0;

    // Count sentiment distribution
    const allScores = Object.values(marketStats).flat();
    const bullishCount = allScores.filter(s => s > 2).length;
    const bearishCount = allScores.filter(s => s < -2).length;
    const neutralCount = allScores.filter(s => s >= -2 && s <= 2).length;

    // Create snapshot
    const snapshot = await databases.createDocument(
      DATABASE_ID,
      'market_snapshots',
      ID.unique(),
      {
        timestamp: new Date().toISOString(),
        cryptoAvg: calcAvg(marketStats.crypto),
        cryptoCount: marketStats.crypto.length,
        stocksAvg: calcAvg(marketStats.stocks),
        stocksCount: marketStats.stocks.length,
        forexAvg: calcAvg(marketStats.forex),
        forexCount: marketStats.forex.length,
        commoditiesAvg: calcAvg(marketStats.commodities),
        commoditiesCount: marketStats.commodities.length,
        totalArticlesAnalyzed: allScores.length,
        bullishCount,
        bearishCount,
        neutralCount
      }
    );

    return { success: true, snapshot };

  } catch (error) {
    console.error('Error creating snapshot:', error);
    return { success: false, error: error.message };
  }
}
```

### Pattern 5: Batch Save Articles with Bulk Operations

```javascript
export async function batchSaveArticles(articles) {
  const databases = adminClient().databases;
  const DATABASE_ID = process.env.APPWRITE_DATABASE_ID;

  try {
    // Prepare documents
    const documents = articles.map(article => ({
      $id: ID.unique(),
      articleId: article.article_id || ID.unique(),
      title: article.title,
      description: article.description,
      url: article.url,
      source: article.source_id,
      publishedAt: article.pubDate,
      fetchedAt: new Date().toISOString()
    }));

    // Bulk create (up to 100 at a time)
    const batchSize = 100;
    const results = [];

    for (let i = 0; i < documents.length; i += batchSize) {
      const batch = documents.slice(i, i + batchSize);
      const result = await databases.createDocuments(
        DATABASE_ID,
        'articles',
        batch
      );
      results.push(...result);
    }

    return { success: true, count: results.length, articles: results };

  } catch (error) {
    console.error('Error in batch save:', error);
    return { success: false, error: error.message };
  }
}
```

---

## Quick Reference

### Common Methods

```javascript
// Initialize
import { Client, Account, Databases, Storage, ID, Query } from 'node-appwrite';

const client = new Client()
  .setEndpoint('https://cloud.appwrite.io/v1')
  .setProject('PROJECT_ID')
  .setKey('API_KEY');

const databases = new Databases(client);
const account = new Account(client);
const storage = new Storage(client);

// Database operations
await databases.createDocument(dbId, collId, ID.unique(), data);
await databases.getDocument(dbId, collId, docId);
await databases.updateDocument(dbId, collId, docId, data);
await databases.deleteDocument(dbId, collId, docId);
await databases.listDocuments(dbId, collId, [queries]);

// Bulk operations
await databases.createDocuments(dbId, collId, documents);
await databases.updateDocuments(dbId, collId, documents);
await databases.upsertDocuments(dbId, collId, documents);

// Authentication
await account.create(ID.unique(), email, password, name);
await account.createEmailPasswordSession(email, password);
await account.get();
await account.deleteSession('current');

// Storage
await storage.createFile(bucketId, ID.unique(), file);
await storage.getFileDownload(bucketId, fileId);
await storage.deleteFile(bucketId, fileId);
```

### Query Operators

| Operator | Method | Example |
|----------|--------|---------|
| = | `Query.equal('field', value)` | Equal |
| ≠ | `Query.notEqual('field', value)` | Not equal |
| > | `Query.greaterThan('field', value)` | Greater than |
| ≥ | `Query.greaterThanEqual('field', value)` | Greater or equal |
| < | `Query.lessThan('field', value)` | Less than |
| ≤ | `Query.lessThanEqual('field', value)` | Less or equal |
| ∈ | `Query.between('field', min, max)` | Between (inclusive) |
| ∋ | `Query.contains('field', value)` | Contains |
| ⊃ | `Query.startsWith('field', value)` | Starts with |
| ⊂ | `Query.endsWith('field', value)` | Ends with |
| ∅ | `Query.isNull('field')` | Is null |
| ∃ | `Query.isNotNull('field')` | Is not null |
| ∨ | `Query.or([queries])` | OR logic |
| 🔍 | `Query.search('field', 'keywords')` | Full-text search |

### Permission Roles

```javascript
import { Permission, Role } from 'node-appwrite';

// Public access
Permission.read(Role.any())

// Authenticated users
Permission.read(Role.users())
Permission.write(Role.users())

// Specific user
Permission.read(Role.user('USER_ID'))
Permission.write(Role.user('USER_ID'))

// Team access
Permission.read(Role.team('TEAM_ID'))
Permission.write(Role.team('TEAM_ID', ['admin', 'moderator']))

// Multiple permissions
[
  Permission.read(Role.any()),
  Permission.write(Role.user('USER_ID')),
  Permission.delete(Role.team('TEAM_ID', ['admin']))
]
```

### Common Error Types

| Type | Meaning | Common Cause |
|------|---------|--------------|
| `user_already_exists` | Email in use | Duplicate registration |
| `user_invalid_credentials` | Wrong password | Login failed |
| `user_not_found` | User doesn't exist | Invalid user ID |
| `document_not_found` | Document missing | Wrong ID |
| `collection_not_found` | Collection missing | Wrong collection ID |
| `general_rate_limit_exceeded` | Too many requests | Need backoff |
| `general_unauthorized_scope` | Permission denied | Wrong API key scope |

### Environment Variables Reference

```bash
# Appwrite Configuration
NEXT_PUBLIC_APPWRITE_ENDPOINT="https://cloud.appwrite.io/v1"
NEXT_PUBLIC_APPWRITE_PROJECT_ID="your_project_id"
NEXT_PUBLIC_APPWRITE_PROJECT_NAME="project_name"
APPWRITE_API_KEY="your_admin_api_key"
APPWRITE_DATABASE_ID="database_id"

# Session Encryption
ENCRYPTION_KEY="your_jwt_encryption_key_32_chars"

# Development
NODE_ENV="development"  # or "production"
```

---

## Official Resources

### Documentation
- **Appwrite Docs:** https://appwrite.io/docs
- **node-appwrite NPM:** https://www.npmjs.com/package/node-appwrite
- **Quick Start (Node.js):** https://appwrite.io/docs/quick-starts/node
- **Databases:** https://appwrite.io/docs/products/databases
- **Authentication:** https://appwrite.io/docs/products/auth
- **Storage:** https://appwrite.io/docs/products/storage
- **Functions:** https://appwrite.io/docs/products/functions

### Guides & Tutorials
- **Server-side Auth (Next.js):** https://appwrite.io/docs/tutorials/nextjs-ssr-auth/step-1
- **Queries:** https://appwrite.io/docs/products/databases/queries
- **Pagination:** https://appwrite.io/docs/products/databases/pagination
- **Bulk Operations:** https://appwrite.io/docs/products/databases/bulk-operations
- **Relationships:** https://appwrite.io/docs/products/databases/relationships
- **Error Handling:** https://appwrite.io/docs/advanced/platform/error-handling
- **Permissions:** https://appwrite.io/docs/advanced/platform/permissions

### Community & Support
- **GitHub:** https://github.com/appwrite/appwrite
- **Discord:** https://appwrite.io/discord
- **Stack Overflow:** Tag `appwrite`
- **Blog:** https://appwrite.io/blog

---

## When to Use This Skill

**Use this skill when:**
- ✅ Setting up Appwrite in Next.js project
- ✅ Creating database operations
- ✅ Implementing authentication flows
- ✅ Writing server actions with Appwrite
- ✅ Optimizing queries and performance
- ✅ Troubleshooting errors
- ✅ Designing database schema
- ✅ Implementing bulk operations
- ✅ Setting up file storage
- ✅ Configuring permissions

**This skill provides:**
- 📖 Complete SDK reference
- 💻 Your project-specific patterns
- 🔒 Security best practices
- ⚡ Performance optimization
- 🛡️ Error handling strategies
- 🎯 Next.js integration examples
- 📊 Query optimization guide

---

## Revision History

- **v1.0** - January 2025 - Initial comprehensive guide created
- SDK Version: node-appwrite v20.3.0
- Project: News Analytics Dashboard
- Based on current implementation analysis

---

**End of Skill Document**
