-- Subscription Plans Database Schema
-- Phase 6: Billing & Subscriptions

-- ============================================================================
-- 1. SUBSCRIPTION PLANS TABLE
-- ============================================================================
-- Defines available subscription tiers (Free, Pro, Enterprise)

CREATE TABLE IF NOT EXISTS subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE, -- 'free', 'pro', 'enterprise'
  display_name TEXT NOT NULL, -- 'Free Plan', 'Pro Plan', 'Enterprise Plan'
  description TEXT,
  price_monthly INTEGER NOT NULL DEFAULT 0, -- Price in cents (e.g., 2000 = $20.00)
  price_yearly INTEGER NOT NULL DEFAULT 0, -- Annual price in cents
  stripe_price_id_monthly TEXT, -- Stripe Price ID for monthly billing
  stripe_price_id_yearly TEXT, -- Stripe Price ID for yearly billing
  features JSONB NOT NULL DEFAULT '{}', -- Plan features as JSON
  limits JSONB NOT NULL DEFAULT '{}', -- Usage limits as JSON
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast plan lookups
CREATE INDEX idx_subscription_plans_name ON subscription_plans(name);
CREATE INDEX idx_subscription_plans_active ON subscription_plans(is_active);

-- ============================================================================
-- 2. SUBSCRIPTIONS TABLE
-- ============================================================================
-- Tracks organization subscriptions and Stripe data

CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES subscription_plans(id),

  -- Stripe Integration
  stripe_customer_id TEXT UNIQUE, -- Stripe Customer ID
  stripe_subscription_id TEXT UNIQUE, -- Stripe Subscription ID
  stripe_price_id TEXT, -- Current Stripe Price ID

  -- Subscription Status
  status TEXT NOT NULL DEFAULT 'active', -- 'active', 'trialing', 'past_due', 'canceled', 'incomplete'
  billing_cycle TEXT NOT NULL DEFAULT 'monthly', -- 'monthly', 'yearly'

  -- Billing Dates
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  trial_end TIMESTAMP WITH TIME ZONE,
  cancel_at TIMESTAMP WITH TIME ZONE,
  canceled_at TIMESTAMP WITH TIME ZONE,

  -- Metadata
  metadata JSONB DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_status CHECK (status IN ('active', 'trialing', 'past_due', 'canceled', 'incomplete', 'incomplete_expired', 'unpaid')),
  CONSTRAINT valid_billing_cycle CHECK (billing_cycle IN ('monthly', 'yearly'))
);

-- Indexes for performance
CREATE INDEX idx_subscriptions_org ON subscriptions(organization_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_stripe_customer ON subscriptions(stripe_customer_id);
CREATE INDEX idx_subscriptions_stripe_subscription ON subscriptions(stripe_subscription_id);
CREATE INDEX idx_subscriptions_period_end ON subscriptions(current_period_end);

-- Ensure one active subscription per organization
CREATE UNIQUE INDEX idx_subscriptions_org_active ON subscriptions(organization_id)
WHERE status IN ('active', 'trialing');

-- ============================================================================
-- 3. USAGE TRACKING TABLE
-- ============================================================================
-- Tracks organization usage for billing and limits enforcement

CREATE TABLE IF NOT EXISTS usage_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,

  -- Usage Metrics
  metric_name TEXT NOT NULL, -- 'messages', 'tokens', 'documents', 'api_calls', etc.
  quantity INTEGER NOT NULL DEFAULT 0,
  unit TEXT NOT NULL DEFAULT 'count', -- 'count', 'tokens', 'bytes', etc.

  -- Billing Period
  period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  period_end TIMESTAMP WITH TIME ZONE NOT NULL,

  -- Metadata
  metadata JSONB DEFAULT '{}',

  -- Timestamps
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraints
  CONSTRAINT usage_quantity_positive CHECK (quantity >= 0)
);

-- Indexes for usage queries
CREATE INDEX idx_usage_records_org ON usage_records(organization_id);
CREATE INDEX idx_usage_records_subscription ON usage_records(subscription_id);
CREATE INDEX idx_usage_records_metric ON usage_records(metric_name);
CREATE INDEX idx_usage_records_period ON usage_records(period_start, period_end);
CREATE INDEX idx_usage_records_org_metric_period ON usage_records(organization_id, metric_name, period_start, period_end);

-- ============================================================================
-- 4. PAYMENT HISTORY TABLE
-- ============================================================================
-- Records all payment transactions

CREATE TABLE IF NOT EXISTS payment_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,

  -- Stripe Data
  stripe_invoice_id TEXT UNIQUE,
  stripe_payment_intent_id TEXT,
  stripe_charge_id TEXT,

  -- Payment Details
  amount INTEGER NOT NULL, -- Amount in cents
  currency TEXT NOT NULL DEFAULT 'usd',
  status TEXT NOT NULL, -- 'succeeded', 'failed', 'pending', 'refunded'

  -- Invoice Details
  invoice_url TEXT,
  invoice_pdf TEXT,
  description TEXT,

  -- Metadata
  metadata JSONB DEFAULT '{}',

  -- Timestamps
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_payment_status CHECK (status IN ('succeeded', 'failed', 'pending', 'refunded', 'canceled')),
  CONSTRAINT payment_amount_positive CHECK (amount >= 0)
);

-- Indexes for payment queries
CREATE INDEX idx_payment_history_org ON payment_history(organization_id);
CREATE INDEX idx_payment_history_subscription ON payment_history(subscription_id);
CREATE INDEX idx_payment_history_status ON payment_history(status);
CREATE INDEX idx_payment_history_stripe_invoice ON payment_history(stripe_invoice_id);
CREATE INDEX idx_payment_history_paid_at ON payment_history(paid_at);

-- ============================================================================
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_history ENABLE ROW LEVEL SECURITY;

-- Subscription Plans: Public read access (everyone can see available plans)
CREATE POLICY "subscription_plans_public_read" ON subscription_plans
  FOR SELECT
  USING (is_active = true);

-- Subscription Plans: Admin-only write access
CREATE POLICY "subscription_plans_admin_write" ON subscription_plans
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'admin');

-- Subscriptions: Organization members can read their own subscription
CREATE POLICY "subscriptions_org_read" ON subscriptions
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id
      FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

-- Subscriptions: Organization admins can update their subscription
CREATE POLICY "subscriptions_org_admin_update" ON subscriptions
  FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id
      FROM organization_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Subscriptions: System can insert/update (for webhook handlers)
CREATE POLICY "subscriptions_system_write" ON subscriptions
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Usage Records: Organization members can read their usage
CREATE POLICY "usage_records_org_read" ON usage_records
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id
      FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

-- Usage Records: System can insert usage data
CREATE POLICY "usage_records_system_insert" ON usage_records
  FOR INSERT
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- Payment History: Organization members can read their payment history
CREATE POLICY "payment_history_org_read" ON payment_history
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id
      FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

-- Payment History: System can insert payment records
CREATE POLICY "payment_history_system_insert" ON payment_history
  FOR INSERT
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- ============================================================================
-- 6. SEED DATA - DEFAULT SUBSCRIPTION PLANS
-- ============================================================================

-- Free Plan
INSERT INTO subscription_plans (name, display_name, description, price_monthly, price_yearly, features, limits)
VALUES (
  'free',
  'Free Plan',
  'Perfect for trying out the platform',
  0,
  0,
  '{"chat": true, "basic_agents": true, "email_support": false, "priority_support": false, "custom_integrations": false}',
  '{"messages_per_month": 100, "tokens_per_month": 50000, "documents": 10, "team_members": 1, "sessions": 5, "api_calls_per_day": 100}'
)
ON CONFLICT (name) DO NOTHING;

-- Pro Plan
INSERT INTO subscription_plans (name, display_name, description, price_monthly, price_yearly, features, limits)
VALUES (
  'pro',
  'Pro Plan',
  'For professionals and growing teams',
  2000, -- $20/month
  19200, -- $192/year (20% discount)
  '{"chat": true, "basic_agents": true, "advanced_agents": true, "email_support": true, "priority_support": false, "custom_integrations": true, "api_access": true}',
  '{"messages_per_month": 10000, "tokens_per_month": 5000000, "documents": 1000, "team_members": 10, "sessions": 100, "api_calls_per_day": 10000}'
)
ON CONFLICT (name) DO NOTHING;

-- Enterprise Plan
INSERT INTO subscription_plans (name, display_name, description, price_monthly, price_yearly, features, limits)
VALUES (
  'enterprise',
  'Enterprise Plan',
  'For large teams with advanced needs',
  10000, -- $100/month
  96000, -- $960/year (20% discount)
  '{"chat": true, "basic_agents": true, "advanced_agents": true, "custom_agents": true, "email_support": true, "priority_support": true, "custom_integrations": true, "api_access": true, "sso": true, "dedicated_support": true}',
  '{"messages_per_month": -1, "tokens_per_month": -1, "documents": -1, "team_members": -1, "sessions": -1, "api_calls_per_day": -1}'
)
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- 7. HELPER FUNCTIONS
-- ============================================================================

-- Function to get current usage for an organization
CREATE OR REPLACE FUNCTION get_current_usage(org_id UUID, metric TEXT)
RETURNS INTEGER AS $$
DECLARE
  current_usage INTEGER;
  period_start TIMESTAMP WITH TIME ZONE;
  period_end TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Get current billing period from subscription
  SELECT s.current_period_start, s.current_period_end
  INTO period_start, period_end
  FROM subscriptions s
  WHERE s.organization_id = org_id
    AND s.status IN ('active', 'trialing')
  LIMIT 1;

  -- If no active subscription, use current month
  IF period_start IS NULL THEN
    period_start := date_trunc('month', NOW());
    period_end := date_trunc('month', NOW()) + INTERVAL '1 month';
  END IF;

  -- Sum usage for the current period
  SELECT COALESCE(SUM(quantity), 0)
  INTO current_usage
  FROM usage_records
  WHERE organization_id = org_id
    AND metric_name = metric
    AND period_start <= NOW()
    AND period_end > NOW();

  RETURN current_usage;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if organization has exceeded limit
CREATE OR REPLACE FUNCTION check_usage_limit(org_id UUID, metric TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  current_usage INTEGER;
  usage_limit INTEGER;
  plan_limits JSONB;
BEGIN
  -- Get plan limits
  SELECT sp.limits
  INTO plan_limits
  FROM subscriptions s
  JOIN subscription_plans sp ON s.plan_id = sp.id
  WHERE s.organization_id = org_id
    AND s.status IN ('active', 'trialing')
  LIMIT 1;

  -- If no subscription, default to free plan limits
  IF plan_limits IS NULL THEN
    SELECT limits INTO plan_limits
    FROM subscription_plans
    WHERE name = 'free';
  END IF;

  -- Get limit for specific metric (-1 means unlimited)
  usage_limit := (plan_limits ->> metric)::INTEGER;

  IF usage_limit = -1 THEN
    RETURN true; -- Unlimited
  END IF;

  -- Get current usage
  current_usage := get_current_usage(org_id, metric);

  -- Check if under limit
  RETURN current_usage < usage_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to record usage
CREATE OR REPLACE FUNCTION record_usage(
  org_id UUID,
  metric TEXT,
  amount INTEGER DEFAULT 1
)
RETURNS VOID AS $$
DECLARE
  sub_id UUID;
  period_start TIMESTAMP WITH TIME ZONE;
  period_end TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Get subscription ID and billing period
  SELECT s.id, s.current_period_start, s.current_period_end
  INTO sub_id, period_start, period_end
  FROM subscriptions s
  WHERE s.organization_id = org_id
    AND s.status IN ('active', 'trialing')
  LIMIT 1;

  -- If no active subscription, use current month
  IF period_start IS NULL THEN
    period_start := date_trunc('month', NOW());
    period_end := date_trunc('month', NOW()) + INTERVAL '1 month';
  END IF;

  -- Insert usage record
  INSERT INTO usage_records (
    organization_id,
    subscription_id,
    metric_name,
    quantity,
    period_start,
    period_end
  )
  VALUES (
    org_id,
    sub_id,
    metric,
    amount,
    period_start,
    period_end
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 8. TRIGGERS FOR UPDATED_AT
-- ============================================================================

-- Trigger function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
CREATE TRIGGER update_subscription_plans_updated_at
  BEFORE UPDATE ON subscription_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
