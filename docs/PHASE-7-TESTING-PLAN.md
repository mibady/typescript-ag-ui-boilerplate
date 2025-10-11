# Phase 7: Testing & QA - Comprehensive Plan

**Status:** In Progress
**Started:** 2025-10-10
**Target Completion:** 2025-10-11

## Overview

Phase 7 focuses on comprehensive testing coverage for the typescript-ag-ui-boilerplate project, with emphasis on the billing system implemented in Phase 6 and critical user flows.

## Current State Analysis

### Existing Test Coverage ✅

**Test Files:** 3 files
**Total Tests:** 18 passing
**Test Environment:** Vitest + Happy-DOM
**Coverage Tool:** @vitest/coverage-v8

**Current Tests:**
1. ✅ `src/__tests__/lib/db/messages.test.ts` - 6 tests
   - Create, read, delete messages
   - Session message retrieval
   - Pagination support

2. ✅ `src/__tests__/lib/db/subscriptions.test.ts` - 8 tests
   - Subscription plan retrieval
   - Usage limit checking
   - Usage recording
   - Current usage tracking

3. ✅ `src/__tests__/components/chat/chat-interface.test.tsx` - 4 tests
   - Component existence
   - Props validation

### Test Infrastructure ✅

- **Vitest Config:** Updated with coverage thresholds (70%)
- **Test Environment:** Happy-DOM (lightweight, Node.js compatible)
- **Mocking:** Supabase client mocked
- **Coverage Reports:** Text, JSON, HTML
- **Setup File:** `src/__tests__/setup.ts` with global config

### Coverage Gaps Identified 🚨

#### 1. **Billing System (Phase 6)** - 0% Coverage
- ❌ API Routes (4 routes untested)
  - `/api/billing/checkout` - Stripe checkout session
  - `/api/billing/portal` - Customer portal
  - `/api/billing/subscription` - Subscription status
  - `/api/billing/webhooks` - Stripe events

- ❌ Webhook Handler (11+ event types untested)
  - `checkout.session.completed`
  - `customer.subscription.created/updated/deleted`
  - `invoice.payment_succeeded/failed`
  - `payment_intent.succeeded/failed`

- ❌ Usage Tracking in Agent Routes
  - Message counting
  - Token usage tracking
  - Limit enforcement (429 responses)

#### 2. **Integration Tests** - 0% Coverage
- ❌ Complete checkout flow
- ❌ Subscription upgrade/downgrade
- ❌ Usage limit enforcement
- ❌ Webhook processing end-to-end

#### 3. **E2E Tests** - 0% Coverage
- ❌ User registration → subscription
- ❌ Dashboard usage metrics
- ❌ Payment method update
- ❌ Chat with usage limits

#### 4. **Security & Edge Cases** - 0% Coverage
- ❌ Webhook signature verification
- ❌ Rate limiting
- ❌ Error handling
- ❌ SQL injection prevention

## Phase 7 Testing Strategy

### 1. Unit Tests (70% Target Coverage)

#### 1.1 Billing API Routes

**File:** `src/__tests__/api/billing/checkout.test.ts`
```typescript
describe('Checkout API', () => {
  it('creates Stripe checkout session with correct params')
  it('includes trial period for Pro plan')
  it('returns 401 for unauthenticated users')
  it('returns 400 for invalid plan selection')
  it('handles Stripe errors gracefully')
})
```

**File:** `src/__tests__/api/billing/portal.test.ts`
```typescript
describe('Customer Portal API', () => {
  it('creates portal session for existing customer')
  it('returns 403 if no subscription exists')
  it('handles Stripe portal errors')
})
```

**File:** `src/__tests__/api/billing/subscription.test.ts`
```typescript
describe('Subscription Status API', () => {
  it('returns current subscription details')
  it('includes usage metrics')
  it('handles missing subscription gracefully')
})
```

#### 1.2 Stripe Webhook Handler

**File:** `src/__tests__/api/billing/webhooks.test.ts`
```typescript
describe('Stripe Webhooks', () => {
  describe('checkout.session.completed', () => {
    it('creates subscription in database')
    it('records payment history')
    it('handles duplicate events (idempotency)')
  })

  describe('customer.subscription.updated', () => {
    it('updates subscription status')
    it('handles plan changes')
    it('tracks cancellation')
  })

  describe('invoice.payment_failed', () => {
    it('suspends subscription')
    it('sends notification')
  })

  describe('Security', () => {
    it('rejects invalid signatures')
    it('returns 400 for malformed events')
  })
})
```

#### 1.3 Usage Tracking

**File:** `src/__tests__/lib/usage-tracking.test.ts`
```typescript
describe('Usage Tracking', () => {
  it('increments message count on agent execution')
  it('tracks token usage accurately')
  it('enforces message limits (returns 429)')
  it('allows unlimited usage for -1 limits')
  it('calculates usage within billing period')
})
```

#### 1.4 Helper Functions

**File:** `src/__tests__/lib/db/billing-helpers.test.ts`
```typescript
describe('Billing Helper Functions', () => {
  it('calculates trial end date correctly')
  it('determines subscription status')
  it('formats currency properly')
  it('handles timezone conversions')
})
```

### 2. Integration Tests

#### 2.1 Complete Checkout Flow

**File:** `src/__tests__/integration/checkout-flow.test.ts`
```typescript
describe('Checkout Integration', () => {
  it('completes full checkout flow', async () => {
    // 1. Create checkout session
    // 2. Simulate Stripe webhook
    // 3. Verify subscription in DB
    // 4. Verify payment history
    // 5. Verify user access granted
  })

  it('handles failed payments correctly')
  it('applies trial period for new users')
})
```

#### 2.2 Subscription Lifecycle

**File:** `src/__tests__/integration/subscription-lifecycle.test.ts`
```typescript
describe('Subscription Lifecycle', () => {
  it('handles upgrade from Free to Pro')
  it('handles downgrade from Enterprise to Pro')
  it('handles cancellation and grace period')
  it('handles reactivation')
})
```

#### 2.3 Usage Limit Enforcement

**File:** `src/__tests__/integration/usage-limits.test.ts`
```typescript
describe('Usage Limit Enforcement', () => {
  it('blocks requests when message limit reached')
  it('blocks requests when token limit reached')
  it('resets usage at billing period start')
  it('allows overages for Enterprise plan')
})
```

### 3. E2E Tests (Playwright)

#### 3.1 Setup Playwright

```bash
npm install --save-dev @playwright/test
npx playwright install
```

**File:** `playwright.config.ts`
```typescript
export default defineConfig({
  testDir: './tests/e2e',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
  ],
})
```

#### 3.2 Critical User Flows

**File:** `tests/e2e/user-onboarding.spec.ts`
```typescript
test('complete user onboarding flow', async ({ page }) => {
  // 1. Sign up with Clerk
  // 2. Select Pro plan
  // 3. Complete Stripe checkout (test mode)
  // 4. Verify dashboard access
  // 5. Send first chat message
})
```

**File:** `tests/e2e/billing-management.spec.ts`
```typescript
test('manage subscription via dashboard', async ({ page }) => {
  // 1. Login as paid user
  // 2. Navigate to billing page
  // 3. View usage metrics
  // 4. Open Stripe portal
  // 5. Update payment method (test card)
})
```

**File:** `tests/e2e/usage-limits.spec.ts`
```typescript
test('hit usage limit and upgrade', async ({ page }) => {
  // 1. Login as Free user
  // 2. Send messages until limit
  // 3. See upgrade prompt
  // 4. Complete upgrade flow
  // 5. Continue using service
})
```

### 4. Load & Performance Tests

#### 4.1 Webhook Performance

**File:** `tests/load/webhook-processing.js` (k6)
```javascript
export default function () {
  http.post('http://localhost:3000/api/billing/webhooks', payload, {
    headers: { 'stripe-signature': signature },
  })
}

export const options = {
  vus: 50, // 50 concurrent webhooks
  duration: '30s',
}
```

#### 4.2 Agent Execution Load

**File:** `tests/load/agent-execution.js` (k6)
```javascript
export default function () {
  http.post('http://localhost:3000/api/agent/execute', {
    message: 'Test query',
    sessionId: 'load-test-session',
  })
}

export const options = {
  stages: [
    { duration: '1m', target: 100 },
    { duration: '3m', target: 100 },
    { duration: '1m', target: 0 },
  ],
}
```

### 5. Security Tests

#### 5.1 Webhook Security

**File:** `src/__tests__/security/webhook-verification.test.ts`
```typescript
describe('Webhook Security', () => {
  it('rejects requests without signature header')
  it('rejects requests with invalid signature')
  it('rejects replayed events (timestamp check)')
  it('rejects events from wrong environment')
})
```

#### 5.2 Rate Limiting

**File:** `src/__tests__/security/rate-limiting.test.ts`
```typescript
describe('Rate Limiting', () => {
  it('blocks excessive requests from same IP')
  it('blocks excessive API calls per organization')
  it('allows burst traffic within limits')
})
```

## Testing Checklist

### Unit Tests ✅
- [ ] Checkout API route (5 tests)
- [ ] Portal API route (3 tests)
- [ ] Subscription API route (3 tests)
- [ ] Webhook handler (15 tests)
- [ ] Usage tracking (5 tests)
- [ ] Billing helpers (4 tests)
- **Target:** 35 new unit tests

### Integration Tests ⏳
- [ ] Complete checkout flow (3 tests)
- [ ] Subscription lifecycle (4 tests)
- [ ] Usage limit enforcement (4 tests)
- **Target:** 11 new integration tests

### E2E Tests ⏳
- [ ] User onboarding (1 test)
- [ ] Billing management (1 test)
- [ ] Usage limits (1 test)
- **Target:** 3 E2E tests

### Performance Tests ⏳
- [ ] Webhook load test
- [ ] Agent execution load test
- **Target:** 2 load tests

### Security Tests ⏳
- [ ] Webhook verification (4 tests)
- [ ] Rate limiting (3 tests)
- **Target:** 7 security tests

### Coverage Targets 📊
- **Overall Coverage:** 70%+
- **Critical Paths:** 90%+ (billing, auth, agent execution)
- **API Routes:** 80%+
- **Database Functions:** 85%+

## Test Commands

```bash
# Run all unit tests
npm test

# Run with coverage
npm test -- --coverage

# Run specific test file
npm test src/__tests__/api/billing/checkout.test.ts

# Run integration tests
npm run test:integration

# Run E2E tests
npm run test:e2e

# Run load tests
npm run test:load

# Watch mode for development
npm test -- --watch
```

## Success Criteria

### Phase 7 Complete When:
1. ✅ All unit tests pass (target: 53+ tests)
2. ✅ All integration tests pass (target: 11 tests)
3. ✅ All E2E tests pass (target: 3 tests)
4. ✅ Coverage thresholds met (70%+)
5. ✅ No critical security vulnerabilities
6. ✅ Load tests show acceptable performance
7. ✅ All tests documented
8. ✅ CI/CD pipeline includes all test types

### Quality Gates:
- **Pre-commit:** Unit tests only (fast feedback)
- **Pre-push:** Unit + Integration tests
- **CI/CD:** All tests including E2E
- **Release:** Load tests + Security audit

## Timeline

**Day 1 (Today):**
- ✅ Fix test infrastructure
- ✅ Create testing plan
- ⏳ Implement billing API unit tests
- ⏳ Implement webhook unit tests

**Day 2:**
- Integration tests
- E2E test setup with Playwright
- Critical user flow E2E tests

**Day 3:**
- Load testing setup
- Security tests
- Coverage optimization
- Documentation

## Test Data Strategy

### Stripe Test Cards
```typescript
// Success
const TEST_CARD_SUCCESS = '4242424242424242'

// Decline
const TEST_CARD_DECLINE = '4000000000000002'

// Requires 3DS
const TEST_CARD_3DS = '4000002500003155'
```

### Test Organizations
```typescript
const TEST_ORGS = {
  free: 'org_free_test',
  pro: 'org_pro_test',
  enterprise: 'org_enterprise_test',
  atLimit: 'org_at_limit_test',
}
```

### Mock Stripe Events
- Sample webhook payloads stored in `tests/fixtures/stripe-events/`
- Reusable mock data for consistent testing

## Notes & Considerations

1. **Mocking Strategy:**
   - Unit tests: Mock Supabase, Stripe SDK
   - Integration tests: Mock Stripe only, use test database
   - E2E tests: Use Stripe test mode, real database (test instance)

2. **Test Isolation:**
   - Each test creates/cleans up its own data
   - Use unique IDs per test run
   - Transaction rollbacks for database tests

3. **CI/CD Integration:**
   - Tests run on every PR
   - Coverage reports uploaded to Codecov
   - Failed tests block merges

4. **Flaky Test Prevention:**
   - Use deterministic test data
   - Avoid race conditions with proper async/await
   - Retry mechanisms for E2E tests (network flakes)

---

**Next Steps:** Begin implementing billing API unit tests (checkout.test.ts)
