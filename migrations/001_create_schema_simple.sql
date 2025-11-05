-- Migration: 001_create_schema_simple.sql
-- Description: Create initial PostgreSQL schema for Aldeia Chatbot (without RLS)
-- Date: November 4, 2025
-- Phase: 2A - Schema Creation
-- Note: RLS disabled since we're using JWT auth, not Supabase Auth

-- Enable UUID extension for generating UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- USERS TABLE
-- ==============================================================================

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255),
  county VARCHAR(100),
  email VARCHAR(255) UNIQUE NOT NULL,
  language VARCHAR(10) DEFAULT 'en',
  password_hash VARCHAR(255),
  role VARCHAR(50) DEFAULT 'user',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);

COMMENT ON TABLE users IS 'User accounts with authentication and role-based access control';

-- ==============================================================================
-- SESSIONS TABLE
-- ==============================================================================

CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  refresh_token VARCHAR(500) UNIQUE NOT NULL,
  ip_address VARCHAR(45),
  user_agent TEXT,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_refresh_token ON sessions(refresh_token);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);

COMMENT ON TABLE sessions IS 'User session management for JWT refresh tokens';

-- ==============================================================================
-- CONVERSATIONS TABLE
-- ==============================================================================

CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255),
  status VARCHAR(50) DEFAULT 'active',
  language VARCHAR(10) DEFAULT 'en',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_status ON conversations(status);
CREATE INDEX IF NOT EXISTS idx_conversations_created_at ON conversations(created_at);

COMMENT ON TABLE conversations IS 'Chatbot conversation sessions';

-- ==============================================================================
-- ANALYTICS TABLE
-- ==============================================================================

CREATE TABLE IF NOT EXISTS analytics (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL,
  message TEXT,
  meta JSONB,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_analytics_user_id ON analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_conversation_id ON analytics(conversation_id);
CREATE INDEX IF NOT EXISTS idx_analytics_event_type ON analytics(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_timestamp ON analytics(timestamp);
CREATE INDEX IF NOT EXISTS idx_analytics_meta ON analytics USING GIN(meta);

COMMENT ON TABLE analytics IS 'Event tracking and analytics for chatbot interactions';

-- ==============================================================================
-- DOCUMENTS TABLE
-- ==============================================================================

CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  filename VARCHAR(255) NOT NULL,
  original_filename VARCHAR(255) NOT NULL,
  file_path TEXT NOT NULL,
  file_type VARCHAR(50),
  file_size INTEGER,
  status VARCHAR(50) DEFAULT 'pending',
  error_message TEXT,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  processed_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status);
CREATE INDEX IF NOT EXISTS idx_documents_file_type ON documents(file_type);
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON documents(created_at);

COMMENT ON TABLE documents IS 'Uploaded documents for RAG (Retrieval Augmented Generation)';

-- ==============================================================================
-- DOCUMENT_CHUNKS TABLE
-- ==============================================================================

CREATE TABLE IF NOT EXISTS document_chunks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  chunk_index INTEGER NOT NULL,
  content TEXT NOT NULL,
  embedding_id VARCHAR(255),
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_document_chunks_document_id ON document_chunks(document_id);
CREATE INDEX IF NOT EXISTS idx_document_chunks_chunk_index ON document_chunks(chunk_index);
CREATE INDEX IF NOT EXISTS idx_document_chunks_embedding_id ON document_chunks(embedding_id);

COMMENT ON TABLE document_chunks IS 'Text chunks from documents for vector embeddings';

-- ==============================================================================
-- UPDATED_AT TRIGGER
-- ==============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at
  BEFORE UPDATE ON conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ==============================================================================
-- VERIFICATION
-- ==============================================================================

DO $$
BEGIN
  RAISE NOTICE 'Migration 001_create_schema_simple.sql completed successfully!';
  RAISE NOTICE 'Tables created:';
  RAISE NOTICE '  - users';
  RAISE NOTICE '  - sessions';
  RAISE NOTICE '  - conversations';
  RAISE NOTICE '  - analytics';
  RAISE NOTICE '  - documents';
  RAISE NOTICE '  - document_chunks';
  RAISE NOTICE '';
  RAISE NOTICE 'Note: Row Level Security (RLS) is disabled.';
  RAISE NOTICE 'Authentication handled by JWT middleware in the application.';
END $$;
