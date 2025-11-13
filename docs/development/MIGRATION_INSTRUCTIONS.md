# Database Migration Instructions

## Current Status

Your Aldeia Chatbot application is almost ready for Phase 6 testing, but the database schema needs to be updated to support all Phase 5 features (billing, multi-tenancy, authentication).

## Problem Identified

The `users` table in your Supabase database is missing required columns:
- `password_hash` - Required for authentication
- `role` - Required for role-based access control
- `is_active` - Required for user account management

Additionally, several tables need to be created for Phase 5 features:
- `sessions` - JWT refresh token management
- `conversations` - Chat conversation sessions
- `subscriptions` - Stripe billing subscriptions
- `organizations` - Multi-tenant support
- `usage_quotas` - Usage tracking
- `payment_methods` - Payment information
- `invoices` - Billing invoices

## Solution: Apply Manual Migration

Since Supabase doesn't support executing DDL (Data Definition Language) statements via their REST API, you need to run the migration manually in the Supabase SQL Editor.

### Step-by-Step Instructions:

1. **Open Supabase Dashboard**
   - Go to: https://supabase.com/dashboard
   - Login to your account

2. **Select Your Project**
   - Click on your project: `oniivrremprhonwmmbaq`

3. **Open SQL Editor**
   - In the left sidebar, click on "SQL Editor"
   - Click "New Query" button

4. **Copy Migration SQL**
   - Open the file: `APPLY_MIGRATIONS_MANUALLY.sql` (in the root directory)
   - Select ALL content (Cmd+A / Ctrl+A)
   - Copy it (Cmd+C / Ctrl+C)

5. **Paste and Execute**
   - Paste the SQL into the Supabase SQL Editor
   - Click "Run" button (or press Cmd+Enter on Mac / Ctrl+Enter on Windows)
   - Wait for execution to complete (should take 10-30 seconds)

6. **Verify Success**
   - Look for the completion message in the output
   - Check the "Tables" section in the Table Editor to verify all tables exist
   - You should see tables like: users, sessions, conversations, subscriptions, organizations, etc.

## After Migration

Once the migration is complete:

1. **Test User Registration**
   ```bash
   ./test-phase6-simple.sh
   ```
   This should now pass all 8 integration tests.

2. **Verify Backend Connection**
   - The backend server is already running at http://localhost:3001
   - Check the health endpoint: http://localhost:3001/api/health

3. **Continue with Phase 6 Testing**
   - All Phase 6 integration tests should pass
   - You can proceed with testing all authentication and protected endpoints

## Troubleshooting

### If migration fails:
- Check that you're running it in the correct Supabase project
- Verify you have admin/owner permissions
- Try running the SQL in smaller sections if needed

### If tests still fail after migration:
- Restart the backend server to clear any caches
- Verify the migration completed successfully by checking if all tables exist
- Check backend logs at `/tmp/backend.log`

## What This Migration Does

### Part 1: Fixes Users Table
- Adds `password_hash`, `role`, and `is_active` columns
- Updates existing users with default values

### Part 2: Creates Core Tables
- Sessions table for JWT authentication
- Conversations table for chat sessions
- Analytics events table for tracking

### Part 3: Creates Phase 5 Tables
- Organizations (multi-tenancy)
- Organization members (team management)
- Subscriptions (Stripe billing)
- Usage quotas (rate limiting)
- Payment methods (billing info)
- Invoices (billing history)

### Part 4: Adds Foreign Keys
- Links conversations to organizations
- Links analytics to organizations
- Links users to Stripe customers

### Part 5: Creates Database Functions
- `update_updated_at_column()` - Auto-update timestamps
- `increment_message_usage()` - Track API usage
- `can_user_send_message()` - Check quota limits

### Part 6: Seeds Initial Data
- Creates free-tier subscriptions for all existing users

## Files Created

- **APPLY_MIGRATIONS_MANUALLY.sql** - The complete migration SQL (455 lines)
- **MIGRATION_INSTRUCTIONS.md** - This file
- **migrations/000_fix_users_schema.sql** - Users table fix (backup)
- **migrations/004_add_billing_and_tenancy.sql** - Phase 5 schema (backup)

## Next Steps

1. Apply the migration (follow instructions above)
2. Run integration tests: `./scripts/testing/test-phase6-simple.sh`
3. Verify all 8 tests pass
4. Continue with Phase 6 completion

---

**Need Help?** Check the backend logs or create an issue in the project repository.
