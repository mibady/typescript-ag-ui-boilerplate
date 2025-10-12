-- ============================================================================
-- COMPLETE DATABASE RESET AND SETUP
-- ============================================================================
-- Run this entire script in Supabase Studio SQL Editor
-- This will DROP all existing tables and create fresh schema
--
-- ⚠️  WARNING: This will DELETE ALL DATA
-- ============================================================================

-- Drop existing tables in reverse dependency order
DROP TABLE IF EXISTS payment_history CASCADE;
DROP TABLE IF EXISTS usage_records CASCADE;
DROP TABLE IF EXISTS subscriptions CASCADE;
DROP TABLE IF EXISTS subscription_plans CASCADE;
DROP TABLE IF EXISTS api_keys CASCADE;
DROP TABLE IF EXISTS document_chunks CASCADE;
DROP TABLE IF EXISTS documents CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS agent_sessions CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS organizations CASCADE;

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "vector";

-- ============================================================================
-- CREATE TABLES
-- ============================================================================

-- ORGANIZATIONS
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_org_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  industry TEXT,
  team_size TEXT,
  use_case TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_organizations_clerk_org_id ON organizations(clerk_org_id);

-- USERS
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT UNIQUE NOT NULL,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  role TEXT DEFAULT 'member',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_users_clerk_user_id ON users(clerk_user_id);
CREATE INDEX idx_users_organization_id ON users(organization_id);

-- AGENT_SESSIONS
CREATE TABLE agent_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  agent_type TEXT NOT NULL,
  status TEXT DEFAULT 'active',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_agent_sessions_organization_id ON agent_sessions(organization_id);
CREATE INDEX idx_agent_sessions_user_id ON agent_sessions(user_id);
CREATE INDEX idx_agent_sessions_status ON agent_sessions(status);

-- MESSAGES
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  session_id UUID NOT NULL REFERENCES agent_sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system', 'tool')),
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_messages_organization_id ON messages(organization_id);
CREATE INDEX idx_messages_session_id ON messages(session_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);

-- DOCUMENTS
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  content TEXT NOT NULL,
  content_type TEXT,
  size_bytes INTEGER,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_documents_organization_id ON documents(organization_id);
CREATE INDEX idx_documents_user_id ON documents(user_id);

-- DOCUMENT_CHUNKS
CREATE TABLE document_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  chunk_index INTEGER NOT NULL,
  embedding vector(1536),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_document_chunks_organization_id ON document_chunks(organization_id);
CREATE INDEX idx_document_chunks_document_id ON document_chunks(document_id);
CREATE INDEX idx_document_chunks_embedding ON document_chunks
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- API_KEYS
CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  key_hash TEXT NOT NULL UNIQUE,
  key_prefix TEXT NOT NULL,
  last_used_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_api_keys_organization_id ON api_keys(organization_id);
CREATE INDEX idx_api_keys_key_hash ON api_keys(key_hash);
CREATE INDEX idx_api_keys_is_active ON api_keys(is_active);

-- SUBSCRIPTION_PLANS
CREATE TABLE subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT,
  price_monthly INTEGER NOT NULL DEFAULT 0,
  price_yearly INTEGER NOT NULL DEFAULT 0,
  stripe_price_id_monthly TEXT,
  stripe_price_id_yearly TEXT,
  stripe_product_id TEXT,
  features JSONB NOT NULL DEFAULT '{}',
  limits JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_subscription_plans_name ON subscription_plans(name);
CREATE INDEX idx_subscription_plans_active ON subscription_plans(is_active);

-- SUBSCRIPTIONS
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES subscription_plans(id),
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  stripe_price_id TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  billing_cycle TEXT NOT NULL DEFAULT 'monthly',
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  trial_end TIMESTAMP WITH TIME ZONE,
  cancel_at TIMESTAMP WITH TIME ZONE,
  canceled_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT valid_status CHECK (status IN ('active', 'trialing', 'past_due', 'canceled', 'incomplete', 'incomplete_expired', 'unpaid')),
  CONSTRAINT valid_billing_cycle CHECK (billing_cycle IN ('monthly', 'yearly'))
);

CREATE INDEX idx_subscriptions_org ON subscriptions(organization_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_stripe_customer ON subscriptions(stripe_customer_id);
CREATE INDEX idx_subscriptions_stripe_subscription ON subscriptions(stripe_subscription_id);
CREATE UNIQUE INDEX idx_subscriptions_org_active ON subscriptions(organization_id)
WHERE status IN ('active', 'trialing');

-- USAGE_RECORDS
CREATE TABLE usage_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
  metric_name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0,
  unit TEXT NOT NULL DEFAULT 'count',
  period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  metadata JSONB DEFAULT '{}',
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_usage_records_org ON usage_records(organization_id);
CREATE INDEX idx_usage_records_metric ON usage_records(metric_name);
CREATE INDEX idx_usage_records_period ON usage_records(period_start, period_end);

-- PAYMENT_HISTORY
CREATE TABLE payment_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
  stripe_invoice_id TEXT UNIQUE,
  stripe_payment_intent_id TEXT,
  stripe_charge_id TEXT,
  amount INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'usd',
  status TEXT NOT NULL,
  invoice_url TEXT,
  invoice_pdf TEXT,
  description TEXT,
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_payment_history_org ON payment_history(organization_id);
CREATE INDEX idx_payment_history_status ON payment_history(status);
CREATE INDEX idx_payment_history_paid_at ON payment_history(paid_at DESC);

-- ============================================================================
-- SEED DATA
-- ============================================================================

-- Insert subscription plans
INSERT INTO subscription_plans (name, display_name, description, price_monthly, price_yearly, limits, features, is_active)
VALUES
  ('free', 'Free', 'Perfect for getting started', 0, 0,
   '{"messages_per_month": 100, "tokens_per_month": 50000, "documents": 10, "team_members": 1, "sessions": 5, "api_calls_per_day": 100}'::jsonb,
   '{"chat": true, "api_access": false, "priority_support": false}'::jsonb,
   true),
  ('pro', 'Pro', 'For professionals and growing teams', 2000, 19200,
   '{"messages_per_month": 10000, "tokens_per_month": 5000000, "documents": 1000, "team_members": 10, "sessions": 100, "api_calls_per_day": 10000}'::jsonb,
   '{"chat": true, "api_access": true, "priority_support": true, "custom_models": false}'::jsonb,
   true),
  ('enterprise', 'Enterprise', 'For large organizations', 10000, 96000,
   '{"messages_per_month": -1, "tokens_per_month": -1, "documents": -1, "team_members": -1, "sessions": -1, "api_calls_per_day": -1}'::jsonb,
   '{"chat": true, "api_access": true, "priority_support": true, "custom_models": true, "dedicated_support": true, "sla": true}'::jsonb,
   true);

-- Update with Stripe Price IDs
UPDATE subscription_plans SET
  stripe_price_id_monthly = 'price_1SGszIDdWGNoBuU6GRptacEq'
WHERE name = 'free';

UPDATE subscription_plans SET
  stripe_price_id_monthly = 'price_1SGszIDdWGNoBuU6MOLxc94a',
  stripe_price_id_yearly = 'price_1SGszJDdWGNoBuU6cf2gVpJA'
WHERE name = 'pro';

UPDATE subscription_plans SET
  stripe_price_id_monthly = 'price_1SGszJDdWGNoBuU6njlNGVuQ',
  stripe_price_id_yearly = 'price_1SGszJDdWGNoBuU6l1A6NiqU'
WHERE name = 'enterprise';

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_history ENABLE ROW LEVEL SECURITY;

-- Helper function to get user's organization ID from Clerk JWT
CREATE OR REPLACE FUNCTION get_user_org_id()
RETURNS UUID AS $$
BEGIN
  RETURN (
    SELECT organization_id
    FROM users
    WHERE clerk_user_id = auth.jwt()->>'sub'
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Service role policies (for backend API)
CREATE POLICY "Service role full access" ON organizations FOR ALL TO service_role USING (true);
CREATE POLICY "Service role full access" ON users FOR ALL TO service_role USING (true);
CREATE POLICY "Service role full access" ON agent_sessions FOR ALL TO service_role USING (true);
CREATE POLICY "Service role full access" ON messages FOR ALL TO service_role USING (true);
CREATE POLICY "Service role full access" ON documents FOR ALL TO service_role USING (true);
CREATE POLICY "Service role full access" ON document_chunks FOR ALL TO service_role USING (true);
CREATE POLICY "Service role full access" ON api_keys FOR ALL TO service_role USING (true);
CREATE POLICY "Service role full access" ON subscription_plans FOR ALL TO service_role USING (true);
CREATE POLICY "Service role full access" ON subscriptions FOR ALL TO service_role USING (true);
CREATE POLICY "Service role full access" ON usage_records FOR ALL TO service_role USING (true);
CREATE POLICY "Service role full access" ON payment_history FOR ALL TO service_role USING (true);

-- ============================================================================
-- AUTHENTICATED USER POLICIES (Client-side access)
-- ============================================================================

-- ORGANIZATIONS: Users can read their own organization
CREATE POLICY "Users can read own organization" ON organizations
  FOR SELECT TO authenticated
  USING (id = get_user_org_id());

-- USERS: Users can read users in their organization
CREATE POLICY "Users can read org members" ON users
  FOR SELECT TO authenticated
  USING (organization_id = get_user_org_id());

-- USERS: Users can update their own profile
CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE TO authenticated
  USING (clerk_user_id = auth.jwt()->>'sub')
  WITH CHECK (clerk_user_id = auth.jwt()->>'sub');

-- AGENT_SESSIONS: Users can read their org's sessions
CREATE POLICY "Users can read org sessions" ON agent_sessions
  FOR SELECT TO authenticated
  USING (organization_id = get_user_org_id());

-- AGENT_SESSIONS: Users can create sessions in their org
CREATE POLICY "Users can create sessions" ON agent_sessions
  FOR INSERT TO authenticated
  WITH CHECK (organization_id = get_user_org_id());

-- AGENT_SESSIONS: Users can update their own sessions
CREATE POLICY "Users can update own sessions" ON agent_sessions
  FOR UPDATE TO authenticated
  USING (user_id IN (
    SELECT id FROM users WHERE clerk_user_id = auth.jwt()->>'sub'
  ));

-- MESSAGES: Users can read their org's messages
CREATE POLICY "Users can read org messages" ON messages
  FOR SELECT TO authenticated
  USING (organization_id = get_user_org_id());

-- MESSAGES: Users can create messages in their org
CREATE POLICY "Users can create messages" ON messages
  FOR INSERT TO authenticated
  WITH CHECK (organization_id = get_user_org_id());

-- DOCUMENTS: Users can read their org's documents
CREATE POLICY "Users can read org documents" ON documents
  FOR SELECT TO authenticated
  USING (organization_id = get_user_org_id());

-- DOCUMENTS: Users can create documents in their org
CREATE POLICY "Users can create documents" ON documents
  FOR INSERT TO authenticated
  WITH CHECK (organization_id = get_user_org_id());

-- DOCUMENTS: Users can update their own documents
CREATE POLICY "Users can update own documents" ON documents
  FOR UPDATE TO authenticated
  USING (user_id IN (
    SELECT id FROM users WHERE clerk_user_id = auth.jwt()->>'sub'
  ));

-- DOCUMENTS: Users can delete their own documents
CREATE POLICY "Users can delete own documents" ON documents
  FOR DELETE TO authenticated
  USING (user_id IN (
    SELECT id FROM users WHERE clerk_user_id = auth.jwt()->>'sub'
  ));

-- DOCUMENT_CHUNKS: Users can read their org's document chunks
CREATE POLICY "Users can read org document chunks" ON document_chunks
  FOR SELECT TO authenticated
  USING (organization_id = get_user_org_id());

-- API_KEYS: Users can read their org's API keys
CREATE POLICY "Users can read org API keys" ON api_keys
  FOR SELECT TO authenticated
  USING (organization_id = get_user_org_id());

-- API_KEYS: Users can create API keys in their org
CREATE POLICY "Users can create API keys" ON api_keys
  FOR INSERT TO authenticated
  WITH CHECK (organization_id = get_user_org_id());

-- API_KEYS: Users can update their own API keys
CREATE POLICY "Users can update own API keys" ON api_keys
  FOR UPDATE TO authenticated
  USING (user_id IN (
    SELECT id FROM users WHERE clerk_user_id = auth.jwt()->>'sub'
  ));

-- API_KEYS: Users can delete their own API keys
CREATE POLICY "Users can delete own API keys" ON api_keys
  FOR DELETE TO authenticated
  USING (user_id IN (
    SELECT id FROM users WHERE clerk_user_id = auth.jwt()->>'sub'
  ));

-- SUBSCRIPTION_PLANS: All authenticated users can read plans (for pricing page)
CREATE POLICY "Authenticated users can read plans" ON subscription_plans
  FOR SELECT TO authenticated
  USING (is_active = true);

-- SUBSCRIPTIONS: Users can read their org's subscription
CREATE POLICY "Users can read org subscription" ON subscriptions
  FOR SELECT TO authenticated
  USING (organization_id = get_user_org_id());

-- USAGE_RECORDS: Users can read their org's usage records
CREATE POLICY "Users can read org usage" ON usage_records
  FOR SELECT TO authenticated
  USING (organization_id = get_user_org_id());

-- PAYMENT_HISTORY: Users can read their org's payment history
CREATE POLICY "Users can read org payments" ON payment_history
  FOR SELECT TO authenticated
  USING (organization_id = get_user_org_id());

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Run these to verify everything was created successfully:

SELECT 'Tables Created' AS status, COUNT(*) AS count
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('organizations', 'users', 'agent_sessions', 'messages', 'documents', 'document_chunks', 'api_keys', 'subscription_plans', 'subscriptions', 'usage_records', 'payment_history');

SELECT 'Subscription Plans' AS status, name, stripe_price_id_monthly, stripe_price_id_yearly
FROM subscription_plans
ORDER BY price_monthly;
