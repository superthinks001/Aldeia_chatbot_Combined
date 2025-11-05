# Database Migrations

This directory contains SQL migration files for the Aldeia Chatbot database.

## Migration Scripts

The backend includes several migration-related npm scripts:

### Quick Reference

```bash
# Create a new migration file
npm run migrate:create <migration_name>

# Run Supabase migrations (interactive)
npm run migrate

# Run general migrations (SQLite/PostgreSQL)
npm run db:migrate

# Seed database with dev data
npm run db:seed

# Reset database (SQLite only)
npm run db:reset
```

## Creating a New Migration

### 1. Generate Migration File

```bash
npm run migrate:create add_new_table
```

This will create a new file: `001_add_new_table.sql` (number auto-increments)

### 2. Edit the Migration File

```sql
-- Migration: 001_add_new_table.sql
-- Description: add new table
-- Date: 2025-11-04
-- Author: Auto-generated

-- ============================================================================
-- UP MIGRATION
-- ============================================================================

CREATE TABLE new_table (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_new_table_name ON new_table(name);

-- ============================================================================
-- DOWN MIGRATION (for rollback)
-- ============================================================================

-- DROP TABLE IF EXISTS new_table;
```

### 3. Apply the Migration

For Supabase (current setup):
```bash
npm run migrate
```

This will:
- Show you the SQL to execute
- Provide instructions to run it in Supabase SQL Editor
- Wait for confirmation
- Track the migration as complete

## Migration File Naming Convention

Migrations are named with the pattern: `{number}_{description}.sql`

- `{number}`: 3-digit zero-padded number (001, 002, 003, etc.)
- `{description}`: Snake_case description (e.g., `add_users_table`)

Examples:
- `001_create_initial_schema.sql`
- `002_add_sessions_table.sql`
- `003_add_analytics_indexes.sql`

## Migration Tracking

Migrations are tracked in the `schema_migrations` table:

```sql
CREATE TABLE schema_migrations (
  version INTEGER PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Best Practices

### 1. **One Migration Per Change**
Each migration should contain a single logical change (e.g., one new table, one index addition).

### 2. **Always Include Rollback**
While the DOWN migration is commented out, always include rollback SQL for documentation.

### 3. **Test Before Running**
Test your SQL in a development environment before running on production.

### 4. **Use Transactions**
For PostgreSQL migrations with multiple statements:
```sql
BEGIN;

-- Your changes here

COMMIT;
```

### 5. **Add Comments**
Document what the migration does and why:
```sql
-- Adding user preferences table to support customizable dashboard layouts
-- Related to ticket: ALDEIA-123
CREATE TABLE user_preferences (
  ...
);
```

## Migration Workflow

### Development

1. **Create migration**: `npm run migrate:create feature_name`
2. **Edit SQL**: Add your database changes
3. **Apply migration**: `npm run migrate`
4. **Test**: Verify changes work as expected
5. **Commit**: Add migration file to git

### Supabase Workflow

Since we use Supabase, migrations require manual execution:

1. Run `npm run migrate`
2. Copy the displayed SQL
3. Go to [Supabase Dashboard](https://app.supabase.com)
4. Navigate to SQL Editor
5. Paste and execute the SQL
6. Press Enter in terminal to confirm
7. Migration is marked as complete

## Available Migration Runners

### 1. `migrate.ts` (Supabase-specific)
- **Location**: `src/database/migrate.ts`
- **Run with**: `npm run migrate`
- **Purpose**: Interactive migration for Supabase
- **Features**:
  - Tracks migrations via `schema_migrations` table
  - Displays SQL for manual execution
  - Skips already-applied migrations

### 2. `run-migrations.ts` (Generic)
- **Location**: `src/database/migrations/run-migrations.ts`
- **Run with**: `npm run db:migrate`
- **Purpose**: Automated migration for both SQLite and PostgreSQL
- **Features**:
  - Reads from root `/migrations/` directory
  - Auto-executes SQL
  - Supports both database types

## Troubleshooting

### Migration Already Applied
If you see "Database is up to date", the migration was already run. To re-run:
1. Delete the entry from `schema_migrations` table
2. Run `npm run migrate` again

### Syntax Error in Migration
1. Check SQL syntax in Supabase SQL Editor first
2. Fix the error in your migration file
3. Re-run the migration

### Foreign Key Constraint Error
Ensure:
1. Referenced tables exist before creating foreign keys
2. Data types match between foreign and primary keys
3. Referenced columns have indexes

## Example Migrations

### Adding a New Table
```sql
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  filename VARCHAR(255) NOT NULL,
  file_path TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_documents_user_id ON documents(user_id);
CREATE INDEX idx_documents_status ON documents(status);
```

### Adding a Column
```sql
ALTER TABLE users ADD COLUMN phone_number VARCHAR(20);
CREATE INDEX idx_users_phone ON users(phone_number);
```

### Adding an Index
```sql
CREATE INDEX idx_analytics_timestamp ON analytics(timestamp);
CREATE INDEX idx_analytics_event_type ON analytics(event_type);
```

### Modifying a Column
```sql
-- Add new column
ALTER TABLE users ADD COLUMN new_email VARCHAR(255);

-- Copy data
UPDATE users SET new_email = email;

-- Drop old column
ALTER TABLE users DROP COLUMN email;

-- Rename new column
ALTER TABLE users RENAME COLUMN new_email TO email;

-- Add constraint
ALTER TABLE users ALTER COLUMN email SET NOT NULL;
```

## Migration History

Current migrations in production:

- ✅ **001_create_schema_simple.sql** - Initial schema (November 4, 2025)
  - Created users, sessions, conversations, analytics, documents, document_chunks tables
  - Added indexes and triggers
  - No RLS (using JWT auth)

## Resources

- [PostgreSQL ALTER TABLE](https://www.postgresql.org/docs/current/sql-altertable.html)
- [Supabase SQL Editor](https://supabase.com/docs/guides/database/overview)
- [Database Migration Best Practices](https://www.prisma.io/dataguide/types/relational/migration-strategies)

---

**Note**: This migration system is designed for Supabase's architecture. Direct SQL execution is done via the Supabase Dashboard SQL Editor, with tracking done through the migration runner script.
