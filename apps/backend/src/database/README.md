## Database Module

Unified database interface supporting both SQLite and PostgreSQL with automatic switching based on environment configuration.

---

## Features

- **Dual Database Support**: SQLite for development, PostgreSQL for production
- **Automatic Switching**: Configure via environment variables
- **Connection Pooling**: Efficient PostgreSQL connection management
- **Transaction Support**: ACID-compliant transactions for both databases
- **Backward Compatible**: Drop-in replacement for existing SQLite code
- **Type Safe**: Full TypeScript support
- **Async/Await**: Modern async API with Promise-based operations

---

## Quick Start

### 1. Configuration

Set environment variables in `.env` or `.env.merge`:

```bash
# Use SQLite (default)
USE_SQLITE=true
SQLITE_DB_PATH=./aldeia.db

# OR use PostgreSQL/Supabase
USE_SQLITE=false
DATABASE_URL=postgresql://user:password@host:5432/database
# OR
SUPABASE_DB_URL=postgresql://postgres.ref:password@pooler.supabase.com:6543/postgres
```

### 2. Basic Usage

```typescript
import { initDb, addOrUpdateUser, logAnalytics, getUsers } from './database';

// Initialize database schema
await initDb();

// Add/update a user
const userId = await addOrUpdateUser({
  name: 'John Doe',
  email: 'john@example.com',
  county: 'San Francisco',
  language: 'en'
});

// Log an analytics event
await logAnalytics({
  user_id: userId,
  event_type: 'user_login',
  message: 'User logged in',
  meta: { ip: '192.168.1.1', browser: 'Chrome' }
});

// Get all users
const users = await getUsers();
console.log(users);
```

### 3. Advanced Usage

#### Transactions

```typescript
import { withTransaction } from './database';

await withTransaction(async (client) => {
  // All operations here are within a transaction
  await addOrUpdateUser({ email: 'user1@example.com', name: 'User 1' });
  await logAnalytics({ event_type: 'batch_import' });
  // If any operation fails, entire transaction rolls back
});
```

#### Raw Queries

```typescript
import { query, queryOne, execute } from './database';

// Query multiple rows
const users = await query<User>('SELECT * FROM users WHERE county = $1', ['San Francisco']);

// Query single row
const user = await queryOne<User>('SELECT * FROM users WHERE email = $1', ['john@example.com']);

// Execute update/insert/delete
await execute('UPDATE users SET name = $1 WHERE id = $2', ['Jane Doe', 123]);
```

#### Database Type Checking

```typescript
import { isPostgres, isSQLite, getDatabaseType } from './database';

if (isPostgres()) {
  console.log('Using PostgreSQL');
  // Use PostgreSQL-specific features
}

const dbType = getDatabaseType(); // 'sqlite' | 'postgres'
```

---

## API Reference

### Database Operations

#### `initDb(): Promise<void>`
Initialize database schema. Creates tables if they don't exist.

#### `addOrUpdateUser(profile): Promise<number>`
Add a new user or update existing user by email. Returns user ID.

**Parameters:**
- `profile.name` (string, optional): User's name
- `profile.email` (string, required): User's email
- `profile.county` (string, optional): User's county
- `profile.language` (string, optional): User's language preference

**Returns:** User ID (number)

#### `logAnalytics(event): Promise<void>`
Log an analytics event.

**Parameters:**
- `event.user_id` (number, optional): Associated user ID
- `event.conversation_id` (string, optional): Associated conversation ID
- `event.event_type` (string, required): Event type (e.g., 'user_message', 'bot_response')
- `event.message` (string, optional): Event message
- `event.meta` (object, optional): Additional metadata (stored as JSON)

#### `getUsers(): Promise<User[]>`
Get all users ordered by creation date (newest first).

#### `getUserById(id: number): Promise<User | null>`
Get user by ID.

#### `getUserByEmail(email: string): Promise<User | null>`
Get user by email address.

#### `getAnalyticsSummary(): Promise<Summary[]>`
Get analytics summary grouped by event type.

**Returns:** Array of `{ event_type: string, count: number }`

#### `getAnalyticsByUser(userId: number, limit?: number): Promise<Analytics[]>`
Get analytics events for a specific user.

**Parameters:**
- `userId` (number): User ID
- `limit` (number, default 100): Maximum number of records to return

#### `getAnalyticsByConversation(conversationId: string, limit?: number): Promise<Analytics[]>`
Get analytics events for a specific conversation.

#### `deleteUser(id: number): Promise<void>`
Delete user by ID.

#### `updateUser(id: number, updates: Partial<User>): Promise<void>`
Update user fields.

**Parameters:**
- `id` (number): User ID
- `updates` (object): Fields to update (name, email, county, language)

#### `getRecentAnalytics(limit?: number): Promise<Analytics[]>`
Get most recent analytics events.

**Parameters:**
- `limit` (number, default 50): Maximum number of records to return

#### `countAnalyticsByType(eventType: string, startDate?: Date, endDate?: Date): Promise<number>`
Count analytics events by type within a date range.

---

### Low-Level Operations

#### `query<T>(sql: string, params?: any[]): Promise<T[]>`
Execute a SELECT query returning multiple rows.

#### `queryOne<T>(sql: string, params?: any[]): Promise<T | null>`
Execute a SELECT query returning a single row.

#### `execute(sql: string, params?: any[]): Promise<{ rowCount: number, lastId?: number }>`
Execute an INSERT, UPDATE, or DELETE query.

#### `withTransaction<T>(fn: (client) => Promise<T>): Promise<T>`
Execute a function within a database transaction.

---

### Connection Management

#### `initConnection(): Promise<void>`
Initialize database connection. Called automatically on module load.

#### `closeConnection(): Promise<void>`
Close database connection. Called automatically on process exit.

#### `healthCheck(): Promise<boolean>`
Check if database connection is healthy.

---

### Configuration Utilities

#### `getDatabaseType(): 'sqlite' | 'postgres'`
Get current database type.

#### `isPostgres(): boolean`
Check if using PostgreSQL.

#### `isSQLite(): boolean`
Check if using SQLite.

#### `getDatabaseConfig(): DatabaseConfig`
Get current database configuration.

#### `validateConfig(config: DatabaseConfig): boolean`
Validate database configuration.

---

## Migration Guide

### From Old SQLite API (Callback-based)

#### Before (Old API)
```typescript
import { addOrUpdateUser, logAnalytics } from './db';

addOrUpdateUser({ email: 'user@example.com' }, (err, userId) => {
  if (err) {
    console.error(err);
    return;
  }
  console.log('User ID:', userId);
});
```

#### After (New API)
```typescript
import { addOrUpdateUser } from './database';

try {
  const userId = await addOrUpdateUser({ email: 'user@example.com' });
  console.log('User ID:', userId);
} catch (err) {
  console.error(err);
}
```

The old callback-based API is still supported via `./db.ts` but is deprecated.

---

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `USE_SQLITE` | Use SQLite instead of PostgreSQL | `true` |
| `SQLITE_DB_PATH` | Path to SQLite database file | `../../aldeia.db` |
| `DATABASE_URL` | PostgreSQL connection string | - |
| `SUPABASE_DB_URL` | Supabase connection string (pooled) | - |
| `DB_HOST` | PostgreSQL host | `localhost` |
| `DB_PORT` | PostgreSQL port | `5432` |
| `DB_NAME` | PostgreSQL database name | `postgres` |
| `DB_USER` | PostgreSQL username | `postgres` |
| `DB_PASSWORD` | PostgreSQL password | - |
| `DB_SSL` | Enable SSL for PostgreSQL | `false` |
| `DB_POOL_MAX` | Max connections in pool | `20` |
| `DB_IDLE_TIMEOUT` | Idle timeout (ms) | `30000` |
| `DB_CONNECTION_TIMEOUT` | Connection timeout (ms) | `10000` |

---

## File Structure

```
apps/backend/src/database/
├── index.ts           # Main entry point
├── config.ts          # Configuration management
├── connection.ts      # Connection pooling
├── client.ts          # High-level database operations
├── migrations/        # SQL migration files
├── seeds/             # Database seed files
└── README.md          # This file
```

---

## Examples

### Complete User Management Example

```typescript
import {
  initDb,
  addOrUpdateUser,
  getUserByEmail,
  updateUser,
  deleteUser,
  getUsers
} from './database';

async function userManagementExample() {
  // Initialize
  await initDb();

  // Create user
  const userId = await addOrUpdateUser({
    name: 'Alice Johnson',
    email: 'alice@example.com',
    county: 'Los Angeles',
    language: 'en'
  });
  console.log('Created user:', userId);

  // Find user
  const user = await getUserByEmail('alice@example.com');
  console.log('Found user:', user);

  // Update user
  await updateUser(userId, {
    name: 'Alice Smith',
    county: 'San Diego'
  });
  console.log('Updated user');

  // List all users
  const allUsers = await getUsers();
  console.log('Total users:', allUsers.length);

  // Delete user
  await deleteUser(userId);
  console.log('Deleted user');
}
```

### Analytics Tracking Example

```typescript
import {
  logAnalytics,
  getAnalyticsSummary,
  getAnalyticsByUser,
  countAnalyticsByType
} from './database';

async function analyticsExample() {
  // Log events
  await logAnalytics({
    user_id: 1,
    conversation_id: 'conv-123',
    event_type: 'user_message',
    message: 'Hello chatbot',
    meta: { language: 'en', sentiment: 'positive' }
  });

  await logAnalytics({
    event_type: 'bot_response',
    conversation_id: 'conv-123',
    meta: { response_time_ms: 250 }
  });

  // Get summary
  const summary = await getAnalyticsSummary();
  console.log('Event types:', summary);

  // Get user analytics
  const userEvents = await getAnalyticsByUser(1, 50);
  console.log('User events:', userEvents.length);

  // Count specific events
  const messageCount = await countAnalyticsByType('user_message');
  console.log('Total messages:', messageCount);
}
```

---

## Troubleshooting

### Connection Errors

**Error:** "PostgreSQL pool not initialized"
- **Solution:** Ensure `initConnection()` is called or wait for automatic initialization

**Error:** "Failed to connect to PostgreSQL"
- **Solution:** Check `DATABASE_URL` is correct and database is accessible
- Verify network connectivity and firewall rules
- Check database credentials

**Error:** "SQLite database locked"
- **Solution:** Close other connections to the database
- Ensure no other processes are accessing the file
- Wait a few seconds and retry

### Migration Issues

**Error:** "Table already exists"
- **Solution:** Run `initDb()` only once at application startup
- For PostgreSQL, use migration scripts instead

**Error:** "Column does not exist"
- **Solution:** Run migrations to update schema
- For SQLite → PostgreSQL migration, use `migrations/migrate-from-sqlite.js`

---

## Testing

```typescript
import { healthCheck, getDatabaseType } from './database';

// Health check
const isHealthy = await healthCheck();
console.log('Database healthy:', isHealthy);

// Type check
const dbType = getDatabaseType();
console.log('Database type:', dbType);
```

---

## Performance Tips

1. **Use Connection Pooling** - PostgreSQL pools connections automatically
2. **Batch Operations** - Use transactions for multiple related operations
3. **Index Your Queries** - Ensure frequently queried columns have indexes
4. **Limit Result Sets** - Use `LIMIT` clauses for large tables
5. **Monitor Connections** - Check pool stats regularly in production

---

## Security Best Practices

1. **Never expose credentials** - Use environment variables
2. **Use parameterized queries** - All functions use `$1, $2` placeholders
3. **Enable SSL** - Set `DB_SSL=true` for production PostgreSQL
4. **Rotate passwords** - Change database passwords regularly
5. **Principle of least privilege** - Use database users with minimal required permissions

---

## Support

For issues or questions about the database module, check:
- Migration documentation: `../../migrations/README.md`
- Supabase setup guide: `../../../merge-docs/SUPABASE_SETUP_GUIDE.md`
- Database analysis: `../../../merge-docs/SQLITE_DATABASE_ANALYSIS.md`
