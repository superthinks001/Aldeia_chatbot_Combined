# Phase 2: Database Migration - Progress Report

**Phase**: 2 - Database Migration
**Status**: 🔄 In Progress (70% complete)
**Started**: November 3, 2025
**Last Updated**: November 3, 2025

---

## 📊 Progress Summary

### Completed ✅ (70%)

1. **Database Analysis**
   - Analyzed all 3 SQLite databases
   - Identified production database: `./aldeia.db` (1 user, 13 analytics records)
   - Documented schema and data structure
   - Created [SQLITE_DATABASE_ANALYSIS.md](./SQLITE_DATABASE_ANALYSIS.md)

2. **Schema Design**
   - Designed enhanced PostgreSQL schema
   - Added authentication tables (users, sessions)
   - Added conversation tracking (conversations)
   - Enhanced analytics with JSONB metadata
   - Added document management for RAG (documents, document_chunks)
   - Included Row Level Security (RLS) policies for Supabase

3. **Migration Scripts**
   - Created `001_create_schema.sql` - Complete PostgreSQL schema
   - Created `002_migrate_sqlite_data.sql` - Manual migration reference
   - Created `migrate-from-sqlite.js` - Automated migration tool
   - Added verification and error handling

4. **Documentation**
   - Created [SUPABASE_SETUP_GUIDE.md](./SUPABASE_SETUP_GUIDE.md)
   - Created [migrations/README.md](../migrations/README.md)
   - Updated [PHASE_TRACKER.md](./PHASE_TRACKER.md)
   - Documented troubleshooting steps

### Pending ⏸️ (30%)

5. **Supabase Setup** (User Action Required)
   - Create Supabase account
   - Create project
   - Obtain credentials (URL, anon key, service role key)
   - Update `.env.merge` with real credentials

6. **Schema Deployment**
   - Run `001_create_schema.sql` on Supabase
   - Verify tables created successfully
   - Test RLS policies

7. **Data Migration**
   - Run `migrate-from-sqlite.js`
   - Verify 1 user migrated with hashed password
   - Verify 13 analytics records migrated
   - Test data integrity

8. **Backend Configuration**
   - Update backend to use PostgreSQL
   - Test database connections
   - Switch `USE_SQLITE=false`
   - Archive old SQLite databases

---

## 🗂️ Files Created

### Migration Scripts
- [`migrations/001_create_schema.sql`](../migrations/001_create_schema.sql) - PostgreSQL schema (6 tables, indexes, triggers, RLS)
- [`migrations/002_migrate_sqlite_data.sql`](../migrations/002_migrate_sqlite_data.sql) - Manual SQL migration reference
- [`migrations/migrate-from-sqlite.js`](../migrations/migrate-from-sqlite.js) - Automated Node.js migration tool
- [`migrations/README.md`](../migrations/README.md) - Complete migration instructions

### Documentation
- [`SQLITE_DATABASE_ANALYSIS.md`](./SQLITE_DATABASE_ANALYSIS.md) - SQLite database analysis and findings
- [`SUPABASE_SETUP_GUIDE.md`](./SUPABASE_SETUP_GUIDE.md) - Step-by-step Supabase setup
- [`PHASE2_PROGRESS.md`](./PHASE2_PROGRESS.md) - This file

---

## 🗄️ Database Schema Overview

### Tables Created

1. **users** - User accounts with authentication
   - Enhanced with: `password_hash`, `role`, `is_active`, `updated_at`
   - Indexes on: `email`, `role`, `is_active`

2. **sessions** - JWT refresh token management
   - Fields: `id`, `user_id`, `refresh_token`, `ip_address`, `user_agent`, `expires_at`
   - Indexes on: `user_id`, `refresh_token`, `expires_at`

3. **conversations** - Chatbot conversation tracking
   - Fields: `id`, `user_id`, `title`, `status`, `language`, `created_at`, `updated_at`
   - Indexes on: `user_id`, `status`, `created_at`

4. **analytics** - Enhanced event tracking
   - Upgraded: `meta` changed from TEXT to JSONB
   - Upgraded: `conversation_id` changed to UUID with FK
   - Indexes on: `user_id`, `conversation_id`, `event_type`, `timestamp`, `meta` (GIN)

5. **documents** - Document uploads for RAG
   - Fields: `id`, `user_id`, `filename`, `file_path`, `file_type`, `status`, `metadata`
   - Indexes on: `user_id`, `status`, `file_type`, `created_at`

6. **document_chunks** - Text chunks for vector embeddings
   - Fields: `id`, `document_id`, `chunk_index`, `content`, `embedding_id`, `metadata`
   - Indexes on: `document_id`, `chunk_index`, `embedding_id`

### Features Implemented

- ✅ Auto-updating timestamps (`updated_at` trigger)
- ✅ UUID generation for distributed IDs
- ✅ Row Level Security (RLS) policies
- ✅ Foreign key constraints with cascading deletes
- ✅ JSONB support for structured metadata
- ✅ GIN indexes for JSON queries
- ✅ Comprehensive indexes for performance

---

## 📈 Migration Statistics

### Current SQLite Data
- **Database**: `./aldeia.db`
- **Users**: 1 record (Admin, test@test.com)
- **Analytics**: 13 records
  - `user_message`: 5 events
  - `bot_response`: 5 events
  - `handoff`: 3 events
- **Date Range**: July 8-10, 2025
- **Database Size**: 60 KB

### Expected PostgreSQL Data
- **Users**: 1 record with bcrypt password hash
- **Analytics**: 13 records with JSONB metadata
- **Password**: Default set to `TestPassword123!` (to be changed)
- **Role**: Admin user will have `role='admin'`

---

## 🚀 Next Steps (User Action Required)

### Step 1: Create Supabase Account

Follow the guide: [SUPABASE_SETUP_GUIDE.md](./SUPABASE_SETUP_GUIDE.md)

1. Visit https://supabase.com
2. Sign up / Log in
3. Create new project: "aldeia-chatbot"
4. Wait for initialization (1-2 minutes)

### Step 2: Get Credentials

From Supabase Dashboard → Settings → API:

- Copy `SUPABASE_URL`
- Copy `SUPABASE_ANON_KEY`
- Copy `SUPABASE_SERVICE_ROLE_KEY`

From Supabase Dashboard → Settings → Database:

- Copy `DATABASE_URL` (direct connection)
- Copy `SUPABASE_DB_URL` (pooled connection)

### Step 3: Update .env.merge

Replace placeholders with actual credentials:

```bash
# Open .env.merge and update these fields
SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
DATABASE_URL=postgresql://postgres:password@db.xxxxxxxxxxxxx.supabase.co:5432/postgres
SUPABASE_DB_URL=postgresql://postgres.ref:password@pooler.supabase.com:6543/postgres
```

### Step 4: Run Schema Creation

**Option A**: Using Supabase SQL Editor (Recommended)
1. Go to Supabase Dashboard → SQL Editor
2. Copy contents of `migrations/001_create_schema.sql`
3. Paste and click "Run"

**Option B**: Using psql
```bash
source <(grep -v '^#' .env.merge | sed 's/^/export /')
psql $DATABASE_URL -f migrations/001_create_schema.sql
```

### Step 5: Run Data Migration

```bash
node migrations/migrate-from-sqlite.js
```

Expected output:
```
✅ Users migrated: 1
✅ Analytics migrated: 13
✅ Migration completed successfully!
```

### Step 6: Test & Verify

```bash
# Test login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@test.com", "password": "TestPassword123!"}'

# Switch to PostgreSQL
# In .env or .env.merge: USE_SQLITE=false

# Restart backend
npm run backend:dev
```

---

## 🔒 Security Checklist

- [ ] Supabase credentials stored securely (not in git)
- [ ] `.env.merge` is in `.gitignore`
- [ ] Different credentials for dev/staging/prod
- [ ] Default password changed after migration
- [ ] RLS policies tested and working
- [ ] Service role key only used server-side
- [ ] Connection pooling configured for app
- [ ] Database password is strong and unique

---

## 🐛 Known Issues & Limitations

### SQLite Compatibility
- **Issue**: Three SQLite databases found (root, apps, chatbot)
- **Resolution**: Using root `aldeia.db` as source; others are duplicates or empty
- **Action**: Archive all three after successful migration

### Data Volume
- **Issue**: Minimal data (1 user, 13 analytics)
- **Impact**: Low risk migration, easy to rollback
- **Note**: This appears to be test/development data

### Authentication
- **Issue**: Original SQLite has no password hashes
- **Resolution**: Migration script generates bcrypt hash for default password
- **Action**: Force password reset on first login

---

## 📊 Migration Verification

After migration, verify:

```sql
-- Check users
SELECT id, name, email, role, created_at FROM users;
-- Expected: 1 row (Admin, test@test.com, role=admin)

-- Check analytics
SELECT event_type, COUNT(*) FROM analytics GROUP BY event_type;
-- Expected: user_message: 5, bot_response: 5, handoff: 3

-- Check constraints
SELECT conname, contype FROM pg_constraint WHERE conrelid = 'users'::regclass;
-- Expected: Primary key, unique email constraint

-- Check indexes
SELECT indexname FROM pg_indexes WHERE tablename = 'analytics';
-- Expected: Multiple indexes on user_id, conversation_id, etc.
```

---

## 🔄 Rollback Plan

If migration fails:

1. Keep SQLite databases (don't delete yet)
2. Set `USE_SQLITE=true` in `.env`
3. Restart backend
4. Debug issues
5. Re-run migration after fixes

SQLite databases will remain until Phase 2 is 100% complete and verified in production.

---

## 📞 Support & Troubleshooting

### Common Errors

**Error**: "Cannot connect to PostgreSQL"
- Verify `DATABASE_URL` is correct
- Check Supabase project is active
- Test: `psql $DATABASE_URL -c "SELECT NOW();"`

**Error**: "bcrypt not installed"
- Run: `cd apps/backend && npm install bcrypt`
- Ensure you're in the backend directory

**Error**: "SQLite database locked"
- Stop all backend processes
- Close any DB browsers
- Wait 30 seconds and retry

### Need Help?

- Review: [migrations/README.md](../migrations/README.md)
- Check: [SUPABASE_SETUP_GUIDE.md](./SUPABASE_SETUP_GUIDE.md)
- Review: [SQLITE_DATABASE_ANALYSIS.md](./SQLITE_DATABASE_ANALYSIS.md)

---

## ✅ Phase 2 Completion Criteria

Phase 2 will be marked complete when:

- [x] SQLite database analyzed and documented
- [x] PostgreSQL schema designed and scripted
- [x] Migration scripts created and tested (locally)
- [ ] Supabase project created and configured
- [ ] Schema deployed to Supabase
- [ ] Data migrated from SQLite to PostgreSQL
- [ ] Migration verified (all data present and correct)
- [ ] Backend tested with PostgreSQL
- [ ] `USE_SQLITE=false` in production
- [ ] SQLite databases archived

**Current Status**: 70% complete, waiting on user to create Supabase account

---

**Ready to proceed?** Start with [SUPABASE_SETUP_GUIDE.md](./SUPABASE_SETUP_GUIDE.md) 🚀
