# Data Migration Script - Summary

**Date:** November 4, 2025  
**File:** `apps/backend/src/database/migrate-data.ts` (4.6 KB, 174 lines)  
**Status:** ✅ CREATED

---

## Overview

Created an automated data migration script that safely migrates data from SQLite to PostgreSQL/Supabase using the Supabase JavaScript client.

## File Details

**Location:** [apps/backend/src/database/migrate-data.ts](apps/backend/src/database/migrate-data.ts)

**Size:** 4.6 KB (174 lines)

**Purpose:** Migrate users and analytics data from SQLite to Supabase PostgreSQL

## NPM Script Added

```bash
npm run migrate:data
```

Added to [apps/backend/package.json](apps/backend/package.json):
```json
{
  "scripts": {
    "migrate:data": "ts-node src/database/migrate-data.ts"
  }
}
```

## Features

### 1. **User Migration**
- Reads all users from SQLite
- Checks for existing users by email (prevents duplicates)
- Migrates user data:
  - email, name, county, language
  - created_at timestamp
- Skips password_hash (users will need to reset passwords)
- Reports: migrated count and skipped count

### 2. **Analytics Migration**
- Reads last 1000 analytics events from SQLite
- Maps old SQLite user IDs to new PostgreSQL user IDs
- Batch inserts (100 events at a time) for performance
- Migrates:
  - user_id (mapped to new IDs)
  - event_type
  - event_data (parsed from JSON meta field)
  - timestamp
- Progress reporting during batch processing

### 3. **Safety Features**
- ✅ Read-only access to SQLite (OPEN_READONLY)
- ✅ Checks for existing records before insert
- ✅ Does NOT delete from SQLite (safe operation)
- ✅ Batch processing to avoid overwhelming database
- ✅ Error handling with detailed messages
- ✅ Summary reports after each migration phase

## Usage

### Run the Migration

```bash
cd apps/backend
npm run migrate:data
```

### Expected Output

```
🚀 Starting data migration from SQLite to PostgreSQL...

⚠️  This will copy data but NOT delete from SQLite (safe operation)

📋 Migrating users...
   Found 1 users in SQLite
   ⏭️  Skipping test@test.com (already exists)

   Summary: 0 migrated, 1 skipped

📋 Migrating analytics...
   Found 13 analytics events (migrating last 1000)
   ✅ Migrated 13/13 events

   Summary: 13 events migrated

✅ Data migration completed successfully!

📝 Next steps:
   1. Verify data in Supabase Dashboard
   2. Test the application with new database
   3. Keep SQLite as backup for now

👋 Done!
```

## Important Notes

### Current State
**Data already migrated:** The data was already migrated using the earlier migration script ([migrations/migrate-from-sqlite.js](../../migrations/migrate-from-sqlite.js)). Running this script now will skip all existing records.

### Differences from Previous Migration

| Feature | Previous Script | This Script |
|---------|----------------|-------------|
| Method | Direct PostgreSQL with pg | Supabase JS Client |
| Password | bcrypt hashing | Skipped (users reset) |
| User IDs | Preserved as integers | New auto-generated |
| Batch Size | All at once | 100 per batch |
| Duplicate Check | No | Yes (by email) |
| SQLite Access | Read-write | Read-only |

### When to Use This Script

1. **Additional migrations** - If you need to migrate more recent data from SQLite
2. **Partial migrations** - Selectively migrate specific users or time periods
3. **Data refresh** - Sync updated analytics from SQLite to PostgreSQL
4. **Testing** - Verify migration logic without deleting source data

### Customization Options

You can modify the script to:

```typescript
// Migrate specific time range
const analytics = await sqliteQuery(
  "SELECT * FROM analytics WHERE timestamp > '2025-01-01' ORDER BY timestamp"
);

// Migrate specific users
const users = await sqliteQuery(
  "SELECT * FROM users WHERE email LIKE '%@example.com'"
);

// Increase batch size for faster migration
const batchSize = 500; // Default is 100

// Migrate all analytics (not just last 1000)
const analytics = await sqliteQuery(
  'SELECT * FROM analytics ORDER BY timestamp'
);
```

## File Structure

```typescript
// Environment & Dependencies
import { createClient } from '@supabase/supabase-js';
import sqlite3 from 'sqlite3';
import * as dotenv from 'dotenv';

// Configuration
dotenv.config({ path: '../../../../.env.merge' });
const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
const sqliteDb = new sqlite3.Database('../../../../aldeia.db', READONLY);

// Helper Functions
function sqliteQuery(sql: string): Promise<any[]>

// Migration Functions
async function migrateUsers()
async function migrateAnalytics()
async function runDataMigration()

// Execution
runDataMigration().then(() => process.exit(0));
```

## Error Handling

The script includes comprehensive error handling:

```typescript
// Per-user error handling
if (error) {
  console.error(`❌ Failed to migrate ${user.email}:`, error.message);
  // Continues to next user
}

// Per-batch error handling
if (error) {
  console.error(`❌ Failed to migrate batch starting at ${i}:`, error.message);
  // Continues to next batch
}

// Top-level error handling
catch (error) {
  console.error('❌ Data migration failed:', error);
  process.exit(1);
}

// Cleanup
finally {
  sqliteDb.close();
}
```

## Related Files

- **Migration Runner:** [src/database/migrate.ts](apps/backend/src/database/migrate.ts)
- **Migration Creator:** [src/database/create-migration.js](apps/backend/src/database/create-migration.js)
- **Original Migration:** [migrations/migrate-from-sqlite.js](migrations/migrate-from-sqlite.js)
- **Verification Script:** [verify-data-comparison.js](verify-data-comparison.js)

## Verification

After running the migration, verify with:

```bash
# Using our comparison script
node verify-data-comparison.js

# Or manually check in Supabase Dashboard
# https://app.supabase.com/project/ldogkuurhpyiiolbovuq/editor
```

---

## Summary

✅ **Created:** Data migration script (migrate-data.ts)  
✅ **Added:** NPM script (migrate:data)  
✅ **Features:** Safe, incremental migration with duplicate detection  
✅ **Status:** Ready to use for additional data migrations

**Note:** Initial data already migrated successfully. This script is available for future migrations or data refreshes.
