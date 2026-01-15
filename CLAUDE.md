
# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an **insurance management platform** built with Next.js 16, integrating Appwrite as the backend-as-a-service. The application manages facilities (rehabilitation centers, polyclinics, hospitals, private clinics), specialists, patients, and appointments.

**Tech Stack:**
- Next.js 16.1.1 (App Router with React Server Components)
- React 19.2.3
- TypeScript 5
- Appwrite (node-appwrite v21.1.0) - Backend service
- Tailwind CSS 4 with shadcn/ui components
- React Hook Form with Zod validation
- Google Generative AI integration

## Development Commands

```bash
# Development
npm run dev          # Start development server at http://localhost:3000

# Production
npm run build        # Build for production
npm run start        # Start production server

# Linting
npm run lint         # Run ESLint (alias: eslint command)
```

## Architecture

### Backend Integration (Appwrite)

The project uses **Appwrite** as a Backend-as-a-Service with a sophisticated dual-client pattern:

**Key Files:**
- `appwrite/adminOrClient.ts` - Central client initialization
- `lib/types/appwrite.ts` - TypeScript definitions and type guards

**Two Client Types:**

1. **Admin Client** (`adminAction()`)
   - Uses API key for full access
   - Bypasses all permissions
   - Used for: user creation, system operations, privileged actions
   - Always returns `AppwriteClient`

2. **User Client** (`clientAction()`)
   - Session-based authentication via cookies
   - Respects document-level permissions
   - Used for: user-specific operations
   - Returns `AppwriteClient | ErrorResult` (use type guard!)

**Critical Pattern:**
Always use the `isAppwriteClient()` type guard when working with `clientAction()`:

```typescript
import { clientAction } from '@/appwrite/adminOrClient';
import { isAppwriteClient } from '@/lib/types/appwrite';

const result = await clientAction();
if (!isAppwriteClient(result)) {
  return { success: false, message: result.message };
}

const { account, databases, storage } = result;
```

### Database Structure

**Collections:**
1. **users** - User accounts with roles (facility_admin, specialist, patient)
2. **facilities** - Medical facilities with types and metadata
3. **specialists** - Healthcare providers with schedules
4. **patients** - Patient records with payment types
5. **appointments** - Booking system with status tracking
6. **invitations** - Token-based invitation system with expiry

**All document types extend `Models.Document`** from node-appwrite, providing:
- `$id` - Document ID
- `$createdAt` - Creation timestamp
- `$updatedAt` - Last update timestamp
- `$permissions` - Document permissions
- `$collectionId`, `$databaseId` - Collection references

See `lib/types/appwrite.ts` for full TypeScript definitions.

### Authentication Flow

1. User registration via `appwrite/createUser.ts`
2. Login creates session stored in HTTP-only cookie `appSession`
3. Session validation via `appwrite/getSession.ts`
4. Logout clears session via `appwrite/logOut.ts`

### Project Structure

```
/
├── app/                    # Next.js App Router pages
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Home page
│   └── globals.css        # Global styles
├── appwrite/              # Appwrite integration layer
│   ├── adminOrClient.ts   # Client initialization (CRITICAL)
│   ├── createUser.ts      # User registration
│   ├── loginUser.ts       # Authentication
│   ├── logOut.ts          # Session cleanup
│   └── getSession.ts      # Session retrieval
├── components/
│   ├── ui/                # shadcn/ui components
│   └── *.tsx              # Custom components
├── lib/
│   ├── types/
│   │   └── appwrite.ts    # Appwrite TypeScript definitions
│   └── utils.ts           # Utility functions (cn helper)
└── .claude/
    └── skills/            # Claude Code custom skills
        ├── shadcn-components.md  # shadcn/ui reference
        └── appwrite-sdk.md       # Appwrite SDK guide
```

## Important Patterns

### Server Actions

All Appwrite operations should be in server actions with `"use server"` directive:

```typescript
"use server";

import { adminAction } from '@/appwrite/adminOrClient';
import { AppwriteException } from 'node-appwrite';

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
    if (error instanceof AppwriteException) {
      console.error('Appwrite error:', error.type, error.message);
      return { success: false, message: 'Operation failed' };
    }
    throw error;
  }
}
```

### Error Handling

**Never throw errors to client components** - always return error objects:

```typescript
// ❌ BAD
throw new Error('Failed');

// ✅ GOOD
return { success: false, message: 'Failed' };
```

Use `AppwriteException` for proper error typing:
- `error.code` - HTTP status code
- `error.type` - Error type (e.g., 'user_already_exists')
- `error.message` - Human-readable message

### Type Safety

**Document Operations:**
Always specify document types for type-safe database access:

```typescript
const user = await databases.getDocument<UserDocument>(
  databaseId,
  usersCollectionId,
  userId
);

// TypeScript knows user.full_name, user.role, etc.
```

**Nullable Fields:**
Use `!= null` (not `!== null`) for proper null/undefined checking:

```typescript
// ✅ Checks both null and undefined
const isValid = maxUses != null && count >= maxUses;
```

### Path Aliases

Uses `@/*` for root-level imports (configured in tsconfig.json):

```typescript
import { cn } from '@/lib/utils';
import { adminAction } from '@/appwrite/adminOrClient';
import type { UserDocument } from '@/lib/types/appwrite';
```

## Environment Variables

Required environment variables (never commit actual values):

```bash
NEXT_PUBLIC_APPWRITE_ENDPOINT=        # Appwrite API endpoint
NEXT_PUBLIC_APPWRITE_PROJECT_ID=      # Project ID
APPWRITE_API_KEY=                     # Admin API key (server-side only)
```

## shadcn/ui Components

The project uses **shadcn/ui** components installed in `components/ui/`. These are NOT npm dependencies - they're copied into the project for full customization.

**Available Components:**
- Form elements: button, input, textarea, label, select, combobox
- Layout: card, separator, field, input-group
- Feedback: alert-dialog, badge, dropdown-menu

**Adding New Components:**
```bash
npx shadcn@latest add [component-name]
```

**Important:** Always read existing component code before modifying. Components use the `cn()` utility from `lib/utils.ts` for className merging.

See `.claude/skills/shadcn-components.md` for complete reference.

## Appwrite Integration Notes

**Client Creation:**
- Create fresh client per request (never share instances)
- Session cookies are HTTP-only, secure, sameSite strict
- Admin operations bypass all permissions

**Common Operations:**
```typescript
import { ID, Query } from 'node-appwrite';

// Create document
await databases.createDocument(dbId, collId, ID.unique(), data);

// Query with filters
await databases.listDocuments(dbId, collId, [
  Query.equal('role', 'specialist'),
  Query.orderDesc('$createdAt'),
  Query.limit(25)
]);

// Update partial fields
await databases.updateDocument(dbId, collId, docId, { status: 'done' });
```

**Bulk Operations:**
Use `createDocuments()`, `updateDocuments()` for batch operations (up to 100 at once).

See `.claude/skills/appwrite-sdk.md` for comprehensive SDK reference.

## Key Dependencies

- **node-appwrite** - Server-side Appwrite SDK
- **jose** - JWT encryption for sessions
- **zod** - Schema validation
- **react-hook-form** - Form state management
- **class-variance-authority** - Component variant styling
- **tailwind-merge** - Tailwind className merging

## Development Notes

**File Extensions:**
- Use `.ts` for utilities, types, server actions
- Use `.tsx` for components with JSX
- React 19 uses `react-jsx` transform (no need to import React)

**Styling:**
- Tailwind CSS 4 with PostCSS
- Use `cn()` utility for conditional classes
- Components use CSS-in-JS patterns with Tailwind

**TypeScript:**
- Strict mode enabled
- Target ES2017
- Module resolution: bundler

**Notes:**
- Dont run "npm run dev", its probably already runing
- Dont create large components, if component is large create new folder in components folder and divide large component into smaller components
