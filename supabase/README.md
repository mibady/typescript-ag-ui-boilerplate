# Supabase Setup Guide

This directory contains the database schema and migrations for the AI-First SaaS Boilerplate.

## Quick Start

### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Click "New Project"
3. Fill in your project details
4. Wait for the project to be created

### 2. Enable Required Extensions

In your Supabase SQL Editor, run:

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "vector";
```

### 3. Run the Migration

Copy the contents of `migrations/20250930000001_initial_schema.sql` and run it in the Supabase SQL Editor.

Or use the Supabase CLI:

```bash
# Install Supabase CLI
npm install -g supabase

# Link to your project
supabase link --project-ref YOUR_PROJECT_REF

# Run migrations
supabase db push
```

### 4. Update Environment Variables

Copy your Supabase credentials to `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxxxx
SUPABASE_SERVICE_ROLE_KEY=eyJxxxxx
```

## Database Schema

### Core Tables

#### organizations
- Multi-tenant workspace for users
- Links to Clerk organization via `clerk_org_id`
- Stores organization metadata (industry, team size, use case)

#### users
- Individual user records
- Links to Clerk user via `clerk_user_id`
- Belongs to an organization
- Stores user role and profile information

#### agent_sessions
- AI agent conversation sessions
- Belongs to organization and user
- Tracks agent type and session metadata
- Status field for session lifecycle

#### messages
- Individual messages within agent sessions
- Supports user, assistant, system, and tool roles
- Stores message content and metadata

#### documents
- User-uploaded documents for RAG
- Belongs to organization and user
- Stores document content and metadata

#### document_chunks
- Chunked document content for RAG
- Contains vector embeddings (1536 dimensions for OpenAI)
- Indexed for similarity search
- Links back to parent document

#### api_keys
- Programmatic API access keys
- Belongs to organization and user
- Stores hashed keys (never plain text)
- Supports scopes and expiration

#### usage_tracking
- Tracks resource usage and costs
- Records tokens used and cost in USD
- Supports various resource types
- Organization-level aggregation

## Row Level Security (RLS)

All tables have RLS enabled with organization-based isolation:

- Users can only access data from their organization
- Organization ID is set via `app.clerk_org_id` session variable
- User ID is set via `app.clerk_user_id` session variable
- Admin operations use service role key to bypass RLS

### Setting Session Variables

In your API routes, set these before querying:

```typescript
import { auth } from '@clerk/nextjs/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

const { orgId, userId } = await auth();
const supabase = await createServerSupabaseClient();

// Set session variables for RLS
await supabase.rpc('exec', {
  sql: `
    SELECT set_config('app.clerk_org_id', '${orgId}', false);
    SELECT set_config('app.clerk_user_id', '${userId}', false);
  `
});
```

## Vector Search for RAG

The `match_document_chunks` function enables similarity search:

```typescript
const { data, error } = await supabase.rpc('match_document_chunks', {
  query_embedding: embedding, // 1536-dimension array
  match_threshold: 0.7,
  match_count: 10,
  filter_org_id: organizationId,
});
```

This returns the most similar document chunks based on cosine similarity.

## Indexes

The following indexes optimize query performance:

- Organization lookups by Clerk ID
- User lookups by Clerk ID
- Session filtering by organization and user
- Message sorting by timestamp
- Document chunk vector similarity (ivfflat)

## Auto-Updated Timestamps

The `update_updated_at_column()` function automatically updates `updated_at` on:
- organizations
- users
- agent_sessions
- documents
- api_keys

## Migration Strategy

Migrations are versioned and sequential:
- Format: `YYYYMMDDHHMMSS_description.sql`
- Run in order
- Never modify existing migrations
- Create new migrations for schema changes

## Local Development

Use docker-compose to run PostgreSQL locally with pgvector:

```bash
docker-compose up -d
```

Then run migrations against local database.

## Production Checklist

- [ ] Enable pgvector extension
- [ ] Run all migrations
- [ ] Verify RLS policies are active
- [ ] Set up database backups
- [ ] Configure connection pooling
- [ ] Monitor query performance
- [ ] Set up database monitoring

## Security Notes

1. **Never disable RLS** - All user data must be organization-isolated
2. **Service role key** - Use only for admin operations, never expose to client
3. **API keys** - Always hash with bcrypt before storing
4. **Session variables** - Always set org/user context before queries
5. **Embeddings** - Consider rate limiting document uploads to prevent abuse

## Performance Tips

1. **Vector index tuning** - Adjust `lists` parameter based on dataset size
2. **Connection pooling** - Use Supabase's built-in Supavisor
3. **Query optimization** - Use `explain analyze` for slow queries
4. **Chunk size** - Balance between context and retrieval performance
5. **Batch operations** - Use transactions for multiple inserts

## Troubleshooting

### RLS blocking queries
- Verify session variables are set correctly
- Check policy conditions match your query
- Use service role key for debugging (temporarily)

### Vector search not working
- Ensure pgvector extension is enabled
- Verify embeddings are 1536 dimensions
- Check index was created successfully
- Rebuild index if needed: `REINDEX INDEX idx_document_chunks_embedding;`

### Slow queries
- Check indexes are being used: `EXPLAIN ANALYZE`
- Consider adding composite indexes
- Optimize RLS policies if complex
- Use materialized views for aggregations

## Support

For issues with:
- Supabase setup: [Supabase Docs](https://supabase.com/docs)
- pgvector: [pgvector GitHub](https://github.com/pgvector/pgvector)
- RLS policies: [PostgreSQL RLS](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
