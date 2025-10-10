# Implementation Steps - Detailed Phase-by-Phase Guide

This document contains the detailed implementation steps for building the AI-First Multi-Tenant SaaS Boilerplate.

**Reference:** `/mnt/c/dev/ai-coder-agents/docs/templates/typescript-ag-ui-boilerplate.md`

---

## Phase 1: Foundation (Week 1)

### Step 1.1: Complete shadcn/ui Setup

**Description:** Install and configure all 46+ shadcn/ui components for the project.

#### Files to Modify

##### components.json (CREATE)
- **Action:** Create
- **Description:** shadcn/ui configuration file

**Implementation:**
```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "default",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.ts",
    "css": "app/globals.css",
    "baseColor": "slate",
    "cssVariables": true
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils"
  }
}
```

#### Validation Gates

##### Component Installation Tests
**Description:** Verify all shadcn/ui components are installed correctly

**Criteria:**
- All 46+ components render without errors
- TypeScript types resolve correctly
- Tailwind classes apply properly
- Dark mode toggles work

**Test Command:**
```bash
npm run type-check
```

#### Dependencies
None (can start immediately)

---

### Step 1.2: Set Up Clerk Authentication

**Description:** Integrate Clerk for multi-tenant authentication with organization support.

#### Files to Modify

##### middleware.ts (CREATE)
- **Action:** Create
- **Description:** Clerk authentication middleware

**Implementation:**
```typescript
import { authMiddleware } from '@clerk/nextjs';
import { NextResponse } from 'next/server';

export default authMiddleware({
  publicRoutes: ['/', '/pricing', '/about', '/contact', '/blog(.*)', '/docs(.*)', '/legal(.*)'],
  async afterAuth(auth, req) {
    // If user is authenticated and has an organization, add org ID to headers
    if (auth.userId && auth.orgId) {
      const response = NextResponse.next();
      response.headers.set('x-organization-id', auth.orgId);
      return response;
    }
    return NextResponse.next();
  },
});

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
};
```

##### app/layout.tsx (MODIFY)
- **Action:** Modify
- **Description:** Wrap app with ClerkProvider

**Changes:**
```typescript
import { ClerkProvider } from '@clerk/nextjs';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={inter.className}>{children}</body>
      </html>
    </ClerkProvider>
  );
}
```

##### .env.example (CREATE)
- **Action:** Create
- **Description:** Environment variable template

**Implementation:**
```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
CLERK_SECRET_KEY=sk_test_xxxxx
CLERK_WEBHOOK_SECRET=whsec_xxxxx

# Supabase (database + RAG)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Upstash Redis (event storage)
UPSTASH_REDIS_REST_URL=https://xxxxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=AXxxxxx...

# LLM Providers (at least ONE required)
OPENAI_API_KEY=sk-xxxxx
ANTHROPIC_API_KEY=sk-ant-xxxxx
GOOGLE_AI_API_KEY=xxxxx
MISTRAL_API_KEY=xxxxx

# Sanity CMS (blog/docs)
NEXT_PUBLIC_SANITY_PROJECT_ID=xxxxx
NEXT_PUBLIC_SANITY_DATASET=production
SANITY_API_TOKEN=skxxxxx

# Email
RESEND_API_KEY=re_xxxxx

# Security
ARCJET_KEY=ajkey_xxxxx

# Optional: Stripe (billing)
STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx

# Optional: Sentry (monitoring)
SENTRY_DSN=https://xxxxx@xxxxx.ingest.sentry.io/xxxxx
```

#### Validation Gates

##### Authentication Tests
**Description:** Verify Clerk authentication works

**Criteria:**
- User can sign up successfully
- User can sign in successfully
- Protected routes redirect to sign-in
- Organization creation works
- Organization context is set in headers

**Test Files:**
- `testing/integration/auth.test.ts`

#### Dependencies
Depends on: Step 1.1

---

### Step 1.3: Create Auth Pages

**Description:** Build sign-in, sign-up, and onboarding pages using Clerk components.

#### Files to Modify

##### app/(auth)/sign-in/[[...sign-in]]/page.tsx (CREATE)
- **Action:** Create
- **Description:** Sign-in page

**Implementation:**
```typescript
import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <SignIn
        appearance={{
          elements: {
            rootBox: 'mx-auto',
            card: 'shadow-none',
          },
        }}
        redirectUrl="/dashboard"
      />
    </div>
  );
}
```

##### app/(auth)/sign-up/[[...sign-up]]/page.tsx (CREATE)
- **Action:** Create
- **Description:** Sign-up page

**Implementation:**
```typescript
import { SignUp } from '@clerk/nextjs';

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <SignUp
        appearance={{
          elements: {
            rootBox: 'mx-auto',
            card: 'shadow-none',
          },
        }}
        redirectUrl="/onboarding"
      />
    </div>
  );
}
```

##### app/(auth)/onboarding/page.tsx (CREATE)
- **Action:** Create
- **Description:** Onboarding wizard (profile setup)

**Implementation:**
```typescript
'use client';

import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function OnboardingPage() {
  const { user } = useUser();
  const router = useRouter();

  const handleContinue = () => {
    router.push('/onboarding/organization');
  };

  return (
    <div className="container mx-auto max-w-2xl py-16">
      <Card className="p-8">
        <h1 className="text-3xl font-bold mb-4">Welcome, {user?.firstName}!</h1>
        <p className="text-muted-foreground mb-8">
          Let's get you set up with your organization.
        </p>
        <Button onClick={handleContinue}>Continue</Button>
      </Card>
    </div>
  );
}
```

##### app/(auth)/onboarding/organization/page.tsx (CREATE)
- **Action:** Create
- **Description:** Organization creation step

**Implementation:**
```typescript
'use client';

import { CreateOrganization } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';

export default function OnboardingOrganizationPage() {
  const router = useRouter();

  return (
    <div className="container mx-auto max-w-2xl py-16">
      <CreateOrganization
        afterCreateOrganizationUrl="/onboarding/complete"
        skipInvitationScreen
      />
    </div>
  );
}
```

##### app/(auth)/onboarding/complete/page.tsx (CREATE)
- **Action:** Create
- **Description:** Onboarding completion

**Implementation:**
```typescript
'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CheckCircle } from 'lucide-react';

export default function OnboardingCompletePage() {
  const router = useRouter();

  return (
    <div className="container mx-auto max-w-2xl py-16">
      <Card className="p-8 text-center">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h1 className="text-3xl font-bold mb-4">You're all set!</h1>
        <p className="text-muted-foreground mb-8">
          Your organization is ready. Let's start building with AI agents.
        </p>
        <Button onClick={() => router.push('/dashboard')}>
          Go to Dashboard
        </Button>
      </Card>
    </div>
  );
}
```

#### Validation Gates

##### Onboarding Flow Tests
**Description:** Verify complete onboarding flow works

**Criteria:**
- New user completes profile step
- User creates organization successfully
- User redirects to dashboard after completion
- Organization is set as active

**Test Files:**
- `testing/e2e/auth-flow.spec.ts`

#### Dependencies
Depends on: Step 1.2

---

### Step 1.4: Initialize Supabase

**Description:** Set up Supabase client and run initial database migrations.

#### Files to Modify

##### lib/supabase.ts (CREATE)
- **Action:** Create
- **Description:** Client-side Supabase client

**Implementation:**
```typescript
import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

##### lib/supabase-server.ts (CREATE)
- **Action:** Create
- **Description:** Server-side Supabase client with RLS context

**Implementation:**
```typescript
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { auth } from '@clerk/nextjs';

export async function createClient() {
  const cookieStore = cookies();
  const { orgId } = auth();

  const client = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );

  // Set RLS context for organization isolation
  if (orgId) {
    await client.rpc('set_current_org_id', { org_id: orgId });
  }

  return client;
}
```

##### supabase/migrations/20250930000001_initial.sql (CREATE)
- **Action:** Create
- **Description:** Initial database schema (users, orgs, roles)

**Implementation:**
```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create RLS helper function
CREATE OR REPLACE FUNCTION get_current_org_id()
RETURNS TEXT AS $$
  SELECT current_setting('app.current_org_id', TRUE);
$$ LANGUAGE SQL STABLE;

-- Set organization context
CREATE OR REPLACE FUNCTION set_current_org_id(org_id TEXT)
RETURNS VOID AS $$
BEGIN
  PERFORM set_config('app.current_org_id', org_id, FALSE);
END;
$$ LANGUAGE plpgsql;

-- Users table (synced from Clerk)
CREATE TABLE users (
  id TEXT PRIMARY KEY, -- Clerk user ID
  email TEXT NOT NULL UNIQUE,
  first_name TEXT,
  last_name TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Organizations table (synced from Clerk)
CREATE TABLE organizations (
  id TEXT PRIMARY KEY, -- Clerk org ID
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  image_url TEXT,
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'enterprise')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Organization members
CREATE TABLE organization_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'member')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, user_id)
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own data"
  ON users FOR SELECT
  USING (id = current_user);

CREATE POLICY "Organization members can view org"
  ON organizations FOR SELECT
  USING (id IN (
    SELECT organization_id FROM organization_members
    WHERE user_id = current_user
  ));

CREATE POLICY "Organization members can view members"
  ON organization_members FOR SELECT
  USING (organization_id = get_current_org_id());
```

#### Validation Gates

##### Database Tests
**Description:** Verify Supabase connection and migrations

**Criteria:**
- Supabase client connects successfully
- Migrations run without errors
- RLS policies are applied
- Organization context is set correctly

**Test Files:**
- `testing/integration/supabase.test.ts`

#### Dependencies
Depends on: Step 1.3

---

### Step 1.5: Set Up Upstash Redis

**Description:** Configure Upstash Redis for AG-UI event storage.

#### Files to Modify

##### lib/redis.ts (CREATE)
- **Action:** Create
- **Description:** Upstash Redis client

**Implementation:**
```typescript
import { Redis } from '@upstash/redis';

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Helper: Store AG-UI event
export async function storeEvent(threadId: string, runId: string, event: any) {
  const key = `agui:${threadId}:${runId}`;
  await redis.rpush(key, JSON.stringify(event));
  await redis.expire(key, 3600); // 1 hour TTL
}

// Helper: Get events
export async function getEvents(threadId: string, runId: string, from: number = 0) {
  const key = `agui:${threadId}:${runId}`;
  return await redis.lrange(key, from, -1);
}

// Helper: Clear events
export async function clearEvents(threadId: string, runId: string) {
  const key = `agui:${threadId}:${runId}`;
  await redis.del(key);
}
```

#### Validation Gates

##### Redis Tests
**Description:** Verify Redis operations work

**Criteria:**
- Client connects successfully
- Events can be stored
- Events can be retrieved
- TTL expires correctly

**Test Files:**
- `testing/integration/redis.test.ts`

#### Dependencies
Depends on: Step 1.4

---

### Step 1.6: Create docker-compose.yml

**Description:** Set up local development environment with PostgreSQL and Redis.

#### Files to Modify

##### docker-compose.yml (CREATE)
- **Action:** Create
- **Description:** Local development services

**Implementation:**
```yaml
version: '3.8'

services:
  postgres:
    image: supabase/postgres:15.1.0.117
    environment:
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: boilerplate
    ports:
      - '5432:5432'
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - '6379:6379'
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

##### .env.local.example (CREATE)
- **Action:** Create
- **Description:** Local development environment variables

**Implementation:**
```env
# Local development (docker-compose)
NEXT_PUBLIC_SUPABASE_URL=http://localhost:5432
UPSTASH_REDIS_REST_URL=http://localhost:6379

# Use production keys for other services
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
# ... (same as .env.example)
```

#### Validation Gates

##### Local Environment Tests
**Description:** Verify docker-compose environment works

**Criteria:**
- PostgreSQL starts successfully
- Redis starts successfully
- Application connects to local services
- Migrations run on local PostgreSQL

**Test Command:**
```bash
docker-compose up -d
npm run dev
```

#### Dependencies
Depends on: Step 1.5

---

### Step 1.7: Environment Validation

**Description:** Create environment variable validation with Zod.

#### Files to Modify

##### lib/env.ts (CREATE)
- **Action:** Create
- **Description:** Environment variable validation

**Implementation:**
```typescript
import { z } from 'zod';

const envSchema = z.object({
  // Clerk
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1),
  CLERK_SECRET_KEY: z.string().min(1),
  CLERK_WEBHOOK_SECRET: z.string().optional(),

  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),

  // Upstash Redis
  UPSTASH_REDIS_REST_URL: z.string().url(),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1),

  // LLM (at least one required)
  OPENAI_API_KEY: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
  GOOGLE_AI_API_KEY: z.string().optional(),
  MISTRAL_API_KEY: z.string().optional(),

  // Sanity
  NEXT_PUBLIC_SANITY_PROJECT_ID: z.string().min(1),
  NEXT_PUBLIC_SANITY_DATASET: z.string().min(1),
  SANITY_API_TOKEN: z.string().min(1),

  // Resend
  RESEND_API_KEY: z.string().min(1),

  // Arcjet
  ARCJET_KEY: z.string().min(1),

  // Optional: Stripe
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().optional(),

  // Optional: Sentry
  SENTRY_DSN: z.string().url().optional(),
}).refine(
  (data) =>
    data.OPENAI_API_KEY ||
    data.ANTHROPIC_API_KEY ||
    data.GOOGLE_AI_API_KEY ||
    data.MISTRAL_API_KEY,
  {
    message: 'At least one LLM provider API key is required',
  }
);

export const env = envSchema.parse(process.env);
```

#### Validation Gates

##### Environment Validation Tests
**Description:** Verify environment variables are valid

**Criteria:**
- Required variables throw error if missing
- Optional variables don't cause errors
- At least one LLM key is provided
- URLs are valid format

**Test Command:**
```bash
npm run type-check
```

#### Dependencies
Depends on: Step 1.6

---

## Phase 1 Completion Checklist

- [ ] shadcn/ui components installed (46+)
- [ ] Clerk authentication configured
- [ ] Auth pages created (sign-in, sign-up, onboarding)
- [ ] Supabase client and migrations set up
- [ ] Upstash Redis configured
- [ ] docker-compose.yml created
- [ ] Environment variables validated
- [ ] All Phase 1 tests passing
- [ ] User can sign up, create org, access dashboard

**Deliverable:** Users can sign up, create organizations, and access dashboard

---

## Next: Phase 2 - Core Agent System

See separate document for Phase 2-8 implementation details.

