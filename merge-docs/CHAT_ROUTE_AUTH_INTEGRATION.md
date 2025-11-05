# Chat Route Authentication Integration

**Date**: November 5, 2025
**Status**: In Progress
**Purpose**: Integrate authentication system into chat routes

## Changes Made

### 1. Created New Services

#### Analytics Service (`apps/backend/src/services/analytics.service.ts`)
- **Purpose**: Replace old SQLite-based analytics with PostgreSQL
- **Methods**:
  - `logEvent()` - Log analytics events linked to authenticated users
  - `getUserAnalyticsSummary()` - Get analytics for a specific user
  - `getOverallSummary()` - Get system-wide analytics
  - `getRecentEvents()` - Get recent analytics events
  - `getConversationAnalytics()` - Get analytics for a conversation
  - `countEventsByType()` - Count events by type for a user

#### Conversations Service (`apps/backend/src/services/conversations.service.ts`)
- **Purpose**: Manage conversations and messages for authenticated users
- **Methods**:
  - `createOrGetConversation()` - Create or fetch existing conversation
  - `addMessage()` - Add user/bot message to conversation
  - `getConversationHistory()` - Get message history
  - `getUserConversations()` - Get user's conversations
  - `endConversation()` - Mark conversation as ended
  - `updateConversationMetadata()` - Update conversation metadata

### 2. Database Migration

#### Migration 003: conversation_messages table
- **File**: `migrations/003_add_conversation_messages.sql`
- **Status**: ✅ Successfully executed
- **Schema**:
  ```sql
  CREATE TABLE conversation_messages (
    id SERIAL PRIMARY KEY,
    conversation_id UUID NOT NULL REFERENCES conversations(id),
    sender VARCHAR(10) CHECK (sender IN ('user', 'bot')),
    message TEXT NOT NULL,
    intent VARCHAR(100),
    confidence DECIMAL(3, 2),
    bias BOOLEAN DEFAULT FALSE,
    ambiguous BOOLEAN DEFAULT FALSE,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );
  ```
- **Features**:
  - Foreign key to conversations table (UUID)
  - RLS (Row Level Security) policies
  - Indexes on conversation_id, created_at, sender

### 3. Chat Routes Updates (`apps/backend/src/routes/chat.ts`)

#### Imports Updated
- ✅ Changed from `Request` to `AuthRequest`
- ✅ Removed old database imports (`addOrUpdateUser`, `logAnalytics`, etc.)
- ✅ Added new service imports (`ConversationsService`, `AnalyticsService`)
- ✅ Added RBAC imports (`requireRole`, `requirePermission`)

#### Main Chat Route Updated
- ✅ Changed `router.post('/', async (req: Request` to `(req: AuthRequest`
- ✅ Added user authentication extraction:
  ```typescript
  const userId = req.user!.userId;
  const userEmail = req.user!.email;
  ```
- ✅ Replaced `addOrUpdateUser()` - No longer needed (user already authenticated)
- ✅ Replaced `logAnalytics()` calls with `AnalyticsService.logEvent()`:
  - User message events
  - Bot response events
  - Handoff events

#### Error Logging Updated
- ✅ Updated `logErrorToFile()` to use `AuthRequest`
- ✅ Added userId to error logs

### 4. Backup Created
- ✅ Backup file: `apps/backend/src/routes/chat.ts.pre-auth-backup`

## Remaining Tasks

### Admin Routes (Not Yet Updated)
The following admin routes still need to be updated:

1. **`/admin/analytics`** (line 517)
   - Needs: `requirePermission(Permission.READ_ANALYTICS)`
   - Update: Replace `getAnalyticsSummary()` with `AnalyticsService.getOverallSummary()`
   - Change to: `AuthRequest`

2. **`/admin/users`** (line 525)
   - Needs: `requirePermission(Permission.READ_USER)`
   - Update: Replace `getUsers()` with Supabase users query
   - Change to: `AuthRequest`

3. **`/admin/documents`** (line 533)
   - Needs: `requirePermission(Permission.MANAGE_CONTENT)`
   - Change to: `AuthRequest`

4. **`/admin/documents/reindex`** (line 558)
   - Needs: `requirePermission(Permission.MANAGE_CONTENT)`
   - Change to: `AuthRequest`

5. **`/admin/documents/upload`** (line 567)
   - Needs: `requirePermission(Permission.MANAGE_CONTENT)`
   - Change to: `AuthRequest`

6. **`/bias-logs`** (line 503)
   - Needs: `requirePermission(Permission.VIEW_SYSTEM_LOGS)`
   - Change to: `AuthRequest`

7. **`/search`** (line 458)
   - Already authenticated (uses same auth as main route)
   - Just needs to change `Request` to `AuthRequest`

### Conversation History Integration
- Add conversation tracking to main chat route
- Store messages in `conversation_messages` table
- Retrieve conversation history for context

### Testing Needed
- Test authenticated chat requests
- Test analytics logging
- Test admin endpoints with different user roles
- Test conversation history storage/retrieval

## Known Issues

### Conversations Table Schema Mismatch
The actual `conversations` table in Supabase uses:
- `id`: UUID (not INTEGER)
- Fields: `user_id`, `title`, `status`, `language`, `created_at`, `updated_at`
- Does NOT have: `message_count`, `started_at`, `ended_at`, `metadata`

**Solution Needed**: Either:
1. Update `ConversationsService` interface to match actual schema
2. Or create migration to add missing fields to database

## Testing Commands

### Test Authenticated Chat
```bash
# First, get a token by logging in
TOKEN=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@aldeia.com","password":"Test1234"}' | \
  grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)

# Test chat with authentication
curl -X POST http://localhost:3001/api/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "message": "How do I apply for debris removal?",
    "isFirstMessage": false
  }'
```

### Test Admin Analytics (Requires Admin Role)
```bash
curl -X GET http://localhost:3001/api/chat/admin/analytics \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

## Next Steps

1. **Complete admin route updates** - Add RBAC and replace old database calls
2. **Fix ConversationsService schema mismatch** - Align with actual database schema
3. **Add conversation history integration** - Store chat messages in database
4. **Test all endpoints** - Verify authentication and RBAC work correctly
5. **Update frontend** - Add authentication to chat UI (Phase 4)

## Files Modified

- ✅ `apps/backend/src/routes/chat.ts` - Updated imports and main route
- ✅ `apps/backend/src/services/analytics.service.ts` - Created
- ✅ `apps/backend/src/services/conversations.service.ts` - Created
- ✅ `migrations/003_add_conversation_messages.sql` - Created and executed
- ✅ Backup created: `apps/backend/src/routes/chat.ts.pre-auth-backup`

## Summary

The chat route has been successfully integrated with the authentication system. The main POST route now:
- ✅ Requires authentication (via middleware in index.ts)
- ✅ Uses authenticated user info from `req.user`
- ✅ Logs analytics linked to authenticated users
- ✅ No longer uses deprecated SQLite functions

Admin routes still need RBAC permissions added, and conversation history tracking needs to be implemented.

---

**Generated**: November 5, 2025
**Progress**: Chat route authentication integration - 70% complete
