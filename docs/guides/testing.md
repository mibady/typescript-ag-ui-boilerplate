# Testing Guide

Comprehensive testing suite for the TypeScript AG-UI Boilerplate. This guide covers all testing types, configuration, and best practices.

## Table of Contents

- [Overview](#overview)
- [Quick Start](#quick-start)
- [Test Types](#test-types)
- [AG-UI SDK Testing](#ag-ui-sdk-testing) ⚡ **CRITICAL**
- [Pre-Deployment Testing](#pre-deployment-testing)
- [Environment Setup](#environment-setup)
- [Running Tests](#running-tests)
- [CI/CD Integration](#cicd-integration)
- [Writing Tests](#writing-tests)
- [Troubleshooting](#troubleshooting)

## Overview

The testing suite includes:

- **Unit Tests** (Vitest) - Fast, isolated component and utility tests
- **Integration Tests** (Vitest) - Service integration testing
- **E2E Tests** (Playwright) - Full user journey testing
- **Load Tests** (K6) - Performance and stress testing
- **Pre-Deployment Suite** - Comprehensive validation before production

### Test Statistics

- **Total Tests**: 260+
- **AG-UI Tests**: 150+ (Unit, Integration, E2E)
- **Coverage Target**: 80%+
- **E2E Browsers**: Chrome, Firefox, Safari
- **Load Test Scenarios**: 4 (normal, stress, spike, RAG-specific)
- **Critical Tests**: Authentication, AG-UI SDK (block deployment)

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Install Playwright Browsers

```bash
npx playwright install
```

### 3. Install K6 (for load tests)

**macOS:**
```bash
brew install k6
```

**Linux:**
```bash
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6
```

**Windows:**
```bash
choco install k6
```

### 4. Configure Test Environment

Copy `.env.test` and configure with test credentials:

```bash
cp .env.test .env.test.local
```

Edit `.env.test.local` with your test credentials (Clerk, Supabase, etc.)

### 5. Setup Test Data

```bash
npm run setup:test-data
```

### 6. Run Tests

```bash
# Unit tests
npm test

# E2E tests
npm run test:e2e

# Pre-deployment suite (recommended before deployment)
npm run test:pre-deploy
```

## Test Types

### Unit Tests

Fast, isolated tests for individual functions and components.

**Location:** `src/__tests__/`

**Run:**
```bash
npm test                 # Run once
npm run test:watch       # Watch mode
npm run test:coverage    # With coverage
```

**Example:**
```typescript
import { describe, it, expect } from 'vitest';
import { calculateCost } from '@/lib/llm/cost-calculator';

describe('Cost Calculator', () => {
  it('should calculate GPT-4 costs correctly', () => {
    const cost = calculateCost('gpt-4', 1000, 500);
    expect(cost).toBeCloseTo(0.06); // $0.06
  });
});
```

### Integration Tests

Test integration with external services (Supabase, Upstash, etc.)

**Location:** `src/__tests__/integration/`

**Run:**
```bash
npm run test:integration
```

**Services Tested:**
- Upstash Redis (cache, rate limiting)
- Upstash Vector (embeddings)
- Supabase (database, RLS)
- LLM providers (OpenAI, Anthropic)

### E2E Tests

Full browser-based testing of user journeys.

**Location:** `src/__tests__/e2e/`

**Run:**
```bash
# All E2E tests
npm run test:e2e

# Specific suites
npm run test:e2e:auth      # Authentication (Priority #1)
npm run test:e2e:api       # API routes
npm run test:e2e:rag       # Document upload & search
npm run test:e2e:billing   # Stripe integration

# Debug mode
npm run test:e2e:debug
npm run test:e2e:headed
```

**Test Suites:**

1. **Authentication E2E** (`auth.spec.ts`) - 30+ tests
   - Sign up/in flows
   - Password validation
   - Session management
   - Protected routes
   - Organization membership

2. **API E2E** (`api.spec.ts`) - 25+ tests
   - Agent execution
   - AG-UI streaming
   - Rate limiting
   - Error handling
   - CORS & security headers

3. **RAG E2E** (`rag.spec.ts`) - 30+ tests
   - Document upload
   - Vector search
   - Full-text search
   - Hybrid search (RRF)
   - Document deletion
   - Organization isolation

4. **Billing E2E** (`billing.spec.ts`) - 25+ tests
   - Subscription creation
   - Stripe checkout
   - Webhook processing
   - Usage tracking
   - Plan changes
   - Cancellation

## AG-UI SDK Testing

⚡ **CRITICAL PRIORITY** - AG-UI tests block deployment if they fail.

The AG-UI SDK is the **foundation** of the agent system, implementing standardized communication between frontend, backend, and LLM providers.

### Quick Test Commands

```bash
# Run all AG-UI tests
npm run test:unit:agui          # Event system unit tests
npm run test:integration:agui   # BaseAgent integration tests
npm run test:e2e:agui          # Full protocol E2E tests
```

### What is Tested

#### Layer 1: Frontend ↔ Backend
- HttpAgent streaming via Observable
- SSE (Server-Sent Events) transport
- AG-UI event types from @ag-ui/core
- Event sequence and timing

#### Layer 2: Backend ↔ LLM
- Message format conversion
- Vercel AI SDK integration
- Multi-provider support (OpenAI, Anthropic)
- Tool execution with proper events

#### Layer 3: Data & Services
- Event storage in Redis
- Message persistence in Supabase
- Event retrieval and replay

### Test Coverage

- **Unit Tests**: 60+ tests for event creation and formatting
- **Integration Tests**: 50+ tests for BaseAgent lifecycle
- **E2E Tests**: 40+ tests for full protocol implementation
- **Total**: 150+ AG-UI-specific tests

### Why AG-UI Tests Block Deployment

If AG-UI tests fail:
- ❌ Frontend cannot communicate with backend
- ❌ Events may be malformed or missing
- ❌ Streaming will not work
- ❌ Tool calls will fail silently
- ❌ User experience completely broken

**Learn More:** See [AG-UI Testing Guide](./ag-ui-testing.md) for comprehensive details.

### Load Tests

Performance and stress testing with K6.

**Location:** `tests/load/`

**Run:**
```bash
# Agent execution load test
npm run test:load

# RAG operations load test
npm run test:load:rag

# Stress test (find breaking point)
npm run test:load:stress

# Spike test (sudden traffic surge)
npm run test:load:spike
```

**Custom Parameters:**
```bash
k6 run --vus 50 --duration 5m tests/load/agent-execution.js
```

**Load Test Scenarios:**

1. **Agent Execution** (`agent-execution.js`)
   - Ramps from 5 → 20 users
   - Tests LLM API endpoints
   - Measures response times
   - Target: 95% < 2s, 99% < 5s

2. **RAG Operations** (`rag-operations.js`)
   - 30% uploads, 70% searches
   - Tests vector + full-text search
   - Target: 95% uploads < 5s, searches < 1s

3. **Stress Test** (`stress-test.js`)
   - Gradually increases to 100+ users
   - Finds system breaking point
   - Tests degradation patterns

4. **Spike Test** (`spike-test.js`)
   - Sudden spike from 5 → 100 users
   - Tests auto-scaling
   - Verifies rate limiting

## Pre-Deployment Testing

The pre-deployment test suite runs **all** validation checks before production deployment.

### Overview

**Script:** `scripts/pre-deployment-test.sh`

**Run:**
```bash
npm run test:pre-deploy
```

### ⚠️ Human-in-the-Loop Requirement

**IMPORTANT:** E2E tests require manual setup and cannot be fully automated.

E2E tests will be **gracefully skipped** if not configured, with clear instructions on what's needed. The deployment can still be approved without E2E tests, but they provide valuable end-to-end validation.

**What needs manual setup:**
1. Test user creation in Clerk Dashboard (cannot be automated)
2. Test credentials configuration in `.env.test`
3. Test data initialization

**See:** [E2E Setup Guide](./e2e-setup.md) for complete instructions

**Check if E2E is ready:**
```bash
npm run test:e2e:check
```

### Test Phases

#### Phase 1: Environment Validation
- Validates all required environment variables
- Checks API key formats
- Verifies configuration

#### Phase 2: Service Connectivity (7 sub-phases)
- 2.1: Clerk (Authentication)
- 2.2: Supabase (Database)
- 2.3: Upstash (Redis/Vector/Search/QStash)
- 2.4: AI Services (OpenAI/Anthropic/etc.)
- 2.5: Stripe (Payments)
- 2.6: Arcjet (Security)
- 2.7: Sentry (Monitoring)

#### Phase 3: Authentication E2E Tests ⚠️ **CRITICAL**
- Runs complete auth test suite
- **Blocks deployment if tests fail**
- Must pass before proceeding

#### Phase 4: Unit Tests
- All unit test suites
- Component and utility tests

#### Phase 5: Integration Tests
- External service integration
- Database operations

#### Phase 7: Full E2E Test Suite
- **Gracefully skips** if manual setup not complete
- Shows clear instructions for setup
- All E2E tests (auth, API, RAG, billing, AG-UI)
- Multi-browser testing
- **Does NOT block deployment** if skipped

#### Phase 8: Load & Performance Tests
- K6 load tests (if installed)
- Performance benchmarking

#### Phase 9: Security Scan
- Scans for exposed secrets
- Checks for hardcoded API keys
- Validates security headers

### Exit Criteria

✅ **Approved for Deployment** when:
- All critical phases pass
- Authentication tests pass (required)
- AG-UI SDK tests pass (required)
- Error rate < 10%
- No exposed secrets

❌ **Deployment Blocked** when:
- Authentication tests fail
- AG-UI SDK tests fail
- Any critical service unavailable
- Security issues detected

⚠️ **Note:** E2E tests (Phase 7) can be skipped without blocking deployment if manual setup is incomplete

### Test Report

After completion, generates:
- **Console Summary**: Pass/fail status, timing
- **HTML Report**: `test-results/report.html`
- **JSON Summary**: `test-results/summary.json`

Generate report manually:
```bash
npm run test:report
```

## Environment Setup

### Test Environment Variables

Create `.env.test` with test credentials:

```bash
# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=test

# Test Users
TEST_USER_EMAIL=test-user@example.com
TEST_USER_PASSWORD=TestPassword123!
TEST_ORG_ADMIN_EMAIL=test-admin@example.com
TEST_ORG_ADMIN_PASSWORD=TestPassword123!

# Clerk Test Keys
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
CLERK_SECRET_KEY=sk_test_xxxxx

# Supabase Test Database
NEXT_PUBLIC_SUPABASE_URL=https://test.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxxxx
SUPABASE_SERVICE_ROLE_KEY=eyJxxxxx

# [Additional test keys...]
```

### Test Database Setup

1. Create separate test database in Supabase
2. Run migrations:
   ```bash
   npm run migrate:db
   ```
3. Setup test data:
   ```bash
   npm run setup:test-data
   ```

### Test User Setup

Create test users in Clerk:
1. Go to Clerk Dashboard → Users
2. Create test accounts matching `.env.test` credentials
3. Assign to test organizations

## Running Tests

### Local Development

```bash
# Watch mode for development
npm run test:watch

# Run specific test file
npm test src/__tests__/utils.test.ts

# Run E2E tests in headed mode (see browser)
npm run test:e2e:headed

# Debug specific E2E test
npx playwright test auth.spec.ts --debug
```

### Pre-Commit

Tests run automatically via Husky on `git commit`:
- Type checking
- Linting
- Unit tests

### Pre-Push

Run before pushing to main:
```bash
npm run test:pre-deploy
```

### CI Environment

GitHub Actions runs automatically on:
- Push to `main` or `develop`
- Pull requests
- Manual trigger

## CI/CD Integration

### GitHub Actions Workflow

**File:** `.github/workflows/test.yml`

**Jobs:**
1. Unit Tests
2. Integration Tests
3. E2E Auth Tests (blocks pipeline on failure)
4. E2E Full Suite (parallel across browsers)
5. Type Checking
6. Linting
7. Security Scan
8. Test Report Generation
9. Deployment Ready Check

### Required Secrets

Configure in GitHub Settings → Secrets:

```
TEST_CLERK_PUBLISHABLE_KEY
TEST_CLERK_SECRET_KEY
TEST_SUPABASE_URL
TEST_SUPABASE_ANON_KEY
TEST_SUPABASE_SERVICE_KEY
TEST_UPSTASH_REDIS_URL
TEST_UPSTASH_REDIS_TOKEN
TEST_UPSTASH_VECTOR_URL
TEST_UPSTASH_VECTOR_TOKEN
TEST_USER_EMAIL
TEST_USER_PASSWORD
```

### Manual Trigger

Trigger workflow manually:
1. Go to Actions tab
2. Select "Test Suite" workflow
3. Click "Run workflow"

## Writing Tests

### Unit Test Template

```typescript
import { describe, it, expect, beforeEach } from 'vitest';

describe('Feature Name', () => {
  beforeEach(() => {
    // Setup before each test
  });

  it('should do something specific', () => {
    // Arrange
    const input = 'test';

    // Act
    const result = functionToTest(input);

    // Assert
    expect(result).toBe('expected');
  });
});
```

### E2E Test Template

```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test('should allow user to perform action', async ({ page }) => {
    // Navigate
    await page.goto('/path');

    // Interact
    await page.fill('[name="field"]', 'value');
    await page.click('button:has-text("Submit")');

    // Assert
    await expect(page).toHaveURL('/success');
    await expect(page.locator('.success-message')).toBeVisible();
  });
});
```

### Load Test Template

```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

const errorRate = new Rate('errors');

export const options = {
  stages: [
    { duration: '30s', target: 10 },
  ],
  thresholds: {
    'http_req_duration': ['p(95)<2000'],
  },
};

export default function () {
  const response = http.get('http://localhost:3000/api/endpoint');

  check(response, {
    'status is 200': (r) => r.status === 200,
  });

  sleep(1);
}
```

## Troubleshooting

### Common Issues

#### Playwright Tests Failing

```bash
# Reinstall browsers
npx playwright install --with-deps

# Clear cache
rm -rf playwright-report test-results
```

#### Test Database Issues

```bash
# Reset database
npm run migrate:rollback
npm run migrate:db
npm run setup:test-data
```

#### Environment Variable Issues

```bash
# Validate environment
npm run validate:env
npm run validate:clerk
npm run validate:supabase
```

#### Port Already in Use

```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

### Debug Mode

**Playwright:**
```bash
# Opens browser with dev tools
npm run test:e2e:debug

# Run with headed browser
npm run test:e2e:headed

# Generate trace
npx playwright test --trace on
```

**Vitest:**
```bash
# Run with debugging
node --inspect-brk ./node_modules/.bin/vitest
```

### Performance Issues

**Slow Tests:**
- Run in parallel: `npm test -- --reporter=verbose --threads`
- Increase timeout: `test.setTimeout(60000)`
- Use test fixtures for setup

**E2E Slow:**
- Reduce browser launches: Use `test.beforeAll()`
- Skip video recording: Set `video: 'retain-on-failure'`
- Run fewer browsers: `--project=chromium`

## Best Practices

### General

1. **Test Pyramid**: More unit tests, fewer E2E tests
2. **Independence**: Tests should not depend on each other
3. **Isolation**: Clean up test data after tests
4. **Speed**: Keep tests fast (unit < 1s, E2E < 30s)
5. **Reliability**: Avoid flaky tests with proper waits

### E2E Testing

1. Use data-testid attributes for stable selectors
2. Wait for elements: `await expect(locator).toBeVisible()`
3. Avoid hardcoded waits: Don't use `sleep(5000)`
4. Test critical paths first (authentication, payments)
5. Mock external APIs when possible

### Load Testing

1. Start small, increase gradually
2. Monitor system resources during tests
3. Set realistic thresholds (don't over-optimize)
4. Test both normal and peak loads
5. Include think time between requests

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [K6 Documentation](https://k6.io/docs/)
- [Testing Library](https://testing-library.com/)

## Support

For issues or questions:
1. Check [Troubleshooting](#troubleshooting)
2. Review test output and logs
3. Check CI/CD pipeline logs
4. Open issue on GitHub
