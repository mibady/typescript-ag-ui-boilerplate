# AI SaaS Platform

A production-ready AI-powered multi-tenant SaaS application built with Next.js, AG-UI protocol, and Vercel AI SDK.

---

## Features

- **Multi-tenant architecture** with organization-based isolation
- **AI agent system** with real-time streaming (AG-UI protocol)
- **LLM-agnostic** - OpenAI, Anthropic, Google, Mistral support
- **RAG system** with pgvector for semantic search
- **Subscription billing** with Stripe (Free, Pro, Enterprise plans)
- **Complete test coverage** (74 tests)
- **CI/CD pipeline** with GitHub Actions

---

## Tech Stack

- **Frontend:** Next.js 14, React 18, TypeScript 5, Tailwind CSS, shadcn/ui
- **Backend:** Vercel AI SDK, AG-UI Protocol, Supabase, Upstash Redis
- **Auth:** Clerk (multi-tenant)
- **Payments:** Stripe
- **AI:** OpenAI, Anthropic, Google, Mistral
- **DevOps:** GitHub Actions, Vercel

---

## Getting Started

### Prerequisites

- Node.js 20+
- Accounts: Clerk, Supabase, Upstash, at least one LLM provider

### Installation

```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env.local
# Edit .env.local with your API keys

# Set up database
# Run supabase/RESET_AND_SETUP.sql in Supabase Dashboard

# Start development server
npm run dev
```

Visit http://localhost:3000

---

## Development

```bash
npm run dev              # Start dev server
npm test                 # Run tests
npm run build            # Build for production
npm run lint             # Run linter
npm run type-check       # TypeScript validation
```

---

## Project Structure

```
├── app/                 # Next.js app directory
│   ├── api/            # API routes
│   ├── dashboard/      # Protected dashboard
│   └── (marketing)/    # Public pages
├── components/          # React components
├── lib/                 # Utilities
│   ├── agui/           # AG-UI event store
│   ├── db/             # Database functions
│   ├── llm/            # LLM providers
│   └── stripe/         # Stripe integration
├── src/__tests__/       # Test suite
├── supabase/            # Database migrations
└── .github/workflows/   # CI/CD
```

---

## Documentation

- [Architecture](./docs/reference/architecture.md)
- [API Reference](./docs/reference/api.md)
- [Database Schema](./docs/reference/database.md)

---

## License

MIT
