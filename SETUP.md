# TypeScript AG-UI Boilerplate - Complete Setup Guide

**Production-Ready AI-First Multi-Tenant SaaS with Supabase + 4 Upstash Products**

---

## 🎯 What's Included

This boilerplate provides a complete, production-ready stack for building AI-powered SaaS applications:

### **Core Stack**
- ✅ **Next.js 14** - App Router, React Server Components
- ✅ **TypeScript 5.3+** - Full type safety
- ✅ **Tailwind CSS + shadcn/ui** - Beautiful, accessible UI components

### **Backend Services**
- ✅ **Supabase** - PostgreSQL database with Row Level Security (RLS)
- ✅ **Upstash Redis** - Cache, real-time events, rate limiting
- ✅ **Upstash Vector** - Semantic search, RAG embeddings
- ✅ **Upstash QStash** - Background jobs, webhooks, workflows

### **AI & Agents**
- ✅ **Vercel AI SDK** - LLM abstraction (OpenAI, Anthropic, Google, Mistral)
- ✅ **AG-UI Protocol** - Real-time agent-UI communication
- ✅ **RAG System** - Document chunking, embeddings, hybrid search

### **Authentication & Security**
- ✅ **Clerk** - Multi-tenant authentication with organizations
- ✅ **Arcjet** - Rate limiting, bot protection (optional)

### **Payments & Content**
- ✅ **Stripe** - Subscription billing
- ✅ **Resend** - Transactional emails
- ✅ **Sanity.io** - Headless CMS (optional)

---

## 📋 Prerequisites

Before you begin, ensure you have:

- **Node.js 20+** installed
- **npm** or **pnpm** package manager
- **Git** for version control
- Accounts for the following services (free tiers available):
  - Clerk (authentication)
  - Supabase (database)
  - Upstash (Redis, Vector, QStash)
  - OpenAI or Anthropic (LLM API)
  - Stripe (optional, for billing)
  - Resend (optional, for emails)

---

## 🚀 Quick Start (5 Minutes)

### Step 1: Clone and Install

```bash
# Clone the repository
git clone <your-repo-url> my-ai-saas
cd my-ai-saas

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local
```

### Step 2: Set Up Services

#### **2.1 Clerk (Authentication)**

1. Go to [clerk.com](https://clerk.com) and create an account
2. Create a new application
3. Enable **Organizations** in settings
4. Copy your API keys to `.env.local`:

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
CLERK_SECRET_KEY=sk_test_xxxxx
```

#### **2.2 Supabase (Database)**

1. Go to [supabase.com](https://supabase.com) and create a project
2. Copy your project URL and keys to `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxxxx
SUPABASE_SERVICE_ROLE_KEY=eyJxxxxx
```

3. Run the database migration:

```bash
npm run migrate:db
```

This command uses the Supabase CLI to apply the initial schema to your database.

#### **2.3 Upstash (Redis, Vector, QStash)**

1. Go to [upstash.com](https://upstash.com) and create an account

2. **Create Redis Database:**
   - Click "Create Database" → Choose "Redis"
   - Copy REST URL and Token to `.env.local`:

```env
UPSTASH_REDIS_REST_URL=https://xxxxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=xxxxx
```

3. **Create Vector Index:**
   - Click "Create Database" → Choose "Vector"
   - Dimensions: **1536** (for OpenAI embeddings)
   - Similarity: **Cosine**
   - Copy REST URL and Token to `.env.local`:

```env
UPSTASH_VECTOR_REST_URL=https://xxxxx-vector.upstash.io
UPSTASH_VECTOR_REST_TOKEN=xxxxx
```

4. **Set Up QStash:**
   - Go to QStash section
   - Copy your token and signing keys to `.env.local`:

```env
QSTASH_URL=https://qstash.upstash.io
QSTASH_TOKEN=xxxxx
QSTASH_CURRENT_SIGNING_KEY=xxxxx
QSTASH_NEXT_SIGNING_KEY=xxxxx
```

#### **2.4 OpenAI (LLM)**

1. Go to [platform.openai.com](https://platform.openai.com)
2. Create an API key
3. Add to `.env.local`:

```env
OPENAI_API_KEY=sk-xxxxx
```

### Step 3: Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

**🎉 You're ready to build!**

---

## 📚 Detailed Setup

### Database Schema

The complete schema is in `supabase/RESET_AND_SETUP.sql`. Key tables:

```sql
-- Multi-tenancy
users, organizations, organization_members

-- Documents & RAG
documents, document_chunks

-- AI Agents
agent_sessions, agent_messages, tool_executions

-- Business
api_keys, usage_records, subscriptions
```

### Environment Variables Reference

This is the complete list of environment variables used in the boilerplate. See `.env.example` for a template.

```env
# === REQUIRED CORE SERVICES ===

# Clerk (Authentication)
# Get from: https://dashboard.clerk.com
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
CLERK_SECRET_KEY=sk_test_xxxxx
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/onboarding

# Supabase (Database)
# Get from: https://supabase.com/dashboard
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxxxx
SUPABASE_SERVICE_ROLE_KEY=eyJxxxxx

# Upstash Redis (Cache, Events, Rate Limiting)
# Get from: https://console.upstash.com
UPSTASH_REDIS_REST_URL=https://xxxxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=xxxxx

# LLM Providers (At least ONE is required)
# Get from: https://platform.openai.com, https://console.anthropic.com, etc.
OPENAI_API_KEY=sk-xxxxx
ANTHROPIC_API_KEY=sk-ant-xxxxx
GOOGLE_GENERATIVE_AI_API_KEY=xxxxx
MISTRAL_API_KEY=xxxxx

# === STRONGLY RECOMMENDED SERVICES ===

# Upstash Vector (RAG, Semantic Search)
UPSTASH_VECTOR_REST_URL=https://xxxxx-vector.upstash.io
UPSTASH_VECTOR_REST_TOKEN=xxxxx

# Upstash QStash (Background Jobs)
QSTASH_URL=https://qstash.upstash.io
QSTASH_TOKEN=xxxxx
QSTASH_CURRENT_SIGNING_KEY=xxxxx
QSTASH_NEXT_SIGNING_KEY=xxxxx

# Stripe (Billing)
# Get from: https://dashboard.stripe.com/apikeys
STRIPE_SECRET_KEY=sk_test_xxxxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx

# Resend (Email)
# Get from: https://resend.com/api-keys
RESEND_API_KEY=re_xxxxx

# === OPTIONAL SERVICES ===

# Upstash Search (Full-Text Search)
UPSTASH_SEARCH_REST_URL=https://xxxxx-search.upstash.io
UPSTASH_SEARCH_REST_TOKEN=xxxxx

# Sanity (CMS)
# Get from: https://www.sanity.io/manage
NEXT_PUBLIC_SANITY_PROJECT_ID=xxxxx
NEXT_PUBLIC_SANITY_DATASET=production
SANITY_API_TOKEN=xxxxx

# Arcjet (Security)
# Get from: https://arcjet.com
ARCJET_KEY=ajkey_xxxxx

# Sentry (Monitoring)
# Get from: https://sentry.io
SENTRY_DSN=https://xxxxx@xxxxx.ingest.sentry.io/xxxxx
NEXT_PUBLIC_SENTRY_DSN=https://xxxxx@xxxxx.ingest.sentry.io/xxxxx

# === APPLICATION ===

NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

---

## 🏗️ Architecture Overview

### Data Flow: Document Upload & RAG

```
1. User uploads document
   ↓
2. Store in Supabase (metadata)
   ↓
3. Queue processing job (QStash)
   ↓
4. Background job processes:
   - Chunk document
   - Generate embeddings (OpenAI)
   - Store in Upstash Vector
   - Store chunks in Supabase
   ↓
5. User can search documents
   ↓
6. Hybrid search:
   - Semantic search (Upstash Vector)
   - Fetch full content (Supabase)
   ↓
7. Return context to AI agent
```

### Multi-Tenancy with RLS

All data is automatically isolated by organization using Supabase Row Level Security (RLS).

This is achieved by setting the `app.clerk_org_id` session variable before each database query. The RLS policies on each table then use this variable to ensure users can only access data belonging to their active organization. See `supabase/README.md` for more details.

---

## 🔧 Development

### Project Structure

```
typescript-ag-ui-boilerplate/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   │   ├── jobs/          # Background job handlers (QStash)
│   │   ├── rag/           # RAG endpoints
│   │   └── webhooks/      # Webhook handlers
│   ├── dashboard/         # Protected dashboard
│   └── (marketing)/       # Public pages
│
├── lib/                   # Core libraries
│   ├── upstash/          # Upstash clients (Redis, Vector, QStash)
│   ├── rag/              # RAG system (chunking, embeddings, search)
│   ├── llm/              # LLM utilities
│   ├── db/               # Database functions
│   └── stripe/           # Stripe integration
│
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   ├── agui/             # AG-UI components
│   └── blocks/           # Pre-built blocks
│
├── supabase/             # Database migrations
└── scripts/              # Utility scripts
```

### Available Scripts

```bash
# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm run start            # Start production server

# Testing
npm test                 # Run unit tests
npm run test:e2e         # Run E2E tests
npm run type-check       # TypeScript validation

# Database
npm run migrate:db       # Apply migrations

# Stripe
npm run setup:stripe     # Create Stripe products
npm run sync:stripe-db   # Sync Stripe prices to DB
```

---

## 🎯 Key Features

### 1. Document Upload & RAG

Upload documents and query them with AI:

```typescript
// Upload document
const response = await fetch('/api/rag/upload', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Company Handbook.pdf',
    content: documentText,
    contentType: 'application/pdf',
  }),
});

// Search documents
const results = await fetch('/api/rag/search', {
  method: 'POST',
  body: JSON.stringify({
    query: 'What is our vacation policy?',
    topK: 5,
  }),
});
```

### 2. Background Job Processing

Process long-running tasks asynchronously:

```typescript
import { queueDocumentProcessing } from '@/lib/upstash/qstash';

// Queue a job
await queueDocumentProcessing(documentId, organizationId);

// Job runs in background via /api/jobs/process-document
```

### 3. Hybrid Search

Combine semantic and keyword search:

```typescript
import { hybridSearch } from '@/lib/rag/vector-search';

const results = await hybridSearch(
  'authentication setup',
  organizationId,
  {
    vectorTopK: 10,
    minScore: 0.7,
  }
);
```

### 4. Multi-Tenant Authentication

Users belong to organizations with roles:

```typescript
import { auth } from '@clerk/nextjs/server';

const { userId, orgId } = await auth();

// All database queries automatically filtered by orgId via RLS
```

---

## 🚢 Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Import your repository
4. Add environment variables
5. Deploy!

### Configure Webhooks

After deployment, set up webhooks:

#### **QStash Endpoints**

Add these URLs to your QStash configuration:

- `https://yourdomain.com/api/jobs/process-document`
- `https://yourdomain.com/api/jobs/send-email`

#### **Stripe Webhooks**

1. Go to Stripe Dashboard → Webhooks
2. Add endpoint: `https://yourdomain.com/api/webhooks/stripe`
3. Select events: `customer.subscription.*`, `invoice.*`
4. Copy webhook secret to `.env`:

```env
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
```

---

## 📖 Usage Examples

### Example 1: AI Customer Support

```typescript
// 1. Upload support documents
await uploadDocument('FAQ.pdf', faqContent);
await uploadDocument('User Guide.pdf', guideContent);

// 2. User asks question
const context = await getRAGContext(
  'How do I reset my password?',
  organizationId
);

// 3. Send to AI with context
const response = await generateText({
  model: openai('gpt-4'),
  messages: [
    { role: 'system', content: `Context:\n${context}` },
    { role: 'user', content: userQuestion },
  ],
});
```

### Example 2: Document Analysis

```typescript
// Upload and analyze documents
const doc = await uploadDocument('Contract.pdf', contractText);

// Search for specific clauses
const results = await hybridSearch(
  'termination clause',
  organizationId
);

// Get AI summary
const summary = await summarizeDocument(doc.id);
```

---

## 🔒 Security

- ✅ **Row Level Security (RLS)** - Automatic data isolation
- ✅ **API Key Authentication** - Secure API access
- ✅ **Rate Limiting** - Prevent abuse (Arcjet)
- ✅ **Input Validation** - Zod schemas
- ✅ **HTTPS Only** - Enforced in production

---

## 🐛 Troubleshooting

### Common Issues

**1. "Cannot find module '@upstash/vector'"**

Run `npm install` to install dependencies.

**2. "Organization not found"**

Ensure you've created an organization in Clerk and synced it to Supabase.

**3. "Vector index not found"**

Check that your Upstash Vector index has 1536 dimensions (for OpenAI embeddings).

**4. "QStash signature verification failed"**

Ensure `QSTASH_CURRENT_SIGNING_KEY` and `QSTASH_NEXT_SIGNING_KEY` are correct.

---

## 📞 Support

- **Documentation**: See `/docs` folder
- **Issues**: [GitHub Issues](https://github.com/your-repo/issues)

---

## 📄 License

MIT License - see LICENSE file for details.

---

**Built with ❤️ using Supabase + 4 Upstash Products**

- Supabase: Database with RLS
- Upstash Redis: Cache & Real-time
- Upstash Vector: Semantic Search
- Upstash QStash: Background Jobs
