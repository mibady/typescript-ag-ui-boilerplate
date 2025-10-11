# Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (Next.js 14)                    │
│  Marketing Site  │  Dashboard  │  Admin Panel  │  Agent UI │
└─────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
┌───────────────┐  ┌──────────────┐  ┌──────────────────┐
│  Clerk Auth   │  │ Supabase DB  │  │  Upstash Redis   │
│  (Multi-org)  │  │  + pgvector  │  │  (Event Store)   │
└───────────────┘  └──────────────┘  └──────────────────┘
```

## Multi-Tenancy

- Organization-based isolation via Clerk
- Row-level security (RLS) in Supabase
- Organization ID in all database tables
- Middleware enforces org context

## AI Agent System

- **AG-UI Protocol** for real-time streaming
- **Vercel AI SDK** for LLM abstraction
- **Upstash Redis** for event storage
- Supports: OpenAI, Anthropic, Google, Mistral

## RAG System

- **pgvector** extension in Supabase
- Document chunking and embedding
- Vector similarity search
- Semantic code search

## Billing

- **Stripe** integration
- 3 plans: Free, Pro, Enterprise
- Usage tracking per organization
- Webhook handling for subscription events

## Database Schema

11 tables:
- `organizations` - Multi-tenant isolation
- `users` - User profiles
- `agent_sessions` - AG-UI sessions
- `messages` - Chat history
- `documents` - RAG documents
- `document_chunks` - Vector embeddings
- `api_keys` - API key management
- `subscription_plans` - Billing plans
- `subscriptions` - Active subscriptions
- `usage_records` - Usage tracking
- `payment_history` - Payment records

## API Routes

- `/api/agui/*` - AG-UI streaming
- `/api/agents/*` - Agent execution
- `/api/billing/*` - Stripe integration
- `/api/mcp/*` - MCP tools
- `/api/rag/*` - RAG system
- `/api/webhooks/*` - Webhook handlers
