-- Migration: 001_create_schema.sql
-- Description: Create initial PostgreSQL schema for Aldeia Chatbot
-- Date: November 3, 2025
-- Phase: 2A - Schema Creation

-- Enable UUID extension for generating UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- USERS TABLE
-- ==============================================================================
-- Enhanced version of SQLite users table with authentication and RBAC support

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255),
  county VARCHAR(100),
  email VARCHAR(255) UNIQUE NOT NULL,
  language VARCHAR(10) DEFAULT 'en',
  password_hash VARCHAR(255),  -- bcrypt hashed password
  role VARCHAR(50) DEFAULT 'user',  -- user, admin, moderator
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Users table indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);

-- Users table constraints
COMMENT ON TABLE users IS 'User accounts with authentication and role-based access control';
COMMENT ON COLUMN users.password_hash IS 'bcrypt hashed password (min 60 chars)';
COMMENT ON COLUMN users.role IS 'User role for RBAC: user, admin, moderator';
COMMENT ON COLUMN users.is_active IS 'Account status - false for disabled/suspended accounts';

-- ==============================================================================
-- SESSIONS TABLE
-- ==============================================================================
-- JWT refresh token management for authentication

CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  refresh_token VARCHAR(500) UNIQUE NOT NULL,
  ip_address VARCHAR(45),  -- IPv4 or IPv6
  user_agent TEXT,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sessions table indexes
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_refresh_token ON sessions(refresh_token);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);

COMMENT ON TABLE sessions IS 'User session management for JWT refresh tokens';
COMMENT ON COLUMN sessions.refresh_token IS 'JWT refresh token for obtaining new access tokens';
COMMENT ON COLUMN sessions.expires_at IS 'Session expiration timestamp - cleanup old sessions regularly';

-- ==============================================================================
-- CONVERSATIONS TABLE
-- ==============================================================================
-- Chatbot conversation tracking

CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255),
  status VARCHAR(50) DEFAULT 'active',  -- active, archived, deleted
  language VARCHAR(10) DEFAULT 'en',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Conversations table indexes
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_status ON conversations(status);
CREATE INDEX IF NOT EXISTS idx_conversations_created_at ON conversations(created_at);

COMMENT ON TABLE conversations IS 'Chatbot conversation sessions';
COMMENT ON COLUMN conversations.status IS 'Conversation status: active, archived, deleted';
COMMENT ON COLUMN conversations.title IS 'Auto-generated or user-set conversation title';

-- ==============================================================================
-- ANALYTICS TABLE
-- ==============================================================================
-- Enhanced version of SQLite analytics table with better typing and relationships

CREATE TABLE IF NOT EXISTS analytics (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL,
  message TEXT,
  meta JSONB,  -- Structured metadata stored as JSON
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Analytics table indexes
CREATE INDEX IF NOT EXISTS idx_analytics_user_id ON analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_conversation_id ON analytics(conversation_id);
CREATE INDEX IF NOT EXISTS idx_analytics_event_type ON analytics(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_timestamp ON analytics(timestamp);
CREATE INDEX IF NOT EXISTS idx_analytics_meta ON analytics USING GIN(meta);  -- GIN index for JSONB queries

COMMENT ON TABLE analytics IS 'Event tracking and analytics for chatbot interactions';
COMMENT ON COLUMN analytics.event_type IS 'Event types: user_message, bot_response, handoff, error, feedback, etc.';
COMMENT ON COLUMN analytics.meta IS 'Additional structured metadata stored as JSONB';

-- ==============================================================================
-- DOCUMENTS TABLE
-- ==============================================================================
-- Document upload and management (for RAG system)

CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  filename VARCHAR(255) NOT NULL,
  original_filename VARCHAR(255) NOT NULL,
  file_path TEXT NOT NULL,
  file_type VARCHAR(50),  -- pdf, docx, txt, etc.
  file_size INTEGER,  -- bytes
  status VARCHAR(50) DEFAULT 'pending',  -- pending, processing, completed, failed
  error_message TEXT,
  metadata JSONB,  -- Document metadata (page count, author, etc.)
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  processed_at TIMESTAMP
);

-- Documents table indexes
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status);
CREATE INDEX IF NOT EXISTS idx_documents_file_type ON documents(file_type);
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON documents(created_at);

COMMENT ON TABLE documents IS 'Uploaded documents for RAG (Retrieval Augmented Generation)';
COMMENT ON COLUMN documents.status IS 'Processing status: pending, processing, completed, failed';
COMMENT ON COLUMN documents.metadata IS 'Document metadata stored as JSONB';

-- ==============================================================================
-- DOCUMENT_CHUNKS TABLE
-- ==============================================================================
-- Text chunks for vector embeddings (ChromaDB/RAG)

CREATE TABLE IF NOT EXISTS document_chunks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  chunk_index INTEGER NOT NULL,
  content TEXT NOT NULL,
  embedding_id VARCHAR(255),  -- Reference to ChromaDB embedding
  metadata JSONB,  -- Chunk-specific metadata (page number, section, etc.)
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Document chunks table indexes
CREATE INDEX IF NOT EXISTS idx_document_chunks_document_id ON document_chunks(document_id);
CREATE INDEX IF NOT EXISTS idx_document_chunks_chunk_index ON document_chunks(chunk_index);
CREATE INDEX IF NOT EXISTS idx_document_chunks_embedding_id ON document_chunks(embedding_id);

COMMENT ON TABLE document_chunks IS 'Text chunks from documents for vector embeddings';
COMMENT ON COLUMN document_chunks.embedding_id IS 'Reference to ChromaDB embedding for similarity search';
COMMENT ON COLUMN document_chunks.metadata IS 'Chunk metadata (page, section, etc.) as JSONB';

-- ==============================================================================
-- UPDATED_AT TRIGGER
-- ==============================================================================
-- Automatically update updated_at timestamp on row modification

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to tables with updated_at column
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at
  BEFORE UPDATE ON conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
-- Enable RLS for Supabase (can be disabled if not using Supabase Auth)

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_chunks ENABLE ROW LEVEL SECURITY;

-- Users: Users can view their own profile, admins can view all
CREATE POLICY users_select_own ON users
  FOR SELECT USING (
    auth.uid()::text = id::text OR
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::integer AND role = 'admin')
  );

CREATE POLICY users_update_own ON users
  FOR UPDATE USING (auth.uid()::text = id::text);

-- Sessions: Users can only access their own sessions
CREATE POLICY sessions_select_own ON sessions
  FOR SELECT USING (user_id = auth.uid()::integer);

CREATE POLICY sessions_delete_own ON sessions
  FOR DELETE USING (user_id = auth.uid()::integer);

-- Conversations: Users can access their own conversations
CREATE POLICY conversations_all_own ON conversations
  FOR ALL USING (user_id = auth.uid()::integer);

-- Analytics: Users can view their own analytics, admins can view all
CREATE POLICY analytics_select ON analytics
  FOR SELECT USING (
    user_id = auth.uid()::integer OR
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::integer AND role = 'admin')
  );

-- Documents: Users can access their own documents
CREATE POLICY documents_all_own ON documents
  FOR ALL USING (user_id = auth.uid()::integer OR user_id IS NULL);

-- Document chunks: Users can access chunks from their documents
CREATE POLICY document_chunks_select ON document_chunks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM documents
      WHERE documents.id = document_chunks.document_id
      AND (documents.user_id = auth.uid()::integer OR documents.user_id IS NULL)
    )
  );

-- ==============================================================================
-- VERIFICATION
-- ==============================================================================
-- List all created tables

DO $$
BEGIN
  RAISE NOTICE 'Migration 001_create_schema.sql completed successfully!';
  RAISE NOTICE 'Tables created:';
  RAISE NOTICE '  - users';
  RAISE NOTICE '  - sessions';
  RAISE NOTICE '  - conversations';
  RAISE NOTICE '  - analytics';
  RAISE NOTICE '  - documents';
  RAISE NOTICE '  - document_chunks';
END $$;
