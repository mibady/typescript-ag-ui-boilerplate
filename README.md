# TypeScript AG-UI Boilerplate

> **Production-ready AI-powered multi-tenant SaaS boilerplate** built with Next.js 14, AG-UI Protocol, and Vercel AI SDK.

[![Next.js](https://img.shields.io/badge/Next.js-14.2-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green)](https://supabase.com/)
[![Upstash](https://img.shields.io/badge/Upstash-Redis%20%7C%20Vector%20%7C%20QStash-orange)](https://upstash.com/)

---

## 🚀 Quick Start

```bash
# 1. Clone and install
git clone <your-repo-url> my-ai-saas
cd my-ai-saas
npm install

# 2. Configure environment
cp .env.example .env.local
# Edit .env.local with your API keys

# 3. Run development server
npm run dev
```

**📖 [Complete Setup Guide](./SETUP.md)** | **🧪 [Testing Guide](./TESTING-GUIDE.md)** | **🏗️ [Architecture](./ARCHITECTURE.md)** | **📚 [Full Documentation](./docs/README.md)**

---

## ✨ Features

### **AI & Agents**
- ✅ **AG-UI Protocol** - Standardized real-time agent-UI communication
- ✅ **Vercel AI SDK** - LLM-agnostic (OpenAI, Anthropic, Google, Mistral)
- ✅ **RAG System** - Document chunking, embeddings, hybrid search
- ✅ **Streaming Responses** - Real-time SSE streaming with Observable pattern

### **Multi-Tenancy**
- ✅ **Clerk Organizations** - Multi-tenant authentication
- ✅ **Row Level Security** - Automatic data isolation (Supabase RLS)
- ✅ **Organization-based Billing** - Stripe subscription management

### **Backend Services**
- ✅ **Supabase** - PostgreSQL database with RLS
- ✅ **Upstash Redis** - Cache, real-time events, rate limiting
- ✅ **Upstash Vector** - Semantic search (1536-dim embeddings)
- ✅ **Upstash QStash** - Background jobs and webhooks

### **Developer Experience**
- ✅ **TypeScript 5** - Full type safety
- ✅ **Tailwind CSS + shadcn/ui** - Beautiful, accessible components
- ✅ **Zustand** - Lightweight state management
- ✅ **Complete Test Suite** - Unit, integration, and E2E tests
- ✅ **CI/CD Ready** - GitHub Actions workflows

---

## 🎯 Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | Next.js 14, React 18, TypeScript | App framework |
| **UI** | Tailwind CSS, shadcn/ui | Styling & components |
| **State** | Zustand | Client state management |
| **Auth** | Clerk | Multi-tenant authentication |
| **Database** | Supabase (PostgreSQL) | Relational data + RLS |
| **Cache** | Upstash Redis | Session cache, rate limiting |
| **Vector DB** | Upstash Vector | Semantic search (RAG) |
| **Jobs** | Upstash QStash | Background processing |
| **AI** | Vercel AI SDK | LLM abstraction layer |
| **Agents** | AG-UI Protocol | Agent-UI communication |
| **Payments** | Stripe | Subscription billing |
| **Monitoring** | Sentry | Error tracking |

---

## 📁 Project Structure

```
typescript-ag-ui-boilerplate/
├── app/                      # Next.js App Router
│   ├── (dashboard)/         # Protected routes
│   ├── (marketing)/         # Public pages
│   └── api/                 # API routes
│       ├── agent/           # AG-UI streaming endpoints
│       ├── rag/             # Document & search endpoints
│       └── jobs/            # QStash webhook handlers
├── components/              # React components
│   ├── chat/               # Chat UI (AG-UI integration)
│   ├── ui/                 # shadcn/ui components
│   └── dashboard/          # Dashboard components
├── lib/                    # Core libraries
│   ├── agents/            # Agent implementations
│   ├── agui-events.ts     # AG-UI event system
│   ├── llm/               # LLM provider configs
│   ├── rag/               # RAG system
│   ├── stores/            # Zustand stores
│   └── db/                # Database utilities
├── docs/                   # Documentation
│   ├── guides/            # How-to guides
│   └── reference/         # API & architecture reference
├── supabase/              # Database migrations
└── src/__tests__/         # Test suites
```

---

## 📚 Documentation

### **Getting Started**
- **[Setup Guide](./SETUP.md)** - Complete setup instructions
- **[Testing Guide](./TESTING-GUIDE.md)** - Comprehensive testing & validation
- **[Architecture Overview](./ARCHITECTURE.md)** - System design and data flow
- **[Quick Start](./docs/QUICK-START.md)** - 5-minute setup

### **Guides**
- **[AG-UI SDK Integration](./docs/guides/AG-UI-SDK-INTEGRATION.md)** - Complete AG-UI implementation
- **[SDK & CLI Selection](./docs/guides/SDK-CLI-SELECTION-GUIDE.md)** - Tech stack decision guide
- **[Hybrid Search](./docs/guides/hybrid-search-guide.md)** - Vector + full-text search
- **[State Management](./docs/guides/state-management-guide.md)** - Zustand patterns
- **[Testing Quick Reference](./docs/TESTING-QUICK-REFERENCE.md)** - Quick testing commands
- **[E2E Testing Setup](./docs/guides/e2e-testing.md)** - E2E test configuration

### **Reference**
- **[API Reference](./docs/reference/api.md)** - API endpoints
- **[Database Schema](./docs/reference/database.md)** - Database structure
- **[Build Specification](./docs/reference/build-specification.md)** - Build requirements

### **Full Documentation Hub**
📖 **[docs/README.md](./docs/README.md)** - Complete documentation index

---

## 🛠️ Development

### **Available Commands**

```bash
# Development
npm run dev              # Start dev server (localhost:3000)
npm run build            # Build for production
npm run start            # Start production server

# Testing
npm test                 # Run all tests
npm run test:unit        # Unit tests only
npm run test:e2e         # E2E tests (requires setup)
npm run test:pre-deploy  # Full pre-deployment suite

# Validation
npm run type-check       # TypeScript validation
npm run lint             # ESLint
npm run validate:env     # Check all environment variables
npm run validate:clerk   # Validate Clerk authentication
npm run validate:supabase # Validate Supabase database
npm run validate:upstash # Validate Upstash services
npm run validate:ai      # Validate LLM providers

# Database
npm run migrate:db       # Apply Supabase migrations
```

---

## 🚢 Deployment

### **Deploy to Vercel**

1. Push code to GitHub
2. Import repository in [Vercel](https://vercel.com)
3. Add environment variables from `.env.example`
4. Deploy

### **Environment Variables**

Required services:
- **Clerk** - Authentication
- **Supabase** - Database
- **Upstash Redis** - Cache & events
- **OpenAI** (or Anthropic/Google) - LLM API

See **[SETUP.md](./SETUP.md)** for complete environment variable reference.

---

## 🤝 Contributing

This is a boilerplate template designed to be forked and customized for your project.

**[CONTRIBUTING.md](./CONTRIBUTING.md)** - Guidelines for extending the boilerplate

---

## 📄 License

MIT License - See [LICENSE](./LICENSE) file for details.

---

## 🆘 Support

- **Documentation**: [docs/README.md](./docs/README.md)
- **Issues**: [GitHub Issues](https://github.com/mibady/typescript-ag-ui-boilerplate/issues)
- **Discussions**: [GitHub Discussions](https://github.com/mibady/typescript-ag-ui-boilerplate/discussions)

---

**Built with ❤️ using Next.js, AG-UI, Supabase, and Upstash**
