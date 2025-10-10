# Local Development Guide

This guide explains how to set up and run the AI-First SaaS Boilerplate locally.

## Prerequisites

- Node.js 20+ installed
- Docker and Docker Compose installed (for local services)
- Git installed
- A code editor (VS Code recommended)

## Quick Start

### 1. Clone and Install

```bash
# Clone the repository
git clone <your-repo-url>
cd typescript-ag-ui-boilerplate

# Install dependencies
npm install
```

### 2. Set Up Environment Variables

```bash
# Copy the example environment file
cp .env.local.example .env.local

# Edit .env.local with your API keys
```

### 3. Start Local Services (Optional)

If you want to use local PostgreSQL and Redis instead of cloud services:

```bash
# Start PostgreSQL and Redis
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### 4. Run the Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see your application.

## Development Services

### Docker Compose Services

The `docker-compose.yml` provides local alternatives to cloud services:

#### PostgreSQL with pgvector (port 5432)
- **Image:** `ankane/pgvector:latest`
- **Database:** `ai_saas_dev`
- **User:** `postgres`
- **Password:** `postgres`
- **Features:** pgvector extension for RAG

#### Redis (port 6379)
- **Image:** `redis:7-alpine`
- **Persistence:** Append-only file (AOF)
- **Use case:** Event storage and caching

#### Redis Commander (port 8081) - Optional
```bash
# Start with tools profile
docker-compose --profile tools up redis-commander
```
- **Access:** http://localhost:8081
- **Use case:** Visual Redis browser

#### pgAdmin (port 8080) - Optional
```bash
# Start with tools profile
docker-compose --profile tools up pgadmin
```
- **Access:** http://localhost:8080
- **Email:** admin@ai-saas.local
- **Password:** admin
- **Use case:** Visual PostgreSQL browser

## Environment Configuration

### Required Services

You need to configure at least these services:

1. **Clerk** (Authentication)
   - Sign up at https://clerk.com
   - Create an application
   - Copy publishable and secret keys

2. **ONE LLM Provider** (AI)
   - OpenAI, Anthropic, Google, or Mistral
   - Get API key from provider

3. **Sanity** (CMS)
   - Sign up at https://sanity.io
   - Create a project
   - Get project ID and dataset

4. **Resend** (Email)
   - Sign up at https://resend.com
   - Get API key

5. **Arcjet** (Security)
   - Sign up at https://arcjet.com
   - Get API key

### Database Options

#### Option A: Supabase Cloud (Recommended)
1. Create project at https://supabase.com
2. Enable pgvector extension
3. Run migration from `supabase/migrations/20250930000001_initial_schema.sql`
4. Copy URL and anon key to `.env.local`

#### Option B: Local PostgreSQL
1. Start docker-compose: `docker-compose up -d postgres`
2. Connect to local PostgreSQL:
   ```
   NEXT_PUBLIC_SUPABASE_URL=http://localhost:5432
   NEXT_PUBLIC_SUPABASE_ANON_KEY=local-dev-key
   SUPABASE_SERVICE_ROLE_KEY=local-dev-key
   ```
3. Run migrations manually or via Supabase CLI

### Redis Options

#### Option A: Upstash Cloud (Recommended)
1. Create database at https://upstash.com
2. Copy REST URL and token to `.env.local`

#### Option B: Local Redis
1. Start docker-compose: `docker-compose up -d redis`
2. Install Upstash Redis HTTP server (for REST compatibility)
3. Configure local REST endpoint

## Development Workflow

### Running the App

```bash
# Development server with hot reload
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Type checking
npm run type-check

# Linting
npm run lint
```

### Testing

```bash
# Unit tests (when implemented in Phase 7)
npm test

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e

# Load tests
npm run test:load
```

### Database Management

```bash
# Connect to local PostgreSQL
docker exec -it ai-saas-postgres psql -U postgres -d ai_saas_dev

# View tables
\dt

# View schema for a table
\d organizations

# Run a query
SELECT * FROM organizations;

# Exit
\q
```

### Redis Management

```bash
# Connect to local Redis
docker exec -it ai-saas-redis redis-cli

# View all keys
KEYS *

# Get a value
GET key_name

# View list
LRANGE agui:events:session-id 0 -1

# Exit
exit
```

## Project Structure

```
typescript-ag-ui-boilerplate/
├── app/                    # Next.js app directory
│   ├── (auth)/            # Auth routes (sign-in, sign-up)
│   ├── dashboard/         # Protected dashboard
│   ├── onboarding/        # User onboarding flow
│   ├── api/               # API routes
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   └── onboarding/       # Onboarding components
├── lib/                   # Utility libraries
│   ├── supabase.ts       # Supabase client
│   ├── supabase-server.ts # Supabase server client
│   ├── redis.ts          # Redis utilities
│   ├── env.ts            # Environment validation
│   ├── utils.ts          # General utilities
│   └── database.types.ts # Database TypeScript types
├── supabase/              # Database files
│   ├── migrations/       # SQL migrations
│   └── README.md         # Supabase documentation
├── docs/                  # Documentation
├── public/               # Static files
├── .env.local            # Local environment (not committed)
├── .env.example          # Environment template
├── docker-compose.yml    # Local services
├── package.json          # Dependencies
└── tsconfig.json         # TypeScript config
```

## Troubleshooting

### "Module not found" errors
```bash
# Clear Next.js cache and rebuild
rm -rf .next
npm run build
```

### Docker services not starting
```bash
# Check Docker is running
docker ps

# Check logs
docker-compose logs postgres
docker-compose logs redis

# Restart services
docker-compose restart
```

### Build errors with Clerk
Ensure you have valid Clerk keys in `.env.local`. The app gracefully handles missing keys during build but requires real keys for authentication features.

### Database connection errors
- Verify PostgreSQL is running: `docker ps`
- Check connection string in `.env.local`
- Ensure migrations have been run
- Check database logs: `docker-compose logs postgres`

### Redis connection errors
- Verify Redis is running: `docker ps`
- Check UPSTASH_REDIS_REST_URL and token
- For local Redis, ensure REST proxy is running
- Check Redis logs: `docker-compose logs redis`

### Type errors
```bash
# Regenerate Supabase types
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > lib/database.types.ts

# Run type check
npm run type-check
```

## Development Tips

### Hot Reload
Next.js automatically reloads on file changes. If it doesn't:
1. Check terminal for errors
2. Restart dev server
3. Clear `.next` cache

### Database Migrations
Always create new migrations instead of modifying existing ones:
```sql
-- supabase/migrations/20250930120000_add_feature.sql
ALTER TABLE users ADD COLUMN new_field TEXT;
```

### Environment Variables
- Client-side variables must start with `NEXT_PUBLIC_`
- Server-side variables are never exposed to the browser
- Restart dev server after changing `.env.local`

### Debugging
Use VS Code debugging:
1. Create `.vscode/launch.json`:
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Next.js",
      "type": "node",
      "request": "launch",
      "runtimeExecutable": "npm",
      "runtimeArgs": ["run", "dev"],
      "console": "integratedTerminal"
    }
  ]
}
```

### Code Quality
```bash
# Format code
npm run lint -- --fix

# Check types
npm run type-check
```

## Next Steps

1. **Phase 2:** Implement Core Agent System (Vercel AI SDK + AG-UI)
2. **Phase 3:** Add MCP Tools integration
3. **Phase 4:** Build RAG system with pgvector
4. **Phase 5:** Create UI and marketing site
5. **Phase 6:** Advanced features (billing, analytics)
6. **Phase 7:** Testing suite
7. **Phase 8:** Production deployment

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Clerk Documentation](https://clerk.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Upstash Redis Documentation](https://upstash.com/docs/redis)
- [shadcn/ui Documentation](https://ui.shadcn.com)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

## Getting Help

- Check the documentation in `/docs`
- Review the implementation guide in `IMPLEMENTATION_STEPS.md`
- Search GitHub issues
- Join the community discussions
