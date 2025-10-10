-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "vector";

-- =============================================================================
-- ORGANIZATIONS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clerk_org_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  industry TEXT,
  team_size TEXT,
  use_case TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast lookup by Clerk organization ID
CREATE INDEX idx_organizations_clerk_org_id ON organizations(clerk_org_id);

-- =============================================================================
-- USERS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clerk_user_id TEXT UNIQUE NOT NULL,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  role TEXT DEFAULT 'member',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for users
CREATE INDEX idx_users_clerk_user_id ON users(clerk_user_id);
CREATE INDEX idx_users_organization_id ON users(organization_id);

-- =============================================================================
-- AGENT_SESSIONS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS agent_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  agent_type TEXT NOT NULL,
  status TEXT DEFAULT 'active',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for agent sessions
CREATE INDEX idx_agent_sessions_organization_id ON agent_sessions(organization_id);
CREATE INDEX idx_agent_sessions_user_id ON agent_sessions(user_id);
CREATE INDEX idx_agent_sessions_status ON agent_sessions(status);

-- =============================================================================
-- MESSAGES TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  session_id UUID NOT NULL REFERENCES agent_sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system', 'tool')),
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for messages
CREATE INDEX idx_messages_organization_id ON messages(organization_id);
CREATE INDEX idx_messages_session_id ON messages(session_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);

-- =============================================================================
-- DOCUMENTS TABLE (for RAG)
-- =============================================================================
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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

-- Indexes for documents
CREATE INDEX idx_documents_organization_id ON documents(organization_id);
CREATE INDEX idx_documents_user_id ON documents(user_id);

-- =============================================================================
-- DOCUMENT_CHUNKS TABLE (for RAG with vector embeddings)
-- =============================================================================
CREATE TABLE IF NOT EXISTS document_chunks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  chunk_index INTEGER NOT NULL,
  embedding vector(1536),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for document chunks
CREATE INDEX idx_document_chunks_organization_id ON document_chunks(organization_id);
CREATE INDEX idx_document_chunks_document_id ON document_chunks(document_id);
-- Vector similarity index using ivfflat (approximate nearest neighbor)
CREATE INDEX idx_document_chunks_embedding ON document_chunks
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- =============================================================================
-- API_KEYS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  key_hash TEXT NOT NULL UNIQUE,
  key_prefix TEXT NOT NULL,
  last_used_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  scopes JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for API keys
CREATE INDEX idx_api_keys_organization_id ON api_keys(organization_id);
CREATE INDEX idx_api_keys_key_hash ON api_keys(key_hash);
CREATE INDEX idx_api_keys_is_active ON api_keys(is_active);

-- =============================================================================
-- USAGE_TRACKING TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS usage_tracking (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID,
  action TEXT NOT NULL,
  tokens_used INTEGER DEFAULT 0,
  cost_usd DECIMAL(10, 6) DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for usage tracking
CREATE INDEX idx_usage_tracking_organization_id ON usage_tracking(organization_id);
CREATE INDEX idx_usage_tracking_created_at ON usage_tracking(created_at DESC);
CREATE INDEX idx_usage_tracking_resource_type ON usage_tracking(resource_type);

-- =============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_tracking ENABLE ROW LEVEL SECURITY;

-- RLS Policies for organizations
CREATE POLICY "Organizations are viewable by members"
  ON organizations FOR SELECT
  USING (clerk_org_id = current_setting('app.clerk_org_id', true));

CREATE POLICY "Organizations are insertable by authenticated users"
  ON organizations FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Organizations are updatable by members"
  ON organizations FOR UPDATE
  USING (clerk_org_id = current_setting('app.clerk_org_id', true));

-- RLS Policies for users
CREATE POLICY "Users are viewable by org members"
  ON users FOR SELECT
  USING (
    organization_id IN (
      SELECT id FROM organizations
      WHERE clerk_org_id = current_setting('app.clerk_org_id', true)
    )
  );

CREATE POLICY "Users are insertable by authenticated users"
  ON users FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users are updatable by themselves"
  ON users FOR UPDATE
  USING (clerk_user_id = current_setting('app.clerk_user_id', true));

-- RLS Policies for agent_sessions
CREATE POLICY "Agent sessions are viewable by org members"
  ON agent_sessions FOR SELECT
  USING (
    organization_id IN (
      SELECT id FROM organizations
      WHERE clerk_org_id = current_setting('app.clerk_org_id', true)
    )
  );

CREATE POLICY "Agent sessions are insertable by org members"
  ON agent_sessions FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT id FROM organizations
      WHERE clerk_org_id = current_setting('app.clerk_org_id', true)
    )
  );

CREATE POLICY "Agent sessions are updatable by org members"
  ON agent_sessions FOR UPDATE
  USING (
    organization_id IN (
      SELECT id FROM organizations
      WHERE clerk_org_id = current_setting('app.clerk_org_id', true)
    )
  );

-- RLS Policies for messages
CREATE POLICY "Messages are viewable by org members"
  ON messages FOR SELECT
  USING (
    organization_id IN (
      SELECT id FROM organizations
      WHERE clerk_org_id = current_setting('app.clerk_org_id', true)
    )
  );

CREATE POLICY "Messages are insertable by org members"
  ON messages FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT id FROM organizations
      WHERE clerk_org_id = current_setting('app.clerk_org_id', true)
    )
  );

-- RLS Policies for documents
CREATE POLICY "Documents are viewable by org members"
  ON documents FOR SELECT
  USING (
    organization_id IN (
      SELECT id FROM organizations
      WHERE clerk_org_id = current_setting('app.clerk_org_id', true)
    )
  );

CREATE POLICY "Documents are insertable by org members"
  ON documents FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT id FROM organizations
      WHERE clerk_org_id = current_setting('app.clerk_org_id', true)
    )
  );

CREATE POLICY "Documents are updatable by owner or org admins"
  ON documents FOR UPDATE
  USING (
    organization_id IN (
      SELECT id FROM organizations
      WHERE clerk_org_id = current_setting('app.clerk_org_id', true)
    )
  );

CREATE POLICY "Documents are deletable by owner or org admins"
  ON documents FOR DELETE
  USING (
    organization_id IN (
      SELECT id FROM organizations
      WHERE clerk_org_id = current_setting('app.clerk_org_id', true)
    )
  );

-- RLS Policies for document_chunks
CREATE POLICY "Document chunks are viewable by org members"
  ON document_chunks FOR SELECT
  USING (
    organization_id IN (
      SELECT id FROM organizations
      WHERE clerk_org_id = current_setting('app.clerk_org_id', true)
    )
  );

CREATE POLICY "Document chunks are insertable by org members"
  ON document_chunks FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT id FROM organizations
      WHERE clerk_org_id = current_setting('app.clerk_org_id', true)
    )
  );

CREATE POLICY "Document chunks are deletable by org members"
  ON document_chunks FOR DELETE
  USING (
    organization_id IN (
      SELECT id FROM organizations
      WHERE clerk_org_id = current_setting('app.clerk_org_id', true)
    )
  );

-- RLS Policies for api_keys
CREATE POLICY "API keys are viewable by org members"
  ON api_keys FOR SELECT
  USING (
    organization_id IN (
      SELECT id FROM organizations
      WHERE clerk_org_id = current_setting('app.clerk_org_id', true)
    )
  );

CREATE POLICY "API keys are insertable by org members"
  ON api_keys FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT id FROM organizations
      WHERE clerk_org_id = current_setting('app.clerk_org_id', true)
    )
  );

CREATE POLICY "API keys are updatable by org members"
  ON api_keys FOR UPDATE
  USING (
    organization_id IN (
      SELECT id FROM organizations
      WHERE clerk_org_id = current_setting('app.clerk_org_id', true)
    )
  );

CREATE POLICY "API keys are deletable by owner or org admins"
  ON api_keys FOR DELETE
  USING (
    organization_id IN (
      SELECT id FROM organizations
      WHERE clerk_org_id = current_setting('app.clerk_org_id', true)
    )
  );

-- RLS Policies for usage_tracking
CREATE POLICY "Usage tracking is viewable by org members"
  ON usage_tracking FOR SELECT
  USING (
    organization_id IN (
      SELECT id FROM organizations
      WHERE clerk_org_id = current_setting('app.clerk_org_id', true)
    )
  );

CREATE POLICY "Usage tracking is insertable by org members"
  ON usage_tracking FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT id FROM organizations
      WHERE clerk_org_id = current_setting('app.clerk_org_id', true)
    )
  );

-- =============================================================================
-- FUNCTIONS
-- =============================================================================

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_agent_sessions_updated_at
  BEFORE UPDATE ON agent_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_documents_updated_at
  BEFORE UPDATE ON documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_api_keys_updated_at
  BEFORE UPDATE ON api_keys
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function for similarity search (will be used in RAG system)
CREATE OR REPLACE FUNCTION match_document_chunks(
  query_embedding vector(1536),
  match_threshold float,
  match_count int,
  filter_org_id uuid
)
RETURNS TABLE (
  id uuid,
  document_id uuid,
  content text,
  chunk_index int,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    document_chunks.id,
    document_chunks.document_id,
    document_chunks.content,
    document_chunks.chunk_index,
    1 - (document_chunks.embedding <=> query_embedding) as similarity
  FROM document_chunks
  WHERE document_chunks.organization_id = filter_org_id
    AND 1 - (document_chunks.embedding <=> query_embedding) > match_threshold
  ORDER BY document_chunks.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
