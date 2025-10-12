# 🧪 Boilerplate Testing Guide

Complete guide for validating your TypeScript AG-UI Boilerplate before deployment.

---

## 📋 Table of Contents

1. [Automated Validation (Run These First)](#1-automated-validation-run-these-first)
2. [Manual Feature Testing](#2-manual-feature-testing)
3. [API Endpoint Testing](#3-api-endpoint-testing)
4. [Automated Test Suites](#4-automated-test-suites)
5. [Production Readiness Checklist](#5-production-readiness-checklist)
6. [Red Flags (Deal Breakers)](#6-red-flags-deal-breakers)
7. [Quick Smoke Test](#7-quick-smoke-test)
8. [Troubleshooting](#8-troubleshooting)

---

## 1. Automated Validation (Run These First)

The boilerplate includes validation scripts to check your setup. Run these to verify all services are configured correctly.

### Check All Environment Variables

```bash
npm run validate:env
```

**What it checks:**
- `.env.local` file exists
- Required variables are set (not placeholders)
- Critical services: Clerk, Supabase, Upstash Redis, at least one LLM provider
- Optional services: Stripe, Resend, Arcjet, Sentry

### Validate Individual Services

```bash
# Authentication
npm run validate:clerk

# Database & Storage
npm run validate:supabase

# Redis, Vector, QStash, Search
npm run validate:upstash

# LLM providers (OpenAI, Anthropic, Google, Mistral)
npm run validate:ai

# Arcjet security & rate limiting
npm run validate:security

# Sentry monitoring
npm run validate:monitoring
```

**Each validation script:**
- ✅ Checks environment variables are set
- ✅ Validates key/URL formats
- ✅ Tests API connectivity
- ✅ Verifies authentication works

---

## 2. Manual Feature Testing

Navigate through the UI to test core features.

### Dashboard Pages

Test all dashboard routes:

| Route | Purpose | What to Test |
|-------|---------|-------------|
| `/dashboard` | Main dashboard | Loads without errors, displays user info |
| `/dashboard/chat` | AI chat interface | Streaming responses, AG-UI protocol |
| `/dashboard/knowledge-base` | RAG/document upload | Upload, process, search documents |
| `/dashboard/analytics` | Usage analytics | Charts render, data displays |
| `/dashboard/team` | Team management | Invite members, view team |
| `/dashboard/settings` | Settings | Update preferences |
| `/dashboard/billing` | Stripe billing | View plans, subscription status |

### A. Authentication & Multi-tenancy

**Test Steps:**

1. **Sign Out/Sign In**
   - Sign out completely
   - Sign back in
   - Verify session persists
   - Check for auth loops

2. **Organization Management** (if enabled in Clerk)
   - Create a new organization
   - Switch between organizations
   - Verify data isolation (each org sees only their data)

3. **Team Members**
   - Invite a team member
   - Check invitation email (if Resend configured)
   - Accept invitation
   - Verify permissions

4. **Data Isolation**
   - Create data in Org A
   - Switch to Org B
   - Verify Org B cannot see Org A's data

**Expected Results:**
- ✅ No authentication loops
- ✅ Sessions persist correctly
- ✅ Organizations are isolated
- ✅ Team invitations work

---

### B. AI Agent System (Most Important)

Navigate to `/dashboard/chat` and test the core agent functionality.

**Test Steps:**

1. **Basic Chat**
   ```
   User: "Hello, can you help me?"
   Expected: Streaming response appears word-by-word
   ```

2. **Check Browser Console**
   - Open DevTools (F12)
   - Look for errors (red text)
   - Verify AG-UI events are logged (if debug mode enabled)

3. **Verify AG-UI Protocol**
   - Check Network tab → Filter by "stream"
   - Verify SSE (Server-Sent Events) connection
   - Look for AG-UI event types: `agent:start`, `agent:chunk`, `agent:end`

4. **Test Different Query Types**
   ```
   # Simple query
   "What is 2+2?"
   
   # Complex query
   "Explain the difference between React and Next.js"
   
   # Multi-turn conversation
   "What's the weather like?" → "What about tomorrow?"
   ```

5. **Error Handling**
   - Try sending empty message
   - Try very long message (>1000 chars)
   - Verify graceful error messages

**Expected Results:**
- ✅ Responses stream in real-time
- ✅ No console errors
- ✅ AG-UI events fire correctly
- ✅ Conversations maintain context
- ✅ Errors display user-friendly messages

**Red Flags:**
- ❌ Responses don't stream (appear all at once)
- ❌ Console shows 500 errors
- ❌ No response after 10+ seconds
- ❌ "API key not configured" errors

---

### C. RAG/Knowledge Base

Navigate to `/dashboard/knowledge-base` and test document processing.

**Test Steps:**

1. **Upload Document**
   - Click "Upload Document"
   - Select a PDF, TXT, or MD file
   - Wait for processing to complete
   - Verify success message

2. **Check Processing**
   - Document appears in list
   - Status shows "Processed" or "Ready"
   - Metadata displays correctly (filename, size, date)

3. **Search Content**
   - Use search bar to find content from uploaded document
   - Try exact phrases from the document
   - Try semantic search (similar concepts)

4. **Hybrid Search**
   - Test keyword search (BM25)
   - Test semantic search (vector embeddings)
   - Verify results are relevant

5. **Delete Document**
   - Delete a test document
   - Verify it's removed from list
   - Verify it's removed from vector database

**Expected Results:**
- ✅ Documents upload successfully
- ✅ Processing completes within 30 seconds
- ✅ Search returns relevant results
- ✅ Both keyword and semantic search work
- ✅ Deletion removes all traces

**Red Flags:**
- ❌ Upload fails or hangs
- ❌ Processing never completes
- ❌ Search returns no results
- ❌ Vector database errors

---

### D. Database Connectivity

Check Supabase to verify data is being stored correctly.

**Test Steps:**

1. **Go to Supabase Dashboard**
   - Visit: https://supabase.com/dashboard
   - Select your project

2. **Check Tables Exist**
   - Go to "Table Editor"
   - Verify these tables exist:
     - `documents`
     - `agent_sessions`
     - `agent_messages`
     - `users` (if using Supabase Auth)
     - `organizations` (if multi-tenant)

3. **Verify Data**
   - Check `documents` table for uploaded files
   - Check `agent_messages` table for chat history
   - Verify timestamps are recent

4. **Check RLS Policies**
   - Go to "Authentication" → "Policies"
   - Verify Row Level Security (RLS) is enabled
   - Verify policies exist for each table

**Expected Results:**
- ✅ All tables exist
- ✅ Data appears after using features
- ✅ RLS policies are enabled
- ✅ No unauthorized access possible

---

## 3. API Endpoint Testing

Test key API endpoints using curl or your browser's network tab.

### Health Check

```bash
curl http://localhost:3000/api/health
```

**Expected Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Agent Stream Endpoint (Requires Auth)

**Don't test this with curl** - it requires authentication. Instead:

1. Open browser DevTools (F12)
2. Go to Network tab
3. Navigate to `/dashboard/chat`
4. Send a message
5. Look for request to `/api/agent/stream`
6. Verify response is SSE (text/event-stream)

### Document Upload Endpoint

**Test through UI** - requires authentication and multipart form data.

1. Open DevTools → Network tab
2. Upload a document in `/dashboard/knowledge-base`
3. Look for POST to `/api/documents/upload`
4. Verify 200 status code

---

## 4. Automated Test Suites

Run automated tests to catch issues early.

### Unit Tests

```bash
# Run all unit tests
npm test

# Run with coverage
npm run test:coverage

# Watch mode (re-runs on file changes)
npm run test:watch
```

**What it tests:**
- Utility functions
- Data transformations
- Event creation (AG-UI)
- Cost calculations

### Integration Tests

```bash
# Run all integration tests
npm run test:integration
```

**What it tests:**
- BaseAgent implementation
- Database operations
- Redis caching
- Vector search

### E2E Tests (End-to-End)

```bash
# Check if E2E tests are ready
npm run test:e2e:check

# Run all E2E tests
npm run test:e2e

# Run specific test suites
npm run test:e2e:auth      # Authentication flows
npm run test:e2e:api       # API endpoints
npm run test:e2e:rag       # RAG/document processing
npm run test:e2e:billing   # Stripe billing
npm run test:e2e:agui      # AG-UI protocol

# Debug mode (opens browser)
npm run test:e2e:debug
```

**Note:** E2E tests require manual setup:
- Create test users in Clerk Dashboard
- Configure `.env.test` with test credentials
- See `docs/guides/e2e-setup.md` for full setup

### Load Tests (Optional)

```bash
# Install K6 first: https://k6.io/docs/get-started/installation/

# Run load tests
npm run test:load          # Agent execution
npm run test:load:rag      # RAG operations
npm run test:load:stress   # Stress test
npm run test:load:spike    # Spike test
```

### TypeScript Type Checking

```bash
npm run type-check
```

**Expected:** No TypeScript errors

### Linting

```bash
npm run lint
```

**Expected:** No ESLint errors

### Production Build

```bash
npm run build
```

**Expected:** Build completes without errors

**This is critical** - if build fails, deployment will fail.

---

## 5. Production Readiness Checklist

### ✅ Critical Services (Must Have)

- [ ] **Clerk Authentication**
  - Sign up/sign in works
  - Sessions persist
  - No auth loops
  - Organization switching works (if enabled)

- [ ] **Supabase Database**
  - Connection successful
  - Tables exist
  - RLS policies enabled
  - Data persists correctly

- [ ] **At Least ONE LLM Provider**
  - OpenAI, Anthropic, Google, or Mistral
  - API key valid
  - Responses stream correctly

- [ ] **Upstash Redis**
  - Connection successful
  - Caching works
  - Rate limiting works

### ✅ Core Features

- [ ] **User can sign up/sign in**
  - No errors during auth flow
  - Email verification works (if enabled)

- [ ] **Dashboard loads without errors**
  - No 500 errors
  - No console errors
  - All pages accessible

- [ ] **Chat interface streams responses**
  - Real-time streaming
  - AG-UI protocol working
  - Context maintained across messages

- [ ] **Documents can be uploaded**
  - Upload succeeds
  - Processing completes
  - Search works

- [ ] **No console errors in browser**
  - Check DevTools console
  - No red errors
  - Warnings are acceptable

### 🎯 Optional (Nice to Have)

- [ ] **Stripe Billing** (for monetization)
  - Subscription plans display
  - Checkout works
  - Webhooks configured

- [ ] **Sentry Monitoring** (for production)
  - Error tracking configured
  - Source maps uploaded
  - Alerts configured

- [ ] **Email Functionality** (Resend)
  - Transactional emails send
  - Templates render correctly

- [ ] **All 4 Upstash Services**
  - Redis (caching)
  - Vector (RAG)
  - QStash (background jobs)
  - Search (full-text search)

---

## 6. Red Flags (Deal Breakers)

**This boilerplate is NOT production-ready if:**

### ❌ Authentication Issues

- Authentication fails or loops infinitely
- Users can't sign up or sign in
- Sessions don't persist
- Clerk API returns errors

**Fix:** Check Clerk configuration, verify API keys

---

### ❌ Database Connection Errors

- Supabase connection fails
- Tables don't exist
- RLS policies missing
- Data doesn't persist

**Fix:** Run migrations, check connection string, verify RLS policies

---

### ❌ No LLM Provider Configured

- No OpenAI, Anthropic, Google, or Mistral API key
- API key invalid or expired
- Rate limit exceeded

**Fix:** Add at least one valid LLM API key to `.env.local`

---

### ❌ Chat Doesn't Stream Responses

- Responses appear all at once (not streaming)
- AG-UI events don't fire
- SSE connection fails

**Fix:** Check `/api/agent/stream` endpoint, verify AG-UI setup

---

### ❌ Build Fails

- `npm run build` throws errors
- TypeScript compilation errors
- Missing dependencies

**Fix:** Run `npm run type-check`, fix TypeScript errors, install missing deps

---

### ❌ TypeScript Errors

- `npm run type-check` shows errors
- Type mismatches
- Missing type definitions

**Fix:** Fix type errors before deployment

---

## 7. Quick Smoke Test

Run this single command to test everything at once:

```bash
npm run test:pre-deploy
```

**What it does:**

1. ✅ **Phase 1:** Environment validation
2. ✅ **Phase 2:** Service connectivity (Clerk, Supabase, Upstash, AI, Stripe, Arcjet, Sentry)
3. ✅ **Phase 3:** Authentication E2E tests (CRITICAL - blocks deployment if fails)
4. ✅ **Phase 4:** AG-UI SDK integration tests (CRITICAL - blocks deployment if fails)
5. ✅ **Phase 5:** Unit tests
6. ✅ **Phase 6:** Integration tests
7. ⚠️  **Phase 7:** Full E2E test suite (skipped if not configured)
8. ⚠️  **Phase 8:** Load tests (skipped if K6 not installed)
9. ✅ **Phase 9:** Security scan (checks for exposed secrets)

**Expected Output:**

```
╔════════════════════════════════════════════════════════════════╗
║               🚀 APPROVED FOR DEPLOYMENT                       ║
╚════════════════════════════════════════════════════════════════╝

All validation phases passed. System is production-ready.

Next steps:
1. Review test report above
2. Deploy to staging: npm run deploy:staging
3. Run smoke tests
4. Deploy to production: npm run deploy:production
```

**If any critical phase fails:**

```
╔════════════════════════════════════════════════════════════════╗
║                ❌ DEPLOYMENT BLOCKED                           ║
╚════════════════════════════════════════════════════════════════╝

One or more validation phases failed.

Next steps:
1. Review failures above
2. Fix issues
3. Re-run: npm run test:pre-deploy
```

---

## 8. Troubleshooting

### Common Issues

#### Issue: "Environment validation failed"

**Symptoms:**
- `npm run validate:env` fails
- Missing or placeholder values

**Fix:**
```bash
# Copy example file
cp .env.example .env.local

# Edit .env.local and add your real API keys
# Then re-run validation
npm run validate:env
```

---

#### Issue: "Clerk validation failed"

**Symptoms:**
- `npm run validate:clerk` fails
- HTTP 401 or 403 errors

**Fix:**
1. Go to https://dashboard.clerk.com
2. Get your API keys from "API Keys" section
3. Verify keys start with `pk_test_` and `sk_test_`
4. Update `.env.local`

---

#### Issue: "Supabase validation failed"

**Symptoms:**
- `npm run validate:supabase` fails
- Connection timeout

**Fix:**
1. Go to https://supabase.com/dashboard
2. Select your project
3. Go to "Settings" → "API"
4. Copy URL and anon key
5. Update `.env.local`

---

#### Issue: "No LLM provider configured"

**Symptoms:**
- Chat doesn't work
- "API key not configured" error

**Fix:**
Add at least one LLM API key:

```bash
# OpenAI (recommended)
OPENAI_API_KEY=sk-...

# OR Anthropic
ANTHROPIC_API_KEY=sk-ant-...

# OR Google
GOOGLE_GENERATIVE_AI_API_KEY=...

# OR Mistral
MISTRAL_API_KEY=...
```

---

#### Issue: "Chat responses don't stream"

**Symptoms:**
- Responses appear all at once
- No streaming effect

**Fix:**
1. Check browser console for errors
2. Verify `/api/agent/stream` endpoint exists
3. Check AG-UI setup in `lib/agents/base-agent.ts`
4. Verify SSE connection in Network tab

---

#### Issue: "Build fails"

**Symptoms:**
- `npm run build` throws errors
- TypeScript compilation errors

**Fix:**
```bash
# Check TypeScript errors
npm run type-check

# Fix errors, then rebuild
npm run build
```

---

#### Issue: "E2E tests fail"

**Symptoms:**
- `npm run test:e2e` fails
- "Test user not found" errors

**Fix:**
1. E2E tests require manual setup
2. See `docs/guides/e2e-setup.md`
3. Create test users in Clerk Dashboard
4. Configure `.env.test`

---

### Getting Help

If you're still stuck:

1. **Check Documentation**
   - `README.md` - Overview
   - `SETUP.md` - Initial setup
   - `ARCHITECTURE.md` - System architecture
   - `docs/guides/` - Detailed guides

2. **Check Logs**
   - Browser console (F12)
   - Server logs (`npm run dev`)
   - Supabase logs (dashboard)
   - Sentry (if configured)

3. **Verify Environment**
   ```bash
   # Check all validations
   npm run validate:env
   npm run validate:clerk
   npm run validate:supabase
   npm run validate:upstash
   npm run validate:ai
   ```

4. **Run Pre-Deployment Test**
   ```bash
   npm run test:pre-deploy
   ```

---

## 📊 Testing Workflow

**Recommended testing order:**

```
1. Environment Validation
   ↓
2. Individual Service Validation
   ↓
3. Manual Feature Testing
   ↓
4. Automated Test Suites
   ↓
5. Pre-Deployment Test
   ↓
6. Production Deployment
```

**Time Estimate:**
- Environment validation: 2-5 minutes
- Manual testing: 15-30 minutes
- Automated tests: 5-10 minutes
- Pre-deployment test: 10-15 minutes

**Total: ~30-60 minutes for complete validation**

---

## 🚀 Ready for Production?

If all tests pass:

```bash
# Generate test report
npm run test:report

# Deploy to staging
npm run deploy:staging

# Run smoke tests on staging
npm run test:e2e -- --base-url=https://staging.yourdomain.com

# Deploy to production
npm run deploy:production
```

**Congratulations! Your boilerplate is production-ready! 🎉**

---

## 📚 Additional Resources

- [E2E Testing Setup Guide](docs/guides/e2e-setup.md)
- [AG-UI SDK Integration Guide](docs/guides/AG-UI-SDK-INTEGRATION.md)
- [SDK vs CLI Selection Guide](docs/guides/SDK-CLI-SELECTION-GUIDE.md)
- [API Reference](docs/reference/api.md)
- [Architecture Overview](docs/reference/architecture.md)

---

**Last Updated:** 2024-01-15
**Version:** 1.0.0
