# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**VehicleClaim AI** — an AI-powered vehicle damage assessment platform for insurance claims. Users record video of vehicle damage, optionally attach an insurance policy, and receive a Gemini-powered analysis with damage details, repair cost estimates, fraud detection, and coverage assessment.

**Tech Stack:** Next.js 16.1.1 (App Router, RSC), React 19, TypeScript 5, Appwrite (node-appwrite v21.1.0), Tailwind CSS 4 + shadcn/ui, Google Generative AI (Gemini), React Hook Form + Zod.

## Development Commands

```bash
npm run dev              # Dev server (likely already running — don't restart)
npm run build            # Production build
npm run lint             # ESLint

# Database schema management
npm run schema:submit    # Submit schema to Appwrite
npm run schema:sync      # Sync schema with project
npm run schema:sync:dry  # Dry run

# Migrations
npm run migrate:field-sizes    # Run field size migration
npm run migrate:rollback       # Rollback migration

npm run ngrok            # Start ngrok tunnel for webhook testing
```

## Architecture

### Core Data Flow

```
User records video → optional policy upload → submitReportAction() server action
  → Gemini analyzes video (+ policy if provided) → structured JSON response
  → Creates report + damage_details + vehicle_verification + assessment + fraud_assessment
  → Redirect to /auth/reports/[id]
```

### Appwrite Dual-Client Pattern

`appwrite/adminOrClient.ts` provides two client factories:

- **`adminAction()`** — API-key client, bypasses permissions. Always returns `AppwriteClient`.
- **`clientAction()`** — Session-based, respects permissions. Returns `AppwriteClient | ErrorResult`.

**Always** use the type guard with `clientAction()`:
```typescript
const result = await clientAction();
if (!isAppwriteClient(result)) {
  return { success: false, message: result.message };
}
const { databases, storage } = result;
```

### Database Collections

All types in `lib/types/appwrite.ts`. All extend `Models.Document` (provides `$id`, `$createdAt`, etc.).

| Collection | Type | Relationship |
|---|---|---|
| users | `UserDocument` | Standalone |
| insurance_companies | `InsuranceCompanyDocument` | Standalone |
| reports | `ReportDocument` | Core entity |
| report_damage_details | `ReportDamageDetailDocument` | Many-to-one → report |
| report_vehicle_verification | `ReportVehicleVerificationDocument` | One-to-one → report |
| report_assessments | `ReportAssessmentDocument` | One-to-one → report |
| report_fraud_assessments | `ReportFraudAssessmentDocument` | One-to-one → report |
| audit_logs | `AuditLogDocument` | Standalone |
| feedback | `FeedbackDocument` | Standalone |

Related collections link via `claim_id` field referencing the report's `$id`. Use `fetchFullReportData()` from `lib/types/appwrite.ts` to fetch a report with all related data.

### Environment Variables

Use `lib/env.ts` for typed access to collection IDs and database config:
```typescript
import { DATABASE_ID, COLLECTION_IDS, STORAGE_BUCKET_ID } from '@/lib/env';
```

Required env vars:
```bash
NEXT_PUBLIC_APPWRITE_ENDPOINT=    # Appwrite API endpoint
NEXT_PUBLIC_APPWRITE_PROJECT_ID=  # Project ID
APPWRITE_API_KEY=                 # Server-side admin key
GEMINI_API_KEY=                   # Google Generative AI
DATABASE_ID=
STORAGE_BUKET_ID=                 # Note: typo preserved from Appwrite setup
USERS_COLLECTION_ID=
INSURANCE_COMPANIES_COLLECTION_ID=
CLAIMS_COLLECTION_ID=             # Maps to COLLECTION_IDS.REPORTS
CLAIM_DAMAGE_DETAILS_COLLECTION_ID=
CLAIM_VEHICLE_VERIFICATION_COLLECTION_ID=
CLAIM_ASSESSMENTS_COLLECTION_ID=
CLAIM_FRAUD_ASSESSMENTS_COLLECTION_ID=
AUDIT_LOGS_COLLECTION_ID=
FEEDBACK_COLLECTION_ID=
```

Note: env var names use "CLAIMS" but code constants use "REPORTS" — `lib/env.ts` handles the mapping.

### Authentication

**Dual-cookie system:**
1. `appSession` — Appwrite session secret
2. `localSession` — Encrypted JWT (via `jose`) containing userId, email, name

**Login methods:** Email/password (`/api/auth/email/login`) and Google OAuth2 (`/api/auth/google/redirect` → `/api/auth/google/callback`). Both set 7-day cookies.

**Session validation:** `getSessionCached()` in `lib/data/cached-queries.ts` — decrypts JWT, validates against Appwrite, falls back to JWT-only if Appwrite unavailable.

**Dev bypass:** Set `DISABLE_PROTECTION=true` to skip auth checks in dashboard layout.

### Caching Strategy

`lib/data/cached-queries.ts` implements a **hybrid caching** pattern:
- **`cache()`** (React) — request-level deduplication (free duplicate calls within one render)
- **`unstable_cache()`** (Next.js) — cross-request caching with TTL

```
getSessionCached       → cache() only (per-request)
getUserDocumentCached  → cache() + unstable_cache(60s)
getReportsCached       → cache() + unstable_cache(30s)
getUserPoliciesCached  → cache() + unstable_cache(60s)
```

### Gemini AI Integration

**Location:** `lib/gemini/`

**Models** (defined in `constants.ts`):
- `gemini-2.5-flash-lite` — default, fastest
- `gemini-2.5-flash` — balanced
- `gemini-3-flash-preview` — latest
- `gemini-2.5-pro` — most capable

**Analysis actions** (`lib/gemini/actions/`):
- `analyzeVideo.ts` / `analyzeImage.ts` — media-only analysis
- `analyzeVideoPlusPolicy.ts` / `analyzeImagePlusPolicy.ts` — media + policy analysis

**Rate limiting** (`lib/gemini/rateLimit/`): Priority-based model selection with automatic fallback. Tracks RPM/RPD per model, picks best available.

**Security** (`lib/gemini/security/`): Prompt injection scanning, image OCR for fraud detection, PDF text extraction for policy verification.

### Video Recording Pipeline

`components/video-recorder/` — multi-step modal with state machine:

```
permission-prompt → ready → recording → processing → compressing → preview → policy-step → uploading
```

**Key hooks** (`hooks/`):
- `use-camera.ts` — camera access with back-camera preference on mobile
- `use-video-recorder.ts` — MediaRecorder API wrapper
- `use-motion-detection.ts` — DeviceMotionEvent for quality tracking

**Video compression:** `lib/utils/video-compression.ts` — client-side compression if video > 20MB (server action limit is 30MB, but base64 encoding adds ~33% overhead).

### Routing

```
/                              → Landing page (redirects to dashboard if authenticated)
/auth/dashboard/[id]/          → Protected dashboard (session must match [id])
/auth/dashboard/[id]/reports   → Reports list
/auth/reports/[id]             → Individual report detail (public or owner access)
/api/auth/email/*              → Email auth endpoints
/api/auth/google/*             → OAuth2 endpoints
/api/logout                    → Session cleanup
```

Dashboard layout (`app/auth/dashboard/[id]/layout.tsx`) handles session validation, parallel data fetching (user doc + policies), and wraps children in `UserProvider` → `PolicyProvider` → `SidebarProvider`.

## Important Patterns

### Server Actions

All Appwrite operations use `"use server"` directive. Never throw errors to client — return `{ success, message }` objects:

```typescript
"use server";
import { adminAction } from '@/appwrite/adminOrClient';

export async function myAction(data: InputType) {
  try {
    const { databases } = await adminAction();
    const result = await databases.createDocument(DATABASE_ID, collId, ID.unique(), data);
    return { success: true, data: result };
  } catch (error: unknown) {
    if (error instanceof AppwriteException) {
      return { success: false, message: 'Operation failed' };
    }
    throw error;
  }
}
```

### Type-Safe Document Access

Always specify document types in Appwrite queries:
```typescript
const user = await databases.getDocument<UserDocument>(DATABASE_ID, COLLECTION_IDS.USERS, userId);
```

### Component Organization

Large features are split into sub-component folders under `components/`:
- `components/video-recorder/` — video recording workflow
- `components/gemini-analysis/` — AI analysis display
- `components/dashboardComponents/` — dashboard UI
- `components/landing/` — public landing page
- `components/ui/` — shadcn/ui base components (copied, not npm — add via `npx shadcn@latest add [name]`)

Keep components under ~200 lines. If a component grows large, create a new folder and split it.

### Path Aliases

`@/*` maps to project root: `import { cn } from '@/lib/utils'`

### Styling

Tailwind CSS 4 with OKLch color variables in `globals.css`. Use `cn()` from `lib/utils.ts` for conditional class merging. Includes print styles for PDF export.

### Next.js Configuration

- Server Actions body size limit: **30MB** (for video uploads)
- Dynamic RSC stale time: **30s** client-side cache
- Uses `nosleep.js` to prevent browser sleep during video recording

## Key Dependencies

- **node-appwrite** — server-side Appwrite SDK
- **@google/genai** — Gemini AI client
- **jose** — JWT encryption for session cookies
- **html2pdf.js** / **jspdf** — PDF report generation
- **nosleep.js** — prevents screen sleep during recording
- **@hugeicons/react** — icon library (not Lucide)
