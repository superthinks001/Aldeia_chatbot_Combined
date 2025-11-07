-- Migration: 004_add_billing_and_tenancy.sql
-- Description: Add billing, subscriptions, multi-tenancy support
-- Date: November 6, 2025
-- Phase: 5 - Enhanced Features Integration

-- ==============================================================================
-- TENANTS/ORGANIZATIONS TABLE (Multi-tenancy)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS organizations (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  api_key VARCHAR(255) UNIQUE,
  is_active BOOLEAN DEFAULT true,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_organizations_slug ON organizations(slug);
CREATE INDEX IF NOT EXISTS idx_organizations_api_key ON organizations(api_key);
CREATE INDEX IF NOT EXISTS idx_organizations_is_active ON organizations(is_active);

COMMENT ON TABLE organizations IS 'Organizations for multi-tenant support';

-- ==============================================================================
-- ORGANIZATION MEMBERS TABLE
-- ==============================================================================

CREATE TABLE IF NOT EXISTS organization_members (
  id SERIAL PRIMARY KEY,
  organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL DEFAULT 'member', -- 'owner', 'admin', 'member'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(organization_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_organization_members_org_id ON organization_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_organization_members_user_id ON organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_organization_members_role ON organization_members(role);

COMMENT ON TABLE organization_members IS 'Membership relationships between users and organizations';

-- ==============================================================================
-- SUBSCRIPTIONS TABLE (Stripe Billing)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS subscriptions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  stripe_customer_id VARCHAR(255),
  stripe_subscription_id VARCHAR(255) UNIQUE,
  tier VARCHAR(50) NOT NULL DEFAULT 'free', -- 'free', 'pro', 'enterprise'
  status VARCHAR(50) NOT NULL DEFAULT 'active', -- 'active', 'canceled', 'past_due', 'incomplete'
  current_period_start TIMESTAMP,
  current_period_end TIMESTAMP,
  cancel_at_period_end BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer_id ON subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_subscription_id ON subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_tier ON subscriptions(tier);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);

COMMENT ON TABLE subscriptions IS 'User subscription information for billing';

-- ==============================================================================
-- USAGE QUOTAS TABLE
-- ==============================================================================

CREATE TABLE IF NOT EXISTS usage_quotas (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  messages_used INTEGER DEFAULT 0,
  messages_limit INTEGER NOT NULL,
  voice_requests_used INTEGER DEFAULT 0,
  voice_requests_limit INTEGER DEFAULT -1, -- -1 means unlimited
  api_calls_used INTEGER DEFAULT 0,
  api_calls_limit INTEGER DEFAULT -1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, period_start)
);

CREATE INDEX IF NOT EXISTS idx_usage_quotas_user_id ON usage_quotas(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_quotas_period_start ON usage_quotas(period_start);
CREATE INDEX IF NOT EXISTS idx_usage_quotas_period_end ON usage_quotas(period_end);

COMMENT ON TABLE usage_quotas IS 'Track user usage against subscription quotas';

-- ==============================================================================
-- PAYMENT METHODS TABLE
-- ==============================================================================

CREATE TABLE IF NOT EXISTS payment_methods (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  stripe_payment_method_id VARCHAR(255) UNIQUE NOT NULL,
  type VARCHAR(50) NOT NULL, -- 'card', 'bank_account', etc.
  last4 VARCHAR(4),
  brand VARCHAR(50), -- 'visa', 'mastercard', etc.
  exp_month INTEGER,
  exp_year INTEGER,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_payment_methods_user_id ON payment_methods(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_methods_stripe_payment_method_id ON payment_methods(stripe_payment_method_id);
CREATE INDEX IF NOT EXISTS idx_payment_methods_is_default ON payment_methods(is_default);

COMMENT ON TABLE payment_methods IS 'User payment methods for billing';

-- ==============================================================================
-- INVOICES TABLE
-- ==============================================================================

CREATE TABLE IF NOT EXISTS invoices (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  stripe_invoice_id VARCHAR(255) UNIQUE NOT NULL,
  amount_due INTEGER NOT NULL, -- in cents
  amount_paid INTEGER DEFAULT 0, -- in cents
  currency VARCHAR(3) DEFAULT 'usd',
  status VARCHAR(50) NOT NULL, -- 'draft', 'open', 'paid', 'uncollectible', 'void'
  invoice_pdf VARCHAR(500),
  hosted_invoice_url VARCHAR(500),
  due_date TIMESTAMP,
  paid_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_stripe_invoice_id ON invoices(stripe_invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(due_date);

COMMENT ON TABLE invoices IS 'Billing invoices for subscriptions';

-- ==============================================================================
-- UPDATE EXISTING TABLES FOR MULTI-TENANCY
-- ==============================================================================

-- Add organization_id to conversations table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'conversations' AND column_name = 'organization_id'
    ) THEN
        ALTER TABLE conversations ADD COLUMN organization_id INTEGER REFERENCES organizations(id);
        CREATE INDEX idx_conversations_organization_id ON conversations(organization_id);
    END IF;
END $$;

-- Add organization_id to analytics_events table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'analytics_events' AND column_name = 'organization_id'
    ) THEN
        ALTER TABLE analytics_events ADD COLUMN organization_id INTEGER REFERENCES organizations(id);
        CREATE INDEX idx_analytics_events_organization_id ON analytics_events(organization_id);
    END IF;
END $$;

-- Add organization_id to documents table (if exists)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_name = 'documents'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'documents' AND column_name = 'organization_id'
    ) THEN
        ALTER TABLE documents ADD COLUMN organization_id INTEGER REFERENCES organizations(id);
        CREATE INDEX idx_documents_organization_id ON documents(organization_id);
    END IF;
END $$;

-- Add stripe_customer_id to users table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'stripe_customer_id'
    ) THEN
        ALTER TABLE users ADD COLUMN stripe_customer_id VARCHAR(255) UNIQUE;
        CREATE INDEX idx_users_stripe_customer_id ON users(stripe_customer_id);
    END IF;
END $$;

-- ==============================================================================
-- DATABASE FUNCTIONS
-- ==============================================================================

-- Function to increment message usage
CREATE OR REPLACE FUNCTION increment_message_usage(
  p_user_id INTEGER,
  p_period_start TIMESTAMP,
  p_period_end TIMESTAMP,
  p_messages_limit INTEGER
)
RETURNS void AS $$
BEGIN
  INSERT INTO usage_quotas (
    user_id,
    period_start,
    period_end,
    messages_used,
    messages_limit
  )
  VALUES (
    p_user_id,
    p_period_start::DATE,
    p_period_end::DATE,
    1,
    p_messages_limit
  )
  ON CONFLICT (user_id, period_start)
  DO UPDATE SET
    messages_used = usage_quotas.messages_used + 1,
    updated_at = CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql;

-- Function to check if user can send message
CREATE OR REPLACE FUNCTION can_user_send_message(p_user_id INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
  v_messages_used INTEGER;
  v_messages_limit INTEGER;
BEGIN
  -- Get current usage
  SELECT messages_used, messages_limit
  INTO v_messages_used, v_messages_limit
  FROM usage_quotas
  WHERE user_id = p_user_id
    AND period_start <= CURRENT_DATE
    AND period_end > CURRENT_DATE;

  -- If no record found, assume free tier with 10 message limit
  IF NOT FOUND THEN
    RETURN TRUE;
  END IF;

  -- Unlimited
  IF v_messages_limit = -1 THEN
    RETURN TRUE;
  END IF;

  -- Check quota
  RETURN v_messages_used < v_messages_limit;
END;
$$ LANGUAGE plpgsql;

-- ==============================================================================
-- TRIGGERS FOR UPDATED_AT TIMESTAMPS
-- ==============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = CURRENT_TIMESTAMP;
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to new tables
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_organizations_updated_at') THEN
        CREATE TRIGGER update_organizations_updated_at
        BEFORE UPDATE ON organizations
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_organization_members_updated_at') THEN
        CREATE TRIGGER update_organization_members_updated_at
        BEFORE UPDATE ON organization_members
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_subscriptions_updated_at') THEN
        CREATE TRIGGER update_subscriptions_updated_at
        BEFORE UPDATE ON subscriptions
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_usage_quotas_updated_at') THEN
        CREATE TRIGGER update_usage_quotas_updated_at
        BEFORE UPDATE ON usage_quotas
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_payment_methods_updated_at') THEN
        CREATE TRIGGER update_payment_methods_updated_at
        BEFORE UPDATE ON payment_methods
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- ==============================================================================
-- SEED DEFAULT FREE TIER SUBSCRIPTIONS
-- ==============================================================================

-- Create default subscriptions for existing users
INSERT INTO subscriptions (user_id, tier, status)
SELECT id, 'free', 'active'
FROM users
WHERE id NOT IN (SELECT user_id FROM subscriptions)
ON CONFLICT (user_id) DO NOTHING;

-- ==============================================================================
-- COMPLETE
-- ==============================================================================

-- Log completion
DO $$
BEGIN
    RAISE NOTICE 'Migration 004: Billing and multi-tenancy tables created successfully';
END $$;
