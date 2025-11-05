-- Migration: Add conversation_messages table
-- Created: November 5, 2025
-- Purpose: Store individual messages within conversations for chat history

CREATE TABLE IF NOT EXISTS conversation_messages (
  id SERIAL PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender VARCHAR(10) NOT NULL CHECK (sender IN ('user', 'bot')),
  message TEXT NOT NULL,
  intent VARCHAR(100),
  confidence DECIMAL(3, 2),
  bias BOOLEAN DEFAULT FALSE,
  ambiguous BOOLEAN DEFAULT FALSE,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_conversation_messages_conversation_id
  ON conversation_messages(conversation_id);

CREATE INDEX IF NOT EXISTS idx_conversation_messages_created_at
  ON conversation_messages(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_conversation_messages_sender
  ON conversation_messages(sender);

-- Add RLS (Row Level Security) policies
ALTER TABLE conversation_messages ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only view messages from their own conversations
CREATE POLICY conversation_messages_select_policy ON conversation_messages
  FOR SELECT
  USING (
    conversation_id IN (
      SELECT id FROM conversations WHERE user_id = (
        SELECT id FROM users WHERE email = current_user
      )
    )
  );

-- Policy: System can insert messages (backend service role)
CREATE POLICY conversation_messages_insert_policy ON conversation_messages
  FOR INSERT
  WITH CHECK (true); -- Service role can insert any message

-- Policy: Users cannot update or delete messages
CREATE POLICY conversation_messages_update_policy ON conversation_messages
  FOR UPDATE
  USING (false);

CREATE POLICY conversation_messages_delete_policy ON conversation_messages
  FOR DELETE
  USING (false);

-- Grant permissions
GRANT SELECT, INSERT ON conversation_messages TO authenticated;
GRANT ALL ON conversation_messages TO service_role;
GRANT USAGE ON SEQUENCE conversation_messages_id_seq TO authenticated;
GRANT USAGE ON SEQUENCE conversation_messages_id_seq TO service_role;
