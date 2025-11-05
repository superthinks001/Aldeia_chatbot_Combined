# Get Supabase Credentials

Your Supabase account is active, but we need the correct database password. Follow these steps:

## Step 1: Get Database Password

1. **Go to your Supabase Dashboard**: https://supabase.com/dashboard
2. **Select your project**: `ldogkuurhpyiiolbovuq`
3. **Click on** ⚙️ **Settings** (gear icon in left sidebar)
4. **Click on** "Database" (in the Settings submenu)
5. **Scroll down to "Connection string"**
6. **Look for "Connection pooling" section**
7. **Copy the "URI" connection string**

It should look like:
```
postgresql://postgres.ldogkuurhpyiiolbovuq:[YOUR-PASSWORD]@aws-0-us-west-1.pooler.supabase.com:6543/postgres
```

## Step 2: Update .env.merge

Replace the DATABASE_URL in `.env.merge` with the connection string you just copied.

**IMPORTANT**: If your password contains special characters, we'll URL-encode it automatically.

## Step 3: Alternative - Use Password Directly

If you have your database password (the one you set when creating the project):

1. **Go to** Settings → Database
2. **Find "Database password"** section
3. **If you forgot it**, click "Reset database password"
4. **Copy the new password**

Then I'll help you construct the correct DATABASE_URL.

---

## Quick Test

Once you have the correct credentials, we can verify with:

```bash
node test-supabase-connection.js
```

## What's Working

✅ Your Supabase URL is correct: `https://ldogkuurhpyiiolbovuq.supabase.co`
✅ Your Supabase keys (ANON_KEY, SERVICE_ROLE_KEY) are valid
❌ The DATABASE_URL password needs to be corrected

---

## Need Help?

Let me know when you have the correct connection string or password, and I'll help you update the configuration!
