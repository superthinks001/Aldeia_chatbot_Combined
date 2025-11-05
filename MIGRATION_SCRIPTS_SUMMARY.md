# Migration Scripts Setup - Complete

**Date:** November 4, 2025  
**Status:** ✅ COMPLETE

---

## Summary

Successfully created a comprehensive database migration system for the Aldeia Chatbot backend with Supabase PostgreSQL integration.

## Created Files

### 1. Migration Runner
**File:** `apps/backend/src/database/migrate.ts` (3.9 KB)
- Supabase-specific migration runner
- Tracks migrations via `schema_migrations` table
- Interactive SQL execution workflow
- Displays SQL for manual execution in Supabase Dashboard

### 2. Migration Creator
**File:** `apps/backend/src/database/create-migration.js` (1.4 KB)
- Automated migration file generator
- Auto-increments migration numbers
- Creates migration templates with UP/DOWN sections
- Includes metadata (date, description, author)

### 3. Migration Documentation
**File:** `apps/backend/src/database/migrations/README.md` (6.2 KB)
- Complete migration workflow guide
- Best practices and examples
- Troubleshooting section
- Supabase-specific instructions

## NPM Scripts Added

All scripts are in `apps/backend/package.json`:

```json
{
  "scripts": {
    "migrate": "ts-node src/database/migrate.ts",
    "migrate:create": "node src/database/create-migration.js",
    "db:migrate": "ts-node src/database/migrations/run-migrations.ts",
    "db:migrate:supabase": "ts-node src/database/migrate.ts",
    "db:seed": "ts-node src/database/seeds/dev-data.ts"
  }
}
```

## Usage Examples

### Create a New Migration
```bash
cd apps/backend
npm run migrate:create add_user_preferences
```

**Output:**
```
✅ Created migration file:
   002_add_user_preferences.sql
   Location: apps/backend/src/database/migrations/002_add_user_preferences.sql
```

### Run Migrations
```bash
npm run migrate
```

**Workflow:**
1. Shows pending migrations
2. Displays SQL for each migration
3. Provides Supabase Dashboard instructions
4. Waits for confirmation (press Enter)
5. Tracks migration as complete

### Alternative: Generic Migration Runner
```bash
npm run db:migrate
```
- Runs migrations from root `/migrations/` directory
- Supports both SQLite and PostgreSQL
- Auto-executes SQL

## Migration File Structure

Migrations are stored in: `apps/backend/src/database/migrations/`

```
migrations/
├── README.md                      ← Complete documentation
├── run-migrations.ts              ← Generic runner (SQLite/PostgreSQL)
└── 001_initial_schema.sql         ← Migration files (numbered)
```

## Migration File Template

When you run `npm run migrate:create <name>`, it creates:

```sql
-- Migration: 001_name.sql
-- Description: name
-- Date: 2025-11-04
-- Author: Auto-generated

-- ============================================================================
-- UP MIGRATION
-- ============================================================================

-- Add your SQL statements here


-- ============================================================================
-- DOWN MIGRATION (for rollback)
-- ============================================================================

-- Add rollback SQL statements here (commented out)
-- Example:
-- DROP TABLE IF EXISTS example_table;
```

## Migration Tracking

Migrations are tracked in the `schema_migrations` table:

```sql
CREATE TABLE schema_migrations (
  version INTEGER PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

The migration runner:
- ✅ Checks which migrations have been applied
- ✅ Only runs pending migrations
- ✅ Prevents duplicate executions
- ✅ Tracks application timestamp

## Complete Workflow Example

### 1. Create Migration
```bash
npm run migrate:create add_notifications_table
```

### 2. Edit Migration File
Edit `apps/backend/src/database/migrations/002_add_notifications_table.sql`:
```sql
-- UP MIGRATION
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  message TEXT,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(read);
```

### 3. Apply Migration
```bash
npm run migrate
```

**Console Output:**
```
🚀 Starting database migrations...

📋 Found 1 migration(s)
✅ Already migrated: 1 version(s)

🔨 Need to run 1 migration(s):
   - 2: 002_add_notifications_table

🔄 Running migration 2: 002_add_notifications_table

📝 SQL to execute:
──────────────────────────────────────────────────
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ...
);
──────────────────────────────────────────────────

⚠️  IMPORTANT: For Supabase, you need to:
   1. Go to your Supabase Dashboard
   2. Click on "SQL Editor" in the left menu
   3. Create a new query
   4. Copy the SQL above
   5. Paste and run it

   Press Enter when done...
```

### 4. Execute in Supabase
1. Copy the SQL from console
2. Open https://app.supabase.com/project/ldogkuurhpyiiolbovuq/sql
3. Paste SQL in editor
4. Click "Run"
5. Press Enter in terminal

**Console Output:**
```
✅ Migration marked as complete

✅ All migrations completed successfully!

👋 Done!
```

## File Locations

```
/Users/gverma/Desktop/SuperThinks/Aldeia_chatbot_Combined/
└── apps/backend/
    ├── package.json                         ← Scripts added here
    └── src/database/
        ├── migrate.ts                       ← ✅ NEW: Supabase migration runner
        ├── create-migration.js              ← ✅ NEW: Migration creator
        └── migrations/
            ├── README.md                    ← ✅ NEW: Complete documentation
            └── run-migrations.ts            ← Existing: Generic runner
```

## Testing

All scripts have been tested and verified:

✅ **migrate:create** - Creates numbered migration files with templates  
✅ **migrate** - Runs Supabase migration workflow  
✅ **db:migrate** - Runs generic migrations (both SQLite and PostgreSQL)

## Next Steps

1. ✅ Migration system ready to use
2. ✅ Documentation complete
3. ✅ Scripts tested and working
4. 📝 Create migrations as needed for new features
5. 📝 Run `npm run migrate` to apply migrations

## Resources

- Migration README: `apps/backend/src/database/migrations/README.md`
- Migration Status: `MIGRATION_STATUS.md`
- Supabase Dashboard: https://app.supabase.com/project/ldogkuurhpyiiolbovuq

---

**Migration System Status:** ✅ **FULLY OPERATIONAL**

All migration tools are ready for development! 🎉
