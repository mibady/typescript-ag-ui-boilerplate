# Database Schema

## Tables

### organizations
Multi-tenant isolation.

```sql
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_org_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### users
User profiles synced from Clerk.

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT UNIQUE NOT NULL,
  organization_id UUID REFERENCES organizations(id),
  email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### subscription_plans
Billing plans (Free, Pro, Enterprise).

```sql
CREATE TABLE subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  price_monthly INTEGER NOT NULL DEFAULT 0,
  price_yearly INTEGER NOT NULL DEFAULT 0,
  stripe_price_id_monthly TEXT,
  stripe_price_id_yearly TEXT,
  features JSONB NOT NULL DEFAULT '{}',
  limits JSONB NOT NULL DEFAULT '{}'
);
```

### subscriptions
Active subscriptions.

```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  plan_id UUID NOT NULL REFERENCES subscription_plans(id),
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  status TEXT NOT NULL DEFAULT 'active',
  billing_cycle TEXT NOT NULL DEFAULT 'monthly',
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE
);
```

### agent_sessions
AG-UI protocol sessions.

```sql
CREATE TABLE agent_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  user_id UUID NOT NULL REFERENCES users(id),
  agent_type TEXT NOT NULL,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### messages
Chat messages.

```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  session_id UUID NOT NULL REFERENCES agent_sessions(id),
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system', 'tool')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### documents
RAG documents.

```sql
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  user_id UUID NOT NULL REFERENCES users(id),
  name TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### document_chunks
Vector embeddings for RAG.

```sql
CREATE TABLE document_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  document_id UUID NOT NULL REFERENCES documents(id),
  content TEXT NOT NULL,
  chunk_index INTEGER NOT NULL,
  embedding vector(1536),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_document_chunks_embedding ON document_chunks
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);
```

### usage_records
Usage tracking for billing.

```sql
CREATE TABLE usage_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  subscription_id UUID REFERENCES subscriptions(id),
  metric_name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0,
  period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  period_end TIMESTAMP WITH TIME ZONE NOT NULL
);
```

### payment_history
Payment records.

```sql
CREATE TABLE payment_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  subscription_id UUID REFERENCES subscriptions(id),
  stripe_invoice_id TEXT UNIQUE,
  amount INTEGER NOT NULL,
  status TEXT NOT NULL,
  paid_at TIMESTAMP WITH TIME ZONE
);
```

## Row Level Security (RLS)

All tables have RLS enabled. Service role has full access. Users can only access data for their organization.

Example policy:
```sql
CREATE POLICY "org_members_read" ON messages
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id
      FROM users
      WHERE clerk_user_id = auth.uid()
    )
  );
```

## Migrations

All migrations are in `supabase/migrations/`.

Complete setup: Run `supabase/RESET_AND_SETUP.sql` in Supabase Dashboard.
