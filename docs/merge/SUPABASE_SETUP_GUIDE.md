# Supabase Setup Guide

**Date**: November 3, 2025
**Purpose**: Guide for setting up Supabase PostgreSQL database for Aldeia Chatbot

---

## 🎯 Overview

This guide walks through setting up a Supabase project to replace SQLite with PostgreSQL. We'll obtain the necessary credentials and configure the `.env.merge` file.

---

## 🚀 Step 1: Create Supabase Account & Project

### Option A: Using the Supabase Dashboard (Recommended)

1. **Visit Supabase**
   - Go to: https://supabase.com
   - Click "Start your project"

2. **Sign Up / Log In**
   - Sign up with GitHub, Google, or email
   - Verify your email if required

3. **Create New Project**
   - Click "New Project"
   - **Organization**: Select or create an organization
   - **Project Name**: `aldeia-chatbot` (or your preferred name)
   - **Database Password**: Generate a strong password (save it securely!)
   - **Region**: Choose closest to your location
   - **Pricing Plan**: Start with Free tier
   - Click "Create new project"

4. **Wait for Project Initialization**
   - This takes 1-2 minutes
   - Database will be automatically provisioned

---

## 🔑 Step 2: Get Your Credentials

Once your project is ready:

1. **Navigate to Settings**
   - Click on the gear icon (⚙️) in the sidebar
   - Go to "Project Settings" → "API"

2. **Copy the Following Credentials**:

   ```bash
   # Project URL
   SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co

   # Project API Keys
   SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

3. **Copy Database Connection Details**:
   - Go to "Project Settings" → "Database"
   - Copy the connection string:

   ```bash
   # Direct connection (for migrations)
   DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.xxxxxxxxxxxxx.supabase.co:5432/postgres

   # Pool connection (for app)
   SUPABASE_DB_URL=postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-us-west-1.pooler.supabase.com:6543/postgres
   ```

---

## 📝 Step 3: Update .env.merge File

Replace the placeholder values in `.env.merge`:

### Before (Placeholders):
```bash
# === DATABASE (PostgreSQL/Supabase) ===
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
DATABASE_URL=postgresql://postgres:your_password@your_host:5432/postgres
SUPABASE_DB_URL=postgresql://postgres.your_ref:your_password@pooler:6543/postgres
```

### After (With Your Actual Credentials):
```bash
# === DATABASE (PostgreSQL/Supabase) ===
SUPABASE_URL=https://abcdefghijklmno.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ubyIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNjk5MjAwMDAwLCJleHAiOjIwMTQ3NzYwMDB9.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ubyIsInJvbGUiOiJzZXJ2aWNlX3JvbGUiLCJpYXQiOjE2OTkyMDAwMDAsImV4cCI6MjAxNDc3NjAwMH0.yyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy
DATABASE_URL=postgresql://postgres:YourSecurePassword123!@db.abcdefghijklmno.supabase.co:5432/postgres
SUPABASE_DB_URL=postgresql://postgres.abcdefghijklmno:YourSecurePassword123!@aws-0-us-west-1.pooler.supabase.com:6543/postgres
```

---

## 🔐 Step 4: Secure Your Credentials

### ⚠️ IMPORTANT SECURITY NOTES

1. **Never commit `.env.merge` to git**
   - Already in `.gitignore` ✅
   - Double-check: `git check-ignore .env.merge` should return `.env.merge`

2. **Use Different Credentials for Production**
   - Current setup is for development
   - Create separate Supabase project for production

3. **Protect Service Role Key**
   - `SUPABASE_SERVICE_ROLE_KEY` has admin access
   - Only use server-side, never expose to frontend
   - Frontend should only use `SUPABASE_ANON_KEY`

4. **Database Password**
   - Save your database password in a password manager
   - You'll need it for direct database access and migrations

---

## 🛠️ Step 5: Test Connection (Optional)

### Using Supabase CLI

If you have a Supabase access token:

```bash
# Set access token
export SUPABASE_ACCESS_TOKEN=your_access_token_here

# Login with token
npx supabase login

# Link to your project
npx supabase link --project-ref your-project-ref
```

### Using Node.js (Recommended)

Create a quick test script:

```bash
# Create test file
cat > test-supabase-connection.js << 'EOF'
require('dotenv').config({ path: '.env.merge' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function testConnection() {
  try {
    console.log('🔍 Testing Supabase connection...');
    console.log('URL:', process.env.SUPABASE_URL);

    // Simple query to test connection
    const { data, error } = await supabase
      .from('_test')
      .select('*')
      .limit(1);

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = table doesn't exist (that's OK for now)
      throw error;
    }

    console.log('✅ Supabase connection successful!');
    console.log('📊 Database is ready for schema creation.');
  } catch (err) {
    console.error('❌ Connection failed:', err.message);
    process.exit(1);
  }
}

testConnection();
EOF

# Run test
node test-supabase-connection.js
```

---

## 📚 Step 6: Next Steps

After configuring credentials:

1. ✅ **Credentials configured in `.env.merge`**
2. ⏭️ **Create PostgreSQL schema** (Run schema migration scripts)
3. ⏭️ **Migrate data from SQLite** (1 user, 13 analytics records)
4. ⏭️ **Test database operations**
5. ⏭️ **Switch backend to PostgreSQL** (`USE_SQLITE=false`)

---

## 🆘 Troubleshooting

### Issue: "Project initialization taking too long"
**Solution**: Wait 2-3 minutes. Refresh the page. Check Supabase status page.

### Issue: "Cannot find Project API Keys"
**Solution**:
1. Ensure project initialization is complete (green checkmark)
2. Navigate to Settings → API
3. Keys are under "Project API keys" section

### Issue: "Connection refused" or "Invalid credentials"
**Solution**:
1. Verify URL format: `https://xxxxx.supabase.co` (no trailing slash)
2. Check for copy-paste errors (keys are very long)
3. Ensure you copied the full key (scroll horizontally if needed)
4. Verify database password doesn't contain special characters that need escaping

### Issue: "FATAL: password authentication failed"
**Solution**:
1. Double-check database password
2. URL-encode special characters in password
3. Reset database password in Supabase dashboard if needed

---

## 📖 Additional Resources

- **Supabase Documentation**: https://supabase.com/docs
- **Database Migrations**: https://supabase.com/docs/guides/database/migrations
- **Connection Pooling**: https://supabase.com/docs/guides/database/connecting-to-postgres#connection-pooler
- **Security Best Practices**: https://supabase.com/docs/guides/auth/managing-user-data

---

## ✅ Verification Checklist

- [ ] Supabase account created
- [ ] Project created and initialized
- [ ] Credentials copied from dashboard
- [ ] `.env.merge` updated with real credentials
- [ ] Database password saved securely
- [ ] Connection test passed (optional)
- [ ] Ready for schema creation

---

**Once you've completed this setup, we can proceed with creating the PostgreSQL schema and migrating data!**
