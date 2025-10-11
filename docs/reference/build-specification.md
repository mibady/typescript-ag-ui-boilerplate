# Product Requirement Prompt (PRP)

---
**Metadata:**
- **PRP ID:** typescript-ag-ui-boilerplate-v1
- **Title:** Complete AI-First Multi-Tenant SaaS Boilerplate
- **Version:** 1.0.0
- **Created:** 2025-10-09
- **Created By:** AI Coder Agents
- **Status:** In Progress
---

## 📋 Overview

### User Request

Build a complete, production-ready boilerplate for AI-powered SaaS applications using the exact specification from `/mnt/c/dev/ai-coder-agents/docs/templates/typescript-ag-ui-boilerplate.md`. This boilerplate will serve as the foundation for building multi-tenant AI agent applications with real-time streaming, RAG capabilities, and comprehensive SaaS features.

### Summary

Create an 8-week phased implementation of a full-stack TypeScript boilerplate that includes:
- Multi-tenant authentication with Clerk organizations
- AI agent system using Vercel AI SDK with AG-UI protocol for real-time streaming
- MCP tools for external integrations (8 core tools)
- RAG system with Supabase pgvector
- Complete marketing site with Sanity CMS
- User dashboard and admin panel
- Stripe subscription billing
- API key management
- Comprehensive testing suite (unit, integration, E2E)
- CI/CD pipeline with GitHub Actions

---

## 🔍 Context Gathered

### Knowledge Base Queries

- Reviewed complete specification: `/mnt/c/dev/ai-coder-agents/docs/templates/typescript-ag-ui-boilerplate.md`
- Referenced PRP template: `/mnt/c/dev/ai-coder-agents/docs/templates/prp.md`
- Analyzed hybrid format system documentation
- Reviewed AI Coder Agents MCP tool capabilities

### Relevant Code Patterns

- **Pattern:** Next.js 14 App Router with TypeScript
  - **Location:** Standard Next.js patterns
  - **Usage:** File-based routing, Server Components, API routes

- **Pattern:** Multi-tenancy with Clerk + Supabase RLS
  - **Location:** Template specification (lines 122-135, 798-824)
  - **Usage:** Organization isolation, row-level security

- **Pattern:** AG-UI Protocol for real-time streaming
  - **Location:** Template specification (lines 61, 259, 439-442, 828-843)
  - **Usage:** SSE streaming, Redis event store, real-time agent communication

- **Pattern:** Vercel AI SDK for LLM abstraction
  - **Location:** Template specification (lines 60, 702)
  - **Usage:** Provider-agnostic LLM integration

### Existing Implementations

- **Feature:** Base Next.js project initialized
  - **Path:** `/mnt/c/dev/typescript-ag-ui-boilerplate/`
  - **Relevance:** Foundation already created, ready for phase implementation

---

## ✅ Requirements

### Functional Requirements

1. Users can sign up and create organizations via Clerk
2. Multi-tenant data isolation enforced via Supabase RLS
3. Users can chat with AI agents in real-time with streaming responses
4. Agents can execute 8 MCP tools (search, database-query, file-read/write, email-send, calendar, analytics, web-scrape)
5. Users can upload documents for RAG retrieval
6. Documents are chunked, embedded, and stored in pgvector
7. Agents retrieve relevant context from RAG system during conversations
8. Marketing site with landing page, pricing, blog, and documentation
9. Blog content managed via Sanity CMS
10. User dashboard with agent management, chat interface, document library, team management
11. Admin panel for system monitoring, user management, analytics
12. API key creation and management for programmatic access
13. Stripe subscription billing with Free, Pro, and Enterprise tiers
14. Usage tracking and cost analytics
15. Email notifications via Resend
16. Rate limiting and security via Arcjet
17. Error monitoring via Sentry
18. Full test coverage (unit, integration, E2E, load)
19. CI/CD pipeline with GitHub Actions
20. Mobile-responsive design with dark mode support

### Non-Functional Requirements

1. Page load time < 2 seconds
2. API response time < 500ms
3. Agent response start < 1 second
4. SSE latency < 100ms
5. Zero TypeScript compilation errors
6. Zero ESLint errors
7. Test coverage > 80%
8. Lighthouse score > 90
9. WCAG 2.1 AA accessibility compliance
10. Secure API key storage (bcrypt hashing)
11. Environment variables properly secured
12. All database operations use RLS policies
13. HTTPS enforced in production
14. CORS properly configured
15. Audit logging for sensitive operations

### Acceptance Criteria

- [ ] User can sign up, create org, and access dashboard
- [ ] User can chat with AI agent and see streaming responses in real-time
- [ ] Agent can execute all 8 MCP tools successfully
- [ ] User can upload documents and agents retrieve relevant context
- [ ] RAG similarity search returns accurate results
- [ ] Marketing site renders with CMS content
- [ ] Blog posts display correctly from Sanity
- [ ] User can invite team members to organization
- [ ] Admin can view system analytics and manage users
- [ ] API keys can be created and used for authentication
- [ ] Stripe checkout flow completes successfully
- [ ] Usage tracking shows accurate metrics
- [ ] All 80+ tests pass
- [ ] GitHub Actions CI/CD pipeline passes
- [ ] Application deploys successfully to Vercel
- [ ] Mobile layout is fully responsive
- [ ] Dark mode toggles correctly
- [ ] Lighthouse scores > 90 for all pages

---

## 🏗️ Technical Specification

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Frontend (Next.js)                     │
├─────────────────────────────────────────────────────────────┤
│  Marketing Site  │  Dashboard  │  Admin Panel  │  Agent UI │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    API Routes (Next.js)                     │
├─────────────────────────────────────────────────────────────┤
│  /api/agui/stream  │  /api/agents/run  │  /api/mcp/tools  │
└─────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
┌───────────────┐  ┌──────────────┐  ┌──────────────────┐
│  Clerk Auth   │  │ Supabase DB  │  │  Upstash Redis   │
│  (Multi-org)  │  │  + pgvector  │  │  (Event Store)   │
└───────────────┘  └──────────────┘  └──────────────────┘
                            │
                            ▼
                ┌───────────────────────┐
                │   Agent System        │
                │  (Vercel AI SDK)      │
                │  + AG-UI Events       │
                │  + MCP Tools          │
                │  + RAG System         │
                └───────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
┌───────────────┐  ┌──────────────┐  ┌──────────────┐
│   OpenAI      │  │  Anthropic   │  │    Google    │
└───────────────┘  └──────────────┘  └──────────────┘
```

### Design Patterns

- **MCP Server Pattern**: Internal MCP server within API routes for tool execution
- **Repository Pattern**: Database abstraction layer for Supabase operations
- **Factory Pattern**: LLM provider factory for runtime provider selection
- **Observer Pattern**: AG-UI event emission and SSE streaming
- **Middleware Chain**: Authentication → Organization context → RLS → Route handler
- **Component Composition**: shadcn/ui components composed into pre-built blocks

### Technologies & Libraries

- **next** (^14.2.0): Core framework with App Router
- **react** (^18.3.0): UI library
- **typescript** (^5.3.0): Type safety
- **tailwindcss** (^3.4.0): Styling
- **@clerk/nextjs** (^5.7.0): Multi-tenant authentication
- **@supabase/supabase-js** (^2.x): Database client
- **@upstash/redis** (^1.x): Redis client for event storage
- **ai** (^3.4.0): Vercel AI SDK for LLM abstraction
- **@ag-ui/core** (^0.0.39): AG-UI protocol for real-time streaming
- **@sanity/client** (^6.x): CMS integration
- **stripe** (^14.x): Payment processing
- **resend** (^3.x): Email delivery
- **@arcjet/next** (^1.0.0): Security and rate limiting
- **@sentry/nextjs** (^7.x): Error monitoring
- **vitest** (latest): Unit testing
- **@playwright/test** (^1.40.0): E2E testing
- **k6** (latest): Load testing

### Constraints

- Must use exact tech stack from template specification (no substitutions)
- All services must be production-grade and scalable
- Must support multiple LLM providers (OpenAI, Anthropic, Google, Mistral)
- Database must enforce organization isolation via RLS
- API responses must be non-blocking for agent execution
- SSE connections must poll Redis every 100ms for events
- Document chunks must be 512 tokens max
- API keys must be bcrypt hashed (never plain text)
- All environment variables must be validated with Zod

### Assumptions

- User has accounts for all required services (Clerk, Supabase, Upstash, etc.)
- User will provide API keys via environment variables
- Local development uses docker-compose for PostgreSQL and Redis
- Production deployment targets Vercel
- Supabase project already has pgvector extension enabled
- Sanity Studio will be hosted separately or embedded

---

## 📦 Dependencies

### New Dependencies Required

#### @clerk/nextjs (^5.7.0)
- **Type:** production
- **Reason:** Multi-tenant authentication with organization support
- **Installation:**
  ```bash
  npm install @clerk/nextjs
  ```

#### @supabase/supabase-js (^2.39.0)
- **Type:** production
- **Reason:** PostgreSQL database client with RLS support
- **Installation:**
  ```bash
  npm install @supabase/supabase-js
  ```

#### @upstash/redis (^1.28.0)
- **Type:** production
- **Reason:** Redis client for AG-UI event storage
- **Installation:**
  ```bash
  npm install @upstash/redis
  ```

#### ai (^3.4.0)
- **Type:** production
- **Reason:** Vercel AI SDK for LLM provider abstraction
- **Installation:**
  ```bash
  npm install ai
  ```

#### @ai-sdk/openai (^1.0.0)
- **Type:** production
- **Reason:** OpenAI provider for Vercel AI SDK
- **Installation:**
  ```bash
  npm install @ai-sdk/openai
  ```

#### @ai-sdk/anthropic (^1.0.0)
- **Type:** production
- **Reason:** Anthropic provider for Vercel AI SDK
- **Installation:**
  ```bash
  npm install @ai-sdk/anthropic
  ```

#### @ai-sdk/google (^1.0.0)
- **Type:** production
- **Reason:** Google provider for Vercel AI SDK
- **Installation:**
  ```bash
  npm install @ai-sdk/google
  ```

#### @ag-ui/core (^0.0.39)
- **Type:** production
- **Reason:** AG-UI protocol for real-time agent-UI communication
- **Installation:**
  ```bash
  npm install @ag-ui/core
  ```

#### @sanity/client (^6.21.0)
- **Type:** production
- **Reason:** Sanity CMS client for blog/docs content
- **Installation:**
  ```bash
  npm install @sanity/client next-sanity
  ```

#### stripe (^14.21.0)
- **Type:** production
- **Reason:** Stripe SDK for subscription billing
- **Installation:**
  ```bash
  npm install stripe
  ```

#### resend (^3.2.0)
- **Type:** production
- **Reason:** Email API for transactional emails
- **Installation:**
  ```bash
  npm install resend
  ```

#### @arcjet/next (^1.0.0-alpha.0)
- **Type:** production
- **Reason:** Security, rate limiting, bot protection
- **Installation:**
  ```bash
  npm install @arcjet/next
  ```

#### @sentry/nextjs (^7.109.0)
- **Type:** production
- **Reason:** Error monitoring and performance tracking
- **Installation:**
  ```bash
  npm install @sentry/nextjs
  ```

#### zod (^3.22.4)
- **Type:** production
- **Reason:** Environment variable validation and runtime type checking
- **Installation:**
  ```bash
  npm install zod
  ```

#### bcryptjs (^2.4.3)
- **Type:** production
- **Reason:** API key hashing
- **Installation:**
  ```bash
  npm install bcryptjs && npm install --save-dev @types/bcryptjs
  ```

#### uuid (^9.0.1)
- **Type:** production
- **Reason:** Generate unique IDs for sessions, keys, etc.
- **Installation:**
  ```bash
  npm install uuid && npm install --save-dev @types/uuid
  ```

#### vitest (^1.3.0)
- **Type:** dev
- **Reason:** Unit testing framework
- **Installation:**
  ```bash
  npm install --save-dev vitest @vitest/ui
  ```

#### @playwright/test (^1.40.0)
- **Type:** dev
- **Reason:** E2E testing framework
- **Installation:**
  ```bash
  npm install --save-dev @playwright/test
  ```

#### shadcn/ui components (46+ components)
- **Type:** Copy-paste components
- **Reason:** Pre-built accessible UI components
- **Installation:**
  ```bash
  npx shadcn-ui@latest init
  # Then add components as needed
  ```

---

## 🔨 Implementation Plan

Continue in next message...

