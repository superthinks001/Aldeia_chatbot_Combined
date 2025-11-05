# SQLite Database Analysis

**Date**: November 3, 2025
**Purpose**: Document existing SQLite databases for PostgreSQL migration

---

## 📊 Database Inventory

### Found Databases

| Location | Size | Last Modified | Status |
|----------|------|---------------|--------|
| `./aldeia.db` | 60K | Jul 18, 2025 | ✅ Contains data |
| `./apps/aldeia.db` | 16K | Sep 26, 2025 | ⚠️ Empty |
| `./chatbot/aldeia.db` | 60K | Jul 18, 2025 | ✅ Contains data (duplicate) |

### Data Summary

- **Root `aldeia.db`**: 1 user, 13 analytics records
- **`apps/aldeia.db`**: 0 users, 0 analytics records (empty database)
- **`chatbot/aldeia.db`**: 1 user, 13 analytics records (identical to root)

**Conclusion**: The root `aldeia.db` and `chatbot/aldeia.db` are duplicates. We'll use the root database as the source for migration.

---

## 📋 Database Schema

### Users Table

```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT,
  county TEXT,
  email TEXT,
  language TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

**Current Data**:
- 1 user record
- Admin user: name="Admin", county="Us", email="test@test.com"
- Created: 2025-07-10 17:46:55

### Analytics Table

```sql
CREATE TABLE analytics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  conversation_id TEXT,
  event_type TEXT,
  message TEXT,
  meta TEXT,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

**Current Data**:
- 13 analytics records
- Event types: `user_message`, `bot_response`, `handoff`
- Date range: 2025-07-08 onwards
- No user_id associations (all NULL)

---

## 🔄 Migration Strategy

### PostgreSQL Schema Design

The PostgreSQL schema will closely mirror the SQLite structure with these enhancements:

#### Users Table (Enhanced)

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255),
  county VARCHAR(100),
  email VARCHAR(255) UNIQUE NOT NULL,
  language VARCHAR(10) DEFAULT 'en',
  password_hash VARCHAR(255),  -- New: For authentication
  role VARCHAR(50) DEFAULT 'user',  -- New: For RBAC
  is_active BOOLEAN DEFAULT true,  -- New: For user management
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
```

#### Analytics Table (Enhanced)

```sql
CREATE TABLE analytics (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  conversation_id UUID,  -- Changed from TEXT to UUID
  event_type VARCHAR(50) NOT NULL,
  message TEXT,
  meta JSONB,  -- Changed from TEXT to JSONB for structured data
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_analytics_user_id ON analytics(user_id);
CREATE INDEX idx_analytics_conversation_id ON analytics(conversation_id);
CREATE INDEX idx_analytics_event_type ON analytics(event_type);
CREATE INDEX idx_analytics_timestamp ON analytics(timestamp);
```

### Additional Tables for Phase 3 (Authentication & RBAC)

#### Sessions Table

```sql
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  refresh_token VARCHAR(500) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_refresh_token ON sessions(refresh_token);
```

#### Conversations Table

```sql
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255),
  status VARCHAR(50) DEFAULT 'active',  -- active, archived, deleted
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_conversations_user_id ON conversations(user_id);
CREATE INDEX idx_conversations_status ON conversations(status);
```

---

## 📦 Migration Plan

### Phase 2A: Schema Creation
1. Create Supabase project
2. Run schema creation scripts
3. Verify tables and indexes created successfully

### Phase 2B: Data Migration
1. Export data from SQLite:
   - 1 user record → PostgreSQL users table
   - 13 analytics records → PostgreSQL analytics table
2. Hash test user password with bcrypt
3. Import data into PostgreSQL
4. Verify data integrity

### Phase 2C: Dual-Database Mode
1. Update backend to support both SQLite and PostgreSQL
2. Use `USE_SQLITE=true` flag in `.env` for backward compatibility
3. Test with both databases
4. Switch to PostgreSQL when ready (`USE_SQLITE=false`)

### Phase 2D: Cleanup
1. Archive SQLite databases
2. Update backend to use PostgreSQL exclusively
3. Remove SQLite dependencies (optional)

---

## 🚨 Migration Risks & Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| Data loss during migration | High | Create backups before migration; verify checksums |
| Schema incompatibility | Medium | Test migrations on staging first |
| Downtime during migration | Low | Use dual-database mode for zero-downtime migration |
| User authentication issues | High | Hash test password correctly; test login flow |
| Analytics data orphaned | Low | Link analytics to user via user_id FK |

---

## ✅ Verification Checklist

- [ ] Supabase project created
- [ ] PostgreSQL schema created
- [ ] User data migrated (1 record)
- [ ] Analytics data migrated (13 records)
- [ ] Foreign key relationships established
- [ ] Indexes created and optimized
- [ ] Test user can authenticate
- [ ] Analytics queries work correctly
- [ ] Dual-database mode tested
- [ ] Switched to PostgreSQL (`USE_SQLITE=false`)

---

## 📝 Notes

- The current SQLite database is minimal (1 user, 13 analytics)
- This is likely test/development data, not production data
- Migration should be straightforward given the small dataset
- The duplicate databases (`aldeia.db` and `chatbot/aldeia.db`) suggest configuration issues that should be cleaned up
- The empty `apps/aldeia.db` can be deleted after migration
