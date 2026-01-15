# Field Size Migration Guide

This guide explains how to apply the database migration to increase character limits from 200-500 to 1200 characters.

## What Was Changed

### 1. Database Schema (`schema/database.schema.json`)
Updated 7 string array field sizes to 1200 characters:

**claims collection:**
- `safety_concerns`: 200 → 1200
- `recommended_actions`: 300 → 1200

**claim_assessments collection:**
- `exclusions`: 500 → 1200
- `relevant_policy_sections`: 200 → 1200
- `covered_damages`: 300 → 1200
- `excluded_damages`: 300 → 1200
- `policy_references`: 200 → 1200

### 2. Code (`appwrite/createClaim.ts`)
Updated truncation limits to match the new schema sizes (all 7 fields now use 1200).

### 3. Migration Script (`scripts/migrate-field-sizes.ts`)
Created an automated script to update the Appwrite database attributes.

## How to Apply the Migration

You have two options:

### Option 1: Automated Script (Recommended)

Run the migration script to automatically update all collection attributes:

```bash
npm run migrate:field-sizes
```

This will:
- Connect to your Appwrite database
- Update all 7 attributes across 2 collections
- Display progress and confirmation

**To rollback if needed:**
```bash
npm run migrate:rollback
```

### Option 2: Manual Update via Appwrite Console

If you prefer to update manually or the script encounters issues:

1. Open your Appwrite Console
2. Navigate to your database → Collections

#### For `claims` collection:
1. Go to Attributes tab
2. Find `safety_concerns` → Edit → Change size to **1200** → Save
3. Find `recommended_actions` → Edit → Change size to **1200** → Save

#### For `claim_assessments` collection:
1. Go to Attributes tab
2. Update these attributes to size **1200**:
   - `exclusions`
   - `relevant_policy_sections`
   - `covered_damages`
   - `excluded_damages`
   - `policy_references`

## Verification Steps

After applying the migration:

### 1. Check Appwrite Console
- Verify each attribute shows `size: 1200`
- Confirm changes applied to both collections

### 2. Test Claim Submission
Submit a test claim with a long policy document (lots of exclusions and coverage details):

```bash
# Submit a claim and watch the logs
npm run dev
```

Look for:
- No truncation warnings in console
- Full text stored in database
- Claims display correctly

### 3. Monitor Logs
Before migration, you saw:
```
⚠️ exclusions[1] too long (598 chars), truncating to 500
⚠️ recommended_actions[5] too long (218 chars), truncating to 200
⚠️ excluded_damages[0] too long (706 chars), truncating to 300
```

After migration, these warnings should **not appear** for text under 1200 chars.

## Troubleshooting

### Script fails with "Missing environment variables"
Make sure your `.env` or `.env.local` file contains:
```env
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://your-endpoint
NEXT_PUBLIC_APPWRITE_PROJECT_ID=your-project-id
APPWRITE_API_KEY=your-admin-api-key
DATABASE_ID=your-database-id
CLAIMS_COLLECTION_ID=your-claims-collection-id
CLAIM_ASSESSMENTS_COLLECTION_ID=your-claim-assessments-collection-id
```

### Script fails with "Permission denied"
The `APPWRITE_API_KEY` must have database write permissions. Verify:
1. API key exists in Appwrite Console → Settings → API Keys
2. Scopes include `databases.write`

### Script fails with "Attribute not found"
The attribute may have a different name or doesn't exist. Check:
1. Collection names match your setup
2. Attribute keys are correct (check in Appwrite Console)

### Manual update not showing changes
1. Hard refresh the browser (Ctrl+F5)
2. Check if you're in the correct database
3. Verify you clicked "Update" after changing the size

## Rollback Instructions

If you need to revert the changes:

### Using Script
```bash
npm run migrate:rollback
```

### Manually
Restore original sizes:
- `safety_concerns`: 200
- `recommended_actions`: 300
- `exclusions`: 500
- `relevant_policy_sections`: 200
- `covered_damages`: 300
- `excluded_damages`: 300
- `policy_references`: 200

Then revert code changes:
```bash
git checkout HEAD -- appwrite/createClaim.ts schema/database.schema.json
```

## Performance Impact

- **Storage:** Minimal increase (only stores actual content length)
- **Query Speed:** No noticeable impact
- **Benefits:** Gemini AI can return full, detailed analysis without truncation

## Questions?

If you encounter issues:
1. Check Appwrite logs in the Console
2. Verify environment variables are set correctly
3. Ensure API key has proper permissions
4. Try manual update via Console as fallback
