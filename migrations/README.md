# Database Migrations

This directory contains database migration scripts for migrating from SQLite to PostgreSQL/Supabase.

---

## 📋 Migration Files

### SQL Scripts

1. **[001_create_schema.sql](./001_create_schema.sql)**
   - Creates PostgreSQL schema (tables, indexes, constraints)
   - Includes: users, sessions, conversations, analytics, documents, document_chunks
   - Sets up Row Level Security (RLS) policies for Supabase
   - Adds triggers for automatic timestamp updates

2. **[002_migrate_sqlite_data.sql](./002_migrate_sqlite_data.sql)**
   - Manual SQL commands for data migration
   - Reference/template for understanding the migration
   - Use the Node.js script for automated migration

### Node.js Scripts

3. **[migrate-from-sqlite.js](./migrate-from-sqlite.js)**
   - Automated migration script (recommended)
   - Reads from SQLite, writes to PostgreSQL
   - Properly hashes passwords with bcrypt
   - Includes verification and rollback safety

---

## 🚀 Migration Process

### Prerequisites

1. **Supabase Project Setup**
   - Follow [SUPABASE_SETUP_GUIDE.md](../merge-docs/SUPABASE_SETUP_GUIDE.md)
   - Get your credentials and update `.env.merge`

2. **Dependencies Installed**
   ```bash
   cd apps/backend
   npm install
   cd ../..
   ```

3. **Environment Variables**
   - Ensure `.env.merge` has valid `DATABASE_URL` and Supabase credentials
   - SQLite database exists at `./aldeia.db`

---

## 📝 Step-by-Step Instructions

### Step 1: Create PostgreSQL Schema

Run the schema creation script using `psql` or Supabase SQL Editor:

#### Option A: Using psql (Direct Connection)

```bash
# Load environment variables
source <(grep -v '^#' .env.merge | sed 's/^/export /')

# Run schema creation
psql $DATABASE_URL -f migrations/001_create_schema.sql
```

#### Option B: Using Supabase SQL Editor (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy the contents of `001_create_schema.sql`
5. Paste and click **Run**
6. Verify success messages

#### Option C: Using Node.js with pg

```bash
# Create a temporary script
cat > run-schema.js << 'EOF'
require('dotenv').config({ path: '.env.merge' });
const { Pool } = require('pg');
const fs = require('fs');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function runSchema() {
  const sql = fs.readFileSync('migrations/001_create_schema.sql', 'utf8');
  await pool.query(sql);
  console.log('✅ Schema created successfully');
  await pool.end();
}

runSchema().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
EOF

# Run it
node run-schema.js

# Clean up
rm run-schema.js
```

### Step 2: Verify Schema Creation

```bash
# Check tables
psql $DATABASE_URL -c "\dt"

# Should show:
# - users
# - sessions
# - conversations
# - analytics
# - documents
# - document_chunks
```

### Step 3: Migrate Data from SQLite

```bash
# Run the automated migration script
node migrations/migrate-from-sqlite.js
```

**Expected Output:**
```
============================================================
SQLite to PostgreSQL Migration
============================================================
SQLite database: ./aldeia.db
PostgreSQL: configured
============================================================
✅ Connected to PostgreSQL
✅ Connected to SQLite database

📦 Migrating users...
Found 1 users in SQLite
  ✅ Migrated user: test@test.com (role: admin)
  ✅ Reset users sequence

📊 Migrating analytics...
Found 13 analytics records in SQLite
  ✅ Migrated 13 analytics records (0 skipped)

🔍 Verifying migration...
  Users in PostgreSQL: 1
  Analytics in PostgreSQL: 13

  Analytics by event type:
    - user_message: 5
    - bot_response: 5
    - handoff: 3

  Migrated users:
    - Admin (test@test.com) - Role: admin
      Default password: TestPassword123!

============================================================
Migration Summary
============================================================
Users migrated: 1
Analytics migrated: 13
Status: ✅ SUCCESS
============================================================

✅ Migration completed successfully!

📝 Next steps:
  1. Test user login with credentials:
     Email: test@test.com
     Password: TestPassword123!
  2. Update .env to set USE_SQLITE=false
  3. Test backend with PostgreSQL
  4. Archive SQLite database files
```

### Step 4: Verify Migration

```bash
# Connect to PostgreSQL
psql $DATABASE_URL

# Check users
SELECT id, name, email, role, created_at FROM users;

# Check analytics
SELECT event_type, COUNT(*) FROM analytics GROUP BY event_type;

# Exit
\q
```

### Step 5: Test Authentication

Update your backend to test the migrated user:

```bash
# Test login (adjust endpoint as needed)
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@test.com",
    "password": "TestPassword123!"
  }'

# Should return JWT tokens
```

### Step 6: Switch to PostgreSQL

Once verified, update your environment:

```bash
# In .env or .env.merge
USE_SQLITE=false
```

Restart your backend:

```bash
npm run backend:dev
```

### Step 7: Archive SQLite Databases

```bash
# Create archive directory
mkdir -p archive/sqlite-backups

# Move SQLite databases
mv aldeia.db archive/sqlite-backups/aldeia.db.backup-$(date +%Y%m%d)
mv apps/aldeia.db archive/sqlite-backups/apps-aldeia.db.backup-$(date +%Y%m%d)
mv chatbot/aldeia.db archive/sqlite-backups/chatbot-aldeia.db.backup-$(date +%Y%m%d)

# Verify they're backed up
ls -lh archive/sqlite-backups/
```

---

## 🔄 Rollback Instructions

If you need to rollback to SQLite:

1. **Stop the backend**
   ```bash
   # Stop any running processes
   pkill -f "node.*backend"
   ```

2. **Restore SQLite database**
   ```bash
   # If you archived them
   cp archive/sqlite-backups/aldeia.db.backup-YYYYMMDD aldeia.db
   ```

3. **Switch back to SQLite**
   ```bash
   # In .env or .env.merge
   USE_SQLITE=true
   ```

4. **Restart backend**
   ```bash
   npm run backend:dev
   ```

---

## 🐛 Troubleshooting

### Error: "Cannot connect to PostgreSQL"

**Solution:**
- Verify `DATABASE_URL` in `.env.merge`
- Check Supabase project is active
- Test connection: `psql $DATABASE_URL -c "SELECT NOW();"`

### Error: "SQLite database not found"

**Solution:**
- Verify `aldeia.db` exists in project root
- Check path in migration script
- Create empty database if needed: `touch aldeia.db`

### Error: "Password hash invalid"

**Solution:**
- Ensure bcrypt is installed: `npm install bcrypt`
- Check BCRYPT_ROUNDS is set to 10
- Verify password meets requirements

### Error: "Sequence not reset"

**Solution:**
- Manually reset sequence:
  ```sql
  SELECT setval('users_id_seq', (SELECT MAX(id) FROM users) + 1);
  ```

### Error: "Foreign key constraint violation"

**Solution:**
- Run migrations in order (schema first, data second)
- Verify schema exists: `\dt` in psql
- Check for orphaned references

---

## 📊 Migration Statistics

### Current SQLite Data (Pre-Migration)

- **Users**: 1 record
- **Analytics**: 13 records
- **Database Size**: 60 KB

### Expected PostgreSQL Data (Post-Migration)

- **Users**: 1 record (with hashed password)
- **Analytics**: 13 records (with JSONB meta)
- **Schema Size**: ~15 tables (including future tables)

---

## 🔒 Security Notes

1. **Default Password**
   - Migration sets password to `TestPassword123!`
   - **Change immediately** in production
   - Force password reset on first login

2. **Credentials**
   - Never commit `.env.merge` or credentials
   - Use different credentials for prod/staging/dev
   - Rotate `SERVICE_ROLE_KEY` regularly

3. **Database Access**
   - Use connection pooling for apps (port 6543)
   - Use direct connection for migrations (port 5432)
   - Limit `SERVICE_ROLE_KEY` usage to backend only

4. **Row Level Security**
   - RLS policies are enabled by default
   - Test policies before production
   - Disable RLS for service role queries if needed

---

## 📚 Additional Resources

- [Supabase Migrations Guide](https://supabase.com/docs/guides/database/migrations)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [bcrypt Best Practices](https://github.com/kelektiv/node.bcrypt.js#readme)

---

## ✅ Migration Checklist

- [ ] Supabase project created and configured
- [ ] `.env.merge` updated with credentials
- [ ] Schema created (001_create_schema.sql)
- [ ] Schema verified (tables exist)
- [ ] Data migrated (migrate-from-sqlite.js)
- [ ] Migration verified (record counts match)
- [ ] Test user login works
- [ ] Backend tested with PostgreSQL
- [ ] `USE_SQLITE=false` in .env
- [ ] SQLite databases archived
- [ ] Documentation updated

---

**Questions or issues?** Check [SQLITE_DATABASE_ANALYSIS.md](../merge-docs/SQLITE_DATABASE_ANALYSIS.md) for more details.
