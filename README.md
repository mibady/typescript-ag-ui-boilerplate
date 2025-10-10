# TypeScript Stack Boilerplate - AI-First Multi-Tenant SaaS

**🚨 AI DEVELOPERS: Read [AGENT-CONTEXT-RULES.md](./AGENT-CONTEXT-RULES.md) FIRST before any work**

Production-ready boilerplate for building AI-powered SaaS applications with multi-tenancy, real-time streaming, and comprehensive features.

## 🎯 Features

- ✅ **Multi-tenant authentication** with organizations (Clerk)
- ✅ **AI agent system** with real-time streaming (AG-UI + Vercel AI SDK)
- ✅ **LLM-agnostic** (OpenAI, Anthropic, Google, Mistral)
- ✅ **MCP tools** for external integrations
- ✅ **RAG system** with pgvector for knowledge bases
- ✅ **Complete marketing site** with CMS (Sanity)
- ✅ **User dashboard** and admin panel
- ✅ **API key management**
- ✅ **Usage tracking** and analytics
- ✅ **Subscription billing** (Stripe)
- ✅ **Full testing suite**
- ✅ **CI/CD pipeline**

## 🏗️ Tech Stack

### Core Framework
- Next.js 14.2+ (App Router, React Server Components)
- React 18.3+ with TypeScript 5.3+ (strict mode)
- Tailwind CSS 3.4+ with shadcn/ui (46+ components)

### Backend Services
- Vercel AI SDK 3.4+ (LLM abstraction)
- AG-UI Protocol (@ag-ui/core) for real-time agent-UI communication
- Supabase (PostgreSQL + pgvector for RAG)
- Upstash Redis (event storage, caching, rate limiting)

### Authentication & Security
- Clerk 5.7+ (multi-tenant auth with organizations)
- Arcjet 1.0+ (rate limiting, bot protection, input validation)

### Content & Payments
- Sanity.io (headless CMS for marketing content)
- Stripe (subscription management)
- Resend (transactional emails)

### Monitoring & DevOps
- Sentry (error monitoring)
- Vercel (deployment platform)
- GitHub Actions (CI/CD)

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- npm or yarn
- Git

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd typescript-ag-ui-boilerplate

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Start development server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the app.

## 📦 Project Structure

See [BUILD_PLAN.md](./BUILD_PLAN.md) for complete documentation.

## 🧪 Testing

```bash
# Unit tests
npm test

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e

# Load tests
npm run test:load
```

## 📚 Documentation

- [BUILD_PLAN.md](./BUILD_PLAN.md) - Complete build specification
- [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) - System architecture
- [docs/AG-UI.md](./docs/AG-UI.md) - AG-UI implementation guide
- [docs/MCP.md](./docs/MCP.md) - MCP tools guide
- [docs/RAG.md](./docs/RAG.md) - RAG system guide
- [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md) - Deployment instructions
- [docs/MULTI-TENANCY.md](./docs/MULTI-TENANCY.md) - Multi-tenant setup
- [docs/TESTING.md](./docs/TESTING.md) - Testing guide
- [docs/CUSTOMIZATION.md](./docs/CUSTOMIZATION.md) - Customization options

## 🔐 Environment Variables

See `.env.example` for complete list. Required variables:

- Clerk (authentication)
- Supabase (database + RAG)
- Upstash Redis (event storage)
- At least ONE LLM provider (OpenAI, Anthropic, Google, or Mistral)
- Sanity (CMS)
- Resend (email)
- Arcjet (security)

Optional:
- Stripe (billing)
- Sentry (monitoring)

## 📄 License

MIT

## 🙏 Acknowledgments

Built with AI Coder Agents - Production-ready boilerplate generator.

---

**Version:** 1.0.0
**Status:** In Development (Phase 1)
