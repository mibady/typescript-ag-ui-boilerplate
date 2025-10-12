# Complete SDK and CLI Selection Guide for Building AI-Powered Projects

## Table of Contents

- [Understanding the System](#understanding-the-system)
- [Complete Tech Stack](#complete-tech-stack)
- [SDK Selection Matrix](#sdk-selection-matrix)
- [Project Type Decision Tree](#project-type-decision-tree)
- [CLI Workflow](#cli-workflow)
- [Environment Setup](#environment-setup)
- [Real-World Examples](#real-world-examples)
- [Decision Checklist](#decision-checklist)
- [Internal vs External Apps](#internal-vs-external-apps)

---

## Understanding the System

### The Two-Part Infrastructure

```
┌─────────────────────────────────────────────────────────┐
│  AI-CODER-AGENTS (C:\dev\ai-coder-agents)               │
│  CLI Tool + MCP Server                                   │
│                                                           │
│  ✓ Project scaffolding and management                   │
│  ✓ MCP tools for Claude Code                            │
│  ✓ RAG system, PRPs, documentation generation           │
│  ✓ Quality gates (CodeRabbit, tests, builds)           │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│  TYPESCRIPT-AG-UI-BOILERPLATE                           │
│  Reference Implementation                                │
│                                                           │
│  ✓ Production-ready SaaS application                    │
│  ✓ Complete tech stack demonstration                   │
│  ✓ Multi-tenant architecture                            │
│  ✓ AI-first with AG-UI protocol                        │
└─────────────────────────────────────────────────────────┘
```

**Key Relationship**: The `ai-coder-agents` CLI tool uses this boilerplate as the **canonical template** for building AI-powered SaaS applications. When you run `ai-coder init`, it references this verified, production-ready codebase.

---

## Complete Tech Stack

### Frontend Layer

```json
{
  "next": "^14.2.33",              // App Router, React Server Components
  "react": "^18.3.0",              // UI library
  "typescript": "^5.3.0",          // Type safety

  "tailwindcss": "^3.4.0",         // Utility-first CSS
  "@radix-ui/react-*": "latest",   // Headless UI primitives
  "lucide-react": "^0.545.0",      // Icon library

  "zustand": "^5.0.2",             // State management
  "react-hook-form": "^7.64.0",    // Form handling
  "zod": "^4.1.12"                 // Schema validation
}
```

### Backend Services Layer

#### 1. Supabase (PostgreSQL)

```typescript
"@supabase/supabase-js": "^2.75.0"

// What it provides:
// - PostgreSQL database with ACID transactions
// - Row Level Security (RLS) for multi-tenancy
// - Real-time subscriptions
// - Storage for files
```

**Database Schema**:

```sql
-- Multi-tenancy
users, organizations, organization_members

-- Application Data
documents, document_chunks, agent_sessions, agent_messages

-- Business Logic
api_keys, usage_records, subscriptions, tool_executions
```

**Key Feature**: RLS provides automatic, ironclad data isolation between organizations.

#### 2. Upstash Redis

```typescript
"@upstash/redis": "^1.35.5"

// What it provides:
// - Session cache (user sessions, temp data)
// - AG-UI event stream (real-time agent events)
// - Rate limiting (API throttling)
// - API response cache (reduce DB queries)
```

#### 3. Upstash Vector

```typescript
"@upstash/vector": "^1.1.0"

// What it provides:
// - Document embeddings (RAG system)
// - Semantic search (similarity search)
// - Recommendation engines
// - Multi-tenant filtering (by organizationId)
```

#### 4. Upstash Search

```typescript
"@upstash/search": "^0.1.5"

// What it provides:
// - Full-text search (BM25 algorithm)
// - Hybrid search (text + semantic)
// - Typo tolerance
// - Filtering & faceting
```

#### 5. Upstash QStash

```typescript
"@upstash/qstash": "^2.3.0"

// What it provides:
// - Background job processing
// - Webhook delivery (reliable)
// - Scheduled tasks (cron)
// - Multi-step workflows
// - Automatic retries
```

### AI & Agent Layer

```json
{
  "ai": "^5.0.65",                 // Vercel AI SDK (LLM abstraction)
  "@ai-sdk/openai": "^2.0.46",     // OpenAI provider
  "@ai-sdk/anthropic": "^2.0.25",  // Anthropic (Claude)
  "@ai-sdk/google": "^2.0.18",     // Google (Gemini)
  "@ai-sdk/mistral": "^2.0.18",    // Mistral AI

  "@ag-ui/core": "^0.0.39",        // Agent-UI protocol (events)
  "@ag-ui/client": "^0.0.40",      // HttpAgent (frontend)

  "openai": "^4.28.0"              // Embeddings generation
}
```

### Authentication & Security

```json
{
  "@clerk/nextjs": "^6.33.3",      // Multi-tenant auth (organizations, SSO)
  "@arcjet/next": "^1.0.0",        // Rate limiting, bot protection
  "bcrypt": "^5.1.1",              // Password hashing
  "jose": "^5.2.0"                 // JWT handling
}
```

### Payments & Communication

```json
{
  "stripe": "^19.1.0",             // Subscription billing
  "@stripe/stripe-js": "^8.0.0",   // Client-side Stripe
  "resend": "^6.1.2"               // Transactional emails
}
```

### Monitoring & DevOps

```json
{
  "@sentry/nextjs": "^8.40.0"      // Error tracking
}
```

---

## SDK Selection Matrix

| Feature | Product | SDK | Version | Pricing |
|---------|---------|-----|---------|---------|
| **Frontend Framework** | Next.js | `next` | 14.2+ | Free |
| **UI Components** | shadcn/ui | `@radix-ui/react-*` | Latest | Free |
| **Styling** | Tailwind CSS | `tailwindcss` | 3.4+ | Free |
| **Database** | Supabase | `@supabase/supabase-js` | 2.75+ | Free tier |
| **Cache/Real-time** | Upstash Redis | `@upstash/redis` | 1.35+ | Free tier |
| **Vector Search** | Upstash Vector | `@upstash/vector` | 1.1+ | Free tier |
| **Full-text Search** | Upstash Search | `@upstash/search` | 0.1+ | Free tier |
| **Background Jobs** | Upstash QStash | `@upstash/qstash` | 2.3+ | Free tier |
| **LLM Integration** | Vercel AI SDK | `ai` | 5.0+ | Free |
| **Agent Protocol** | AG-UI | `@ag-ui/core` | 0.0.39+ | Free |
| **Authentication** | Clerk | `@clerk/nextjs` | 6.33+ | Free tier |
| **Rate Limiting** | Arcjet | `@arcjet/next` | 1.0+ | Free tier |
| **Payments** | Stripe | `stripe` | 19.0+ | Pay per transaction |
| **Email** | Resend | `resend` | 6.0+ | Free tier |
| **Monitoring** | Sentry | `@sentry/nextjs` | 8.40+ | Free tier |

---

## Project Type Decision Tree

### What are you building?

```
┌─────────────────────────────────────────────────────────┐
│ AI-Powered SaaS with Multi-Tenancy?                      │
│                                                           │
│ YES → Use Full Boilerplate Stack                         │
│       ✓ Next.js 14 + React + TypeScript                 │
│       ✓ Clerk (multi-tenant auth)                       │
│       ✓ Supabase (PostgreSQL + RLS)                     │
│       ✓ Upstash Redis (cache + events)                  │
│       ✓ Upstash Vector (RAG/semantic)                   │
│       ✓ Upstash Search (full-text)                      │
│       ✓ Upstash QStash (background jobs)                │
│       ✓ Vercel AI SDK + AG-UI                           │
│       ✓ Stripe (billing)                                │
│       ✓ shadcn/ui (components)                          │
└─────────────────────────────────────────────────────────┘
                            ↓ NO
┌─────────────────────────────────────────────────────────┐
│ Need AI/LLM Integration?                                 │
│                                                           │
│ YES → Add AI Stack                                       │
│       ✓ Vercel AI SDK (ai)                              │
│       ✓ AG-UI Protocol (@ag-ui/core)                    │
│       ✓ Upstash Vector (RAG)                            │
│       ✓ Upstash Redis (streaming)                       │
└─────────────────────────────────────────────────────────┘
                            ↓ NO
┌─────────────────────────────────────────────────────────┐
│ Need Multi-Tenancy?                                      │
│                                                           │
│ YES → Add Multi-Tenant Stack                            │
│       ✓ Clerk (@clerk/nextjs)                           │
│       ✓ Supabase with RLS                               │
│       ✓ Org-level data isolation                        │
└─────────────────────────────────────────────────────────┘
                            ↓ NO
┌─────────────────────────────────────────────────────────┐
│ Need Real-Time Features?                                 │
│                                                           │
│ YES → Add Real-Time Stack                               │
│       ✓ Upstash Redis (pub/sub)                         │
│       ✓ Server-Sent Events (SSE)                        │
│       ✓ WebSockets (optional)                           │
└─────────────────────────────────────────────────────────┘
                            ↓ NO
┌─────────────────────────────────────────────────────────┐
│ Need Background Jobs?                                    │
│                                                           │
│ YES → Add Job Queue                                      │
│       ✓ Upstash QStash                                  │
│       ✓ Workflow orchestration                          │
└─────────────────────────────────────────────────────────┘
                            ↓ NO
┌─────────────────────────────────────────────────────────┐
│ Basic Web App                                            │
│       - Next.js + React                                  │
│       - Supabase (database)                              │
│       - Clerk or NextAuth (auth)                         │
│       - Tailwind + shadcn/ui                             │
└─────────────────────────────────────────────────────────┘
```

---

## CLI Workflow

### Step 1: Initialize Project

```bash
# Navigate to workspace
cd C:\dev

# Initialize new project with ai-coder CLI
ai-coder init my-saas-app \
  --type web \
  --language typescript \
  --framework nextjs \
  --description "AI-powered customer support platform"

# This creates:
# C:\dev\my-saas-app\
#    .ai-coder/
#       project.json
#       sessions/
#       prps/
#    .git/
#    README.md
```

### Step 2: Resume Project

```bash
# Load project context
ai-coder resume my-saas-app

# This:
# 1. Loads project metadata
# 2. Creates MCP context file for Claude Code
# 3. Sets working directory
# 4. Displays project status
```

### Step 3: Build with Claude Code

#### Option A: Use Full Boilerplate

In Claude Code:

```
"Build a multi-tenant AI SaaS application following the typescript-ag-ui-boilerplate
specification at C:\dev\ai-coder-agents\scaffolds\boilerplates\typescript-ag-ui-boilerplate.md

Include:
- Next.js 14 with App Router
- Clerk for multi-tenant authentication
- Supabase for database with RLS
- Upstash Redis for caching and real-time events
- Upstash Vector for RAG/semantic search
- Upstash Search for full-text search
- Upstash QStash for background jobs
- Vercel AI SDK with AG-UI protocol
- shadcn/ui components
- Stripe for subscription billing"
```

#### Option B: Custom Stack

In Claude Code:

```
"Build a REST API with:
- Express.js + TypeScript
- Supabase PostgreSQL database
- Clerk authentication
- OpenAPI documentation
- Jest for testing"
```

### Step 4: Development Workflow

```bash
# Check project status
ai-coder status

# View history
ai-coder history

# Run quality gates (CodeRabbit + tests + build)
ai-coder review

# List all projects
ai-coder list

# Switch projects
ai-coder switch another-project
```

---

## Environment Setup

### Required Environment Variables

```bash
# ============================================
# CORE SERVICES (Required for all projects)
# ============================================

# Clerk (Multi-tenant Authentication)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
CLERK_SECRET_KEY=sk_test_xxxxx
CLERK_WEBHOOK_SECRET=whsec_xxxxx

# Supabase (Database)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# ============================================
# UPSTASH SERVICES
# ============================================

# Upstash Redis (Cache, Events, Rate Limiting)
UPSTASH_REDIS_REST_URL=https://xxxxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=AXxxxxx...

# Upstash Vector (RAG, Semantic Search)
UPSTASH_VECTOR_REST_URL=https://xxxxx-vector.upstash.io
UPSTASH_VECTOR_REST_TOKEN=AYxxxxx...

# Upstash Search (Full-text Search)
UPSTASH_SEARCH_REST_URL=https://xxxxx-search.upstash.io
UPSTASH_SEARCH_REST_TOKEN=AZxxxxx...

# Upstash QStash (Background Jobs)
QSTASH_URL=https://qstash.upstash.io
QSTASH_TOKEN=xxxxx
QSTASH_CURRENT_SIGNING_KEY=xxxxx
QSTASH_NEXT_SIGNING_KEY=xxxxx

# ============================================
# LLM PROVIDERS (At least ONE required)
# ============================================

# OpenAI
OPENAI_API_KEY=sk-xxxxx

# Anthropic
ANTHROPIC_API_KEY=sk-ant-xxxxx

# Google
GOOGLE_AI_API_KEY=xxxxx

# Mistral
MISTRAL_API_KEY=xxxxx

# ============================================
# OPTIONAL SERVICES
# ============================================

# Stripe (Subscription Billing)
STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx

# Resend (Email)
RESEND_API_KEY=re_xxxxx

# Arcjet (Security)
ARCJET_KEY=ajkey_xxxxx

# Sentry (Monitoring)
SENTRY_DSN=https://xxxxx@xxxxx.ingest.sentry.io/xxxxx
```

### Environment Setup Script

```bash
# Copy example env file
cp .env.example .env.local

# Install dependencies
npm install

# Run database migrations
npx supabase db push

# Generate TypeScript types from Supabase
npx supabase gen types typescript --local > types/database.ts

# Start development server
npm run dev
```

---

## Real-World Examples

### Example 1: AI Customer Support Platform

**Stack Selection**:

```typescript
{
  "frontend": "Next.js 14 + React + TypeScript + shadcn/ui",
  "auth": "Clerk (multi-tenant)",
  "database": "Supabase PostgreSQL",
  "cache": "Upstash Redis",
  "vectorSearch": "Upstash Vector",
  "fullTextSearch": "Upstash Search",
  "backgroundJobs": "Upstash QStash",
  "ai": "Vercel AI SDK + AG-UI",
  "llm": "OpenAI GPT-4",
  "billing": "Stripe",
  "email": "Resend"
}
```

**Data Flow**:

```
1. Customer asks question
   ↓ Clerk auth verifies user
   ↓ Check Upstash Redis cache

2. If not cached:
   ↓ Generate embedding (OpenAI)
   ↓ Search Upstash Vector (semantic)
   ↓ Search Upstash Search (keywords)
   ↓ Merge results (hybrid search)

3. Fetch context from Supabase
   ↓ Send to LLM with context
   ↓ Stream response via AG-UI
   ↓ Upstash Redis pub/sub

4. Save to Supabase
   ↓ Track usage
   ↓ Cache response in Redis

5. Background (QStash):
   ↓ Send email summary
   ↓ Update analytics
   ↓ Generate reports
```

**CLI Commands**:

```bash
ai-coder init customer-support-ai --type web --language typescript
ai-coder resume customer-support-ai
# In Claude Code: "Build AI customer support platform with full boilerplate stack"
```

### Example 2: Internal Knowledge Management

**Stack Selection**:

```typescript
{
  "frontend": "Next.js 14 + React + TypeScript",
  "auth": "Clerk (departments as orgs)",
  "database": "Supabase PostgreSQL",
  "vectorSearch": "Upstash Vector",
  "fullTextSearch": "Upstash Search",
  "backgroundJobs": "Upstash QStash",
  "ai": "Vercel AI SDK",
  "llm": "Anthropic Claude"
}
```

**Features**:
- Upload company documents (PDFs, Word, Markdown)
- AI assistant answers questions from docs
- Department-level access control (RLS)
- Hybrid search (text + semantic)
- Auto-summarization
- Weekly digest emails

### Example 3: AI Code Assistant

**Stack Selection**:

```typescript
{
  "frontend": "Next.js 14 + React + TypeScript",
  "auth": "Clerk (teams)",
  "database": "Supabase PostgreSQL",
  "cache": "Upstash Redis",
  "vectorSearch": "Upstash Vector",
  "fullTextSearch": "Upstash Search",
  "backgroundJobs": "Upstash QStash",
  "ai": "Vercel AI SDK + AG-UI",
  "llm": "OpenAI GPT-4 + Codex"
}
```

**Features**:
- Index codebase (GitHub integration)
- Semantic code search
- AI code completions
- Answer questions about codebase
- Usage tracking per developer
- Team-level billing

---

## Decision Checklist

Before starting a project, answer these questions:

### Core Features

- [ ] **AI-powered?** → Yes = Vercel AI SDK + AG-UI + Upstash Vector
- [ ] **Multi-tenant?** → Yes = Clerk + Supabase RLS
- [ ] **Real-time?** → Yes = Upstash Redis + SSE
- [ ] **Background jobs?** → Yes = Upstash QStash
- [ ] **Search needed?** → Yes = Upstash Search + Upstash Vector (hybrid)
- [ ] **Subscriptions?** → Yes = Stripe
- [ ] **CMS needed?** → Yes = Sanity.io
- [ ] **Complex UI?** → Yes = Next.js + shadcn/ui

### Based on Answers:

- **7-8 "Yes"** → Use full boilerplate stack
- **4-6 "Yes"** → Use boilerplate, remove unused features
- **1-3 "Yes"** → Use `ai-coder init` with custom stack
- **0 "Yes"** → Basic Next.js + Supabase + Clerk

---

## Internal vs External Apps

### The Shared Foundation (For Both)

Both types of applications should be built on the same high-quality foundation:

- **Core Technology**: Next.js, TypeScript, Supabase, Tailwind CSS
- **Code Quality**: Same linting, type-checking, pre-commit hooks
- **Security Foundation**: Clerk + Supabase RLS (even for internal tools)
- **Validation Workflow**: `pre-deploy.sh` scripts are critical
- **Testing**: Unit + Integration tests

### Key Differences

| Feature | Internal Tools | External SaaS |
|---------|----------------|---------------|
| **Authentication** | Often simpler (Google Workspace SSO). "Organizations" = departments. | Full multi-tenancy. Each client = separate "Organization". Robust user invitation flows. |
| **Billing (Stripe)** | Not required. Disable/remove all Stripe code. | Mission-critical. Full integration with webhooks and customer portal. |
| **Scalability** | Predictable load (employee count). Lower-cost tiers. | Unpredictable load. Architected for high scalability. |
| **Customization** | Standard internal branding. | Client may want custom logo, theme, domain. |
| **Support** | Internal issue handling. | Robust error tracking (Sentry), detailed logging, SLAs. |

### Testing Agents (Playwright)

**Question**: "If I sell an app, do I code agents within the app that will test it like Playwright agents?"

**Answer**: **No**, testing agents are NOT shipped with the client-facing application.

**Development Pipeline (Internal)**:
- Use AI agents or scripts that run Playwright E2E tests
- Run against staging/development before deployment
- Part of `ai-coder-agents` workflow or CI/CD pipeline

**Production Application (Sold to Clients)**:
- Clean, optimized code only
- No testing code, Playwright dependencies, or testing agents
- Reduces bloat, attack surface, and serves no purpose for end-users

### Recommended Workflow

**For Internal Tool**:
1. Use boilerplate
2. Remove `STRIPE_*` variables
3. Hide billing UI elements
4. Deploy

**For External SaaS**:
1. Use boilerplate
2. Configure all env variables (including Stripe)
3. Ensure robust multi-tenant logic
4. Run Playwright tests (via agents/CI/CD) on staging
5. Deploy clean, tested app to production

---

## Complete Package.json

```json
{
  "name": "my-ai-saas",
  "version": "1.0.0",
  "dependencies": {
    // Frontend
    "next": "^14.2.33",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "typescript": "^5.3.0",

    // UI & Styling
    "tailwindcss": "^3.4.0",
    "@radix-ui/react-*": "latest",
    "lucide-react": "^0.545.0",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.1",
    "tailwind-merge": "^3.3.1",

    // Backend - Supabase
    "@supabase/supabase-js": "^2.75.0",

    // Backend - Upstash
    "@upstash/redis": "^1.35.5",
    "@upstash/vector": "^1.1.0",
    "@upstash/search": "^0.1.5",
    "@upstash/qstash": "^2.3.0",

    // AI & Agents
    "ai": "^5.0.65",
    "@ai-sdk/openai": "^2.0.46",
    "@ai-sdk/anthropic": "^2.0.25",
    "@ag-ui/core": "^0.0.39",
    "@ag-ui/client": "^0.0.40",
    "openai": "^4.28.0",

    // Auth & Security
    "@clerk/nextjs": "^6.33.3",
    "@arcjet/next": "^1.0.0",

    // Payments & Email
    "stripe": "^19.1.0",
    "@stripe/stripe-js": "^8.0.0",
    "resend": "^6.1.2",

    // Monitoring
    "@sentry/nextjs": "^8.40.0",

    // State & Forms
    "zustand": "^5.0.2",
    "react-hook-form": "^7.64.0",
    "zod": "^4.1.12"
  }
}
```

---

## Summary

### To Build AI-Powered SaaS:

1. Use `ai-coder init` to scaffold project
2. Choose stack based on decision tree
3. Tell Claude Code to build using boilerplate spec
4. Claude Code will:
   - Install all dependencies
   - Set up project structure
   - Create API routes
   - Build components
   - Write tests
   - Run quality gates

### The Complete Stack:

```
Supabase (database)
+ 4 Upstash Products (Redis, Vector, Search, QStash)
+ Vercel AI SDK (LLM abstraction)
+ AG-UI (agent protocol)
+ Clerk (multi-tenant auth)
+ Next.js (framework)
= Production-Ready AI SaaS
```

**All with generous free tiers for development!**

### Boilerplate Alignment: 100%

The `typescript-ag-ui-boilerplate` is:
- ✅ **100% compliant** with this guide
- ✅ **Production-ready** with all features implemented
- ✅ **Fully tested** (unit + integration + E2E)
- ✅ **Well-documented** with comprehensive guides
- ✅ **Verified** through complete audit and remediation

This boilerplate is the **canonical reference implementation** for the AG-UI protocol and serves as the ideal starting point for any AI-powered SaaS project.

---

*Last Updated: 2025-10-11*
*Boilerplate Version: 1.0.0*
