# Aldeia Chatbot - Migration Guide

**Version**: 1.0.0
**Last Updated**: January 6, 2025
**Target Audience**: Developers and administrators migrating from standalone chatbot to merged version

---

## Table of Contents

1. [Overview](#overview)
2. [Pre-Migration Checklist](#pre-migration-checklist)
3. [Breaking Changes](#breaking-changes)
4. [Database Migration](#database-migration)
5. [Authentication Migration](#authentication-migration)
6. [API Client Updates](#api-client-updates)
7. [Configuration Changes](#configuration-changes)
8. [Testing After Migration](#testing-after-migration)
9. [Rollback Plan](#rollback-plan)
10. [FAQ](#faq)

---

## Overview

This guide helps you migrate from the standalone Aldeia Chatbot to the merged version (v1.0.0) that includes:

- **PostgreSQL database** (from SQLite)
- **JWT access + refresh token authentication** (from simple JWT)
- **Billing and subscriptions** (Stripe integration)
- **Multi-tenancy support**
- **Role-based access control (RBAC)**
- **Enhanced conversation persistence**
- **Production deployment infrastructure**

### Migration Timeline

**Estimated Time**: 2-4 hours (depending on data volume)

**Recommended Schedule**:
1. **Day 1 Morning**: Read documentation and prepare environment
2. **Day 1 Afternoon**: Perform migration in development environment
3. **Day 2 Morning**: Test thoroughly
4. **Day 2 Afternoon**: Production migration during low-traffic window

---

## Pre-Migration Checklist

### ✅ Before You Begin

- [ ] **Read all documentation**:
  - [CHANGELOG.md](CHANGELOG.md) - All changes
  - [API_DOCUMENTATION.md](API_DOCUMENTATION.md) - New API endpoints
  - [DEPLOYMENT.md](DEPLOYMENT.md) - Deployment procedures
  - [ROLLBACK_PROCEDURE.md](ROLLBACK_PROCEDURE.md) - Emergency procedures

- [ ] **Backup everything**:
  - [ ] SQLite database file
  - [ ] Application code
  - [ ] Configuration files (.env)
  - [ ] User uploaded documents
  - [ ] Server configuration

- [ ] **Set up new infrastructure**:
  - [ ] PostgreSQL/Supabase account and project
  - [ ] Redis instance (optional but recommended)
  - [ ] Stripe account (if using billing features)
  - [ ] Google Cloud account (if using translation)
  - [ ] Sentry account (optional, for error monitoring)

- [ ] **Prepare new environment variables**:
  - [ ] Database connection strings
  - [ ] JWT secrets (generate new ones)
  - [ ] Stripe API keys
  - [ ] Google Translate API key
  - [ ] Redis connection details

- [ ] **Test in development first**:
  - [ ] Set up development environment
  - [ ] Run migration scripts
  - [ ] Verify all features work
  - [ ] Test client applications

- [ ] **Schedule maintenance window**:
  - [ ] Notify users of downtime
  - [ ] Choose low-traffic time
  - [ ] Allocate 2-4 hours
  - [ ] Prepare rollback plan

---

## Breaking Changes

### 1. Authentication System

#### Old System (Simple JWT)
```javascript
// Old login response
{
  "success": true,
  "data": {
    "user": { "id": "user_123", "name": "John", "email": "john@example.com" },
    "token": "eyJhbGc..." // Single token, no expiration handling
  }
}

// Old API call
fetch('/api/chat', {
  headers: { 'Authorization': `Bearer ${token}` }
})
```

#### New System (Access + Refresh Tokens)
```javascript
// New login response
{
  "success": true,
  "data": {
    "user": { "id": "user_123", "name": "John", "email": "john@example.com", "role": "user" },
    "tokens": {
      "accessToken": "eyJhbGc...", // Expires in 24h
      "refreshToken": "eyJhbGc..." // Expires in 30d
    }
  }
}

// New API call with token refresh logic
async function apiCall(url, options = {}) {
  let accessToken = localStorage.getItem('accessToken');

  let response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${accessToken}`
    }
  });

  // If token expired, refresh it
  if (response.status === 401) {
    const refreshToken = localStorage.getItem('refreshToken');
    const refreshResponse = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken })
    });

    if (refreshResponse.ok) {
      const data = await refreshResponse.json();
      localStorage.setItem('accessToken', data.data.tokens.accessToken);
      localStorage.setItem('refreshToken', data.data.tokens.refreshToken);

      // Retry original request
      response = await fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          'Authorization': `Bearer ${data.data.tokens.accessToken}`
        }
      });
    } else {
      // Refresh failed, redirect to login
      window.location.href = '/login';
    }
  }

  return response;
}
```

**Migration Steps**:
1. Update login/register response handling to store both tokens
2. Implement token refresh logic in API client
3. Handle 401 errors by refreshing tokens
4. Update logout to invalidate refresh token

---

### 2. Database Changes

#### Old: SQLite
- Local file-based database
- No connection pooling
- Limited concurrent connections
- Simple schema

#### New: PostgreSQL
- Cloud-hosted (Supabase) or self-hosted
- Connection pooling required
- Unlimited concurrent connections
- Enhanced schema with new tables

**Migration Steps**: See [Database Migration](#database-migration) section below

---

### 3. API Endpoint Changes

#### Changed Endpoints

| Old Endpoint | New Endpoint | Changes |
|-------------|-------------|---------|
| `/auth/login` | `/auth/login` | Response includes both tokens |
| `/auth/register` | `/auth/register` | Response includes both tokens |
| `/auth/profile` | `/auth/profile` | Returns more user fields |
| N/A | `/auth/refresh` | NEW: Refresh access token |
| N/A | `/auth/verify` | NEW: Verify token validity |
| N/A | `/auth/change-password` | NEW: Change password |
| N/A | `/auth/logout` | NEW: Logout single session |
| N/A | `/auth/logout-all` | NEW: Logout all sessions |

#### New Endpoints

**Billing** (if using subscriptions):
- `GET /billing/plans`
- `GET /billing/subscription`
- `POST /billing/checkout`
- `POST /billing/portal`
- `GET /billing/usage`
- `GET /billing/can-send-message`

**Admin** (for admin users):
- `GET /chat/admin/analytics`
- `GET /chat/admin/users`
- `GET /chat/admin/documents`
- `POST /chat/admin/documents/reindex`

See [API_DOCUMENTATION.md](API_DOCUMENTATION.md) for complete API reference.

---

### 4. Configuration Changes

#### New Required Environment Variables

```bash
# JWT Authentication (GENERATE NEW SECRETS!)
JWT_SECRET=<64-char-secret>
JWT_REFRESH_SECRET=<64-char-secret-different-from-above>
JWT_EXPIRATION=24h
JWT_REFRESH_EXPIRATION=30d

# Database (PostgreSQL/Supabase)
DATABASE_URL=postgresql://user:password@host:5432/database
SUPABASE_URL=https://project-id.supabase.co
SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>

# Redis (optional but recommended)
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=<redis-password>

# Billing (optional, if using Stripe)
STRIPE_SECRET_KEY=sk_live_<your-key>
STRIPE_PUBLISHABLE_KEY=pk_live_<your-key>
STRIPE_WEBHOOK_SECRET=whsec_<your-secret>

# Translation (optional)
GOOGLE_TRANSLATE_API_KEY=<your-google-api-key>

# Monitoring (optional)
SENTRY_DSN=https://<key>@sentry.io/<project>
```

#### Generate New Secrets

```bash
# Generate JWT secrets (64 characters minimum)
openssl rand -base64 64

# Generate refresh token secret (must be different from JWT_SECRET)
openssl rand -base64 64

# Generate session secret
openssl rand -base64 32

# Generate Redis password
openssl rand -base64 32

# Generate ChromaDB token
openssl rand -base64 32
```

**⚠️ IMPORTANT**: Never reuse production secrets in development or vice versa!

---

## Database Migration

### Step 1: Backup SQLite Database

```bash
# Backup SQLite database file
cp data/chatbot.db data/chatbot.db.backup

# Export as SQL dump (optional, for reference)
sqlite3 data/chatbot.db .dump > backup.sql

# Verify backup
ls -lh data/chatbot.db.backup
```

### Step 2: Set Up PostgreSQL Database

#### Option A: Using Supabase (Recommended)

1. **Create Supabase project**:
   - Go to [supabase.com](https://supabase.com)
   - Click "New Project"
   - Choose region closest to your users
   - Note the project credentials

2. **Get connection details**:
   - Project URL: `https://your-project-id.supabase.co`
   - Anon key: From project settings
   - Service role key: From project settings
   - Database URL: From database settings

3. **Enable connection pooling**:
   - Go to Database → Connection Pooling
   - Enable pooler
   - Note the pooler connection string

#### Option B: Self-Hosted PostgreSQL

1. **Install PostgreSQL**:
   ```bash
   # Ubuntu/Debian
   sudo apt-get install postgresql postgresql-contrib

   # macOS
   brew install postgresql
   ```

2. **Create database and user**:
   ```bash
   sudo -u postgres psql

   CREATE DATABASE aldeia_chatbot;
   CREATE USER aldeia_user WITH ENCRYPTED PASSWORD 'your_secure_password';
   GRANT ALL PRIVILEGES ON DATABASE aldeia_chatbot TO aldeia_user;
   \q
   ```

3. **Note connection string**:
   ```
   postgresql://aldeia_user:your_secure_password@localhost:5432/aldeia_chatbot
   ```

### Step 3: Configure Database Connection

Update your `.env` file:

```bash
# For Supabase
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-ID].supabase.co:5432/postgres
SUPABASE_URL=https://[PROJECT-ID].supabase.co
SUPABASE_ANON_KEY=[YOUR-ANON-KEY]
SUPABASE_SERVICE_ROLE_KEY=[YOUR-SERVICE-ROLE-KEY]

# For self-hosted
DATABASE_URL=postgresql://aldeia_user:your_password@localhost:5432/aldeia_chatbot
```

### Step 4: Run Database Migrations

```bash
# Navigate to project directory
cd /path/to/Aldeia_chatbot_Combined

# Install dependencies
npm install

# Run schema migrations
npm run migrate

# Or manually with Node.js
node apps/backend/src/database/migrate.ts
```

**Expected Output**:
```
Running migrations...
✓ Migration 000_users_schema_fixes - Applied successfully
✓ Migration 003_add_conversation_messages - Applied successfully
✓ Migration 004_add_billing_and_tenancy - Applied successfully
All migrations completed successfully!
```

### Step 5: Migrate Data from SQLite

```bash
# Run data migration script
node migrations/migrate-from-sqlite.js

# Verify data migration
node verify-data-comparison.js
```

**Expected Output**:
```
Starting data migration from SQLite to PostgreSQL...

Migrating users...
✓ Migrated 150 users

Migrating analytics...
✓ Migrated 1,250 analytics records

Migrating documents...
✓ Migrated 25 documents

Migration completed successfully!
Total records migrated: 1,425
```

### Step 6: Verify Data Integrity

```bash
# Connect to PostgreSQL
psql $DATABASE_URL

# Check table counts
SELECT 'users' as table_name, COUNT(*) FROM users
UNION ALL
SELECT 'analytics', COUNT(*) FROM analytics
UNION ALL
SELECT 'documents', COUNT(*) FROM documents;

# Sample user data
SELECT id, email, name, role, created_at FROM users LIMIT 5;

# Exit
\q
```

### Step 7: Test Database Connection

```bash
# Test backend connection
npm run test:db

# Or manually
node apps/backend/test-db.ts
```

**Expected Output**:
```
Testing PostgreSQL connection...
✓ Connected successfully
✓ Schema exists
✓ Tables created: users, analytics, documents, conversations, messages
Database connection test passed!
```

---

## Authentication Migration

### Step 1: Update Backend

The backend is already updated in the merged version. Ensure you're using the new auth routes:

```typescript
// apps/backend/src/index.ts
import authRoutes from './routes/auth.routes'; // NEW auth system
app.use('/api/auth', authRoutes);
```

### Step 2: Update Frontend/Client Applications

#### Login Flow

**Old Code**:
```javascript
async function login(email, password) {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });

  const data = await response.json();
  localStorage.setItem('token', data.data.token);
  return data.data.user;
}
```

**New Code**:
```javascript
async function login(email, password) {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });

  const data = await response.json();

  // Store BOTH tokens
  localStorage.setItem('accessToken', data.data.tokens.accessToken);
  localStorage.setItem('refreshToken', data.data.tokens.refreshToken);

  // Store user info
  localStorage.setItem('user', JSON.stringify(data.data.user));

  return data.data.user;
}
```

#### Token Refresh Implementation

```javascript
// Token refresh utility
async function refreshAccessToken() {
  const refreshToken = localStorage.getItem('refreshToken');

  if (!refreshToken) {
    throw new Error('No refresh token available');
  }

  const response = await fetch('/api/auth/refresh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken })
  });

  if (!response.ok) {
    // Refresh token expired or invalid
    localStorage.clear();
    window.location.href = '/login';
    throw new Error('Token refresh failed');
  }

  const data = await response.json();

  // Update tokens
  localStorage.setItem('accessToken', data.data.tokens.accessToken);
  localStorage.setItem('refreshToken', data.data.tokens.refreshToken);

  return data.data.tokens.accessToken;
}

// API call wrapper with automatic token refresh
async function authenticatedFetch(url, options = {}) {
  let accessToken = localStorage.getItem('accessToken');

  // First attempt
  let response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${accessToken}`
    }
  });

  // If unauthorized, try refreshing token
  if (response.status === 401) {
    try {
      accessToken = await refreshAccessToken();

      // Retry with new token
      response = await fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          'Authorization': `Bearer ${accessToken}`
        }
      });
    } catch (error) {
      // Redirect to login if refresh fails
      window.location.href = '/login';
      throw error;
    }
  }

  return response;
}
```

#### Proactive Token Refresh

```javascript
// Decode JWT to check expiration (requires jwt-decode library)
import jwtDecode from 'jwt-decode';

function isTokenExpiringSoon(token, bufferMinutes = 5) {
  try {
    const decoded = jwtDecode(token);
    const expiresAt = decoded.exp * 1000; // Convert to milliseconds
    const now = Date.now();
    const bufferMs = bufferMinutes * 60 * 1000;

    return expiresAt - now < bufferMs;
  } catch (error) {
    return true; // If can't decode, assume expired
  }
}

// Check and refresh token before making API calls
async function ensureValidToken() {
  const accessToken = localStorage.getItem('accessToken');

  if (!accessToken || isTokenExpiringSoon(accessToken)) {
    await refreshAccessToken();
  }
}

// Use before important API calls
async function sendChatMessage(message) {
  await ensureValidToken();
  return authenticatedFetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message })
  });
}
```

#### Logout Implementation

```javascript
async function logout() {
  const refreshToken = localStorage.getItem('refreshToken');

  // Call logout endpoint
  await authenticatedFetch('/api/auth/logout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken })
  });

  // Clear local storage
  localStorage.clear();

  // Redirect to login
  window.location.href = '/login';
}

// Logout from all devices
async function logoutAll() {
  await authenticatedFetch('/api/auth/logout-all', {
    method: 'POST'
  });

  localStorage.clear();
  window.location.href = '/login';
}
```

### Step 3: Handle Existing Users

Existing users need to log in again with their credentials. Their accounts will be automatically migrated from SQLite to PostgreSQL during the data migration.

**User Communication Template**:

```
Subject: System Upgrade - Please Log In Again

Dear Valued User,

We've upgraded the Aldeia Chatbot system with enhanced security and new features.

As part of this upgrade, you'll need to log in again using your existing email and password. Your account data has been preserved and is ready for you.

What's New:
- Enhanced security with improved authentication
- Better performance and reliability
- New features (if applicable: billing, voice input, multi-language)

If you experience any issues logging in, please contact support.

Thank you for your patience!
- The Aldeia Team
```

---

## API Client Updates

### Update API Base URL (if changed)

```javascript
// Old
const API_BASE = 'http://localhost:3000/api';

// New
const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';
```

### Update Chat Message Sending

**Old Code**:
```javascript
async function sendMessage(message) {
  const token = localStorage.getItem('token');

  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ message })
  });

  return response.json();
}
```

**New Code**:
```javascript
async function sendMessage(message, conversationId = null) {
  const response = await authenticatedFetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message,
      conversationId, // Track conversation
      isFirstMessage: !conversationId,
      userProfile: {
        name: user.name,
        language: user.language || 'en',
        county: user.county
      }
    })
  });

  const data = await response.json();

  // Store conversation ID for subsequent messages
  if (data.conversationId && !conversationId) {
    setConversationId(data.conversationId);
  }

  return data;
}
```

### Update User Profile Fetching

```javascript
async function getUserProfile() {
  const response = await authenticatedFetch('/api/auth/profile');
  const data = await response.json();

  return data.data; // Note: data structure may have changed
}
```

---

## Configuration Changes

### Update Environment Files

1. **Copy production template**:
   ```bash
   cp .env.production .env
   ```

2. **Update all variables** (see [Configuration Changes](#4-configuration-changes) section above)

3. **Validate configuration**:
   ```bash
   # Check for placeholder values
   grep -E '^[A-Z_]+=.*REPLACE.*' .env && echo "⚠️ Warning: Found placeholder values!" || echo "✅ All placeholders replaced"
   ```

### Update Docker Configuration (if deploying with Docker)

1. **Use production Docker Compose file**:
   ```bash
   docker-compose -f docker-compose.production.yml up -d
   ```

2. **Verify services are running**:
   ```bash
   docker-compose -f docker-compose.production.yml ps
   ```

---

## Testing After Migration

### 1. Backend Health Check

```bash
# Test backend health
curl http://localhost:3001/api/health

# Expected response
{"status":"ok","timestamp":"2025-01-06T10:00:00Z"}
```

### 2. Database Connection Test

```bash
# Run database test
npm run test:db

# Or manually
node apps/backend/test-db.ts
```

### 3. Authentication Test

```bash
# Run authentication test script
chmod +x test-auth.sh
./test-auth.sh

# Expected output
Testing user registration...
✓ User registration successful (HTTP 201)

Testing user login...
✓ User login successful (HTTP 200)
✓ Access token received
✓ Refresh token received

Testing protected endpoint...
✓ Protected endpoint accessible with valid token (HTTP 200)

Testing token refresh...
✓ Token refresh successful (HTTP 200)

Testing unauthorized access protection...
✓ Unauthorized access properly rejected (HTTP 401)

All tests passed!
```

### 4. Chat Functionality Test

```bash
# Test chat endpoint
curl -X POST http://localhost:3001/api/chat \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "How do I apply for debris removal?",
    "isFirstMessage": false
  }'

# Expected: Response with answer from documents
```

### 5. Billing Test (if enabled)

```bash
# Get subscription plans
curl http://localhost:3001/api/billing/plans

# Get user subscription (requires auth)
curl http://localhost:3001/api/billing/subscription \
  -H "Authorization: Bearer <access_token>"
```

### 6. Admin Features Test (if admin user)

```bash
# Get analytics summary
curl http://localhost:3001/api/chat/admin/analytics \
  -H "Authorization: Bearer <admin_access_token>"

# Get user list
curl http://localhost:3001/api/chat/admin/users \
  -H "Authorization: Bearer <admin_access_token>"
```

### 7. Load Testing (Optional)

```bash
# Install artillery (if not installed)
npm install -g artillery

# Run load test
artillery quick --count 10 --num 50 http://localhost:3001/api/health
```

---

## Rollback Plan

If migration fails or critical issues are discovered, follow these steps:

### Quick Rollback (Emergency)

```bash
# 1. Stop new services
docker-compose -f docker-compose.production.yml down

# 2. Restore backup tag
git checkout pre-merge-backup-YYYYMMDD-HHMMSS

# 3. Restore SQLite database
cp data/chatbot.db.backup data/chatbot.db

# 4. Restart old services
npm install
npm run dev

# 5. Verify old system works
curl http://localhost:3000/api/health
```

### Detailed Rollback Procedure

See [ROLLBACK_PROCEDURE.md](ROLLBACK_PROCEDURE.md) for comprehensive rollback instructions.

---

## FAQ

### Q: Will my existing users need to create new accounts?

**A**: No, existing users can log in with their same email and password. Their data is migrated from SQLite to PostgreSQL automatically.

### Q: Can I run the old and new systems in parallel?

**A**: Yes, during testing phase. Run old system on port 3000 and new system on port 3001. However, they should use separate databases.

### Q: What happens to existing chat conversations?

**A**: Analytics data (messages, events) are migrated. However, in-memory conversation context is not preserved (it was session-based). Users will start fresh conversations after migration.

### Q: Do I need to enable billing/subscriptions?

**A**: No, billing is optional. You can disable it by not configuring Stripe keys. All users will have unlimited access by default.

### Q: How do I migrate custom modifications?

**A**:
1. Document your customizations
2. Apply them to the new codebase after migration
3. Test thoroughly
4. Consider contributing back to the project

### Q: Can I keep using SQLite instead of PostgreSQL?

**A**: Not recommended for production. The new version is optimized for PostgreSQL. SQLite support may be limited or removed in future versions.

### Q: What if I encounter errors during migration?

**A**:
1. Check logs: `docker-compose logs` or `npm run dev`
2. Verify environment variables are correct
3. Ensure database is accessible
4. Check [TROUBLESHOOTING](#troubleshooting) section
5. Contact support if issues persist

### Q: How long does migration take?

**A**:
- Small dataset (<1000 users): 30-60 minutes
- Medium dataset (1000-10000 users): 1-2 hours
- Large dataset (>10000 users): 2-4 hours

### Q: Do I need to notify users?

**A**: Yes, recommended. Users will need to log in again and may experience brief downtime during migration.

### Q: Can I test migration without affecting production?

**A**: Yes! Set up a staging environment:
1. Clone production data to staging database
2. Run migration on staging
3. Test thoroughly
4. Apply learnings to production migration

---

## Troubleshooting

### Database Connection Errors

**Problem**: "Connection refused" or "Unable to connect to database"

**Solutions**:
1. Verify DATABASE_URL is correct
2. Check database server is running
3. Verify firewall allows connections
4. Test connection manually: `psql $DATABASE_URL`

### Migration Script Fails

**Problem**: Migration scripts exit with errors

**Solutions**:
1. Check database credentials
2. Verify database is empty (no conflicting tables)
3. Run migrations one by one manually
4. Check error logs for specific issues

### Token Errors After Migration

**Problem**: "Invalid token" or "Token expired" errors

**Solutions**:
1. Clear all local storage/cookies
2. Log in again to get new tokens
3. Verify JWT secrets are configured correctly
4. Check server time is synchronized (NTP)

### Missing User Data

**Problem**: Users can't log in or data is missing

**Solutions**:
1. Verify data migration completed: `node verify-data-comparison.js`
2. Check user count in PostgreSQL matches SQLite
3. Look for migration errors in logs
4. Re-run data migration if needed

### Performance Issues

**Problem**: Slow response times after migration

**Solutions**:
1. Enable connection pooling
2. Add database indexes
3. Configure Redis caching
4. Check ChromaDB is running
5. Monitor resource usage: `docker stats`

---

## Support

If you encounter issues during migration:

1. **Check documentation**:
   - [DEPLOYMENT.md](DEPLOYMENT.md)
   - [API_DOCUMENTATION.md](API_DOCUMENTATION.md)
   - [CHANGELOG.md](CHANGELOG.md)

2. **Review logs**:
   ```bash
   # Backend logs
   docker-compose logs backend --tail=100

   # All services
   docker-compose logs --tail=50
   ```

3. **Contact support**:
   - Email: support@aldeia.com
   - GitHub Issues: https://github.com/superthinks001/Aldeia_Chatbot_Combined/issues

---

## Success Checklist

After completing migration, verify:

- [ ] All users can log in with existing credentials
- [ ] Chat functionality works correctly
- [ ] Conversations are persisted properly
- [ ] Authentication tokens refresh automatically
- [ ] Admin features accessible (if applicable)
- [ ] Billing works correctly (if enabled)
- [ ] Performance is acceptable
- [ ] No errors in logs
- [ ] Backup system configured
- [ ] Monitoring alerts set up
- [ ] Documentation updated
- [ ] Users notified of any changes

---

**Congratulations!** You've successfully migrated to Aldeia Chatbot v1.0.0!

**Last Updated**: January 6, 2025
**Version**: 1.0.0 - Production Release
